import { BaseError, ErrorCategory, ErrorSeverity } from './BaseError';

export class AuthenticationError extends BaseError {
  constructor(
    message: string,
    code: string = 'AUTHENTICATION_ERROR',
    metadata: Record<string, any> = {}
  ) {
    super(
      message,
      ErrorCategory.AUTHENTICATION,
      ErrorSeverity.HIGH,
      code,
      metadata
    );
  }
}

export class InvalidCredentialsError extends AuthenticationError {
  constructor(
    message: string = 'Identifiants invalides',
    metadata: Record<string, any> = {}
  ) {
    super(message, 'INVALID_CREDENTIALS', metadata);
  }
}

export class TokenExpiredError extends AuthenticationError {
  constructor(
    message: string = 'Token expiré',
    metadata: Record<string, any> = {}
  ) {
    super(message, 'TOKEN_EXPIRED', metadata);
  }
}

export class InvalidTokenError extends AuthenticationError {
  constructor(
    message: string = 'Token invalide',
    metadata: Record<string, any> = {}
  ) {
    super(message, 'INVALID_TOKEN', metadata);
  }
}

export class AccountLockedError extends AuthenticationError {
  constructor(
    message: string = 'Compte verrouillé',
    metadata: Record<string, any> = {}
  ) {
    super(message, 'ACCOUNT_LOCKED', metadata);
  }
}
