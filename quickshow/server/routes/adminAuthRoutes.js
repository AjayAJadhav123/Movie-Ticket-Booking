import express from 'express';
import { exchangeClerkTokenForAdmin } from '../controllers/adminAuthController.js';

const router = express.Router();

// The global clerkMiddleware handles the Clerk JWT verification
// so req.auth.userId is available if the token is valid.
router.post('/exchange', exchangeClerkTokenForAdmin);

export default router;
