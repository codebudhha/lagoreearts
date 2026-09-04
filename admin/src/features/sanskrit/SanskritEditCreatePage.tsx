import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { SanskritEditForm } from '../../components/sanskrit/SanskritEditForm';
import { ProductPicker } from '../../components/collections/ProductPicker';
import { useCreateSanskritEditProfile } from '../../hooks/useSanskritEdit';
import { useProductDetail } from '../../hooks/useProducts';
import { CreateSanskritEditProfilePayload } from '../../lib/api/sanskritEdit';
import { Package, Plus, Sparkles } from 'lucide-react';

export const SanskritEditCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [showProductPicker, setShowProductPicker] = useState(false);

  const { data: selectedProduct } = useProductDetail(selectedProductId || '');
  const createMutation = useCreateSanskritEditProfile();

  const handleCreate = async (data: CreateSanskritEditProfilePayload) => {
    if (!selectedProductId) return;
    await createMutation.mutateAsync({
      productId: selectedProductId,
      payload: data,
    });
    navigate(`/admin/sanskrit-edit/${selectedProductId}`);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Create The Sanskrit Edit Entry"
        description="Attach sacred verse calligraphy, philosophical meanings, and scriptural commentary to an artwork."
        breadcrumbs={[
          { label: 'Dashboard', path: '/admin' },
          { label: 'The Sanskrit Edit', path: '/admin/sanskrit-edit' },
          { label: 'New Entry' },
        ]}
      />

      <div className="max-w-4xl space-y-6">
        {/* Step 1: Base Product Selector */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-sand-200 pb-3">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal-800 font-sans flex items-center gap-2">
                <Package className="w-4 h-4 text-champagne-600" />
                Step 1: Select Artwork Product <span className="text-rose-600">*</span>
              </h3>
              <p className="text-xs text-charcoal-500 font-sans">
                Choose the catalog artwork that will host this Sanskrit editorial entry.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowProductPicker(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              {selectedProduct ? 'Change Product' : 'Choose Product'}
            </Button>
          </div>

          {selectedProduct ? (
            <div className="flex items-center gap-4 p-4 bg-sand-50 rounded-xl border border-sand-200">
              <div className="w-12 h-12 rounded bg-sand-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                {selectedProduct.image ? (
                  <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-6 h-6 text-charcoal-400" />
                )}
              </div>
              <div>
                <h4 className="font-semibold text-charcoal-900 font-serif text-sm">
                  {selectedProduct.name}
                </h4>
                <p className="text-xs text-charcoal-500 font-mono">
                  SKU: {selectedProduct.sku} • Price: ₹{Number(selectedProduct.price).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 border-2 border-dashed border-sand-200 rounded-lg bg-sand-50/50">
              <Package className="w-8 h-8 mx-auto text-charcoal-300 mb-2" />
              <p className="text-xs text-charcoal-500 font-sans">
                Please select an artwork product before filling out the Sanskrit verses.
              </p>
            </div>
          )}
        </Card>

        {/* Step 2: Sanskrit Form */}
        {selectedProduct && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal-800 font-sans flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-champagne-600" />
              Step 2: Enter Calligraphy, Verses & Commentary
            </h3>
            <SanskritEditForm
              productId={selectedProduct.id}
              onSubmit={handleCreate as any}
              onCancel={() => navigate('/admin/sanskrit-edit')}
              isLoading={createMutation.isPending}
            />
          </div>
        )}
      </div>

      {/* Product Picker Modal */}
      {showProductPicker && (
        <ProductPicker
          isOpen={showProductPicker}
          onClose={() => setShowProductPicker(false)}
          onSelectProducts={(selectedIds) => {
            if (selectedIds.length > 0) {
              setSelectedProductId(selectedIds[0]);
            }
            setShowProductPicker(false);
          }}
        />
      )}
    </PageContainer>
  );
};
