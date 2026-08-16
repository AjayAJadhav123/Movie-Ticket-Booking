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
} from '../controllers/movieController.js';
import { requireAdminMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/list', getMovieList);

router.get('/latest', getLatestMovies);

router.get('/now-playing', getNowPlayingMovies);

router.get('/trending', getTrendingMovies);

router.get('/upcoming', getUpcomingMovies);

router.get('/popular', getPopularMovies);

router.get('/:id', getMovieById);

router.post('/add', requireAdminMiddleware, addMovieFromTMDB);

router.delete('/:id', requireAdminMiddleware, deleteMovie);

export default router;
