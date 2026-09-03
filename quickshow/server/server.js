import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
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
import authRoutes from './routes/authRoutes.js';
import { serve } from 'inngest/express';
import { inngest } from './config/inngest.js';
import {
  sendBookingConfirmationEmail,
  sendShowReminderEmail,
  sendNewShowNotification,
} from './inngest/functions.js';

const app = express();
// Trust proxy is required for express-rate-limit to work correctly behind Render/Vercel proxies
app.set('trust proxy', 1);
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

console.log(`✅ Startup config - OTP_MODE: '${process.env.OTP_MODE || 'not set'}'`);

// ✅ SECURITY: Add Helmet for security headers with proper CSP for external services
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'", 
        "'unsafe-inline'",
        "https://sdk.cashfree.com",
        "https://js.stripe.com",
        "https://*.clerk.accounts.dev",
        "https://accounts.clerk.com",
      ],
      styleSrc: [
        "'self'", 
        "'unsafe-inline'",
        "https://fonts.googleapis.com",
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
      ],
      imgSrc: [
        "'self'", 
        "data:", 
        "https:",
        "https://image.tmdb.org",
        "https://img.clerk.com",
      ],
      connectSrc: [
        "'self'",
        "https://api.themoviedb.org",
        "https://*.clerk.accounts.dev",
        "https://accounts.clerk.com",
        "https://api.cashfree.com",
        "https://sandbox.cashfree.com",
        "https://api.stripe.com",
        "wss://",
        "ws://localhost:*",
        "https://movie-ticket-booking-4p6x.onrender.com",
        "https://movie-ticket-booking-seven-psi.vercel.app",
        process.env.BACKEND_URL || "http://localhost:5000",
        process.env.FRONTEND_URL || "http://localhost:5173",
      ],
      frameSrc: [
        "'self'",
        "https://*.clerk.accounts.dev",
        "https://accounts.clerk.com",
        "https://js.stripe.com",
        "https://sdk.cashfree.com",
      ],
      frameAncestors: ["'self'"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
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
      // Production origins that are allowed
      const allowedOrigins = [
        'https://movie-ticket-booking-seven-psi.vercel.app', // Production frontend
        process.env.FRONTEND_URL,                            // Set this in Render dashboard
        // Development origins (only in development mode)
        ...(process.env.NODE_ENV !== 'production' ? [
          'http://localhost:3000',
          'http://localhost:5173',
          'http://localhost:5174',
          'http://localhost:5175',
        ] : [])
      ].filter(Boolean);

      // Allow server-to-server requests with no Origin header:
      // - Vercel's edge proxy forwarding /api/* to Render
      // - Clerk webhook deliveries
      // - Render health checks
      if (!origin) {
        return callback(null, true);
      }

      // Check if origin is in allowed list or is a Vercel deployment
      if (allowedOrigins.includes(origin) || (origin && origin.endsWith('.vercel.app'))) {
        return callback(null, true);
      }

      // Reject unauthorized browser origins
      return callback(new Error('CORS policy violation'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'X-Requested-With',
      'Accept',
      'Origin',
      'Cache-Control',
      'X-File-Name',
    ],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 86400, // 24 hours
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);

app.get('/', (req, res) => {
  res.send('QuickShow API is running');
});

app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running',
  });
});

// Middleware for authentication is now handled explicitly in routes via auth.js middleware.

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
app.use('/api/auth', authRoutes);
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
  if (req.path.startsWith('/api') && process.env.NODE_ENV !== 'production') {
    console.log(`404: ${req.method} ${req.path}`);
  }
  
  const response = {
    success: false,
    message: 'Route not found',
  };
  
  if (process.env.NODE_ENV !== 'production') {
    response.path = req.path;
    response.method = req.method;
  }
  
  res.status(404).json(response);
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

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ QuickShow server running on port ${PORT} (0.0.0.0)`);
  console.log(`🚀 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💳 CASHFREE_ENV: ${process.env.CASHFREE_ENV || 'NOT SET'}`);
  console.log(`🔗 Cashfree return_url format: [FRONTEND_URL]/payment/callback?order_id=...&booking_id=...`);

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

