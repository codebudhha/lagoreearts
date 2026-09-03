import express from '../../utils/express.ts';
import { requireAdminAuth } from '../../middleware/requireAdminAuth.ts';
import { requirePermission } from '../../middleware/requirePermission.ts';
import { JournalAdminController, JournalPublicController } from './journal.controller.ts';
import {
  validateCreateAuthor,
  validateUpdateAuthor,
  validateCreateCategory,
  validateUpdateCategory,
  validateCreateTag,
  validateUpdateTag,
  validateCreatePost,
  validateUpdatePost,
  validateAttachMedia
} from './journal.validator.ts';

// ==========================================
// Admin Authors Router
// ==========================================
export const adminJournalAuthorsRouter = express.Router();
adminJournalAuthorsRouter.use(requireAdminAuth);

adminJournalAuthorsRouter.get('/', requirePermission('journal.view'), JournalAdminController.listAuthors);
adminJournalAuthorsRouter.post('/', requirePermission('journal.create'), validateCreateAuthor, JournalAdminController.createAuthor);
adminJournalAuthorsRouter.get('/:id', requirePermission('journal.view'), JournalAdminController.getAuthorById);
adminJournalAuthorsRouter.patch('/:id', requirePermission('journal.update'), validateUpdateAuthor, JournalAdminController.updateAuthor);
adminJournalAuthorsRouter.delete('/:id', requirePermission('journal.delete'), JournalAdminController.deleteAuthor);

// ==========================================
// Admin Categories Router
// ==========================================
export const adminJournalCategoriesRouter = express.Router();
adminJournalCategoriesRouter.use(requireAdminAuth);

adminJournalCategoriesRouter.get('/', requirePermission('journal.view'), JournalAdminController.listCategories);
adminJournalCategoriesRouter.put('/order', requirePermission('journal.update'), JournalAdminController.reorderCategories);
adminJournalCategoriesRouter.post('/', requirePermission('journal.create'), validateCreateCategory, JournalAdminController.createCategory);
adminJournalCategoriesRouter.get('/:id', requirePermission('journal.view'), JournalAdminController.getCategoryById);
adminJournalCategoriesRouter.patch('/:id', requirePermission('journal.update'), validateUpdateCategory, JournalAdminController.updateCategory);
adminJournalCategoriesRouter.delete('/:id', requirePermission('journal.delete'), JournalAdminController.deleteCategory);

// ==========================================
// Admin Tags Router
// ==========================================
export const adminJournalTagsRouter = express.Router();
adminJournalTagsRouter.use(requireAdminAuth);

adminJournalTagsRouter.get('/', requirePermission('journal.view'), JournalAdminController.listTags);
adminJournalTagsRouter.post('/', requirePermission('journal.create'), validateCreateTag, JournalAdminController.createTag);
adminJournalTagsRouter.get('/:id', requirePermission('journal.view'), JournalAdminController.getTagById);
adminJournalTagsRouter.patch('/:id', requirePermission('journal.update'), validateUpdateTag, JournalAdminController.updateTag);
adminJournalTagsRouter.delete('/:id', requirePermission('journal.delete'), JournalAdminController.deleteTag);

// ==========================================
// Admin Main Journal Posts Router
// ==========================================
export const adminJournalRouter = express.Router();
adminJournalRouter.use(requireAdminAuth);

// Mount sub-routers first
adminJournalRouter.use('/authors', adminJournalAuthorsRouter);
adminJournalRouter.use('/categories', adminJournalCategoriesRouter);
adminJournalRouter.use('/tags', adminJournalTagsRouter);

// Post Media Operations (specific subroutes before :id)
adminJournalRouter.post('/:id/media', requirePermission('journal.update'), validateAttachMedia, JournalAdminController.attachPostMedia);
adminJournalRouter.put('/:id/media/order', requirePermission('journal.update'), JournalAdminController.reorderPostMedia);
adminJournalRouter.delete('/:id/media/:mediaId', requirePermission('journal.update'), JournalAdminController.detachPostMedia);

// Post Junction Operations
adminJournalRouter.put('/:id/tags', requirePermission('journal.update'), JournalAdminController.setPostTags);
adminJournalRouter.put('/:id/products', requirePermission('journal.update'), JournalAdminController.setPostProducts);
adminJournalRouter.put('/:id/collections', requirePermission('journal.update'), JournalAdminController.setPostCollections);
adminJournalRouter.put('/:id/artists', requirePermission('journal.update'), JournalAdminController.setPostArtists);
adminJournalRouter.put('/:id/sanskrit-edit', requirePermission('journal.update'), JournalAdminController.setPostSanskritEdits);
adminJournalRouter.put('/:id/related-posts', requirePermission('journal.update'), JournalAdminController.setPostRelatedPosts);

// Post Lifecycle Operations
adminJournalRouter.post('/:id/publish', requirePermission('journal.publish'), JournalAdminController.publishPost);
adminJournalRouter.post('/:id/unpublish', requirePermission('journal.update'), JournalAdminController.unpublishPost);
adminJournalRouter.post('/:id/archive', requirePermission('journal.update'), JournalAdminController.archivePost);
adminJournalRouter.patch('/:id/status', requirePermission('journal.update'), JournalAdminController.updatePostStatus);

// Post Standard CRUD
adminJournalRouter.get('/', requirePermission('journal.view'), JournalAdminController.listPosts);
adminJournalRouter.post('/', requirePermission('journal.create'), validateCreatePost, JournalAdminController.createPost);
adminJournalRouter.get('/:id', requirePermission('journal.view'), JournalAdminController.getPostById);
adminJournalRouter.patch('/:id', requirePermission('journal.update'), validateUpdatePost, JournalAdminController.updatePost);
adminJournalRouter.delete('/:id', requirePermission('journal.delete'), JournalAdminController.deletePost);

// ==========================================
// Public Storefront Journal Router
// ==========================================
export const publicJournalRouter = express.Router();

publicJournalRouter.get('/', JournalPublicController.list);
publicJournalRouter.get('/:slug', JournalPublicController.getBySlug);
