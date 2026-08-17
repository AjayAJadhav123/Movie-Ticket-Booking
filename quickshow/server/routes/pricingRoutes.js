import express from 'express';
import {
  getShowDynamicPrice,
  validatePrice,
  getPricingConfigEndpoint,
  updatePricingConfigEndpoint,
} from '../controllers/pricingController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/pricing/show/:showId - Get dynamic price for a show (public)
router.get('/show/:showId', getShowDynamicPrice);

// POST /api/pricing/validate - Validate booking price (public)
router.post('/validate', validatePrice);

// GET /api/pricing/config - Get pricing config (admin)
router.get('/config', optionalAuth, getPricingConfigEndpoint);

// PUT /api/pricing/config - Update pricing config (admin)
router.put('/config', optionalAuth, updatePricingConfigEndpoint);

export default router;
