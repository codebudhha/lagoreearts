import { Router } from '../../utils/express.ts';
import { requireAdminAuth } from '../../middleware/requireAdminAuth.ts';
import { requirePermission } from '../../middleware/requirePermission.ts';
import { HomepageAdminController, HomepagePublicController } from './homepage.controller.ts';
import { HomepageValidator } from './homepage.validator.ts';

// 1. Admin Homepage Router (/api/v1/admin/homepage)
export const adminHomepageRouter = Router();

adminHomepageRouter.use(requireAdminAuth);

// Homepage CRUD
adminHomepageRouter.get(
  '/',
  requirePermission('homepage.view'),
  HomepageAdminController.list
);

adminHomepageRouter.post(
  '/',
  requirePermission('homepage.create'),
  HomepageValidator.validateCreateHomepage,
  HomepageAdminController.create
);

adminHomepageRouter.get(
  '/:id',
  requirePermission('homepage.view'),
  HomepageAdminController.getById
);

adminHomepageRouter.patch(
  '/:id',
  requirePermission('homepage.update'),
  HomepageValidator.validateUpdateHomepage,
  HomepageAdminController.update
);

adminHomepageRouter.delete(
  '/:id',
  requirePermission('homepage.delete'),
  HomepageAdminController.delete
);

adminHomepageRouter.patch(
  '/:id/status',
  requirePermission('homepage.publish'),
  HomepageValidator.validateStatusUpdate,
  HomepageAdminController.updateStatus
);

adminHomepageRouter.patch(
  '/:id/default',
  requirePermission('homepage.publish'),
  HomepageAdminController.setDefault
);

// Homepage Sections
adminHomepageRouter.get(
  '/:homepageId/sections',
  requirePermission('homepage.view'),
  HomepageAdminController.listSections
);

adminHomepageRouter.post(
  '/:homepageId/sections',
  requirePermission('homepage.create'),
  HomepageValidator.validateCreateSection,
  HomepageAdminController.createSection
);

adminHomepageRouter.put(
  '/:homepageId/sections/order',
  requirePermission('homepage.update'),
  HomepageValidator.validateReorderSections,
  HomepageAdminController.reorderSections
);

adminHomepageRouter.get(
  '/:homepageId/sections/:sectionId',
  requirePermission('homepage.view'),
  HomepageAdminController.getSectionById
);

adminHomepageRouter.patch(
  '/:homepageId/sections/:sectionId',
  requirePermission('homepage.update'),
  HomepageValidator.validateUpdateSection,
  HomepageAdminController.updateSection
);

adminHomepageRouter.delete(
  '/:homepageId/sections/:sectionId',
  requirePermission('homepage.delete'),
  HomepageAdminController.deleteSection
);

// Section Junction Items
adminHomepageRouter.put(
  '/:homepageId/sections/:sectionId/products',
  requirePermission('homepage.update'),
  HomepageValidator.validateSectionItems,
  HomepageAdminController.setSectionProducts
);

adminHomepageRouter.put(
  '/:homepageId/sections/:sectionId/collections',
  requirePermission('homepage.update'),
  HomepageValidator.validateSectionItems,
  HomepageAdminController.setSectionCollections
);

adminHomepageRouter.put(
  '/:homepageId/sections/:sectionId/artists',
  requirePermission('homepage.update'),
  HomepageValidator.validateSectionItems,
  HomepageAdminController.setSectionArtists
);

adminHomepageRouter.put(
  '/:homepageId/sections/:sectionId/categories',
  requirePermission('homepage.update'),
  HomepageValidator.validateSectionItems,
  HomepageAdminController.setSectionCategories
);

// Section Media
adminHomepageRouter.post(
  '/:homepageId/sections/:sectionId/media',
  requirePermission('homepage.update'),
  HomepageValidator.validateAttachMedia,
  HomepageAdminController.attachSectionMedia
);

adminHomepageRouter.delete(
  '/:homepageId/sections/:sectionId/media/:mediaId',
  requirePermission('homepage.update'),
  HomepageAdminController.detachSectionMedia
);

adminHomepageRouter.put(
  '/:homepageId/sections/:sectionId/media/order',
  requirePermission('homepage.update'),
  HomepageValidator.validateReorderMedia,
  HomepageAdminController.reorderSectionMedia
);

// 2. Public Storefront Homepage Router (/api/v1/homepage)
export const publicHomepageRouter = Router();

publicHomepageRouter.get('/', HomepagePublicController.getDefault);
publicHomepageRouter.get('/:slug', HomepagePublicController.getBySlug);
