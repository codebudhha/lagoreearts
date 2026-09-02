import { SchemaValidator } from '../../utils/validator.ts';
import { validatePasswordStrength } from '../../security/password.ts';

export const loginValidator = new SchemaValidator([
  { field: 'email', required: true, type: 'email' },
  { field: 'password', required: true, type: 'string', minLength: 1 }
]);

export const changePasswordValidator = new SchemaValidator([
  { field: 'currentPassword', required: true, type: 'string', minLength: 1 },
  {
    field: 'newPassword',
    required: true,
    type: 'string',
    custom: (val) => {
      const res = validatePasswordStrength(val);
      return res.isValid ? true : (res.message || 'Password does not meet security requirements');
    }
  }
]);

export const forgotPasswordValidator = new SchemaValidator([
  { field: 'email', required: true, type: 'email' }
]);

export const resetPasswordValidator = new SchemaValidator([
  { field: 'token', required: true, type: 'string', minLength: 10 },
  {
    field: 'password',
    required: true,
    type: 'string',
    custom: (val) => {
      const res = validatePasswordStrength(val);
      return res.isValid ? true : (res.message || 'Password does not meet security requirements');
    }
  }
]);

export const updateProfileValidator = new SchemaValidator([
  { field: 'name', required: false, type: 'string', minLength: 2, maxLength: 100 },
  { field: 'email', required: false, type: 'email' }
]);
