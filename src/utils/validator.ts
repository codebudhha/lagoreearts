import type { Request, Response, NextFunction } from './express.ts';
import { ApiResponse } from './apiResponse.ts';

export interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'email' | 'array' | 'boolean' | 'enum';
  minLength?: number;
  maxLength?: number;
  enumValues?: string[];
  custom?: (value: any) => boolean | string;
}

export class SchemaValidator {
  rules: ValidationRule[];

  constructor(rules: ValidationRule[]) {
    this.rules = rules;
  }

  validate(data: any): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};

    for (const rule of this.rules) {
      const val = data?.[rule.field];

      if (rule.required && (val === undefined || val === null || val === '')) {
        errors[rule.field] = `${rule.field} is required`;
        continue;
      }

      if (val !== undefined && val !== null && val !== '') {
        if (rule.type === 'string' && typeof val !== 'string') {
          errors[rule.field] = `${rule.field} must be a string`;
        } else if (rule.type === 'number' && typeof val !== 'number') {
          errors[rule.field] = `${rule.field} must be a number`;
        } else if (rule.type === 'boolean' && typeof val !== 'boolean') {
          errors[rule.field] = `${rule.field} must be a boolean`;
        } else if (rule.type === 'array' && !Array.isArray(val)) {
          errors[rule.field] = `${rule.field} must be an array`;
        } else if (rule.type === 'email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (typeof val !== 'string' || !emailRegex.test(val)) {
            errors[rule.field] = 'Please provide a valid email address';
          }
        } else if (rule.type === 'enum' && rule.enumValues && !rule.enumValues.includes(val)) {
          errors[rule.field] = `${rule.field} must be one of: ${rule.enumValues.join(', ')}`;
        }

        if (rule.minLength && typeof val === 'string' && val.length < rule.minLength) {
          errors[rule.field] = `${rule.field} must be at least ${rule.minLength} characters`;
        }
        if (rule.maxLength && typeof val === 'string' && val.length > rule.maxLength) {
          errors[rule.field] = `${rule.field} cannot exceed ${rule.maxLength} characters`;
        }

        if (rule.custom) {
          const customRes = rule.custom(val);
          if (customRes !== true) {
            errors[rule.field] = typeof customRes === 'string' ? customRes : `${rule.field} is invalid`;
          }
        }
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const result = this.validate(req.body);
      if (!result.isValid) {
        return ApiResponse.badRequest(res, 'Validation failed', result.errors);
      }
      next();
    };
  }
}
