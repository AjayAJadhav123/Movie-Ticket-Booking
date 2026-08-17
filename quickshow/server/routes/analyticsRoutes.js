import express from 'express';
import {
  getAnalyticsOverview,
  getRevenueAnalytics,
  getMovieAnalytics,
  getGenreAnalytics,
  getDemandAnalytics,
  getAIInsights,
  getDemandForecast,
} from '../controllers/analyticsController.js';
import {
  requireAuthMiddleware,
  requireAdminMiddleware,
} from '../middleware/auth.js';

const router = express.Router();

// All analytics endpoints require admin authentication
router.use(requireAuthMiddleware, requireAdminMiddleware);

// Analytics endpoints
router.get('/overview', getAnalyticsOverview);
router.get('/revenue', getRevenueAnalytics);
router.get('/movies', getMovieAnalytics);
router.get('/genres', getGenreAnalytics);
router.get('/demand', getDemandAnalytics);
router.get('/insights', getAIInsights);
router.get('/forecast', getDemandForecast);

export default router;
