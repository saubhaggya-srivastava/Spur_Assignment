import { Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';

/**
 * Validation middleware using express-validator
 */

/**
 * Validate chat message request
 */
export const validateChatMessage = [
  body('message')
    .exists().withMessage('Message is required')
    .isString().withMessage('Message must be a string')
    .trim()
    .notEmpty().withMessage('Message cannot be empty')
    .isLength({ max: 2000 }).withMessage('Message cannot exceed 2000 characters'),
  
  body('sessionId')
    .optional()
    .isString().withMessage('Session ID must be a string')
    .isUUID().withMessage('Session ID must be a valid UUID'),
  
  handleValidationErrors,
];

/**
 * Validate session ID parameter
 */
export const validateSessionId = [
  param('sessionId')
    .exists().withMessage('Session ID is required')
    .isString().withMessage('Session ID must be a string')
    .isUUID().withMessage('Session ID must be a valid UUID'),
  
  handleValidationErrors,
];

/**
 * Handle validation errors
 */
function handleValidationErrors(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    
    return res.status(400).json({
      error: firstError.msg,
      code: 'VALIDATION_ERROR',
      field: firstError.type === 'field' ? (firstError as any).path : undefined,
    });
  }
  
  next();
}

/**
 * Validate JSON body
 */
export function validateJSON(err: any, req: Request, res: Response, next: NextFunction) {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({
      error: 'Invalid JSON in request body',
      code: 'INVALID_JSON',
    });
  }
  
  next(err);
}
