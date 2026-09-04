import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { SearchInput } from '../../components/ui/SearchInput';
import { Select } from '../../components/ui/Select';
import { Pagination } from '../../components/ui/Pagination';
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog';
import { Skeleton } from '../../components/feedback/Skeleton';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { JournalPostStatusBadge } from '../../components/journal/JournalPostStatusBadge';
import {
  useJournalPostsList,
  useDeleteJournalPost,
  useJournalAuthorsList,
  useJournalCategoriesList,
} from '../../hooks/useJournal';
import { useAuth } from '../../hooks/useAuth';
import {
  JournalPost,
  JournalPostStatus,
  JournalPostType,
} from '../../lib/api/journal';
import {
  Plus,
  Eye,
  Edit2,
  Trash2,
  BookOpen,
  User,
  Tags,
  FolderArchive,
  Image as ImageIcon,
} from 'lucide-react';

export const JournalListPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const canCreate = hasPermission('journal.create');
  const canUpdate = hasPermission('journal.update');
  const canDelete = hasPermission('journal.delete');

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [authorFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [postToDelete, setPostToDelete] = useState<JournalPost | null>(null);

  // Queries
  const { data, isLoading, isError, error, refetch } = useJournalPostsList({
    page,
    limit,
    search: search || undefined,
    status: statusFilter !== 'ALL' ? (statusFilter as JournalPostStatus) : undefined,
    type: typeFilter !== 'ALL' ? (typeFilter as JournalPostType) : undefined,
    authorId: authorFilter !== 'ALL' ? authorFilter : undefined,
    categoryId: categoryFilter !== 'ALL' ? categoryFilter : undefined,
  });

  const { data: authorsData } = useJournalAuthorsList({ limit: 100 });
  const { data: categoriesData } = useJournalCategoriesList({ limit: 100 });

  const deleteMutation = useDeleteJournalPost();

  const posts = data?.items || [];
  const pagination = data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 };
  const authors = authorsData?.items || [];
  const categories = categoriesData?.items || [];

  const handleConfirmDelete = async () => {
    if (!postToDelete) return;
    await deleteMutation.mutateAsync(postToDelete.id);
    setPostToDelete(null);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Journal & Editorial Blog"
        description="Author scholarly essays, artist profiles, lookbook stories, and manage authors and taxonomy."
        breadcrumbs={[
          { label: 'Admin', path: '/admin' },
          { label: 'Journal & Blog' },
        ]}
      >
        <div className="flex items-center gap-2">
          <Link to="/admin/journal/authors">
            <Button variant="outline" size="sm" className="gap-1.5">
              <User className="w-4 h-4" />
              Authors ({authors.length})
            </Button>
          </Link>
          <Link to="/admin/journal/categories">
            <Button variant="outline" size="sm" className="gap-1.5">
              <FolderArchive className="w-4 h-4" />
              Categories ({categories.length})
            </Button>
          </Link>
          <Link to="/admin/journal/tags">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Tags className="w-4 h-4" />
              Tags
            </Button>
          </Link>
          {canCreate && (
            <Button onClick={() => navigate('/admin/journal/new')} className="gap-2">
              <Plus className="w-4 h-4" />
              New Article
            </Button>
          )}
        </div>
      </PageHeader>

      {/* Filter Toolbar */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-3 mb-6">
        <div className="w-full lg:w-72">
          <SearchInput
            placeholder="Search posts..."
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
          />
        </div>

        <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap">
          <Select
            aria-label="Filter by Status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-36 text-xs"
          >
            <option value="ALL">All Statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </Select>

          <Select
            aria-label="Filter by Type"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="w-36 text-xs"
          >
            <option value="ALL">All Types</option>
            <option value="ARTICLE">Article</option>
            <option value="STORY">Story</option>
            <option value="INTERVIEW">Interview</option>
            <option value="CURATION">Curation</option>
            <option value="EDITORIAL">Editorial</option>
          </Select>

          <Select
            aria-label="Filter by Category"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="w-40 text-xs"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Main Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          title="Failed to load journal posts"
          message={(error as Error)?.message || 'An error occurred'}
          onRetry={refetch}
        />
      ) : posts.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-7 h-7 text-charcoal-400" />}
          title="No journal articles found"
          description={
            search || statusFilter !== 'ALL' || typeFilter !== 'ALL'
              ? 'Try refining your search terms or filter criteria.'
              : 'Start sharing your cultural narratives, artist spotlights, and scholarly essays.'
          }
          actionLabel={canCreate && !search && statusFilter === 'ALL' ? 'Write First Article' : undefined}
          onAction={canCreate && !search && statusFilter === 'ALL' ? () => navigate('/admin/journal/new') : undefined}
        />
      ) : (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 text-neutral-600 dark:text-neutral-400 font-medium text-xs">
                  <th className="py-3 px-4">Post & Excerpt</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Author & Category</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Published Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {posts.map((post) => (
                  <tr
                    key={post.id}
                    className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded bg-neutral-100 dark:bg-neutral-800 overflow-hidden shrink-0 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center">
                          {post.coverImage?.url ? (
                            <img
                              src={post.coverImage.thumbnailUrl || post.coverImage.url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-neutral-400" />
                          )}
                        </div>

                        <div className="min-w-0 max-w-sm">
                          <Link
                            to={`/admin/journal/${post.id}`}
                            className="font-semibold text-neutral-900 dark:text-neutral-100 hover:text-gold-600 transition-colors line-clamp-1"
                          >
                            {post.title}
                          </Link>
                          {post.excerpt && (
                            <p className="text-xs text-neutral-500 line-clamp-1">
                              {post.excerpt}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge variant="outline" className="text-xs">
                        {post.type}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 text-xs">
                      <div className="space-y-0.5">
                        <div className="text-neutral-800 dark:text-neutral-200 font-medium truncate">
                          {post.author?.name || <span className="text-neutral-400">—</span>}
                        </div>
                        <div className="text-neutral-500 truncate">
                          {post.category?.name || <span className="text-neutral-400">—</span>}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <JournalPostStatusBadge
                        status={post.status}
                        isFeatured={post.featured}
                      />
                    </td>

                    <td className="py-3.5 px-4 text-xs text-neutral-500 whitespace-nowrap">
                      {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : '—'}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/admin/journal/${post.id}/preview`)}
                          title="Preview Article"
                        >
                          <Eye className="w-4 h-4 text-neutral-500" />
                        </Button>

                        {canUpdate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/admin/journal/${post.id}/edit`)}
                            title="Edit Article"
                          >
                            <Edit2 className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
                          </Button>
                        )}

                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPostToDelete(post)}
                            title="Delete Article"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          )}
        </div>
      )}

      {/* Delete Post Dialog */}
      <ConfirmDialog
        isOpen={Boolean(postToDelete)}
        onClose={() => setPostToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Journal Article"
        message={`Are you sure you want to delete "${postToDelete?.title}"? This action cannot be undone.`}
        confirmLabel="Delete Article"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </PageContainer>
  );
};
