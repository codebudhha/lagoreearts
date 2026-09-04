import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Switch } from '../../components/ui/Switch';
import { Skeleton } from '../../components/feedback/Skeleton';
import { ErrorState } from '../../components/feedback/ErrorState';
import { useAttributeDetail, useUpdateAttribute } from '../../hooks/useAttributes';
import { AttributeType, UpdateAttributePayload } from '../../lib/api/attributes';
import { ArrowLeft, Save, Lock } from 'lucide-react';

export const AttributeEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: attribute,
    isLoading,
    isError,
    error,
    refetch,
  } = useAttributeDetail(id || '');

  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [type, setType] = useState<AttributeType>('SELECT');
  const [description, setDescription] = useState('');

  // Settings
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [isFilterable, setIsFilterable] = useState(true);
  const [isRequired, setIsRequired] = useState(false);
  const [sortOrder, setSortOrder] = useState('0');

  const updateMutation = useUpdateAttribute();

  useEffect(() => {
    if (attribute) {
      setName(attribute.name || '');
      setSlug(attribute.slug || '');
      setType(attribute.type);
      setDescription(attribute.description || '');
      setStatus(attribute.status || 'ACTIVE');
      setIsFilterable(Boolean(attribute.isFilterable));
      setIsRequired(Boolean(attribute.isRequired));
      setSortOrder(String(attribute.sortOrder ?? 0));
    }
  }, [attribute]);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </PageContainer>
    );
  }

  if (isError || !attribute) {
    return (
      <PageContainer>
        <ErrorState
          title="Attribute Not Found"
          message={(error as any)?.message || 'The requested attribute does not exist.'}
          onRetry={refetch}
        />
      </PageContainer>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !id) return;

    const payload: UpdateAttributePayload = {
      name: name.trim(),
      slug: slug.trim() || undefined,
      type: attribute.isSystem ? undefined : type,
      description: description.trim() || undefined,
      status,
      isFilterable,
      isRequired,
      sortOrder: parseInt(sortOrder, 10) || 0,
    };

    try {
      await updateMutation.mutateAsync({ id, payload });
      navigate(`/admin/attributes/${id}`);
    } catch {
      // Handled by toast
    }
  };

  return (
    <PageContainer>
      <form onSubmit={handleSubmit} className="space-y-6">
        <PageHeader
          title={`Edit: ${attribute.name}`}
          description={`Editing attribute specification properties (ID: ${attribute.id})`}
          breadcrumbs={[
            { label: 'Dashboard', path: '/admin' },
            { label: 'Attributes', path: '/admin/attributes' },
            { label: attribute.name, path: `/admin/attributes/${attribute.id}` },
            { label: 'Edit' },
          ]}
        >
          <div className="flex items-center space-x-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate(`/admin/attributes/${id}`)}
              className="flex items-center space-x-1"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              <span>Cancel</span>
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={updateMutation.isPending}
              className="flex items-center space-x-1"
            >
              <Save className="w-4 h-4 mr-1" />
              <span>Save Changes</span>
            </Button>
          </div>
        </PageHeader>

        {attribute.isSystem && (
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 flex items-start space-x-3">
            <Lock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 font-sans">
              <span className="font-semibold block mb-0.5 font-serif text-sm">
                System Attribute Protection
              </span>
              The data type of a system attribute cannot be modified to avoid breaking core storefront schemas.
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Basic Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-lg border border-sand-200 shadow-sm space-y-4">
              <h3 className="text-sm font-serif font-semibold text-charcoal-900 border-b border-sand-200 pb-2">
                Attribute Identity
              </h3>

              <Input
                label="Attribute Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <Input
                label="Attribute Slug / Identifier"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                helperText="Identifier for filter query parameters"
              />

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5 font-sans">
                  Attribute Data Type {attribute.isSystem && <span className="text-amber-600 font-normal normal-case">(Locked)</span>}
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as AttributeType)}
                  disabled={attribute.isSystem}
                  className="w-full text-sm bg-white border border-sand-300 rounded-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-gold-500 font-serif disabled:bg-sand-100 disabled:text-charcoal-500 disabled:cursor-not-allowed"
                >
                  <option value="SELECT">SELECT (Single Choice from Defined List)</option>
                  <option value="MULTI_SELECT">MULTI_SELECT (Multiple Choices from Defined List)</option>
                  <option value="TEXT">TEXT (Free-form Text String)</option>
                  <option value="BOOLEAN">BOOLEAN (Yes / No Toggle)</option>
                  <option value="NUMBER">NUMBER (Exact Numerical Value)</option>
                  <option value="RANGE">RANGE (Continuous Number Slider / Interval)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5 font-sans">
                  Description / Curator Guidelines
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-sm bg-white border border-sand-300 rounded-md p-2.5 focus:outline-none focus:ring-1 focus:ring-gold-500 font-serif"
                />
              </div>
            </div>
          </div>

          {/* Right 1 Col: Settings */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-sand-200 shadow-sm space-y-4">
              <h3 className="text-sm font-serif font-semibold text-charcoal-900 border-b border-sand-200 pb-2">
                Behavior & Rules
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
