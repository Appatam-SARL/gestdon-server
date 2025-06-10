export declare class ApiError extends Error {
  statusCode: number;
  errors?: any[];
  status: string;
  isOperational: boolean;
  constructor(statusCode: number, message: string, errors?: any[]);
}
