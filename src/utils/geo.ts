type Coordinates = [number, number]; // [longitude, latitude]

// Calculer la distance entre deux points en mètres (formule de Haversine)
export function calculateDistance(
  point1: Coordinates,
  point2: Coordinates
): number {
  const R = 6371e3; // Rayon de la Terre en mètres
  const φ1 = (point1[1] * Math.PI) / 180; // latitude en radians
  const φ2 = (point2[1] * Math.PI) / 180;
  const Δφ = ((point2[1] - point1[1]) * Math.PI) / 180;
  const Δλ = ((point2[0] - point1[0]) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Calcul de durée de fallback amélioré
export function calculateDuration(distance: number, vehicleType: string = 'CAR'): number {
  const speedsKmH = {
    BICYCLE: 15,  // 15 km/h en moyenne pour un vélo
    BIKE: 30,     // 30 km/h en moyenne pour une moto
    CAR: 25,      // 25 km/h en moyenne pour une voiture en ville
    CARGO: 20     // 20 km/h en moyenne pour un véhicule cargo
  };

  const speed = speedsKmH[vehicleType as keyof typeof speedsKmH] || speedsKmH.CAR;
  const speedInMetersPerSecond = (speed * 1000) / 3600;
  return Math.round(distance / speedInMetersPerSecond);
}

// Vérifier si un point est dans un rayon donné
export function isWithinRadius(
  center: Coordinates,
  point: Coordinates,
  radiusInMeters: number
): boolean {
  return calculateDistance(center, point) <= radiusInMeters;
}

// Calculer le centre d'une zone à partir de plusieurs points en utilisant les distances routières
export async function calculateCenter(points: Coordinates[]): Promise<Coordinates> {
  if (points.length === 0) {
    throw new Error('Aucun point fourni pour calculer le centre');
  }
  
  if (points.length === 1) {
    return points[0];
  }

  try {
    // Calculer les distances routières entre tous les points
    const distanceMatrix: number[][] = [];
    
    for (let i = 0; i < points.length; i++) {
      distanceMatrix[i] = [];
      for (let j = 0; j < points.length; j++) {
        if (i === j) {
          distanceMatrix[i][j] = 0;
          continue;
        }
        if (distanceMatrix[j] && distanceMatrix[j][i] !== undefined) {
          distanceMatrix[i][j] = distanceMatrix[j][i];
          continue;
        }
        
        const route = await getRouteDetails(points[i], points[j]);
        distanceMatrix[i][j] = route.distance;
      }
    }

    // Trouver le point qui minimise la somme des distances vers tous les autres points
    let minTotalDistance = Infinity;
    let centralPointIndex = 0;

    for (let i = 0; i < points.length; i++) {
      const totalDistance = distanceMatrix[i].reduce((sum, distance) => sum + distance, 0);
      if (totalDistance < minTotalDistance) {
        minTotalDistance = totalDistance;
        centralPointIndex = i;
      }
    }

    return points[centralPointIndex];
  } catch (error) {
    console.error('Erreur lors du calcul du centre avec OSRM:', error);
    // Fallback vers le calcul simple en cas d'erreur
    const total = points.reduce(
      (acc, point) => ({
        longitude: acc.longitude + point[0],
        latitude: acc.latitude + point[1],
      }),
      { longitude: 0, latitude: 0 }
    );

    return [total.longitude / points.length, total.latitude / points.length];
  }
}

interface VehicleProfile {
  profile: 'driving' | 'bike' | 'foot';
  speedFactor: number;
  trafficImpact: number;
}

const VEHICLE_PROFILES: Record<string, VehicleProfile> = {
  BICYCLE: {
    profile: 'bike',
    speedFactor: 0.8,    // Plus lent qu'une moto
    trafficImpact: 0.3   // Moins impacté par le trafic
  },
  BIKE: {
    profile: 'bike',
    speedFactor: 1.2,    // Plus rapide qu'un vélo
    trafficImpact: 0.5   // Moyennement impacté par le trafic
  },
  CAR: {
    profile: 'driving',
    speedFactor: 1.0,    // Vitesse standard
    trafficImpact: 1.0   // Pleinement impacté par le trafic
  },
  CARGO: {
    profile: 'driving',
    speedFactor: 0.9,    // Plus lent qu'une voiture
    trafficImpact: 1.2   // Plus impacté par le trafic
  }
}

interface OsrmProfile {
  profile: 'driving' | 'bike' | 'foot';
  avgSpeedKmH: number;
  maxSpeedKmH: number;
  alternatives?: boolean;
  overview?: 'full' | 'simplified' | 'false';
  annotations?: boolean;
}

const VEHICLE_TO_OSRM: Record<string, OsrmProfile> = {
  BICYCLE: {
    profile: 'bike',
    avgSpeedKmH: 15,    // Vitesse moyenne vélo en ville
    maxSpeedKmH: 20,    // Vitesse max vélo
    overview: 'simplified',
    annotations: true
  },
  BIKE: {
    profile: 'bike',
    avgSpeedKmH: 35,    // Vitesse moyenne moto en ville
    maxSpeedKmH: 50,    // Vitesse max moto en ville
    overview: 'simplified',
    annotations: true
  },
  CAR: {
    profile: 'driving',
    avgSpeedKmH: 30,    // Vitesse moyenne voiture en ville
    maxSpeedKmH: 50,    // Vitesse max voiture en ville
    overview: 'simplified',
    annotations: true
  },
  CARGO: {
    profile: 'driving',
    avgSpeedKmH: 25,    // Vitesse moyenne cargo en ville
    maxSpeedKmH: 45,    // Vitesse max cargo en ville
    overview: 'simplified',
    annotations: true
  }
};

// Obtenir les détails de l'itinéraire via OSRM API
export async function getRouteDetails(
  point1: Coordinates,
  point2: Coordinates,
  vehicleType: string = 'CAR',
  trafficCondition: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM'
): Promise<{ distance: number; duration: number }> {
  const profile = VEHICLE_TO_OSRM[vehicleType] || VEHICLE_TO_OSRM.CAR;
  
  const url = `https://router.project-osrm.org/route/v1/${profile.profile}/` +
    `${point1[0]},${point1[1]};${point2[0]},${point2[1]}` +
    `?overview=${profile.overview}` +
    `&annotations=${profile.annotations}` +
    `&alternatives=false`;
  
  try {
    const response = await fetch(url);
    const data = await response.json() as { code: string; routes?: { distance: number }[] };
    
    if (data.code !== 'Ok' || !data.routes?.[0]) {
      throw new Error('OSRM API error: ' + data.code);
    }

    const route = data.routes[0];
    
    // Calculer la durée en fonction de la vitesse moyenne du véhicule
    const distanceKm = route.distance / 1000;
    const baseTimeHours = distanceKm / profile.avgSpeedKmH;
    const baseTimeSeconds = baseTimeHours * 3600;

    // Appliquer les multiplicateurs de trafic
    const trafficMultiplier = {
      LOW: 1.0,
      MEDIUM: 1.3,    // Augmenté pour être plus réaliste
      HIGH: 1.8      // Augmenté pour le trafic dense
    }[trafficCondition];

    // Ajuster la durée en fonction du type de véhicule et du trafic
    const vehicleAdjustment = {
      BICYCLE: 0.2,   // Peu affecté par le trafic
      BIKE: 0.4,      // Légèrement affecté
      CAR: 1.0,       // Pleinement affecté
      CARGO: 1.2      // Plus affecté
    }[vehicleType] || 1.0;

    const finalDuration = baseTimeSeconds * (1 + ((trafficMultiplier - 1) * vehicleAdjustment));

    return {
      distance: route.distance,
      duration: Math.round(finalDuration)
    };
  } catch (error) {
    console.error('OSRM API error:', error);
    // Fallback vers le calcul local
    const distance = calculateDistance(point1, point2);
    return {
      distance,
      duration: Math.round((distance / 1000 / profile.avgSpeedKmH) * 3600)
    };
  }
}
