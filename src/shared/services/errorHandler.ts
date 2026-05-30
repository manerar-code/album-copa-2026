export type AppErrorType = 'NetworkError' | 'StorageError' | 'ValidationError' | 'UnknownError';

export class AppError extends Error {
  constructor(
    public readonly type: AppErrorType,
    message: string,
    public readonly originalError?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function handleError(error: unknown, context?: string): AppError {
  if (error instanceof AppError) return error;

  const message = error instanceof Error ? error.message : 'Unknown error';
  const prefix = context ? `[${context}] ` : '';

  if (message.includes('network') || message.includes('fetch')) {
    return new AppError('NetworkError', `${prefix}${message}`, error);
  }
  if (message.includes('storage') || message.includes('AsyncStorage')) {
    return new AppError('StorageError', `${prefix}${message}`, error);
  }

  return new AppError('UnknownError', `${prefix}${message}`, error);
}
