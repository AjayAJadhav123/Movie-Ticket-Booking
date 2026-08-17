import express from 'express';
import {
  getMovieRecommendations,
  getUserRecommendations,
} from '../controllers/recommendationController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/recommendations/movie/:movieId
// Get movies similar to a specific movie (no auth required)
router.get('/movie/:movieId', getMovieRecommendations);

// GET /api/recommendations/user/:userId
// Get personalized recommendations for a user (optional auth)
router.get('/user/:userId', optionalAuth, getUserRecommendations);

export default router;
