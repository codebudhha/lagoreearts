import { SchemaValidator } from '../../utils/validator.ts';
import { validatePasswordStrength } from '../../security/password.ts';

export const createAdminUserValidator = new SchemaValidator([
  { field: 'name', required: true, type: 'string', minLength: 2, maxLength: 100 },
  { field: 'email', required: true, type: 'email' },
  {
    field: 'password',
    required: true,
    type: 'string',
    custom: (val) => {
      const res = validatePasswordStrength(val);
      return res.isValid ? true : (res.message || 'Password does not meet security requirements');
    }
  },
  { field: 'roleId', required: true, type: 'string' },
  { field: 'status', required: false, type: 'enum', enumValues: ['ACTIVE', 'INACTIVE', 'SUSPENDED'] }
]);

export const updateAdminUserValidator = new SchemaValidator([
  { field: 'name', required: false, type: 'string', minLength: 2, maxLength: 100 },
  { field: 'email', required: false, type: 'email' },
  { field: 'roleId', required: false, type: 'string' },
  { field: 'status', required: false, type: 'enum', enumValues: ['ACTIVE', 'INACTIVE', 'SUSPENDED'] }
]);

export const updateAdminStatusValidator = new SchemaValidator([
  { field: 'status', required: true, type: 'enum', enumValues: ['ACTIVE', 'INACTIVE', 'SUSPENDED'] }
]);
