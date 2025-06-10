interface OrderPrice {
  base: number;
  distance: number;
  duration: number;
  total: number;
  currency: string;
  vehicleType: string;
  orderType: 'DELIVERY' | 'RIDE';
}



export const PRICING_CONFIG = {
  CURRENCY: 'XOF',
  MIN_TOTAL: 300,
  DELIVERY: {
    BICYCLE: {
      basePrice: 300,
      pricePerKm: 100,
      pricePerMinute: 5,
      multiplier: 1.0
    },
    BIKE: {
      basePrice: 300,
      pricePerKm: 100,
      pricePerMinute: 10,
      multiplier: 1.1
    },
    CAR: {
      basePrice: 500,
      pricePerKm: 125,
      pricePerMinute: 15,
      multiplier: 1.20
    },
    CARGO: {
      basePrice: 700,
      pricePerKm: 150,
      pricePerMinute: 30,
      multiplier: 1.35
    }
  },
  RIDE: {
    STANDARD: {
      basePrice: 700,
      pricePerKm: 150,
      pricePerMinute: 30,
      multiplier: 1.0
    },
    CONFORT: {
      basePrice: 1000,
      pricePerKm: 200,
      pricePerMinute: 40,
      multiplier: 1.3
    },
    CONFORT_PLUS: {
      basePrice: 1000,
      pricePerKm: 300,
      pricePerMinute: 50,
      multiplier: 1.5
    },
  },
  TRAFFIC_MULTIPLIER: {
    LOW: 1.0,
    MEDIUM: 1.1,
    HIGH: 1.2
  },
  WEATHER_MULTIPLIER: {
    GOOD: 1.0,
    MODERATE: 1.1,
    BAD: 1.2
  }
};

// Calculer le prix de la livraison
export function handleCalculateOrderPrice(
  distanceInMeters: number,
  durationInSeconds: number,
  orderType: 'DELIVERY' | 'RIDE' = 'DELIVERY',
  vehicleType: string = 'STANDARD',
  trafficCondition: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM',
  weatherCondition: 'GOOD' | 'MODERATE' | 'BAD' = 'GOOD'
): OrderPrice {
  // Convertir en km et minutes pour le calcul
  const distanceInKm = distanceInMeters / 1000;
  const durationInMinutes = durationInSeconds / 60;

  // Obtenir la configuration de prix pour le type de véhicule
  const pricing = orderType === 'DELIVERY' 
    ? PRICING_CONFIG.DELIVERY[vehicleType as keyof typeof PRICING_CONFIG.DELIVERY]
    : PRICING_CONFIG.RIDE[vehicleType as keyof typeof PRICING_CONFIG.RIDE];

  if (!pricing) {
    throw new Error(`Type de véhicule non supporté: ${vehicleType}`);
  }

  // Calculer les composants du prix
  const basePrice = pricing.basePrice;
  const distancePrice = distanceInKm * pricing.pricePerKm;
  const durationPrice = durationInMinutes * pricing.pricePerMinute;

  // Calculer le total avec les multiplicateurs
  let total = (basePrice + distancePrice + durationPrice) * pricing.multiplier;
  
  // Appliquer les multiplicateurs de conditions
  total *= PRICING_CONFIG.TRAFFIC_MULTIPLIER[trafficCondition];
  total *= PRICING_CONFIG.WEATHER_MULTIPLIER[weatherCondition];

  // Appliquer le prix minimum et arrondir aux 100 FCFA supérieurs
  total = Math.max(Math.ceil(total / 100) * 100, PRICING_CONFIG.MIN_TOTAL);

  return {
    base: Math.ceil(basePrice / 100) * 100,
    distance: Math.ceil(distancePrice / 100) * 100,
    duration: Math.ceil(durationPrice / 100) * 100,
    total,
    currency: PRICING_CONFIG.CURRENCY,
    vehicleType,
    orderType
  };
}

// Vérifier si c'est un jour férié
function isHoliday(): boolean {
  // TODO: Implémenter la vérification des jours fériés
  return false;
}

// Arrondir aux 100 FCFA supérieurs
function roundPrice(price: number): number {
  return Math.ceil(price / 100) * 100;
}
