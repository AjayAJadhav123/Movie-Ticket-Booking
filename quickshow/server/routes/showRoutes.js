import express from 'express';
import {
  getShowList,
  getShowById,
  createShow,
  updateShow,
  duplicateShow,
  removeShow,
  getAvailableDates,
  getShowsByMovieAndDate,
  getShowStats,
} from '../controllers/showController.js';
import { requireAdminMiddleware, requireAuthMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/list', getShowList);

router.get('/available-dates', getAvailableDates);

router.get('/by-movie-date', getShowsByMovieAndDate);

router.get('/:id', getShowById);

router.get('/:id/stats', getShowStats);

router.post('/add', requireAuthMiddleware, requireAdminMiddleware, createShow);

router.post('/:id/duplicate', requireAuthMiddleware, requireAdminMiddleware, duplicateShow);

router.put('/:id', requireAuthMiddleware, requireAdminMiddleware, updateShow);

router.delete('/:id', requireAuthMiddleware, requireAdminMiddleware, removeShow);

export default router;
