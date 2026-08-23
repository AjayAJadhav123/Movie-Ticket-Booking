import express from 'express';
import {
  getAllCinemas,
  getCinemaById,
  getCities,
  createCinema,
  updateCinema,
  deleteCinema,
  getCinemaStats,
} from '../controllers/cinemaController.js';
import { requireAuthMiddleware, requireAdminMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/cities', getCities);
router.get('/', getAllCinemas);
router.get('/:id', getCinemaById);
router.get('/:id/stats', getCinemaStats);

// Admin routes (protected)
router.post('/', requireAuthMiddleware, requireAdminMiddleware, createCinema);
router.put('/:id', requireAuthMiddleware, requireAdminMiddleware, updateCinema);
router.delete('/:id', requireAuthMiddleware, requireAdminMiddleware, deleteCinema);

export default router;
