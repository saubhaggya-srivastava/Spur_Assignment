import { Request, Response, NextFunction } from 'express';

/**
 * Global error handling middleware
 * Transforms errors into user-friendly messages and appropriate status codes
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log error with context
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] Error in ${req.method} ${req.path}:`);
  console.error(err);

  // Determine status code and error message
  let statusCode = 500;
  let errorMessage = 'An unexpected error occurred. Please try again.';
  let errorCode = 'INTERNAL_ERROR';

  // Handle specific error types
  if (err.message) {
    const message = err.message.toLowerCase();

    // Validation errors
    if (message.includes('message cannot be empty')) {
      statusCode = 400;
      errorMessage = 'Message cannot be empty';
      errorCode = 'VALIDATION_ERROR';
    } else if (message.includes('invalid message')) {
      statusCode = 400;
      errorMessage = 'Invalid message format';
      errorCode = 'VALIDATION_ERROR';
    } else if (message.includes('session id')) {
      statusCode = 400;
      errorMessage = 'Invalid session ID format';
      errorCode = 'VALIDATION_ERROR';
    }
    
    // Database errors
    else if (message.includes('database') || message.includes('conversation')) {
      statusCode = 500;
      errorMessage = 'Service temporarily unavailable. Please try again.';
      errorCode = 'DATABASE_ERROR';
    }
    
    // LLM errors (already have user-friendly messages)
    else if (
      message.includes('AI agent') ||
      message.includes('AI service') ||
      message.includes('Unable to generate response')
    ) {
      statusCode = 500;
      errorMessage = err.message; // Use the friendly message from LLM service
      errorCode = 'LLM_ERROR';
    }
    
    // Session errors
    else if (message.includes('session')) {
      statusCode = 500;
      errorMessage = 'Failed to create or retrieve session. Please try again.';
      errorCode = 'SESSION_ERROR';
    }
  }

  // Never expose internal error details to users
  res.status(statusCode).json({
    error: errorMessage,
    code: errorCode,
  });
}

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors and pass to error middleware
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
