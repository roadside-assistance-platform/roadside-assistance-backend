import { Request } from 'express';
import { AppError } from './errors';

export interface ValidationRule {
  field: string;
  type: 'string' | 'number' | 'boolean' | 'email';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
}

export const validateRequest = (req: Request, rules: ValidationRule[]) => {
  const errors: string[] = [];

  rules.forEach(rule => {
    const value = req.body[rule.field];

    // Check required fields
    if (rule.required && !(rule.field in req.body)) {
      errors.push(`${rule.field} is required`);
      return;
    }

    // Skip further validation if value is not provided and not required
    if (value === undefined || value === null || value === '') {
      return;
    }

    // Type validation
    switch (rule.type) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push(`${rule.field} must be a string`);
        } else {
          if (rule.minLength && value.length < rule.minLength) {
            errors.push(`${rule.field} must be at least ${rule.minLength} characters long`);
          }
          if (rule.maxLength && value.length > rule.maxLength) {
            errors.push(`${rule.field} must be no more than ${rule.maxLength} characters long`);
          }
          if (rule.pattern && !rule.pattern.test(value)) {
            errors.push(`${rule.field} format is invalid`);
          }
        }
        break;

      case 'number':
        if (typeof value !== 'number') {
          errors.push(`${rule.field} must be a number`);
        } else {
          if (rule.min !== undefined && value < rule.min) {
            errors.push(`${rule.field} must be at least ${rule.min}`);
          }
          if (rule.max !== undefined && value > rule.max) {
            errors.push(`${rule.field} must be no more than ${rule.max}`);
          }
        }
        break;

      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (typeof value !== 'string' || !emailRegex.test(value)) {
          errors.push(`${rule.field} must be a valid email address`);
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push(`${rule.field} must be a boolean`);
        }
        break;
    }
  });

  if (errors.length > 0) {
    throw new AppError(errors.join('. '), 400);
  }
};
