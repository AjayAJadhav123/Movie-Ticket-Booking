import express from 'express';
import { exchangeClerkTokenForAdmin } from '../controllers/adminAuthController.js';

import rateLimit from 'express-rate-limit';

const router = express.Router();

const adminExchangeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: { success: false, message: 'Too many admin token exchange requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// The global clerkMiddleware handles the Clerk JWT verification
// so req.auth.userId is available if the token is valid.
router.post('/exchange', adminExchangeLimiter, exchangeClerkTokenForAdmin);

export default router;
