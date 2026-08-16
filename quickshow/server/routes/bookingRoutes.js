import express from 'express';
import {
  createStripeSession,
  verifyPaymentSession,
  handleStripeWebhook,
  createCashfreeOrder,
  verifyCashfreePayment,
  handleCashfreeWebhook,
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

// Stripe endpoints
router.post(
  '/create-stripe-session',
  requireAuthMiddleware,
  createStripeSession
);

router.get('/verify-payment-session', requireAuthMiddleware, verifyPaymentSession);

router.post('/stripe-webhook', handleStripeWebhook);

// Cashfree endpoints - Dynamic UPI QR (replaces Razorpay)
router.post(
  '/create-cashfree-order',
  requireAuthMiddleware,
  createCashfreeOrder
);

router.post(
  '/verify-cashfree-payment',
  requireAuthMiddleware,
  verifyCashfreePayment
);

router.post('/cashfree-webhook', handleCashfreeWebhook);

// Booking management
router.get('/user-bookings', requireAuthMiddleware, getUserBookings);

router.get('/:bookingId', requireAuthMiddleware, getBookingById);

router.get('/admin-bookings', requireAuthMiddleware, requireAdminMiddleware, getAdminBookings);

router.get('/admin-stats', requireAuthMiddleware, requireAdminMiddleware, getAdminStats);

export default router;
