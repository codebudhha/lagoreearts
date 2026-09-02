import { ProductVariantRepository } from './variants.repository.ts';
import type {
  CreateProductOptionDto,
  UpdateProductOptionDto,
  CreateProductOptionValueDto,
  UpdateProductOptionValueDto,
  CreateProductVariantDto,
  UpdateProductVariantDto,
  VariantQueryFilters,
  ProductVariantStatus
} from './variants.types.ts';
import { AuditService } from '../../audit/audit.service.ts';
import type { Request } from '../../utils/express.ts';

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export class ProductVariantService {
  private repository: ProductVariantRepository;

  constructor() {
    this.repository = new ProductVariantRepository();
  }

  // ==========================================
  // Product Options
  // ==========================================

  async getOptions(productId: string) {
    await this.ensureVariableProduct(productId);
    return this.repository.findOptionsByProduct(productId);
  }

  async getOption(productId: string, optionId: string) {
    await this.ensureVariableProduct(productId);
    const option = await this.repository.findOptionById(optionId);
    if (!option || option.productId !== productId) {
      throw { status: 404, code: 'NOT_FOUND', message: 'Product option not found' };
    }
    return option;
  }

  async createOption(productId: string, data: CreateProductOptionDto, req?: Request) {
    const product = await this.ensureVariableProduct(productId);

    const name = data.name.trim();
    let slug = data.slug ? slugify(data.slug) : slugify(name);

    // Duplicate name check on this product
    const existingName = await this.repository.findOptionByName(productId, name);
    if (existingName) {
      throw { status: 400, code: 'DUPLICATE_OPTION_NAME', message: `Option "${name}" already exists on this product` };
    }

    // Duplicate slug check on this product
    const existingSlug = await this.repository.findOptionBySlug(productId, slug);
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const option = await this.repository.createOption(productId, { ...data, name, slug });

    if (req?.admin) {
      AuditService.log({
        adminUserId: req.admin.id,
        action: 'PRODUCT_OPTION_CREATED',
        module: 'CATALOGUE',
        entityType: 'ProductOption',
        entityId: option.id,
        newValues: { productId, name: option.name, slug: option.slug },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] as string
      });
    }

    return option;
  }

  async updateOption(productId: string, optionId: string, data: UpdateProductOptionDto, req?: Request) {
    await this.ensureVariableProduct(productId);
    const existing = await this.getOption(productId, optionId);

    const updateData: UpdateProductOptionDto = { ...data };

    if (data.name) {
      const name = data.name.trim();
      const duplicateName = await this.repository.findOptionByName(productId, name);
      if (duplicateName && duplicateName.id !== optionId) {
        throw { status: 400, code: 'DUPLICATE_OPTION_NAME', message: `Option "${name}" already exists on this product` };
      }
      updateData.name = name;
    }

    if (data.slug) {
      const slug = slugify(data.slug);
      const duplicateSlug = await this.repository.findOptionBySlug(productId, slug);
      if (duplicateSlug && duplicateSlug.id !== optionId) {
        throw { status: 400, code: 'DUPLICATE_OPTION_SLUG', message: `Option slug "${slug}" is already in use on this product` };
      }
      updateData.slug = slug;
    }

    const updated = await this.repository.updateOption(optionId, updateData);

    if (req?.admin) {
      AuditService.log({
        adminUserId: req.admin.id,
        action: 'PRODUCT_OPTION_UPDATED',
        module: 'CATALOGUE',
        entityType: 'ProductOption',
        entityId: optionId,
        oldValues: { name: existing.name, slug: existing.slug, sortOrder: existing.sortOrder },
        newValues: { name: updated.name, slug: updated.slug, sortOrder: updated.sortOrder },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] as string
      });
    }

    return updated;
  }

  async deleteOption(productId: string, optionId: string, req?: Request) {
    await this.ensureVariableProduct(productId);
    const existing = await this.getOption(productId, optionId);

    // Safety check: block if used by any variant
    const usageCount = await this.repository.countOptionUsageInVariants(optionId);
    if (usageCount > 0) {
      throw { status: 409, code: 'CONFLICT', message: 'Cannot delete product option that is currently in use by existing variants' };
    }

    const deleted = await this.repository.deleteOption(optionId);

    if (req?.admin) {
      AuditService.log({
        adminUserId: req.admin.id,
        action: 'PRODUCT_OPTION_DELETED',
        module: 'CATALOGUE',
        entityType: 'ProductOption',
        entityId: optionId,
        oldValues: { productId, name: existing.name, slug: existing.slug },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] as string
      });
    }

    return deleted;
  }

  // ==========================================
  // Product Option Values
  // ==========================================

  async getOptionValues(productId: string, optionId: string) {
    await this.getOption(productId, optionId);
    return this.repository.findOptionValuesByOption(optionId);
  }

  async createOptionValue(productId: string, optionId: string, data: CreateProductOptionValueDto, req?: Request) {
    await this.getOption(productId, optionId);

    const value = data.value.trim();
    let slug = data.slug ? slugify(data.slug) : slugify(value);

    // Duplicate value check within this option
    const existingValue = await this.repository.findOptionValueByValue(optionId, value);
    if (existingValue) {
      throw { status: 400, code: 'DUPLICATE_OPTION_VALUE', message: `Value "${value}" already exists for this option` };
    }

    // Duplicate slug check within this option
    const existingSlug = await this.repository.findOptionValueBySlug(optionId, slug);
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const created = await this.repository.createOptionValue(optionId, { ...data, value, slug });

    if (req?.admin) {
      AuditService.log({
        adminUserId: req.admin.id,
        action: 'PRODUCT_OPTION_VALUE_CREATED',
        module: 'CATALOGUE',
        entityType: 'ProductOptionValue',
        entityId: created.id,
        newValues: { optionId, value: created.value, slug: created.slug },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] as string
      });
    }

    return created;
  }

  async updateOptionValue(productId: string, optionId: string, valueId: string, data: UpdateProductOptionValueDto, req?: Request) {
    await this.getOption(productId, optionId);
    const existing = await this.repository.findOptionValueById(valueId);
    if (!existing || existing.productOptionId !== optionId) {
      throw { status: 404, code: 'NOT_FOUND', message: 'Product option value not found' };
    }

    const updateData: UpdateProductOptionValueDto = { ...data };

    if (data.value) {
      const val = data.value.trim();
      const duplicateVal = await this.repository.findOptionValueByValue(optionId, val);
      if (duplicateVal && duplicateVal.id !== valueId) {
        throw { status: 400, code: 'DUPLICATE_OPTION_VALUE', message: `Value "${val}" already exists for this option` };
      }
      updateData.value = val;
    }

    if (data.slug) {
      const slug = slugify(data.slug);
      const duplicateSlug = await this.repository.findOptionValueBySlug(optionId, slug);
      if (duplicateSlug && duplicateSlug.id !== valueId) {
        throw { status: 400, code: 'DUPLICATE_OPTION_VALUE_SLUG', message: `Slug "${slug}" already exists for this option` };
      }
      updateData.slug = slug;
    }

    const updated = await this.repository.updateOptionValue(valueId, updateData);

    if (req?.admin) {
      AuditService.log({
        adminUserId: req.admin.id,
        action: 'PRODUCT_OPTION_VALUE_UPDATED',
        module: 'CATALOGUE',
        entityType: 'ProductOptionValue',
        entityId: valueId,
        oldValues: { value: existing.value, slug: existing.slug, sortOrder: existing.sortOrder },
        newValues: { value: updated.value, slug: updated.slug, sortOrder: updated.sortOrder },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] as string
      });
    }

    return updated;
  }

  async deleteOptionValue(productId: string, optionId: string, valueId: string, req?: Request) {
    await this.getOption(productId, optionId);
    const existing = await this.repository.findOptionValueById(valueId);
    if (!existing || existing.productOptionId !== optionId) {
      throw { status: 404, code: 'NOT_FOUND', message: 'Product option value not found' };
    }

    // Safety check: block if used by any variant
    const usageCount = await this.repository.countOptionValueUsageInVariants(valueId);
    if (usageCount > 0) {
      throw { status: 409, code: 'CONFLICT', message: 'Cannot delete option value that is currently in use by existing variants' };
    }

    const deleted = await this.repository.deleteOptionValue(valueId);

    if (req?.admin) {
      AuditService.log({
        adminUserId: req.admin.id,
        action: 'PRODUCT_OPTION_VALUE_DELETED',
        module: 'CATALOGUE',
        entityType: 'ProductOptionValue',
        entityId: valueId,
        oldValues: { optionId, value: existing.value, slug: existing.slug },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] as string
      });
    }

    return deleted;
  }

  // ==========================================
  // Product Variants
  // ==========================================

  async listVariants(productId: string, filters: VariantQueryFilters = {}) {
    await this.ensureVariableProduct(productId);
    return this.repository.findVariantsByProduct(productId, filters);
  }

  async getVariant(productId: string, variantId: string) {
    await this.ensureVariableProduct(productId);
    const variant = await this.repository.findVariantById(variantId);
    if (!variant || variant.productId !== productId) {
      throw { status: 404, code: 'NOT_FOUND', message: 'Product variant not found' };
    }
    return variant;
  }

  async createVariant(productId: string, data: CreateProductVariantDto, req?: Request) {
    const product = await this.ensureVariableProduct(productId);

    // 1. Validate & Normalize SKU
    const sku = data.sku.trim().toUpperCase();
    await this.validateGlobalSku(sku);

    // 2. Validate Pricing
    this.validatePricing(data.price, data.compareAtPrice, data.costPrice, product.price);

    // 3. Validate Option Combination Completeness & Uniqueness
    const validOptionValueIds = await this.validateCombination(productId, data.optionValues);

    // 4. Create Variant Transactionally
    const variant = await this.repository.createVariant(productId, { ...data, sku }, validOptionValueIds);

    if (req?.admin) {
      AuditService.log({
        adminUserId: req.admin.id,
        action: 'VARIANT_CREATED',
        module: 'CATALOGUE',
        entityType: 'ProductVariant',
        entityId: variant.id,
        newValues: {
          productId,
          sku: variant.sku,
          price: variant.price,
          status: variant.status,
          optionValueIds: validOptionValueIds
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] as string
      });
    }

    return variant;
  }

  async updateVariant(productId: string, variantId: string, data: UpdateProductVariantDto, req?: Request) {
    const product = await this.ensureVariableProduct(productId);
    const existing = await this.getVariant(productId, variantId);

    const updateData: UpdateProductVariantDto = { ...data };

    // 1. SKU validation if changed
    if (data.sku) {
      const sku = data.sku.trim().toUpperCase();
      if (sku !== existing.sku) {
        await this.validateGlobalSku(sku, variantId);
        updateData.sku = sku;
      }
    }

    // 2. Pricing validation
    const targetPrice = data.price !== undefined ? data.price : existing.price;
    const targetCompare = data.compareAtPrice !== undefined ? data.compareAtPrice : existing.compareAtPrice;
    const targetCost = data.costPrice !== undefined ? data.costPrice : existing.costPrice;
    this.validatePricing(targetPrice, targetCompare, targetCost, product.price);

    // 3. Option combination validation if updating combination
    let validOptionValueIds: string[] | undefined = undefined;
    if (data.optionValues && data.optionValues.length > 0) {
      validOptionValueIds = await this.validateCombination(productId, data.optionValues, variantId);
    }

    const updated = await this.repository.updateVariant(variantId, updateData, validOptionValueIds);

    if (req?.admin) {
      AuditService.log({
        adminUserId: req.admin.id,
        action: 'VARIANT_UPDATED',
        module: 'CATALOGUE',
        entityType: 'ProductVariant',
        entityId: variantId,
        oldValues: { sku: existing.sku, price: existing.price, status: existing.status },
        newValues: { sku: updated.sku, price: updated.price, status: updated.status },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] as string
      });

      if (validOptionValueIds) {
        AuditService.log({
          adminUserId: req.admin.id,
          action: 'VARIANT_COMBINATION_CHANGED',
          module: 'CATALOGUE',
          entityType: 'ProductVariant',
          entityId: variantId,
          newValues: { optionValueIds: validOptionValueIds },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] as string
        });
      }
    }

    return updated;
  }

  async updateVariantStatus(productId: string, variantId: string, status: ProductVariantStatus, req?: Request) {
    await this.ensureVariableProduct(productId);
    const existing = await this.getVariant(productId, variantId);

    const updated = await this.repository.updateVariant(variantId, { status });

    if (req?.admin) {
      AuditService.log({
        adminUserId: req.admin.id,
        action: 'VARIANT_STATUS_CHANGED',
        module: 'CATALOGUE',
        entityType: 'ProductVariant',
        entityId: variantId,
        oldValues: { status: existing.status },
        newValues: { status },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] as string
      });
    }

    return updated;
  }

  async updateVariantSortOrder(productId: string, variantId: string, sortOrder: number, req?: Request) {
    await this.ensureVariableProduct(productId);
    const existing = await this.getVariant(productId, variantId);

    const updated = await this.repository.updateVariant(variantId, { sortOrder });

    if (req?.admin) {
      AuditService.log({
        adminUserId: req.admin.id,
        action: 'VARIANT_SORT_CHANGED',
        module: 'CATALOGUE',
        entityType: 'ProductVariant',
        entityId: variantId,
        oldValues: { sortOrder: existing.sortOrder },
        newValues: { sortOrder },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] as string
      });
    }

    return updated;
  }

  async deleteVariant(productId: string, variantId: string, req?: Request) {
    await this.ensureVariableProduct(productId);
    const existing = await this.getVariant(productId, variantId);

    const deleted = await this.repository.deleteVariant(variantId);

    if (req?.admin) {
      AuditService.log({
        adminUserId: req.admin.id,
        action: 'VARIANT_DELETED',
        module: 'CATALOGUE',
        entityType: 'ProductVariant',
        entityId: variantId,
        oldValues: { productId, sku: existing.sku, status: existing.status },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] as string
      });
    }

    return deleted;
  }

  // ==========================================
  // Helper / Validation Functions
  // ==========================================

  private async ensureVariableProduct(productId: string) {
    const product = await this.repository.findProduct(productId);
    if (!product) {
      throw { status: 404, code: 'PRODUCT_NOT_FOUND', message: `Product with ID "${productId}" not found` };
    }
    if (product.productType !== 'VARIABLE') {
      throw { status: 409, code: 'INVALID_PRODUCT_TYPE', message: 'Simple products cannot contain variants. Product type must be VARIABLE.' };
    }
    return product;
  }

  private async validateGlobalSku(sku: string, currentVariantId?: string) {
    // 1. Check Product Variant SKUs
    const duplicateVariant = await this.repository.findVariantBySku(sku);
    if (duplicateVariant && duplicateVariant.id !== currentVariantId) {
      throw { status: 400, code: 'DUPLICATE_SKU', message: `Variant SKU "${sku}" is already in use` };
    }

    // 2. Check Product Base SKUs
    const duplicateProduct = await this.repository.findProductBySku(sku);
    if (duplicateProduct) {
      throw { status: 400, code: 'DUPLICATE_SKU', message: `SKU "${sku}" collides with an existing product SKU` };
    }
  }

  private validatePricing(price?: number | null, compareAtPrice?: number | null, costPrice?: number | null, baseProductPrice?: number) {
    if (price !== undefined && price !== null && price < 0) {
      throw { status: 400, code: 'INVALID_PRICE', message: 'Variant price cannot be negative' };
    }
    if (costPrice !== undefined && costPrice !== null && costPrice < 0) {
      throw { status: 400, code: 'INVALID_COST_PRICE', message: 'Variant cost price cannot be negative' };
    }
    if (compareAtPrice !== undefined && compareAtPrice !== null) {
      if (compareAtPrice < 0) {
        throw { status: 400, code: 'INVALID_COMPARE_PRICE', message: 'Compare at price cannot be negative' };
      }
      const effectivePrice = price !== undefined && price !== null ? price : (baseProductPrice || 0);
      if (compareAtPrice < effectivePrice) {
        throw { status: 400, code: 'INVALID_COMPARE_PRICE', message: 'Compare at price cannot be lower than selling price' };
      }
    }
  }

  private async validateCombination(productId: string, requestedValues: any[], excludeVariantId?: string): Promise<string[]> {
    const options = await this.repository.findOptionsByProduct(productId);
    if (options.length === 0) {
      throw { status: 400, code: 'NO_OPTIONS_CONFIGURED', message: 'Product must have options configured before creating variants' };
    }

    // Ensure non-empty request
    if (!requestedValues || requestedValues.length === 0) {
      throw { status: 400, code: 'MISSING_OPTION_VALUES', message: 'Variant must define option values' };
    }

    // Verify option count completeness: exactly one value per option
    if (requestedValues.length !== options.length) {
      throw {
        status: 400,
        code: 'INCOMPLETE_OPTION_COMBINATION',
        message: `Variant option combination is incomplete. Expected ${options.length} options, received ${requestedValues.length}.`
      };
    }

    const valueIds: string[] = [];
    const seenOptionIds = new Set<string>();

    for (const item of requestedValues) {
      const val = await this.repository.findOptionValueById(item.optionValueId);
      if (!val) {
        throw { status: 400, code: 'INVALID_OPTION_VALUE', message: `Option value with ID "${item.optionValueId}" not found` };
      }

      // Check if value's option belongs to this product
      const parentOption = options.find(o => o.id === val.productOptionId);
      if (!parentOption) {
        throw {
          status: 400,
          code: 'INVALID_OPTION_VALUE_RELATION',
          message: `Option value "${val.value}" does not belong to any option on this product`
        };
      }

      if (seenOptionIds.has(parentOption.id)) {
        throw {
          status: 400,
          code: 'DUPLICATE_OPTION_IN_COMBINATION',
          message: `Multiple values specified for option "${parentOption.name}" in a single variant`
        };
      }

      seenOptionIds.add(parentOption.id);
      valueIds.push(val.id);
    }

    // Verify all configured options are covered
    for (const opt of options) {
      if (!seenOptionIds.has(opt.id)) {
        throw { status: 400, code: 'MISSING_OPTION_VALUE', message: `Missing value for option "${opt.name}"` };
      }
    }

    // Normalize combination: sort value IDs deterministically
    const normalizedRequested = [...valueIds].sort();

    // Check against existing variant combinations for this product
    const existingCombos = await this.repository.getExistingCombinations(productId, excludeVariantId);
    for (const combo of existingCombos) {
      if (combo.optionValueIds.length === normalizedRequested.length) {
        const isIdentical = combo.optionValueIds.every((id, idx) => id === normalizedRequested[idx]);
        if (isIdentical) {
          throw {
            status: 400,
            code: 'DUPLICATE_COMBINATION',
            message: 'A variant with this option combination already exists for this product'
          };
        }
      }
    }

    return valueIds;
  }
}
