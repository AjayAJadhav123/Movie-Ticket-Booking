import express from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, forgotPassword, resetPassword, googleLogin, verifyOtp, resendOtp } from '../controllers/authController.js';

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // limit each IP to 15 requests per windowMs for auth routes
  message: { success: false, message: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', authLimiter, register);
router.post('/verify-otp', authLimiter, verifyOtp);
router.post('/resend-otp', authLimiter, resendOtp);
router.post('/login', authLimiter, login);
router.post('/google', authLimiter, googleLogin);
router.post('/forgot-password', authLimiter, forgotPassword);
router.put('/reset-password/:resettoken', authLimiter, resetPassword);

export default router;
