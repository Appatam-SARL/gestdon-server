import { BaseError, ErrorCategory, ErrorSeverity } from './BaseError';

export class ExternalServiceError extends BaseError {
  constructor(
    message: string,
    code: string = 'EXTERNAL_SERVICE_ERROR',
    metadata: Record<string, any> = {}
  ) {
    super(
      message,
      ErrorCategory.EXTERNAL_SERVICE,
      ErrorSeverity.HIGH,
      code,
      metadata
    );
  }
}

export class PaymentGatewayError extends ExternalServiceError {
  constructor(message: string, metadata: Record<string, any> = {}) {
    super(message, 'PAYMENT_GATEWAY_ERROR', metadata);
  }
}

export class EmailServiceError extends ExternalServiceError {
  constructor(message: string, metadata: Record<string, any> = {}) {
    super(message, 'EMAIL_SERVICE_ERROR', metadata);
  }
}

export class PushNotificationError extends ExternalServiceError {
  constructor(message: string, metadata: Record<string, any> = {}) {
    super(message, 'PUSH_NOTIFICATION_ERROR', metadata);
  }
}

export class MapsServiceError extends ExternalServiceError {
  constructor(message: string, metadata: Record<string, any> = {}) {
    super(message, 'MAPS_SERVICE_ERROR', metadata);
  }
}

export class WeatherServiceError extends ExternalServiceError {
  constructor(message: string, metadata: Record<string, any> = {}) {
    super(message, 'WEATHER_SERVICE_ERROR', metadata);
  }
}
