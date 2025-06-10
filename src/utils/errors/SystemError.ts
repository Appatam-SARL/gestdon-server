import { BaseError, ErrorCategory, ErrorSeverity } from './BaseError';

export class SystemError extends BaseError {
  constructor(
    message: string,
    code: string = 'SYSTEM_ERROR',
    metadata: Record<string, any> = {}
  ) {
    super(
      message,
      ErrorCategory.SYSTEM,
      ErrorSeverity.CRITICAL,
      code,
      metadata
    );
  }
}

export class DatabaseError extends SystemError {
  constructor(message: string, metadata: Record<string, any> = {}) {
    super(message, 'DATABASE_ERROR', metadata);
  }
}

export class CacheError extends SystemError {
  constructor(message: string, metadata: Record<string, any> = {}) {
    super(message, 'CACHE_ERROR', metadata);
  }
}

export class ConfigurationError extends SystemError {
  constructor(message: string, metadata: Record<string, any> = {}) {
    super(message, 'CONFIGURATION_ERROR', metadata);
  }
}

export class FileSystemError extends SystemError {
  constructor(message: string, metadata: Record<string, any> = {}) {
    super(message, 'FILE_SYSTEM_ERROR', metadata);
  }
}

export class NetworkError extends SystemError {
  constructor(message: string, metadata: Record<string, any> = {}) {
    super(message, 'NETWORK_ERROR', metadata);
  }
}
