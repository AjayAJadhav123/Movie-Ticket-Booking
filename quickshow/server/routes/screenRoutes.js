import express from 'express';
import {
  getScreensByCinema,
  getScreenById,
  createScreen,
  updateScreen,
  deleteScreen,
  getScreenLayout,
  updateSeatLayout,
} from '../controllers/screenController.js';
import { requireAuthMiddleware, requireAdminMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/cinema/:cinemaId', getScreensByCinema);
router.get('/:id', getScreenById);
router.get('/:id/layout', getScreenLayout);

// Admin routes (protected)
router.post('/', requireAuthMiddleware, requireAdminMiddleware, createScreen);
router.put('/:id', requireAuthMiddleware, requireAdminMiddleware, updateScreen);
router.put('/:id/layout', requireAuthMiddleware, requireAdminMiddleware, updateSeatLayout);
router.delete('/:id', requireAuthMiddleware, requireAdminMiddleware, deleteScreen);

export default router;
