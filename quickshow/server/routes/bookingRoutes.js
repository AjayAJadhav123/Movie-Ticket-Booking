import express from 'express';
import {
  createStripeSession,
  handleStripeWebhook,
  getUserBookings,
  getBookingById,
  getAdminBookings,
  getAdminStats,
} from '../controllers/bookingController.js';
import {
  requireAuthMiddleware,
  requireAdminMiddleware,
} from '../middleware/auth.js';

const router = express.Router();

router.post(
  '/create-stripe-session',
  requireAuthMiddleware,
  createStripeSession
);

router.post('/stripe-webhook', handleStripeWebhook);

router.get('/user-bookings', requireAuthMiddleware, getUserBookings);

router.get('/:bookingId', requireAuthMiddleware, getBookingById);

router.get('/admin-bookings', requireAdminMiddleware, getAdminBookings);

router.get('/admin-stats', requireAdminMiddleware, getAdminStats);

export default router;
