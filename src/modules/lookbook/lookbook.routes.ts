import express from '../../utils/express.ts';
import { requireAdminAuth } from '../../middleware/requireAdminAuth.ts';
import { requirePermission } from '../../middleware/requirePermission.ts';
import { LookbookController } from './lookbook.controller.ts';
import { LookbookValidator } from './lookbook.validator.ts';

// ==========================================
// Admin Lookbook Router
// ==========================================
export const adminLookbookRouter = express.Router();
adminLookbookRouter.use(requireAdminAuth);

// ------------------------------------------
// Section Media Subroutes
// ------------------------------------------
adminLookbookRouter.post(
  '/sections/:sectionId/media',
  requirePermission('lookbook.update'),
  LookbookValidator.validateAttachMedia,
  LookbookController.attachSectionMedia
);

adminLookbookRouter.delete(
  '/sections/:sectionId/media/:mediaId/:role',
  requirePermission('lookbook.delete'),
  LookbookController.detachSectionMedia
);

adminLookbookRouter.post(
  '/sections/:sectionId/media/reorder',
  requirePermission('lookbook.update'),
  LookbookValidator.validateReorderMedia,
  LookbookController.reorderSectionMedia
);

adminLookbookRouter.put(
  '/sections/:sectionId/media/reorder',
  requirePermission('lookbook.update'),
  LookbookValidator.validateReorderMedia,
  LookbookController.reorderSectionMedia
);

adminLookbookRouter.post(
  '/sections/:sectionId/media/primary',
  requirePermission('lookbook.update'),
  LookbookController.setSectionPrimaryMedia
);

adminLookbookRouter.put(
  '/sections/:sectionId/media/primary',
  requirePermission('lookbook.update'),
  LookbookController.setSectionPrimaryMedia
);

// ------------------------------------------
// Section Entity Junction Subroutes
// ------------------------------------------
adminLookbookRouter.post(
  '/sections/:sectionId/products',
  requirePermission('lookbook.update'),
  LookbookValidator.validateSetProducts,
  LookbookController.setSectionProducts
);

adminLookbookRouter.put(
  '/sections/:sectionId/products',
  requirePermission('lookbook.update'),
  LookbookValidator.validateSetProducts,
  LookbookController.setSectionProducts
);

adminLookbookRouter.post(
  '/sections/:sectionId/collections',
  requirePermission('lookbook.update'),
  LookbookValidator.validateSetCollections,
  LookbookController.setSectionCollections
);

adminLookbookRouter.put(
  '/sections/:sectionId/collections',
  requirePermission('lookbook.update'),
  LookbookValidator.validateSetCollections,
  LookbookController.setSectionCollections
);

adminLookbookRouter.post(
  '/sections/:sectionId/artists',
  requirePermission('lookbook.update'),
  LookbookValidator.validateSetArtists,
  LookbookController.setSectionArtists
);

adminLookbookRouter.put(
  '/sections/:sectionId/artists',
  requirePermission('lookbook.update'),
  LookbookValidator.validateSetArtists,
  LookbookController.setSectionArtists
);

adminLookbookRouter.post(
  '/sections/:sectionId/categories',
  requirePermission('lookbook.update'),
  LookbookValidator.validateSetCategories,
  LookbookController.setSectionCategories
);

adminLookbookRouter.put(
  '/sections/:sectionId/categories',
  requirePermission('lookbook.update'),
  LookbookValidator.validateSetCategories,
  LookbookController.setSectionCategories
);

adminLookbookRouter.post(
  '/sections/:sectionId/journals',
  requirePermission('lookbook.update'),
  LookbookValidator.validateSetJournals,
  LookbookController.setSectionJournals
);

adminLookbookRouter.put(
  '/sections/:sectionId/journals',
  requirePermission('lookbook.update'),
  LookbookValidator.validateSetJournals,
  LookbookController.setSectionJournals
);

adminLookbookRouter.post(
  '/sections/:sectionId/sanskrit-edits',
  requirePermission('lookbook.update'),
  LookbookValidator.validateSetSanskritEdits,
  LookbookController.setSectionSanskritEdits
);

adminLookbookRouter.put(
  '/sections/:sectionId/sanskrit-edits',
  requirePermission('lookbook.update'),
  LookbookValidator.validateSetSanskritEdits,
  LookbookController.setSectionSanskritEdits
);

// ------------------------------------------
// Section Direct Operations
// ------------------------------------------
adminLookbookRouter.get(
  '/sections/:sectionId',
  requirePermission('lookbook.view'),
  LookbookController.getSectionById
);

adminLookbookRouter.patch(
  '/sections/:sectionId',
  requirePermission('lookbook.update'),
  LookbookValidator.validateUpdateSection,
  LookbookController.updateSection
);

adminLookbookRouter.put(
  '/sections/:sectionId',
  requirePermission('lookbook.update'),
  LookbookValidator.validateUpdateSection,
  LookbookController.updateSection
);

adminLookbookRouter.delete(
  '/sections/:sectionId',
  requirePermission('lookbook.delete'),
  LookbookController.deleteSection
);

// ------------------------------------------
// Lookbook Section Management (by Lookbook ID)
// ------------------------------------------
adminLookbookRouter.get(
  '/:id/sections',
  requirePermission('lookbook.view'),
  LookbookController.getSections
);

adminLookbookRouter.post(
  '/:id/sections',
  requirePermission('lookbook.create'),
  LookbookValidator.validateCreateSection,
  LookbookController.createSection
);

adminLookbookRouter.post(
  '/:id/sections/reorder',
  requirePermission('lookbook.update'),
  LookbookValidator.validateReorderSections,
  LookbookController.reorderSections
);

adminLookbookRouter.put(
  '/:id/sections/reorder',
  requirePermission('lookbook.update'),
  LookbookValidator.validateReorderSections,
  LookbookController.reorderSections
);

// ------------------------------------------
// Lookbook Lifecycle Operations
// ------------------------------------------
adminLookbookRouter.post(
  '/:id/publish',
  requirePermission('lookbook.publish'),
  LookbookController.publishLookbook
);

adminLookbookRouter.post(
  '/:id/unpublish',
  requirePermission('lookbook.publish'),
  LookbookController.unpublishLookbook
);

adminLookbookRouter.post(
  '/:id/archive',
  requirePermission('lookbook.publish'),
  LookbookController.archiveLookbook
);

adminLookbookRouter.post(
  '/:id/duplicate',
  requirePermission('lookbook.create'),
  LookbookController.duplicateLookbook
);

// ------------------------------------------
// Lookbook Standard CRUD Operations
// ------------------------------------------
adminLookbookRouter.get(
  '/',
  requirePermission('lookbook.view'),
  LookbookController.listLookbooks
);

adminLookbookRouter.post(
  '/',
  requirePermission('lookbook.create'),
  LookbookValidator.validateCreateLookbook,
  LookbookController.createLookbook
);

adminLookbookRouter.get(
  '/:id',
  requirePermission('lookbook.view'),
  LookbookController.getLookbookById
);

adminLookbookRouter.patch(
  '/:id',
  requirePermission('lookbook.update'),
  LookbookValidator.validateUpdateLookbook,
  LookbookController.updateLookbook
);

adminLookbookRouter.put(
  '/:id',
  requirePermission('lookbook.update'),
  LookbookValidator.validateUpdateLookbook,
  LookbookController.updateLookbook
);

adminLookbookRouter.delete(
  '/:id',
  requirePermission('lookbook.delete'),
  LookbookController.deleteLookbook
);

// ==========================================
// Public Storefront Lookbook Router
// ==========================================
export const publicLookbookRouter = express.Router();

publicLookbookRouter.get('/', LookbookController.getPublicLookbooks);
publicLookbookRouter.get('/:slug', LookbookController.getPublicLookbookBySlug);
