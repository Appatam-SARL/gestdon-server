export enum ErrorCategory {
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  BUSINESS_LOGIC = 'BUSINESS_LOGIC',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
  DATABASE = 'DATABASE',
  SYSTEM = 'SYSTEM',
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface IErrorDetails {
  code: string;
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  timestamp: Date;
  stack?: string;
  metadata?: Record<string, any>;
}

export class BaseError extends Error {
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly code: string;
  public readonly timestamp: Date;
  public readonly metadata: Record<string, any>;

  constructor(
    message: string,
    category: ErrorCategory,
    severity: ErrorSeverity,
    code: string,
    metadata: Record<string, any> = {}
  ) {
    super(message);
    this.name = this.constructor.name;
    this.category = category;
    this.severity = severity;
    this.code = code;
    this.timestamp = new Date();
    this.metadata = metadata;

    // Capture la stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  public toJSON(): IErrorDetails {
    return {
      code: this.code,
      message: this.message,
      category: this.category,
      severity: this.severity,
      timestamp: this.timestamp,
      stack: this.stack,
      metadata: this.metadata,
    };
  }
}
