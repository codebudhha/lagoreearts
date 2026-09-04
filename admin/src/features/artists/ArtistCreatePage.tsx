import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { ArtistForm } from '../../components/artists/ArtistForm';
import { useCreateArtist } from '../../hooks/useArtists';
import { CreateArtistPayload } from '../../lib/api/artists';

export const ArtistCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const createMutation = useCreateArtist();

  const handleCreate = async (data: CreateArtistPayload) => {
    const created = await createMutation.mutateAsync(data);
    navigate(`/admin/artists/${created.id}`);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Create Artist Profile"
        description="Add a master artisan, lineage details, and biographical narrative to the heritage roster."
        breadcrumbs={[
          { label: 'Dashboard', path: '/admin' },
          { label: 'Artists & Makers', path: '/admin/artists' },
          { label: 'New Artist' },
        ]}
      />

      <div className="max-w-4xl">
        <ArtistForm
          onSubmit={handleCreate as any}
          onCancel={() => navigate('/admin/artists')}
          isLoading={createMutation.isPending}
        />
      </div>
    </PageContainer>
  );
};
