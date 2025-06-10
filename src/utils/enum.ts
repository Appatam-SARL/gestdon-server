export enum VehicleTypeEnum {
  BIKE = 'BIKE',
  CAR = 'CAR',
  ELECTRIC_BIKE = 'ELECTRIC_BIKE',
  CARGO = 'CARGO',
}

export enum RideServiceTypeEnum {
  STANDARD = 'STANDARD',
  CONFORT = 'CONFORT',
  CONFORT_PLUS = 'CONFORT_PLUS',
}

export enum DeliveryServiceTypeEnum {
  EXPRESS = 'EXPRESS',
  SCHEDULED = 'SCHEDULED',
  PICKUP = 'PICKUP',
  SHIPPING = 'SHIPPING',
}

export enum DocOwnerTypeEnum {
  DRIVER = 'DRIVER',
  VEHICLE = 'VEHICLE',
  PARTNER = 'PARTNER',
  ADMIN = 'ADMIN',
  COMPANY = 'COMPANY',
}

export enum DocTypeEnum {
  DRIVER_LICENSE = 'DRIVER_LICENSE',
  VEHICLE_INSURANCE = 'VEHICLE_INSURANCE',
  VEHICLE_REGISTRATION = 'VEHICLE_REGISTRATION',
  OTHER = 'OTHER',
  ID_CARD = 'ID_CARD',
  PASSPORT = 'PASSPORT',
  RESIDENCE_PERMIT = 'RESIDENCE_PERMIT',
  NATIONAL_ID = 'NATIONAL_ID',
}

export enum DocStatusEnum {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export enum RelayPointTypeEnum {
  STORE = 'STORE', // Magasin
  PHARMACY = 'PHARMACY', // Pharmacie
  POST_OFFICE = 'POST_OFFICE', // Bureau de poste
  RESTAURANT = 'RESTAURANT', // Restaurant
  GROCERY = 'GROCERY', // Épicerie
  LOCKER = 'LOCKER', // Casier automatique
  OTHER = 'OTHER', // Autre
}

export enum RelayPointStatusEnum {
  ACTIVE = 'ACTIVE', // Point de relais actif
  INACTIVE = 'INACTIVE', // Point de relais temporairement inactif
  PENDING = 'PENDING', // En attente de validation
  SUSPENDED = 'SUSPENDED', // Suspendu (problèmes)
  CLOSED = 'CLOSED', // Fermé définitivement
}
