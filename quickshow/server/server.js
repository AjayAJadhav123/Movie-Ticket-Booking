import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
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
import { serve } from 'inngest/express';
import { inngest } from './config/inngest.js';
import './inngest/functions.js';

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
        callback(null, true); // Allow all origins in production for now
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

app.use(
  express.json({
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
        callback(null, true); // Allow all origins in production for now
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
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

app.use(clerkMiddleware());

app.use('/api/user', userRoutes);
app.use('/api/movie', movieRoutes);
app.use('/api/show', showRoutes);
app.use('/api/booking', bookingRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/pricing', pricingRoutes);

// Inngest handler - using correct v3 syntax
app.use('/api/inngest', serve({ client: inngest }));

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

  // User joins a specific show room
  socket.on('join:show', (showId) => {
    const room = `show:${showId}`;
    socket.join(room);
    console.log(`📍 Socket ${socket.id} joined room: ${room}`);
  });

  // User leaves a show room
  socket.on('leave:show', (showId) => {
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
