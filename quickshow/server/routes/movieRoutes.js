import express from 'express';
import {
  getMovieList,
  getMovieById,
  addMovieFromTMDB,
  getNowPlayingMovies,
  getLatestMovies,
  getTrendingMovies,
  getUpcomingMovies,
  getPopularMovies,
  deleteMovie,
  searchMovies,
  searchTMDBMovies,
  getRecommendations,
} from '../controllers/movieController.js';
import { optionalAuth, requireAdminMiddleware, requireAuthMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/list', getMovieList);

router.get('/latest', getLatestMovies);

router.get('/now-playing', getNowPlayingMovies);

router.get('/trending', getTrendingMovies);

router.get('/upcoming', getUpcomingMovies);

router.get('/popular', getPopularMovies);

router.get('/search', searchMovies);

router.get('/search-tmdb', searchTMDBMovies);

// Guests receive popular titles, while signed-in users receive personalized results.
router.get('/recommendations', optionalAuth, getRecommendations);

router.get('/:id', getMovieById);

router.post('/add', requireAuthMiddleware, requireAdminMiddleware, addMovieFromTMDB);

router.delete('/:id', requireAuthMiddleware, requireAdminMiddleware, deleteMovie);

export default router;
