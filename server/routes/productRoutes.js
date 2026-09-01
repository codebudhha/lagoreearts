import express from 'express';
import {
  getProducts,
  getProductBySlugOrId,
  getCategories,
  getArtists,
  getFramingOptions,
  addReview
} from '../controllers/productController.js';
import { optionalAuthenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getProducts);
router.get('/categories', getCategories);
router.get('/artists', getArtists);
router.get('/framing-options', getFramingOptions);
router.get('/:identifier', getProductBySlugOrId);
router.post('/:productId/reviews', optionalAuthenticate, addReview);

export default router;
