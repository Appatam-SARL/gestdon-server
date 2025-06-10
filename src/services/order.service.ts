import mongoose from 'mongoose';
import { Driver, IDriver } from '../models/driver.model';
import { Incident } from '../models/incident.model';
import { IOrder, Order } from '../models/order.model';
import { AppError } from '../utils/AppError';
import { calculateDistance, getRouteDetails } from '../utils/geo';
import { handleCalculateOrderPrice, PRICING_CONFIG } from '../utils/pricing'; // Adjust the path as needed
import { DriverMatchingService } from './driver-matching.service';
import { SocketService } from './socket.service';

export class OrderService {
  // Trouver le meilleur chauffeur disponible pour une commande
  static async findOptimalDriver(order: IOrder): Promise<IDriver> {
    return DriverMatchingService.findOptimalDriver(order);
  }

  // Mettre à jour la position du chauffeur
  static async updateDriverLocation(
    orderId: string,
    location: { latitude: number; longitude: number }
  ) {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new AppError('Commande non trouvée', 404);
    }

    // Mettre à jour la position dans la commande
    order.driverLocation = {
      type: 'Point',
      coordinates: [location.longitude, location.latitude],
    };
    order.lastLocationUpdate = new Date();

    // Mettre à jour la position du chauffeur
    if (order.driver) {
      await Driver.findByIdAndUpdate(order.driver, {
        lastLocation: {
          type: 'Point',
          coordinates: [location.longitude, location.latitude],
        },
      });
    }

    // Calculer la distance réelle parcourue
    if (order.status === 'IN_PROGRESS') {
      const previousLocation =
        order.statusHistory[order.statusHistory.length - 1].location;
      if (previousLocation) {
        const distance = calculateDistance(previousLocation.coordinates, [
          location.longitude,
          location.latitude,
        ]);
        order.actualDistance = (order.actualDistance || 0) + distance;
      }
    }

    await order.save();

    // Émettre la mise à jour via Socket.io
    SocketService.emitLocationUpdate(order);

    // Émettre une mise à jour en temps réel aux abonnés
    if (order.customer) {
      SocketService.emitOrdersUpdate([order], {
        userType: 'user',
        userId: order.customer.toString(),
      });
    }

    return order;
  }

  // Marquer un point d'arrêt comme complété
  static async completeStopPoint(
    orderId: string,
    stopSequence: number,
    location?: { latitude: number; longitude: number }
  ) {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new AppError('Commande non trouvée', 404);
    }

    // Trouver le point d'arrêt par séquence
    const stopIndex = order.stops.findIndex(
      (stop) => stop.sequence === stopSequence
    );
    if (stopIndex === -1) {
      throw new AppError("Point d'arrêt non trouvé", 404);
    }

    // Marquer le point comme complété
    order.stops[stopIndex].completed = true;
    order.stops[stopIndex].completedAt = new Date();

    // Mettre à jour la position du chauffeur si fournie
    if (location) {
      order.driverLocation = {
        type: 'Point',
        coordinates: [location.longitude, location.latitude],
      };
      order.lastLocationUpdate = new Date();
    }

    // Vérifier si tous les points sont complétés
    const allStopsCompleted = order.stops.every((stop) => stop.completed);

    // Si tous les points sont complétés, marquer la commande comme terminée
    if (allStopsCompleted) {
      order.status = 'COMPLETED';
      order.actualDuration =
        (new Date().getTime() - order.createdAt.getTime()) / 1000;

      // Distribution des paiements
      await this.distributePayments(order);

      // Mettre à jour les statistiques du chauffeur
      if (order.driver) {
        const driver = await Driver.findById(order.driver);
        if (driver) {
          await Driver.findByIdAndUpdate(driver._id, {
            $pull: { activeOrders: order._id },
          });
        }
      }
    }
    // Si c'est un point de ramassage (PICKUP), mettre à jour le statut
    else if (order.stops[stopIndex].type === 'PICKUP') {
      // Vérifier si c'est le premier point de ramassage complété
      const isFirstPickup = !order.stops
        .filter(
          (stop) => stop.type === 'PICKUP' && stop.sequence !== stopSequence
        )
        .some((stop) => stop.completed);

      if (isFirstPickup) {
        order.status = 'PICKED_UP';
      }
    }

    await order.save();

    // Émettre la mise à jour via Socket.io
    SocketService.emitStatusUpdate(order);

    // Émettre une mise à jour en temps réel aux abonnés
    // 1. Pour le client (customer)
    if (order.customer) {
      SocketService.emitOrdersUpdate([order], {
        userType: 'user',
        userId: order.customer.toString(),
      });
    }

    // 2. Pour le chauffeur
    if (order.driver) {
      SocketService.emitOrdersUpdate([order], {
        userType: 'driver',
        userId: order.driver.toString(),
      });
    }

    // 3. Pour le partenaire (si applicable)
    if (order.partner) {
      SocketService.emitOrdersUpdate([order], {
        userType: 'partner',
        userId: order.partner.toString(),
      });
    }

    // 4. Pour les administrateurs
    SocketService.emitOrdersUpdate([order], { userType: 'admin' });

    return order;
  }

  // Distribution des paiements entre les différentes parties
  private static async distributePayments(order: IOrder) {
    try {
      // Récupérer les informations nécessaires
      const { serviceCharge, valdeliCommission, partnerCommission } =
        order.price;

      // Récupérer le driver et son wallet
      if (order.driver) {
        const driver = await Driver.findById(order.driver);
        if (driver && driver.wallet) {
          const Wallet = mongoose.model('Wallet');
          const driverWallet = await Wallet.findById(driver.wallet);

          if (driverWallet) {
            // Calcul de la part du chauffeur (= total - commissions)
            let driverShare;

            if (order.orderType === 'DELIVERY') {
              // Pour les livraisons, le chauffeur reçoit sa part selon le calcul de commission
              driverShare =
                serviceCharge - valdeliCommission - partnerCommission;
            } else {
              // Pour les courses VTC, le chauffeur reçoit 85%
              driverShare = serviceCharge * 0.85;
            }

            // Ajouter les gains au wallet du chauffeur
            await driverWallet.addEarning(
              driverShare,
              `Rémunération pour ${
                order.orderType === 'DELIVERY' ? 'livraison' : 'course'
              } #${order._id}`
            );

            // Mettre à jour les statistiques du chauffeur via le modèle Wallet
            // car le modèle Driver n'a pas de propriétés totalEarnings et dailyEarnings
            await Wallet.findByIdAndUpdate(driver.wallet, {
              $inc: { totalEarnings: driverShare, dailyEarnings: driverShare },
            });
          }
        }
      }

      // Traiter la commission du partenaire pour les livraisons
      if (
        order.orderType === 'DELIVERY' &&
        order.partner &&
        partnerCommission > 0
      ) {
        const partner = await mongoose.model('Partner').findById(order.partner);
        if (partner && partner.wallets && partner.wallets.length > 0) {
          const Wallet = mongoose.model('Wallet');
          const partnerWallet = await Wallet.findById(partner.wallets[0]);

          if (partnerWallet) {
            // Ajouter la commission au wallet du partenaire
            await partnerWallet.addEarning(
              partnerCommission,
              `Commission pour livraison #${order._id}`
            );

            // Mettre à jour les statistiques du partenaire
            partner.statistics.totalRevenue += partnerCommission;
            partner.statistics.totalOrders += 1;
            await partner.save();
          }
        }
      }

      // À ce stade, la commission ValDeli reste dans le système
    } catch (error) {
      console.error('Erreur lors de la distribution des paiements:', error);
      // Ne pas bloquer le processus de finalisation de commande en cas d'erreur
    }
  }

  // Calculer le prix de la commande
  static async calculateOrderPrice(
    pickupLocation: [number, number],
    dropoffLocation: [number, number],
    orderType: 'RIDE' | 'DELIVERY' = 'DELIVERY',
    trafficCondition: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM',
    weatherCondition: 'GOOD' | 'MODERATE' | 'BAD' = 'GOOD'
  ) {
    const vehicleTypes = orderType === 'DELIVERY' 
      ? Object.keys(PRICING_CONFIG.DELIVERY)
      : Object.keys(PRICING_CONFIG.RIDE);

    const prices: Record<string, {
      base: number;
      distance: number;
      duration: number;
      durationText: string;
      total: number;
      serviceCharge: number;
      valdeliCommission: number;
      partnerCommission: number;
      currency: string;
    }> = {};

    // Calculer le prix pour chaque type de véhicule
    for (const vehicleType of vehicleTypes) {
      // Obtenir la durée et la distance avec les conditions de trafic
      const route = await getRouteDetails(
        pickupLocation, 
        dropoffLocation, 
        vehicleType,
        trafficCondition
      );
      
      // Calculer le prix avec les nouvelles durées ajustées
      const basePrice = handleCalculateOrderPrice(
        route.distance,
        route.duration,
        orderType,
        vehicleType,
        trafficCondition,
        weatherCondition
      );

      const serviceCharge = basePrice.total;
      const valdeliCommission = serviceCharge * (orderType === 'RIDE' ? 0.15 : 0.1);
      const partnerCommission = orderType === 'DELIVERY' ? serviceCharge * 0.05 : 0;

      prices[vehicleType] = {
        base: basePrice.base,
        distance: basePrice.distance,
        duration: route.duration,
        durationText: `${Math.round(route.duration / 60)} min`,
        total: serviceCharge,
        serviceCharge,
        valdeliCommission,
        partnerCommission,
        currency: basePrice.currency
      };
    }

    return {
      orderType,
      conditions: {
        traffic: trafficCondition,
        weather: weatherCondition
      },
      prices,
      durations: {
        unit: "seconds",
        note: "Duration values are provided in seconds. Use durationText for formatted minutes."
      }
    };
  }

  // Attribuer une commande à un chauffeur
  static async assignOrder(orderId: string) {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new AppError('Commande non trouvée', 404);
    }

    const driver = await this.findOptimalDriver(order);

    // Mettre à jour la commande
    order.driver = driver._id as unknown as mongoose.Types.ObjectId;
    order.status = 'ACCEPTED';
    await order.save();

    // Mettre à jour le chauffeur
    await Driver.findByIdAndUpdate(driver._id, {
      $push: { activeOrders: order._id },
    });

    // Notifier le chauffeur via Socket.io
    SocketService.emitStatusUpdate(order);

    // Émettre une mise à jour en temps réel aux abonnés
    // Pour le client (customer)
    if (order.customer) {
      SocketService.emitOrdersUpdate([order], {
        userType: 'user',
        userId: order.customer.toString(),
      });
    }

    // Pour le chauffeur assigné
    SocketService.emitOrdersUpdate([order], {
      userType: 'driver',
      userId: (driver._id as unknown as mongoose.Types.ObjectId).toString(),
    });

    // Pour le partenaire (si applicable)
    if (order.partner) {
      SocketService.emitOrdersUpdate([order], {
        userType: 'partner',
        userId: order.partner.toString(),
      });
    }

    // Pour les administrateurs
    SocketService.emitOrdersUpdate([order], { userType: 'admin' });

    return order;
  }

  // Mettre à jour le statut de la commande
  static async updateOrderStatus(
    orderId: string,
    status: IOrder['status'],
    location?: { latitude: number; longitude: number }
  ) {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new AppError('Commande non trouvée', 404);
    }

    const oldStatus = order.status;
    order.status = status;

    if (location) {
      order.driverLocation = {
        type: 'Point',
        coordinates: [location.longitude, location.latitude],
      };
      order.lastLocationUpdate = new Date();
    }

    if (status === 'COMPLETED') {
      order.actualDuration =
        (new Date().getTime() - order.createdAt.getTime()) / 1000;

      // Distribution des paiements
      await this.distributePayments(order);

      // Mettre à jour les statistiques du chauffeur
      if (order.driver) {
        const driver = await Driver.findById(order.driver);
        if (driver) {
          // On passe maintenant 0 comme montant car la distribution des gains est gérée par distributePayments
          await driver.updateStats(true);
          await Driver.findByIdAndUpdate(driver._id, {
            $pull: { activeOrders: order._id },
          });
        }
      }
    } else if (status === 'CANCELLED' && oldStatus !== 'CANCELLED') {
      // Mettre à jour les statistiques du chauffeur en cas d'annulation
      if (order.driver) {
        const driver = await Driver.findById(order.driver);
        if (driver) {
          await driver.updateStats(false);
          await Driver.findByIdAndUpdate(driver._id, {
            $pull: { activeOrders: order._id },
          });
        }
      }
    }

    await order.save();

    // Émettre la mise à jour via Socket.io
    SocketService.emitStatusUpdate(order);

    // Émettre une mise à jour en temps réel aux abonnés
    // Pour le client (customer)
    if (order.customer) {
      SocketService.emitOrdersUpdate([order], {
        userType: 'user',
        userId: order.customer.toString(),
      });
    }

    // Pour le chauffeur
    if (order.driver) {
      SocketService.emitOrdersUpdate([order], {
        userType: 'driver',
        userId: order.driver.toString(),
      });
    }

    // Pour le partenaire (si applicable)
    if (order.partner) {
      SocketService.emitOrdersUpdate([order], {
        userType: 'partner',
        userId: order.partner.toString(),
      });
    }

    // Pour les administrateurs
    SocketService.emitOrdersUpdate([order], { userType: 'admin' });

    return order;
  }

  // Signaler un incident
  static async reportIncident(
    orderId: string,
    incident: {
      type:
        | 'DELAY'
        | 'ACCIDENT'
        | 'CUSTOMER_UNREACHABLE'
        | 'PACKAGE_DAMAGED'
        | 'OTHER';
      description: string;
      reportedBy: string;
      location?: { latitude: number; longitude: number };
    }
  ) {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new AppError('Commande non trouvée', 404);
    }

    // Créer l'incident dans la base de données
    const newIncident = await Incident.create({
      order: order._id,
      type: incident.type,
      description: incident.description,
      reportedBy: incident.reportedBy,
      location: incident.location
        ? {
            type: 'Point',
            coordinates: [
              incident.location.longitude,
              incident.location.latitude,
            ],
          }
        : undefined,
    });

    // Mettre à jour le statut de la commande si nécessaire
    if (incident.type === 'ACCIDENT') {
      order.status = 'CANCELLED';
      await order.save();

      // Mettre à jour les statistiques du chauffeur
      if (order.driver) {
        const driver = await Driver.findById(order.driver);
        if (driver) {
          await driver.updateStats(false);
          await Driver.findByIdAndUpdate(driver._id, {
            $pull: { activeOrders: order._id },
          });
        }
      }
    }

    // Émettre l'incident via Socket.io
    SocketService.emitOrderIncident(orderId, {
      type: incident.type,
      description: incident.description,
    });

    return { order, incident: newIncident };
  }

  // Annuler une commande
  static async cancelOrder(orderId: string, reason: string) {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new AppError('Commande non trouvée', 404);
    }

    order.status = 'CANCELLED';
    await order.save();

    // Mettre à jour les statistiques du chauffeur
    if (order.driver) {
      const driver = await Driver.findById(order.driver);
      if (driver) {
        await driver.updateStats(false);
        await Driver.findByIdAndUpdate(driver._id, {
          $pull: { activeOrders: order._id },
        });
      }
    }

    // Émettre l'annulation via Socket.io
    SocketService.emitOrderCancellation(orderId, reason);

    return order;
  }
}
