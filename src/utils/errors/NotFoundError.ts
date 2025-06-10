import { BaseError, ErrorCategory, ErrorSeverity } from './BaseError';

export class NotFoundError extends BaseError {
  constructor(
    message: string,
    code: string = 'NOT_FOUND_ERROR',
    metadata: Record<string, any> = {}
  ) {
    super(message, ErrorCategory.NOT_FOUND, ErrorSeverity.LOW, code, metadata);
  }
}

export class ResourceNotFoundError extends NotFoundError {
  constructor(
    resource: string,
    id: string,
    metadata: Record<string, any> = {}
  ) {
    super(`${resource} avec l'ID ${id} non trouvé`, 'RESOURCE_NOT_FOUND', {
      resource,
      id,
      ...metadata,
    });
  }
}

export class UserNotFoundError extends NotFoundError {
  constructor(userId: string, metadata: Record<string, any> = {}) {
    super(`Utilisateur avec l'ID ${userId} non trouvé`, 'USER_NOT_FOUND', {
      userId,
      ...metadata,
    });
  }
}

export class OrderNotFoundError extends NotFoundError {
  constructor(orderId: string, metadata: Record<string, any> = {}) {
    super(`Commande avec l'ID ${orderId} non trouvée`, 'ORDER_NOT_FOUND', {
      orderId,
      ...metadata,
    });
  }
}

export class PartnerNotFoundError extends NotFoundError {
  constructor(partnerId: string, metadata: Record<string, any> = {}) {
    super(`Partenaire avec l'ID ${partnerId} non trouvé`, 'PARTNER_NOT_FOUND', {
      partnerId,
      ...metadata,
    });
  }
}
