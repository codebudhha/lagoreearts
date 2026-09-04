import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { ArtistForm } from '../../components/artists/ArtistForm';
import { Skeleton } from '../../components/feedback/Skeleton';
import { ErrorState } from '../../components/feedback/ErrorState';
import { useArtistDetail, useUpdateArtist } from '../../hooks/useArtists';
import { UpdateArtistPayload } from '../../lib/api/artists';

export const ArtistEditPage: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: artist, isLoading, isError, error, refetch } = useArtistDetail(id);
  const updateMutation = useUpdateArtist();

  const handleUpdate = async (data: UpdateArtistPayload) => {
    await updateMutation.mutateAsync({ id, payload: data });
    navigate(`/admin/artists/${id}`);
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </PageContainer>
    );
  }

  if (isError || !artist) {
    return (
      <PageContainer>
        <ErrorState
          title="Artist Not Found"
          message={(error as any)?.message || 'Could not retrieve artist profile for editing.'}
          onRetry={() => refetch()}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={`Edit Artist: ${artist.name}`}
        description={`Update lineage, biographical narratives, and discovery metadata for /${artist.slug}.`}
        breadcrumbs={[
          { label: 'Dashboard', path: '/admin' },
          { label: 'Artists & Makers', path: '/admin/artists' },
          { label: artist.name, path: `/admin/artists/${artist.id}` },
          { label: 'Edit' },
        ]}
      />

      <div className="max-w-4xl">
        <ArtistForm
          initialData={artist}
          onSubmit={handleUpdate as any}
          onCancel={() => navigate(`/admin/artists/${artist.id}`)}
          isLoading={updateMutation.isPending}
        />
      </div>
    </PageContainer>
  );
};
