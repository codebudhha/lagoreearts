import { SchemaValidator } from '../../utils/validator.ts';

export const createAntiqueProfileValidator = new SchemaValidator([
  { field: 'era', required: false, type: 'string', maxLength: 100 },
  { field: 'period', required: false, type: 'string', maxLength: 100 },
  {
    field: 'approximateAgeFrom',
    required: false,
    type: 'number',
    custom: (val, body) => {
      if (val === undefined || val === null) return true;
      const num = Number(val);
      if (isNaN(num) || num < 0) return 'Approximate age from must be a non-negative number';
      if (body?.approximateAgeTo !== undefined && body?.approximateAgeTo !== null) {
        const toNum = Number(body.approximateAgeTo);
        if (!isNaN(toNum) && num > toNum) {
          return 'Approximate age from cannot exceed approximate age to';
        }
      }
      return true;
    }
  },
  {
    field: 'approximateAgeTo',
    required: false,
    type: 'number',
    custom: (val, body) => {
      if (val === undefined || val === null) return true;
      const num = Number(val);
      if (isNaN(num) || num < 0) return 'Approximate age to must be a non-negative number';
      if (body?.approximateAgeFrom !== undefined && body?.approximateAgeFrom !== null) {
        const fromNum = Number(body.approximateAgeFrom);
        if (!isNaN(fromNum) && fromNum > num) {
          return 'Approximate age from cannot exceed approximate age to';
        }
      }
      return true;
    }
  },
  { field: 'ageDescription', required: false, type: 'string', maxLength: 255 },
  { field: 'origin', required: false, type: 'string', maxLength: 150 },
  { field: 'region', required: false, type: 'string', maxLength: 100 },
  { field: 'countryOfOrigin', required: false, type: 'string', maxLength: 100 },
  { field: 'artistMaker', required: false, type: 'string', maxLength: 150 },
  { field: 'attribution', required: false, type: 'string', maxLength: 150 },
  { field: 'schoolOrTradition', required: false, type: 'string', maxLength: 150 },
  { field: 'material', required: false, type: 'string', maxLength: 255 },
  { field: 'technique', required: false, type: 'string', maxLength: 255 },
  {
    field: 'condition',
    required: false,
    type: 'enum',
    enumValues: ['EXCELLENT', 'VERY_GOOD', 'GOOD', 'FAIR', 'POOR', 'RESTORED', 'FOR_RESTORATION']
  },
  { field: 'conditionNotes', required: false, type: 'string' },
  {
    field: 'restorationStatus',
    required: false,
    type: 'enum',
    enumValues: ['ORIGINAL', 'PARTIALLY_RESTORED', 'FULLY_RESTORED', 'UNKNOWN']
  },
  { field: 'restorationNotes', required: false, type: 'string' },
  { field: 'provenance', required: false, type: 'string' },
  { field: 'provenanceNotes', required: false, type: 'string' },
  {
    field: 'authenticityStatus',
    required: false,
    type: 'enum',
    enumValues: ['UNKNOWN', 'UNVERIFIED', 'VERIFIED']
  },
  { field: 'authenticityNotes', required: false, type: 'string' },
  { field: 'acquisitionSource', required: false, type: 'string', maxLength: 255 },
  { field: 'acquisitionNotes', required: false, type: 'string' },
  { field: 'dimensionsDescription', required: false, type: 'string', maxLength: 255 },
  {
    field: 'height',
    required: false,
    type: 'number',
    custom: (val) => {
      if (val === undefined || val === null) return true;
      return Number(val) >= 0 ? true : 'Height cannot be negative';
    }
  },
  {
    field: 'width',
    required: false,
    type: 'number',
    custom: (val) => {
      if (val === undefined || val === null) return true;
      return Number(val) >= 0 ? true : 'Width cannot be negative';
    }
  },
  {
    field: 'depth',
    required: false,
    type: 'number',
    custom: (val) => {
      if (val === undefined || val === null) return true;
      return Number(val) >= 0 ? true : 'Depth cannot be negative';
    }
  },
  {
    field: 'diameter',
    required: false,
    type: 'number',
    custom: (val) => {
      if (val === undefined || val === null) return true;
      return Number(val) >= 0 ? true : 'Diameter cannot be negative';
    }
  },
  {
    field: 'dimensionUnit',
    required: false,
    type: 'enum',
    enumValues: ['MM', 'CM', 'M', 'IN', 'FT']
  },
  {
    field: 'weight',
    required: false,
    type: 'number',
    custom: (val) => {
      if (val === undefined || val === null) return true;
      return Number(val) >= 0 ? true : 'Weight cannot be negative';
    }
  },
  {
    field: 'weightUnit',
    required: false,
    type: 'enum',
    enumValues: ['G', 'KG', 'OZ', 'LB']
  },
  { field: 'isOneOfAKind', required: false, type: 'boolean' },
  { field: 'isCertified', required: false, type: 'boolean' },
  { field: 'certificateNumber', required: false, type: 'string', maxLength: 100 },
  { field: 'certificateIssuer', required: false, type: 'string', maxLength: 150 },
  {
    field: 'certificateDate',
    required: false,
    custom: (val) => {
      if (val === undefined || val === null || val === '') return true;
      const d = new Date(val);
      return !isNaN(d.getTime()) ? true : 'Invalid certificate date';
    }
  }
]);

export const updateAntiqueProfileValidator = new SchemaValidator([
  { field: 'era', required: false, type: 'string', maxLength: 100 },
  { field: 'period', required: false, type: 'string', maxLength: 100 },
  {
    field: 'approximateAgeFrom',
    required: false,
    type: 'number',
    custom: (val, body) => {
      if (val === undefined || val === null) return true;
      const num = Number(val);
      if (isNaN(num) || num < 0) return 'Approximate age from must be a non-negative number';
      if (body?.approximateAgeTo !== undefined && body?.approximateAgeTo !== null) {
        const toNum = Number(body.approximateAgeTo);
        if (!isNaN(toNum) && num > toNum) {
          return 'Approximate age from cannot exceed approximate age to';
        }
      }
      return true;
    }
  },
  {
    field: 'approximateAgeTo',
    required: false,
    type: 'number',
    custom: (val, body) => {
      if (val === undefined || val === null) return true;
      const num = Number(val);
      if (isNaN(num) || num < 0) return 'Approximate age to must be a non-negative number';
      if (body?.approximateAgeFrom !== undefined && body?.approximateAgeFrom !== null) {
        const fromNum = Number(body.approximateAgeFrom);
        if (!isNaN(fromNum) && fromNum > num) {
          return 'Approximate age from cannot exceed approximate age to';
        }
      }
      return true;
    }
  },
  { field: 'ageDescription', required: false, type: 'string', maxLength: 255 },
  { field: 'origin', required: false, type: 'string', maxLength: 150 },
  { field: 'region', required: false, type: 'string', maxLength: 100 },
  { field: 'countryOfOrigin', required: false, type: 'string', maxLength: 100 },
  { field: 'artistMaker', required: false, type: 'string', maxLength: 150 },
  { field: 'attribution', required: false, type: 'string', maxLength: 150 },
  { field: 'schoolOrTradition', required: false, type: 'string', maxLength: 150 },
  { field: 'material', required: false, type: 'string', maxLength: 255 },
  { field: 'technique', required: false, type: 'string', maxLength: 255 },
  {
    field: 'condition',
    required: false,
    type: 'enum',
    enumValues: ['EXCELLENT', 'VERY_GOOD', 'GOOD', 'FAIR', 'POOR', 'RESTORED', 'FOR_RESTORATION']
  },
  { field: 'conditionNotes', required: false, type: 'string' },
  {
    field: 'restorationStatus',
    required: false,
    type: 'enum',
    enumValues: ['ORIGINAL', 'PARTIALLY_RESTORED', 'FULLY_RESTORED', 'UNKNOWN']
  },
  { field: 'restorationNotes', required: false, type: 'string' },
  { field: 'provenance', required: false, type: 'string' },
  { field: 'provenanceNotes', required: false, type: 'string' },
  {
    field: 'authenticityStatus',
    required: false,
    type: 'enum',
    enumValues: ['UNKNOWN', 'UNVERIFIED', 'VERIFIED']
  },
  { field: 'authenticityNotes', required: false, type: 'string' },
  { field: 'acquisitionSource', required: false, type: 'string', maxLength: 255 },
  { field: 'acquisitionNotes', required: false, type: 'string' },
  { field: 'dimensionsDescription', required: false, type: 'string', maxLength: 255 },
  {
    field: 'height',
    required: false,
    type: 'number',
    custom: (val) => {
      if (val === undefined || val === null) return true;
      return Number(val) >= 0 ? true : 'Height cannot be negative';
    }
  },
  {
    field: 'width',
    required: false,
    type: 'number',
    custom: (val) => {
      if (val === undefined || val === null) return true;
      return Number(val) >= 0 ? true : 'Width cannot be negative';
    }
  },
  {
    field: 'depth',
    required: false,
    type: 'number',
    custom: (val) => {
      if (val === undefined || val === null) return true;
      return Number(val) >= 0 ? true : 'Depth cannot be negative';
    }
  },
  {
    field: 'diameter',
    required: false,
    type: 'number',
    custom: (val) => {
      if (val === undefined || val === null) return true;
      return Number(val) >= 0 ? true : 'Diameter cannot be negative';
    }
  },
  {
    field: 'dimensionUnit',
    required: false,
    type: 'enum',
    enumValues: ['MM', 'CM', 'M', 'IN', 'FT']
  },
  {
    field: 'weight',
    required: false,
    type: 'number',
    custom: (val) => {
      if (val === undefined || val === null) return true;
      return Number(val) >= 0 ? true : 'Weight cannot be negative';
    }
  },
  {
    field: 'weightUnit',
    required: false,
    type: 'enum',
    enumValues: ['G', 'KG', 'OZ', 'LB']
  },
  { field: 'isOneOfAKind', required: false, type: 'boolean' },
  { field: 'isCertified', required: false, type: 'boolean' },
  { field: 'certificateNumber', required: false, type: 'string', maxLength: 100 },
  { field: 'certificateIssuer', required: false, type: 'string', maxLength: 150 },
  {
    field: 'certificateDate',
    required: false,
    custom: (val) => {
      if (val === undefined || val === null || val === '') return true;
      const d = new Date(val);
      return !isNaN(d.getTime()) ? true : 'Invalid certificate date';
    }
  }
]);
