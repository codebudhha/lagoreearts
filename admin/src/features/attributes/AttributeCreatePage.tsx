import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Switch } from '../../components/ui/Switch';
import { useCreateAttribute } from '../../hooks/useAttributes';
import { AttributeType, CreateAttributePayload } from '../../lib/api/attributes';
import { ArrowLeft, Save, Info } from 'lucide-react';

export const AttributeCreatePage: React.FC = () => {
  const navigate = useNavigate();

  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isCustomSlug, setIsCustomSlug] = useState(false);
  const [type, setType] = useState<AttributeType>('SELECT');
  const [description, setDescription] = useState('');

  // Settings
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [isFilterable, setIsFilterable] = useState(true);
  const [isRequired, setIsRequired] = useState(false);
  const [sortOrder, setSortOrder] = useState('0');

  const createMutation = useCreateAttribute();

  useEffect(() => {
    if (!isCustomSlug && name) {
      const generated = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setSlug(generated);
    }
  }, [name, isCustomSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload: CreateAttributePayload = {
      name: name.trim(),
      slug: slug.trim() || undefined,
      type,
      description: description.trim() || undefined,
      status,
      isFilterable,
      isRequired,
      sortOrder: parseInt(sortOrder, 10) || 0,
    };

    try {
      const created = await createMutation.mutateAsync(payload);
      navigate(`/admin/attributes/${created.id}`);
    } catch {
      // Handled by toast
    }
  };

  const typeDescriptions: Record<AttributeType, string> = {
    TEXT: 'Free-form text input on products (e.g. Dimensions note, Provenance details).',
    SELECT: 'Single selection from pre-configured option values (e.g. Medium: Oil / Watercolor / Tempera).',
    MULTI_SELECT: 'Multiple selections from pre-configured option values (e.g. Materials: Teak Wood, 24K Gold Leaf).',
    BOOLEAN: 'Yes/No binary toggle (e.g. Includes Frame, Certificate of Authenticity).',
    NUMBER: 'Numeric value input (e.g. Weight in grams, Year of Creation).',
    RANGE: 'Range slider facet on storefront (e.g. Height in inches, Price tiers).',
  };

  return (
    <PageContainer>
      <form onSubmit={handleSubmit} className="space-y-6">
        <PageHeader
          title="Create New Attribute"
          description="Define a global product specification and filter dimension."
          breadcrumbs={[
            { label: 'Dashboard', path: '/admin' },
            { label: 'Attributes', path: '/admin/attributes' },
            { label: 'New Attribute' },
          ]}
        >
          <div className="flex items-center space-x-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin/attributes')}
              className="flex items-center space-x-1"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              <span>Cancel</span>
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={createMutation.isPending}
              className="flex items-center space-x-1"
            >
              <Save className="w-4 h-4 mr-1" />
              <span>Save Attribute</span>
            </Button>
          </div>
        </PageHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Form Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-lg border border-sand-200 shadow-sm space-y-4">
              <h3 className="text-sm font-serif font-semibold text-charcoal-900 border-b border-sand-200 pb-2">
                Attribute Identity & Type
              </h3>

              <Input
                label="Attribute Name"
                placeholder="e.g. Primary Medium, Framing Style, Period"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-charcoal-700 font-sans">
                    Attribute Slug / Identifier
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomSlug(!isCustomSlug)}
                    className="text-xs text-gold-600 hover:text-gold-700 font-sans underline"
                  >
                    {isCustomSlug ? 'Auto-generate from Name' : 'Custom Slug'}
                  </button>
                </div>
                <Input
                  placeholder="e.g. primary-medium"
                  value={slug}
                  onChange={(e) => {
                    setIsCustomSlug(true);
                    setSlug(e.target.value);
                  }}
                  helperText="Unique technical key used in storefront filter query parameters"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5 font-sans">
                  Attribute Data Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as AttributeType)}
                  className="w-full text-sm bg-white border border-sand-300 rounded-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-gold-500 font-serif"
                >
                  <option value="SELECT">SELECT (Single Choice from Defined List)</option>
                  <option value="MULTI_SELECT">MULTI_SELECT (Multiple Choices from Defined List)</option>
                  <option value="TEXT">TEXT (Free-form Text String)</option>
                  <option value="BOOLEAN">BOOLEAN (Yes / No Toggle)</option>
                  <option value="NUMBER">NUMBER (Exact Numerical Value)</option>
                  <option value="RANGE">RANGE (Continuous Number Slider / Interval)</option>
                </select>
                <p className="mt-1.5 text-xs text-charcoal-500 font-sans flex items-start gap-1">
                  <Info className="w-3.5 h-3.5 text-gold-600 flex-shrink-0 mt-0.5" />
                  <span>{typeDescriptions[type]}</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5 font-sans">
                  Description / Curator Guidelines
                </label>
                <textarea
                  rows={3}
                  placeholder="Internal notes or guidelines for curators and catalog managers..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-sm bg-white border border-sand-300 rounded-md p-2.5 focus:outline-none focus:ring-1 focus:ring-gold-500 font-serif"
                />
              </div>
            </div>
          </div>

          {/* Right 1 Col: Settings & Facets */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-sand-200 shadow-sm space-y-4">
              <h3 className="text-sm font-serif font-semibold text-charcoal-900 border-b border-sand-200 pb-2">
                Behavior & Facet Controls
              </h3>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5 font-sans">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                  className="w-full text-sm bg-white border border-sand-300 rounded-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-gold-500 font-serif"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <div className="pt-2 border-t border-sand-100">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <Switch
                    checked={isFilterable}
                    onChange={(checked) => setIsFilterable(checked)}
                  />
                  <div>
                    <span className="text-sm font-medium text-charcoal-900 font-serif">
                      Storefront Filterable
                    </span>
                    <p className="text-xs text-charcoal-500 font-sans">
                      Enable shoppers to filter catalog collections by this attribute
                    </p>
                  </div>
                </label>
              </div>

              <div className="pt-2 border-t border-sand-100">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <Switch
                    checked={isRequired}
                    onChange={(checked) => setIsRequired(checked)}
                  />
                  <div>
                    <span className="text-sm font-medium text-charcoal-900 font-serif">
                      Globally Required
                    </span>
                    <p className="text-xs text-charcoal-500 font-sans">
                      Mandatory field across all categories
                    </p>
                  </div>
                </label>
              </div>

              <div className="pt-2 border-t border-sand-100">
                <Input
                  label="Display Sort Order"
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </form>
    </PageContainer>
  );
};
