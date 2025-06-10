import { BaseError, ErrorCategory, ErrorSeverity } from './BaseError';

export class BusinessLogicError extends BaseError {
  constructor(
    message: string,
    code: string = 'BUSINESS_LOGIC_ERROR',
    metadata: Record<string, any> = {}
  ) {
    super(
      message,
      ErrorCategory.BUSINESS_LOGIC,
      ErrorSeverity.MEDIUM,
      code,
      metadata
    );
  }
}

export class OrderStatusError extends BusinessLogicError {
  constructor(message: string, metadata: Record<string, any> = {}) {
    super(message, 'ORDER_STATUS_ERROR', metadata);
  }
}

export class PaymentError extends BusinessLogicError {
  constructor(message: string, metadata: Record<string, any> = {}) {
    super(message, 'PAYMENT_ERROR', metadata);
  }
}

export class DeliveryError extends BusinessLogicError {
  constructor(message: string, metadata: Record<string, any> = {}) {
    super(message, 'DELIVERY_ERROR', metadata);
  }
}

export class InventoryError extends BusinessLogicError {
  constructor(message: string, metadata: Record<string, any> = {}) {
    super(message, 'INVENTORY_ERROR', metadata);
  }
}

export class PricingError extends BusinessLogicError {
  constructor(message: string, metadata: Record<string, any> = {}) {
    super(message, 'PRICING_ERROR', metadata);
  }
}
