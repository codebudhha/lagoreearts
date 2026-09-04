import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { JournalPostForm } from '../../components/journal/JournalPostForm';
import { Skeleton } from '../../components/feedback/Skeleton';
import { ErrorState } from '../../components/feedback/ErrorState';
import { useJournalPost, useUpdateJournalPost } from '../../hooks/useJournal';
import { UpdateJournalPostPayload } from '../../lib/api/journal';

export const JournalEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: post, isLoading, isError, error, refetch } = useJournalPost(id || '');
  const updateMutation = useUpdateJournalPost();

  if (isLoading) {
    return (
      <PageContainer>
        <Skeleton className="h-12 w-1/3 mb-4" />
        <Skeleton className="h-96 w-full" />
      </PageContainer>
    );
  }

  if (isError || !post) {
    return (
      <PageContainer>
        <ErrorState
          title="Article Not Found"
          message={(error as Error)?.message || 'Unable to load journal article for editing.'}
          onRetry={refetch}
        />
      </PageContainer>
    );
  }

  const handleSubmit = async (payload: any) => {
    await updateMutation.mutateAsync({
      id: post.id,
      payload: payload as UpdateJournalPostPayload,
    });
    navigate(`/admin/journal/${post.id}`);
  };

  return (
    <PageContainer>
      <PageHeader
        title={`Edit Article: ${post.title}`}
        description="Update article content, author, categories, media, and linked items."
        breadcrumbs={[
          { label: 'Admin', path: '/admin' },
          { label: 'Journal & Blog', path: '/admin/journal' },
          { label: post.title, path: `/admin/journal/${post.id}` },
          { label: 'Edit' },
        ]}
      />

      <JournalPostForm
        initialData={post}
        onSubmit={handleSubmit}
        isLoading={updateMutation.isPending}
        onCancel={() => navigate(`/admin/journal/${post.id}`)}
      />
    </PageContainer>
  );
};
