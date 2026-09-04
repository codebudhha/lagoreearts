import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { JournalPostForm } from '../../components/journal/JournalPostForm';
import { useCreateJournalPost } from '../../hooks/useJournal';
import { CreateJournalPostPayload } from '../../lib/api/journal';

export const JournalCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const createMutation = useCreateJournalPost();

  const handleSubmit = async (payload: any) => {
    const created = await createMutation.mutateAsync(payload as CreateJournalPostPayload);
    navigate(`/admin/journal/${created.id}`);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Create Journal Article"
        description="Write cultural essays, research articles, artist interviews, and catalog narratives."
        breadcrumbs={[
          { label: 'Admin', path: '/admin' },
          { label: 'Journal & Blog', path: '/admin/journal' },
          { label: 'New Article' },
        ]}
      />

      <JournalPostForm
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending}
        onCancel={() => navigate('/admin/journal')}
      />
    </PageContainer>
  );
};
