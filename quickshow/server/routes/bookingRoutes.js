import express from 'express';
import rateLimit from 'express-rate-limit';
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
  cancelBooking,
} from '../controllers/bookingController.js';
import {
  requireAuthMiddleware,
  requireAdminMiddleware,
} from '../middleware/auth.js';

const router = express.Router();

// ✅ SECURITY: Rate limiting for payment endpoints
// 10 payment creation attempts per hour per user (prevent brute force)
const paymentCreateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  keyGenerator: (req) => req.userId || req.ip,
  message: 'Too many payment orders created. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// 30 payment verification attempts per hour per user
const paymentVerifyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  keyGenerator: (req) => req.userId || req.ip,
  message: 'Too many verification attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Stripe endpoints
router.post(
  '/create-stripe-session',
  requireAuthMiddleware,
  paymentCreateLimiter,
  createStripeSession
);

router.get('/verify-payment-session', requireAuthMiddleware, paymentVerifyLimiter, verifyPaymentSession);

router.post('/stripe-webhook', handleStripeWebhook);

// Cashfree endpoints - Dynamic UPI QR (replaces Razorpay)
router.post(
  '/create-cashfree-order',
  requireAuthMiddleware,  // ✅ FIXED: Re-enabled authentication
  paymentCreateLimiter,   // ✅ FIXED: Added rate limiting
  createCashfreeOrder
);

router.post(
  '/verify-cashfree-payment',
  paymentVerifyLimiter,   // ✅ FIXED: Added rate limiting
  verifyCashfreePayment
);

router.post('/cashfree-webhook', handleCashfreeWebhook);

// Booking management
router.get('/user-bookings', requireAuthMiddleware, getUserBookings);

router.get('/admin-bookings', requireAuthMiddleware, requireAdminMiddleware, getAdminBookings);

router.get('/admin-stats', requireAuthMiddleware, requireAdminMiddleware, getAdminStats);

router.get('/:bookingId', requireAuthMiddleware, getBookingById);

router.post('/:bookingId/cancel', requireAuthMiddleware, cancelBooking);

export default router;
