import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  journalApi,
  JournalPostStatus,
  JournalPostFilterParams,
  CreateJournalPostPayload,
  UpdateJournalPostPayload,
  CreateJournalAuthorPayload,
  UpdateJournalAuthorPayload,
  CreateJournalCategoryPayload,
  UpdateJournalCategoryPayload,
  CreateJournalTagPayload,
  UpdateJournalTagPayload,
  JournalPostMediaRole,
} from '../lib/api/journal';
import { queryKeys } from '../lib/api/queryKeys';
import { useToast } from './useToast';

// Posts Hooks
export function useJournalPosts(params?: JournalPostFilterParams) {
  return useQuery({
    queryKey: queryKeys.journal.postList(params),
    queryFn: () => journalApi.getPosts(params),
  });
}

export function useJournalPostDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.journal.post(id),
    queryFn: () => journalApi.getPost(id),
    enabled: Boolean(id),
  });
}

export function useCreateJournalPost() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (payload: CreateJournalPostPayload) => journalApi.createPost(payload),
    onSuccess: (newPost) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.journal.posts() });
      success(`Journal post "${newPost.title}" created successfully`);
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to create journal post');
    },
  });
}

export function useUpdateJournalPost() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateJournalPostPayload }) =>
      journalApi.updatePost(id, payload),
    onSuccess: (updatedPost) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.journal.post(updatedPost.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.journal.posts() });
      success('Journal post updated successfully');
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to update journal post');
    },
  });
}

export function useDeleteJournalPost() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (id: string) => journalApi.deletePost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.journal.posts() });
      success('Journal post deleted successfully');
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to delete journal post');
    },
  });
}

export function usePublishJournalPost() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (id: string) => journalApi.publishPost(id),
    onSuccess: (post) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.journal.post(post.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.journal.posts() });
      success(`Post "${post.title}" is now published`);
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to publish post');
    },
  });
}

export function useUnpublishJournalPost() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (id: string) => journalApi.unpublishPost(id),
    onSuccess: (post) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.journal.post(post.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.journal.posts() });
      success(`Post "${post.title}" moved to draft`);
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to unpublish post');
    },
  });
}

export function useArchiveJournalPost() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (id: string) => journalApi.archivePost(id),
    onSuccess: (post) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.journal.post(post.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.journal.posts() });
      success(`Post "${post.title}" archived`);
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to archive post');
    },
  });
}

export function useUpdateJournalPostStatus() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: JournalPostStatus }) =>
      journalApi.updateStatus(id, status),
    onSuccess: (post) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.journal.post(post.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.journal.posts() });
      success(`Post status updated to ${post.status}`);
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to update post status');
    },
  });
}

// Post Media
export function useAttachJournalPostMedia() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({
      postId,
      payload,
    }: {
      postId: string;
      payload: { mediaId: string; role?: JournalPostMediaRole; sortOrder?: number; isPrimary?: boolean };
    }) => journalApi.attachMedia(postId, payload),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.journal.post(postId) });
      success('Media attached to journal post');
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to attach media');
    },
  });
}

export function useDetachJournalPostMedia() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ postId, mediaId, role }: { postId: string; mediaId: string; role?: JournalPostMediaRole }) =>
      journalApi.detachMedia(postId, mediaId, role),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.journal.post(postId) });
      success('Media detached from journal post');
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to detach media');
    },
  });
}

export function useReorderJournalPostMedia() {
  const queryClient = useQueryClient();
  const { error } = useToast();

  return useMutation({
    mutationFn: ({
      postId,
      items,
    }: {
      postId: string;
      items: Array<{ mediaId: string; role: JournalPostMediaRole; sortOrder: number; isPrimary?: boolean }>;
    }) => journalApi.reorderMedia(postId, items),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.journal.post(postId) });
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to reorder media');
    },
  });
}

// Junctions
export function useSetPostTags() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ postId, tags }: { postId: string; tags: string[] }) => journalApi.setTags(postId, tags),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.journal.post(postId) });
      success('Tags updated for post');
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to update tags');
    },
  });
}

export function useSetPostProducts() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ postId, products }: { postId: string; products: Array<{ id: string; displayOrder?: number }> }) =>
      journalApi.setProducts(postId, products),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.journal.post(postId) });
      success('Products linked to post');
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to link products');
    },
  });
}

export function useSetPostCollections() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({
      postId,
      collections,
    }: {
      postId: string;
      collections: Array<{ id: string; displayOrder?: number }>;
    }) => journalApi.setCollections(postId, collections),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.journal.post(postId) });
      success('Collections linked to post');
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to link collections');
    },
  });
}

export function useSetPostArtists() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ postId, artists }: { postId: string; artists: Array<{ id: string; displayOrder?: number }> }) =>
      journalApi.setArtists(postId, artists),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.journal.post(postId) });
      success('Artists linked to post');
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to link artists');
    },
  });
}

export function useSetPostSanskritEdits() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({
      postId,
      sanskritEdits,
    }: {
      postId: string;
      sanskritEdits: Array<{ id: string; displayOrder?: number }>;
    }) => journalApi.setSanskritEdits(postId, sanskritEdits),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.journal.post(postId) });
      success('Sanskrit verses linked to post');
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to link Sanskrit verses');
    },
  });
}

export function useSetPostRelatedPosts() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({
      postId,
      relatedPosts,
    }: {
      postId: string;
      relatedPosts: Array<{ id: string; displayOrder?: number }>;
    }) => journalApi.setRelatedPosts(postId, relatedPosts),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.journal.post(postId) });
      success('Related posts updated');
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to link related posts');
    },
  });
}

// Authors Hooks
export function useJournalAuthors(params?: { search?: string; isActive?: boolean; page?: number; limit?: number }) {
  return useQuery({
    queryKey: queryKeys.journal.authors(params),
    queryFn: () => journalApi.getAuthors(params),
  });
}

export function useJournalAuthorDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.journal.author(id),
    queryFn: () => journalApi.getAuthor(id),
    enabled: Boolean(id),
  });
}

export function useCreateJournalAuthor() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (payload: CreateJournalAuthorPayload) => journalApi.createAuthor(payload),
    onSuccess: (author) => {
      queryClient.invalidateQueries({ queryKey: ['journal', 'authors'] });
      success(`Author "${author.name}" created successfully`);
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to create author');
    },
  });
}

export function useUpdateJournalAuthor() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateJournalAuthorPayload }) =>
      journalApi.updateAuthor(id, payload),
    onSuccess: (author) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.journal.author(author.id) });
      queryClient.invalidateQueries({ queryKey: ['journal', 'authors'] });
      success(`Author updated successfully`);
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to update author');
    },
  });
}

export function useDeleteJournalAuthor() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (id: string) => journalApi.deleteAuthor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal', 'authors'] });
      success('Author removed');
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to delete author');
    },
  });
}

// Categories Hooks
export function useJournalCategories(params?: { search?: string; isActive?: boolean; page?: number; limit?: number }) {
  return useQuery({
    queryKey: queryKeys.journal.categories(params),
    queryFn: () => journalApi.getCategories(params),
  });
}

export function useJournalCategoryDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.journal.category(id),
    queryFn: () => journalApi.getCategory(id),
    enabled: Boolean(id),
  });
}

export function useCreateJournalCategory() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (payload: CreateJournalCategoryPayload) => journalApi.createCategory(payload),
    onSuccess: (category) => {
      queryClient.invalidateQueries({ queryKey: ['journal', 'categories'] });
      success(`Category "${category.name}" created`);
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to create category');
    },
  });
}

export function useUpdateJournalCategory() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateJournalCategoryPayload }) =>
      journalApi.updateCategory(id, payload),
    onSuccess: (category) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.journal.category(category.id) });
      queryClient.invalidateQueries({ queryKey: ['journal', 'categories'] });
      success('Category updated');
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to update category');
    },
  });
}

export function useDeleteJournalCategory() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (id: string) => journalApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal', 'categories'] });
      success('Category removed');
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to delete category');
    },
  });
}

export function useReorderJournalCategories() {
  const queryClient = useQueryClient();
  const { error } = useToast();

  return useMutation({
    mutationFn: (items: Array<{ id: string; displayOrder?: number; sortOrder?: number }>) =>
      journalApi.reorderCategories(
        items.map((it, idx) => ({
          id: it.id,
          displayOrder: it.displayOrder ?? it.sortOrder ?? idx,
        }))
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal', 'categories'] });
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to reorder categories');
    },
  });
}

// Tags Hooks
export function useJournalTags(params?: { search?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: queryKeys.journal.tags(params),
    queryFn: () => journalApi.getTags(params),
  });
}

export function useJournalTagDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.journal.tag(id),
    queryFn: () => journalApi.getTag(id),
    enabled: Boolean(id),
  });
}

export function useCreateJournalTag() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (payload: CreateJournalTagPayload) => journalApi.createTag(payload),
    onSuccess: (tag) => {
      queryClient.invalidateQueries({ queryKey: ['journal', 'tags'] });
      success(`Tag "${tag.name}" created`);
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to create tag');
    },
  });
}

export function useUpdateJournalTag() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateJournalTagPayload }) =>
      journalApi.updateTag(id, payload),
    onSuccess: (tag) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.journal.tag(tag.id) });
      queryClient.invalidateQueries({ queryKey: ['journal', 'tags'] });
      success('Tag updated');
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to update tag');
    },
  });
}

export function useDeleteJournalTag() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (id: string) => journalApi.deleteTag(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal', 'tags'] });
      success('Tag removed');
    },
    onError: (err: any) => {
      error(err?.message || 'Failed to delete tag');
    },
  });
}

// Synonyms & convenience aliases
export const useJournalPostsList = useJournalPosts;
export const useJournalPost = useJournalPostDetail;
export const useJournalAuthorsList = useJournalAuthors;
export const useCreateAuthor = useCreateJournalAuthor;
export const useUpdateAuthor = useUpdateJournalAuthor;
export const useDeleteAuthor = useDeleteJournalAuthor;
export const useJournalCategoriesList = useJournalCategories;
export const useJournalTagsList = useJournalTags;
