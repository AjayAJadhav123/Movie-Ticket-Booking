import express from 'express';
import {
  getShowList,
  getShowById,
  createShow,
  removeShow,
  getAvailableDates,
  getShowsByMovieAndDate,
} from '../controllers/showController.js';
import { requireAdminMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/list', getShowList);

router.get('/available-dates', getAvailableDates);

router.get('/by-movie-date', getShowsByMovieAndDate);

router.get('/:id', getShowById);

router.post('/add', requireAdminMiddleware, createShow);

router.delete('/:id', requireAdminMiddleware, removeShow);

export default router;
