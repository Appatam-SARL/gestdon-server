import { Server } from 'http';
import { Server as SocketServer } from 'socket.io';
import { Conversation } from '../models/conversation.model';
import { logger } from '../utils/logger';

// Fonction utilitaire pour calculer la distance entre deux points
function calculateDistance(
  point1: [number, number],
  point2: [number, number]
): number {
  const R = 6371e3; // Rayon moyen de la Terre en mètres
  const φ1 = (point1[1] * Math.PI) / 180; // Latitude point 1 en radians
  const φ2 = (point2[1] * Math.PI) / 180; // Latitude point 2 en radians
  const Δφ = ((point2[1] - point1[1]) * Math.PI) / 180; // Différence de latitude en radians
  const Δλ = ((point2[0] - point1[0]) * Math.PI) / 180; // Différence de longitude en radians

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance en mètres
}

// Interface pour la position du chauffeur
interface DriverLocation {
  driverId: string;
  coordinates: [number, number]; // [longitude, latitude]
  heading?: number;
  speed?: number;
  timestamp: Date;
  isAvailable: boolean;
}

// Interface pour le suivi d'une zone géographique
interface AreaTrackingInfo {
  coordinates: [number, number]; // [longitude, latitude]
  maxDistance: number;
  isAvailable?: boolean;
  clients: Set<string>; // IDs des clients qui suivent cette zone
  lastCheck: Date;
}

export class SocketService {
  private static io: SocketServer;

  // Map pour stocker les connexions des chauffeurs par userId
  private static driverSockets: Map<string, string> = new Map();

  // Map pour stocker les connexions des clients qui suivent des chauffeurs
  private static trackingSockets: Map<string, Set<string>> = new Map();

  // Map pour stocker les zones géographiques suivies
  private static trackedAreas: Map<string, AreaTrackingInfo> = new Map();

  // Map inverse pour savoir quelles zones un client suit
  private static clientAreas: Map<string, Set<string>> = new Map();

  /**
   * Initialise le serveur Socket.IO
   * @param server Serveur HTTP
   */
  static initialize(server: Server) {
    this.io = new SocketServer(server, {
      cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST'],
      },
    });

    this.io.on('connection', (socket) => {
      logger.socket('Client connecté:', socket.id);

      // Rejoindre une room spécifique pour une livraison
      socket.on('join-delivery', (deliveryId: string) => {
        socket.join(`delivery:${deliveryId}`);
      });

      // Quitter une room
      socket.on('leave-delivery', (deliveryId: string) => {
        socket.leave(`delivery:${deliveryId}`);
      });

      // Authentification du chauffeur
      socket.on('driver-auth', (data: { driverId: string; token: string }) => {
        // TODO: Vérifier le token (pour la sécurité)

        // Enregistrer l'ID du socket pour ce chauffeur
        this.driverSockets.set(data.driverId, socket.id);

        // Rejoindre la room du chauffeur
        socket.join(`driver:${data.driverId}`);

        logger.socket(`Chauffeur authentifié: ${data.driverId}`);
      });

      // Mise à jour de la position du chauffeur
      socket.on('driver-location', async (data: DriverLocation) => {
        try {
          // En mode développement, permettre les mises à jour sans authentification préalable
          if (process.env.NODE_ENV === 'development') {
            // Mettre à jour dans MongoDB

            // Émettre la mise à jour aux clients qui suivent ce chauffeur
            this.emitDriverLocation(data);

            logger.socket(
              `Position du chauffeur mise à jour (mode dev): ${data.driverId}`
            );
            return;
          }

          // Émettre la mise à jour aux clients qui suivent ce chauffeur
          this.emitDriverLocation(data);

          logger.socket(`Position du chauffeur mise à jour: ${data.driverId}`);
        } catch (error) {
          logger.error(
            `Erreur lors de la mise à jour de la position du chauffeur: ${error}`
          );
        }
      });

      // Client demande à suivre un chauffeur
      socket.on('track-driver', (driverId: string) => {
        // Ajouter à la room de suivi du chauffeur
        socket.join(`driver-tracking:${driverId}`);

        // Enregistrer ce socket comme suivant ce chauffeur
        if (!this.trackingSockets.has(driverId)) {
          this.trackingSockets.set(driverId, new Set());
        }
        this.trackingSockets.get(driverId)?.add(socket.id);

        logger.socket(`Client commence à suivre le chauffeur: ${driverId}`);
      });

      // Client arrête de suivre un chauffeur
      socket.on('untrack-driver', (driverId: string) => {
        socket.leave(`driver-tracking:${driverId}`);

        // Supprimer ce socket de la liste des suiveurs
        this.trackingSockets.get(driverId)?.delete(socket.id);

        logger.socket(`Client arrête de suivre le chauffeur: ${driverId}`);
      });

      // Gérer les messages du chat
      socket.on(
        'chat-message',
        (data: { deliveryId: string; message: string; sender: string }) => {
          this.io.to(`delivery:${data.deliveryId}`).emit('chat-message', {
            ...data,
            timestamp: new Date(),
          });
        }
      );

      socket.on('disconnect', () => {
        // Nettoyage des maps quand un client/chauffeur se déconnecte
        for (const [driverId, socketId] of this.driverSockets.entries()) {
          if (socketId === socket.id) {
            this.driverSockets.delete(driverId);
            break;
          }
        }

        // Supprimer ce socket de toutes les listes de tracking
        for (const [driverId, sockets] of this.trackingSockets.entries()) {
          if (sockets.has(socket.id)) {
            sockets.delete(socket.id);
            if (sockets.size === 0) {
              this.trackingSockets.delete(driverId);
            }
          }
        }

        logger.socket('Client déconnecté:', socket.id);
      });
    });
  }

  /**
   * Récupère l'instance de Socket.IO
   * @returns L'instance Socket.IO ou undefined si non initialisée
   */
  static getInstance(): SocketServer | undefined {
    return this.io;
  }

  /**
   * Émet la mise à jour de la position d'un chauffeur à tous les clients qui le suivent
   * @param data Données de localisation du chauffeur
   */
  static emitDriverLocation(data: DriverLocation) {
    if (this.io) {
      this.io
        .to(`driver-tracking:${data.driverId}`)
        .emit('driver-location-update', {
          driverId: data.driverId,
          coordinates: data.coordinates,
          heading: data.heading,
          speed: data.speed,
          isAvailable: data.isAvailable,
          timestamp: data.timestamp,
        });

      // Vérifier si ce chauffeur est entré dans une zone suivie
      this.checkDriverInTrackedAreas(data.driverId, data);
    }
  }

  // Émettre une mise à jour de commande
  static emitOrderUpdate(orderId: string, update: any) {
    if (this.io) {
      this.io.to(`order:${orderId}`).emit('order-update', {
        orderId,
        ...update,
        timestamp: new Date(),
      });
    }
  }

  // Émettre une notification d'annulation
  static emitOrderCancellation(orderId: string, reason: string) {
    if (this.io) {
      this.io.to(`order:${orderId}`).emit('order-cancelled', {
        orderId,
        reason,
        timestamp: new Date(),
      });
    }
  }

  // Émettre une notification à un utilisateur
  static emitNotification(userId: string, data: any) {
    if (this.io) {
      this.io.to(`user:${userId}`).emit('notification', {
        ...data,
        timestamp: new Date(),
      });
    }
  }

  // Rejoindre toutes les rooms de chat pour un utilisateur
  static joinUserChatRooms(socket: any, userId: string) {
    socket.join(`user:${userId}`);

    // Récupérer les IDs de conversation de l'utilisateur et les rejoindre
    Conversation.find({
      'participants.id': userId,
    })
      .select('_id')
      .then((conversations) => {
        conversations.forEach((conv) => {
          socket.join(`chat:${conv._id}`);
        });
      });
  }

  // Émettre un nouveau message
  static emitNewMessage(
    userId: string,
    data: {
      conversationId: string;
      message: any;
      type?: string;
    }
  ) {
    if (this.io) {
      this.io.to(`user:${userId}`).emit('new-message', data);
      this.io.to(`chat:${data.conversationId}`).emit('chat-update', data);
    }
  }

  // Émettre une nouvelle conversation
  static emitNewConversation(
    userId: string,
    data: {
      conversationId: string;
      subject: string;
      lastMessage: string;
      type?: string;
    }
  ) {
    if (this.io) {
      this.io.to(`user:${userId}`).emit('new-conversation', data);
    }
  }

  // Émettre une mise à jour du statut de lecture
  static emitReadStatus(conversationId: string, userId: string) {
    if (this.io) {
      this.io.to(`chat:${conversationId}`).emit('read-status', {
        conversationId,
        userId,
        timestamp: new Date(),
      });
    }
  }

  // Émettre une mise à jour de conversation
  static emitConversationUpdate(
    userId: string,
    data: {
      conversationId: string;
      updates: {
        status?: 'OPEN' | 'CLOSED' | 'PENDING';
        priority?: 'LOW' | 'MEDIUM' | 'HIGH';
        tags?: string[];
        isActive?: boolean;
      };
    }
  ) {
    if (this.io) {
      this.io.to(`user:${userId}`).emit('conversation-update', data);
    }
  }

  // Émettre une notification pour les demandes de support
  static emitSupportRequest(
    conversationId: string,
    data: {
      type: 'SUPPORT' | 'CLAIM';
      subject: string;
      priority: 'LOW' | 'MEDIUM' | 'HIGH';
    }
  ) {
    if (this.io) {
      // Notifier tous les administrateurs
      this.io.to('admin-group').emit('support-request', {
        conversationId,
        ...data,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Crée ou met à jour une session de suivi pour une zone géographique
   * @param areaId Identifiant de la zone (format: "area:lng,lat,radius")
   * @param clientId Identifiant du client qui suit cette zone
   * @param options Critères de la zone (coordonnées, rayon, filtres)
   */
  static createAreaTracking(
    areaId: string,
    clientId: string,
    options: {
      coordinates: [number, number];
      maxDistance: number;
    }
  ): void {
    try {
      // Créer ou mettre à jour la zone
      if (!this.trackedAreas.has(areaId)) {
        this.trackedAreas.set(areaId, {
          coordinates: options.coordinates,
          maxDistance: options.maxDistance,
          clients: new Set<string>(),
          lastCheck: new Date(),
        });
      }

      // Ajouter ce client à la zone
      this.trackedAreas.get(areaId)!.clients.add(clientId);

      // Mettre à jour les zones suivies par ce client
      if (!this.clientAreas.has(clientId)) {
        this.clientAreas.set(clientId, new Set<string>());
      }
      this.clientAreas.get(clientId)!.add(areaId);

      logger.socket(`Client ${clientId} commence à suivre la zone ${areaId}`);
    } catch (error) {
      logger.error(`Erreur lors de la création du suivi de zone: ${error}`);
    }
  }

  /**
   * Supprime le suivi d'une zone par un client
   * @param areaId Identifiant de la zone
   * @param clientId Identifiant du client
   */
  static removeAreaTracking(areaId: string, clientId: string): void {
    try {
      // Supprimer le client de cette zone
      const area = this.trackedAreas.get(areaId);
      if (area) {
        area.clients.delete(clientId);

        // Si plus aucun client ne suit cette zone, la supprimer
        if (area.clients.size === 0) {
          this.trackedAreas.delete(areaId);
        }
      }

      // Supprimer la zone des zones suivies par ce client
      const clientAreas = this.clientAreas.get(clientId);
      if (clientAreas) {
        clientAreas.delete(areaId);

        // Si le client ne suit plus aucune zone, le supprimer
        if (clientAreas.size === 0) {
          this.clientAreas.delete(clientId);
        }
      }

      logger.socket(`Client ${clientId} arrête de suivre la zone ${areaId}`);
    } catch (error) {
      logger.error(`Erreur lors de la suppression du suivi de zone: ${error}`);
    }
  }

  /**
   * Vérifie si un chauffeur est dans une zone suivie et notifie les clients concernés
   * @param driverId ID du chauffeur
   * @param driverLocation Position du chauffeur
   */
  static checkDriverInTrackedAreas(
    driverId: string,
    driverLocation: DriverLocation
  ): void {
    try {
      // Parcourir toutes les zones suivies
      for (const [areaId, area] of this.trackedAreas.entries()) {
        try {
          // Calculer la distance entre le chauffeur et le centre de la zone
          const distance = calculateDistance(
            area.coordinates,
            driverLocation.coordinates
          );

          // Si le chauffeur est dans cette zone et correspond aux critères
          if (
            distance <= area.maxDistance &&
            (area.isAvailable === undefined ||
              area.isAvailable === driverLocation.isAvailable)
          ) {
            // Notifier tous les clients qui suivent cette zone
            if (this.io) {
              for (const clientId of area.clients) {
                this.io.to(`client:${clientId}`).emit('driver-entered-area', {
                  areaId,
                  driverId,
                  location: {
                    coordinates: driverLocation.coordinates,
                    isAvailable: driverLocation.isAvailable,
                    heading: driverLocation.heading,
                    speed: driverLocation.speed,
                    timestamp: driverLocation.timestamp,
                  },
                });
              }
            }
          }
        } catch (innerError) {
          // Ignorer les erreurs individuelles pour une zone et continuer avec les autres
          logger.error(
            `Erreur lors du traitement de la zone ${areaId}: ${innerError}`
          );
        }
      }
    } catch (error) {
      logger.error(
        `Erreur lors de la vérification des zones suivies: ${error}`
      );
    }
  }
}
