import express from 'express';
import {
  getAnalyticsOverview,
  getRevenueAnalytics,
  getMovieAnalytics,
  getGenreAnalytics,
  getDemandAnalytics,
  getAIInsights,
  getDemandForecast,
  getCounts,
  getTrends,
  getBookingStatus,
  getCinemaAnalytics,
  getPopularShows,
} from '../controllers/analyticsController.js';
import {
  requireAuthMiddleware,
  requireAdminMiddleware,
} from '../middleware/auth.js';

const router = express.Router();

// All analytics endpoints require admin authentication
router.use(requireAuthMiddleware, requireAdminMiddleware);

// Existing endpoints
router.get('/overview',    getAnalyticsOverview);
router.get('/counts',      getCounts);
router.get('/revenue',     getRevenueAnalytics);
router.get('/movies',      getMovieAnalytics);
router.get('/genres',      getGenreAnalytics);
router.get('/demand',      getDemandAnalytics);
router.get('/insights',    getAIInsights);
router.get('/forecast',    getDemandForecast);

// Phase 8: New endpoints
router.get('/trends',          getTrends);
router.get('/booking-status',  getBookingStatus);
router.get('/cinema-analytics', getCinemaAnalytics);
router.get('/popular-shows',   getPopularShows);

export default router;
