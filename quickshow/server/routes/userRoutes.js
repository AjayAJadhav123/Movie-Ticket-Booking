import express from 'express';
import {
  handleClerkWebhook,
  getUser,
  addFavorite,
  removeFavorite,
  getFavorites,
} from '../controllers/userController.js';
import { requireAuthMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/webhooks', handleClerkWebhook);

router.get('/me', requireAuthMiddleware, getUser);

router.post('/add-favorite', requireAuthMiddleware, addFavorite);

router.post('/remove-favorite', requireAuthMiddleware, removeFavorite);

router.get('/favorites', requireAuthMiddleware, getFavorites);

export default router;
