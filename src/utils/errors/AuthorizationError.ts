import { BaseError, ErrorCategory, ErrorSeverity } from './BaseError';

export class AuthorizationError extends BaseError {
  constructor(
    message: string,
    code: string = 'AUTHORIZATION_ERROR',
    metadata: Record<string, any> = {}
  ) {
    super(
      message,
      ErrorCategory.AUTHORIZATION,
      ErrorSeverity.HIGH,
      code,
      metadata
    );
  }
}

export class InsufficientPermissionsError extends AuthorizationError {
  constructor(
    message: string = 'Permissions insuffisantes',
    metadata: Record<string, any> = {}
  ) {
    super(message, 'INSUFFICIENT_PERMISSIONS', metadata);
  }
}

export class RoleRequiredError extends AuthorizationError {
  constructor(
    message: string = 'Rôle requis',
    metadata: Record<string, any> = {}
  ) {
    super(message, 'ROLE_REQUIRED', metadata);
  }
}

export class ResourceAccessDeniedError extends AuthorizationError {
  constructor(
    message: string = 'Accès à la ressource refusé',
    metadata: Record<string, any> = {}
  ) {
    super(message, 'RESOURCE_ACCESS_DENIED', metadata);
  }
}
