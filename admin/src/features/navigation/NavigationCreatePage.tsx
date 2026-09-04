import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Switch } from '../../components/ui/Switch';
import { Card } from '../../components/ui/Card';
import {
  useCreateNavigation,
} from '../../hooks/useNavigation';
import {
  NavigationLocation,
  NavigationStatus,
  navigationLocations,
} from '../../lib/api/navigation';
import { Save } from 'lucide-react';

interface CreateNavigationForm {
  name: string;
  slug: string;
  location: NavigationLocation;
  status: NavigationStatus;
  isDefault: boolean;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const NavigationCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const createMutation = useCreateNavigation();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateNavigationForm>({
    defaultValues: {
      name: '',
      slug: '',
      location: 'HEADER',
      status: 'ACTIVE',
      isDefault: false,
    },
  });

  const onSubmit = async (data: CreateNavigationForm) => {
    const created = await createMutation.mutateAsync({
      name: data.name.trim(),
      slug: data.slug.trim() || slugify(data.name),
      location: data.location,
      status: data.status,
      isDefault: data.isDefault,
    });
    navigate(`/admin/navigation/${created.id}/edit`);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Create Navigation"
        description="Set up a new navigation menu for the storefront."
        breadcrumbs={[
          { label: 'Admin', path: '/admin' },
          { label: 'Navigation', path: '/admin/navigation' },
          { label: 'Create' },
        ]}
      />

      <div className="max-w-2xl mt-6">
        <Card className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Controller
              name="name"
              control={control}
              rules={{ required: 'Navigation name is required' }}
              render={({ field }) => (
                <Input
                  {...field}
                  label="Navigation Name *"
                  placeholder="e.g. Main Header Navigation"
                  error={errors.name?.message}
                />
              )}
            />

            <Controller
              name="slug"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  label="Slug"
                  placeholder="auto-generated-from-name"
                  helperText="Leave blank to auto-generate from name"
                />
              )}
            />

            <Controller
              name="location"
              control={control}
              render={({ field }) => (
                <Select
                  label="Location *"
                  value={field.value}
                  onChange={field.onChange}
                  options={navigationLocations.map((l) => ({ value: l.value, label: l.label }))}
                />
              )}
            />

            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select
                  label="Status"
                  value={field.value}
                  onChange={field.onChange}
                  options={[
                    { value: 'ACTIVE', label: 'Active' },
                    { value: 'INACTIVE', label: 'Inactive' },
                  ]}
                />
              )}
            />

            <Controller
              name="isDefault"
              control={control}
              render={({ field }) => (
                <Switch
                  id="is-default"
                  label="Set as Default"
                  description="Make this the default navigation for its location. Only one default per location is allowed."
                  checked={field.value}
                  onChange={field.onChange}
                />
              )}
            />

            <div className="flex justify-end gap-3 pt-4 border-t border-ivory-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/navigation')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="gap-1.5"
              >
                {createMutation.isPending ? (
                  'Creating...'
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Create Navigation
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </PageContainer>
  );
};
