import express from 'express';
import {
  getMovieList,
  getMovieById,
  addMovieFromTMDB,
  getNowPlayingMovies,
  deleteMovie,
} from '../controllers/movieController.js';
import { requireAdminMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/list', getMovieList);

router.get('/now-playing', getNowPlayingMovies);

router.get('/:id', getMovieById);

router.post('/add', requireAdminMiddleware, addMovieFromTMDB);

router.delete('/:id', requireAdminMiddleware, deleteMovie);

export default router;
