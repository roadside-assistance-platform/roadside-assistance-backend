import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../errors/validation.error';

interface ValidationRules {
  [key: string]: {
    type: string;
    optional?: boolean;
    min?: number;
    max?: number;
    format?: string;
    pattern?: RegExp;
  };
}

export const validateRequest = (rules: ValidationRules) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const validationErrors: string[] = [];

    for (const [field, rule] of Object.entries(rules)) {
      const value = req.body[field];

      // Skip validation if field is optional and not provided
      if (rule.optional && (value === undefined || value === null)) {
        continue;
      }

      // Required field check
      if (!rule.optional && !(field in req.body)) {
        validationErrors.push(`${field} is required`);
        continue;
      }

      // Type check
      if (value !== undefined && typeof value !== rule.type) {
        validationErrors.push(`${field} must be of type ${rule.type}`);
      }

      // String-specific validations
      if (rule.type === 'string' && typeof value === 'string') {
        // Min length
        if (rule.min && value.length < rule.min) {
          validationErrors.push(`${field} must be at least ${rule.min} characters long`);
        }

        // Max length
        if (rule.max && value.length > rule.max) {
          validationErrors.push(`${field} must be at most ${rule.max} characters long`);
        }

        // Email format
        if (rule.format === 'email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            validationErrors.push(`${field} must be a valid email address`);
          }
        }

        // Pattern matching
        if (rule.pattern && !rule.pattern.test(value)) {
          validationErrors.push(`${field} format is invalid`);
        }
      }
    }

    if (validationErrors.length > 0) {
      throw new ValidationError('Validation failed', validationErrors);
    }

    next();
  };
};
