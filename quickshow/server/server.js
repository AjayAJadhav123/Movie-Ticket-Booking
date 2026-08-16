import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { clerkMiddleware } from '@clerk/express';
import connectDB from './config/db.js';
import { initializeEmailService } from './services/emailService.js';
import userRoutes from './routes/userRoutes.js';
import movieRoutes from './routes/movieRoutes.js';
import showRoutes from './routes/showRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import { serve } from 'inngest/express';
import { inngest } from './config/inngest.js';
import './inngest/functions.js';

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();
initializeEmailService();

app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf.toString('utf8');
    },
  })
);

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Health check before Clerk middleware
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running',
    mongodb: process.env.MONGODB_URI ? 'configured' : 'not configured',
    clerk: process.env.CLERK_SECRET_KEY ? 'configured' : 'not configured',
  });
});

app.use(clerkMiddleware({
  onError: (err) => {
    console.warn('Clerk middleware warning:', err.message);
  },
}));

app.use('/api/user', userRoutes);
app.use('/api/movie', movieRoutes);
app.use('/api/show', showRoutes);
app.use('/api/booking', bookingRoutes);

// Inngest handler - using correct v3 syntax
app.use('/api/inngest', serve({ client: inngest }));

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

app.listen(PORT, () => {
  console.log(`✅ QuickShow server running on port ${PORT}`);
  console.log(`🚀 Environment: ${process.env.NODE_ENV || 'development'}`);

  // Configuration status warnings
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('⚠️  STRIPE_SECRET_KEY not configured. Payment sessions will fail. Add STRIPE_SECRET_KEY to server/.env.');
  }
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.warn('⚠️  STRIPE_WEBHOOK_SECRET not configured. Webhook processing will fail.');
  }
  if (!process.env.TMDB_API_KEY) {
    console.warn('⚠️  TMDB_API_KEY not configured. Movie data from TMDB will not be available.');
  }
});

export default app;
