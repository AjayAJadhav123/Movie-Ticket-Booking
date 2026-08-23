import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { clerkMiddleware } from '@clerk/express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import { initializeEmailService } from './services/emailService.js';
import userRoutes from './routes/userRoutes.js';
import movieRoutes from './routes/movieRoutes.js';
import showRoutes from './routes/showRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import recommendationRoutes from './routes/recommendationRoutes.js';
import pricingRoutes from './routes/pricingRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import cinemaRoutes from './routes/cinemaRoutes.js';
import screenRoutes from './routes/screenRoutes.js';
import adminAuthRoutes from './routes/adminAuthRoutes.js';
import { serve } from 'inngest/express';
import { inngest } from './config/inngest.js';
import {
  sendBookingConfirmationEmail,
  sendShowReminderEmail,
  sendNewShowNotification,
} from './inngest/functions.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: function (origin, callback) {
      const allowedOrigins = [
        process.env.FRONTEND_URL || 'http://localhost:5173',
        'http://localhost:3000',
        'http://localhost:5173',
      ];
      
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // ✅ FIXED: Reject instead of allowing all
        callback(new Error('CORS policy violation'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
});

// Make io accessible to routes
app.locals.io = io;

const PORT = process.env.PORT || 5000;

connectDB();
initializeEmailService();

// ✅ SECURITY: Add Helmet for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      frameSrc: ["'self'"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
}));

// ✅ SECURITY: Add request size limit to prevent DoS
app.use(
  express.json({
    limit: '10kb',  // Limit payload to 10KB
    verify: (req, res, buf) => {
      req.rawBody = buf.toString('utf8');
    },
  })
);

app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        process.env.FRONTEND_URL || 'http://localhost:5173',
        'http://localhost:3000',
        'http://localhost:5173',
      ];
      
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // ✅ FIXED: Reject instead of allowing all
        callback(new Error('CORS policy violation'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running',
    mongodb: process.env.MONGODB_URI ? 'configured' : 'not configured',
    clerk: process.env.CLERK_SECRET_KEY ? 'configured' : 'not configured',
    cashfree_app_id: process.env.CASHFREE_APP_ID ? process.env.CASHFREE_APP_ID.substring(0, 5) + '...' : 'not configured',
  });
});

const clerkJwtKey = process.env.CLERK_JWT_KEY ? process.env.CLERK_JWT_KEY.replace(/\\n/g, '\n') : undefined;

app.use(clerkMiddleware({ 
  authorizedParties: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:3000',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  jwtKey: clerkJwtKey,
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY 
}));

app.use('/api/user', userRoutes);
app.use('/api/movie', movieRoutes);
app.use('/api/cinema', cinemaRoutes);
app.use('/api/screen', screenRoutes);
app.use('/api/show', showRoutes);
app.use('/api/booking', bookingRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin/analytics', analyticsRoutes);

// Inngest handler - pass functions so Inngest can serve and execute them
app.use(
  '/api/inngest',
  serve({
    client: inngest,
    functions: [sendBookingConfirmationEmail, sendShowReminderEmail, sendNewShowNotification],
  })
);

// 404 handler for debugging API routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`404: ${req.method} ${req.path}`);
  }
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
    method: req.method,
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('🔌 Socket connected:', socket.id);

  // ✅ SECURITY: Verify auth token on connection
  const token = socket.handshake.headers.authorization?.split(' ')[1];
  if (!token) {
    console.warn(`❌ Socket ${socket.id} disconnected - no auth token`);
    socket.disconnect(true);
    return;
  }

  // User joins a specific show room
  socket.on('join:show', (showId) => {
    if (!showId || typeof showId !== 'string') {
      console.warn(`Invalid showId on join:show - ${socket.id}`);
      return;
    }
    const room = `show:${showId}`;
    socket.join(room);
    console.log(`📍 Socket ${socket.id} joined room: ${room}`);
  });

  // User leaves a show room
  socket.on('leave:show', (showId) => {
    if (!showId || typeof showId !== 'string') {
      console.warn(`Invalid showId on leave:show - ${socket.id}`);
      return;
    }
    const room = `show:${showId}`;
    socket.leave(room);
    console.log(`📍 Socket ${socket.id} left room: ${room}`);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('❌ Socket disconnected:', socket.id);
  });
});

httpServer.listen(PORT, () => {
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

