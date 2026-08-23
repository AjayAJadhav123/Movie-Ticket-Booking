import express from 'express';
import rateLimit from 'express-rate-limit';
import { chatWithAI } from '../controllers/aiController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Rate limiting: 30 messages per 15 minutes per user/IP
const aiChatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests
  message: 'Too many chat requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use userId as the rate limit key (if authenticated) or IP
    return req.userId || req.ip;
  },
});

// POST /api/ai/chat - Chat with QuickShow AI (accessible to all users)
router.post('/chat', optionalAuth, aiChatLimiter, chatWithAI);

export default router;
