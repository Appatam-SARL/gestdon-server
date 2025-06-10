import { BaseError, ErrorCategory, ErrorSeverity } from './BaseError';

export class ValidationError extends BaseError {
  constructor(
    message: string,
    code: string = 'VALIDATION_ERROR',
    metadata: Record<string, any> = {}
  ) {
    super(
      message,
      ErrorCategory.VALIDATION,
      ErrorSeverity.MEDIUM,
      code,
      metadata
    );
  }
}

export class SchemaValidationError extends ValidationError {
  constructor(
    message: string = 'Erreur de validation des données',
    metadata: Record<string, any> = {}
  ) {
    super(message, 'SCHEMA_VALIDATION_ERROR', metadata);
  }
}

export class InputValidationError extends ValidationError {
  constructor(
    message: string = 'Entrée de données invalide',
    metadata: Record<string, any> = {}
  ) {
    super(message, 'INPUT_VALIDATION_ERROR', metadata);
  }
}

export class MissingRequiredFieldError extends ValidationError {
  constructor(fieldName: string, metadata: Record<string, any> = {}) {
    super(
      `Le champ ${fieldName} est requis`,
      'MISSING_REQUIRED_FIELD',
      metadata
    );
  }
}

export class InvalidFormatError extends ValidationError {
  constructor(
    fieldName: string,
    format: string,
    metadata: Record<string, any> = {}
  ) {
    super(
      `Le format du champ ${fieldName} est invalide. Format attendu: ${format}`,
      'INVALID_FORMAT',
      metadata
    );
  }
}
