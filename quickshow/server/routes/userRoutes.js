import express from 'express';
import {
  getUser,
  addFavorite,
  removeFavorite,
  getFavorites,
  checkAdmin,
} from '../controllers/userController.js';
import { requireAuthMiddleware } from '../middleware/auth.js';

import rateLimit from 'express-rate-limit';

const router = express.Router();

router.get('/me', requireAuthMiddleware, getUser);

router.get('/check-admin', requireAuthMiddleware, checkAdmin);

router.post('/add-favorite', requireAuthMiddleware, addFavorite);

router.post('/remove-favorite', requireAuthMiddleware, removeFavorite);

router.get('/favorites', requireAuthMiddleware, getFavorites);

export default router;
