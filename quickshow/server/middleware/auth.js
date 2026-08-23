import { clerkClient, verifyToken } from '@clerk/express';
import { jwtDecode } from 'jwt-decode';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const requireAuthMiddleware = async (req, res, next) => {
  try {
    // Get authHeader at the beginning so it's available throughout
    const authHeader = req.headers.authorization;
    
    // ✅ SECURITY: Only log debug info in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('\n--- [AUTH DIAGNOSTICS] ---');
      console.log('Origin:', req.headers.origin || 'No origin');
      console.log('Authorization header:', authHeader ? 'Present' : 'Missing');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const tokenStr = authHeader.split(' ')[1];
          const payloadStr = Buffer.from(tokenStr.split('.')[1], 'base64').toString();
          const payload = JSON.parse(payloadStr);
          console.log('[JWT PAYLOAD DEBUG] iss:', payload.iss);
          console.log('[JWT PAYLOAD DEBUG] azp:', payload.azp);
          console.log('[JWT PAYLOAD DEBUG] aud:', payload.aud);
          console.log('[JWT PAYLOAD DEBUG] exp:', payload.exp);
          console.log('[JWT PAYLOAD DEBUG] alg:', JSON.parse(Buffer.from(tokenStr.split('.')[0], 'base64').toString()).alg);
        } catch (e) {
          console.log('[JWT PAYLOAD DEBUG] Error decoding token:', e.message);
        }
      }
      
      console.log('req.auth exists:', !!req.auth);
      if (req.auth) {
        console.log('req.auth keys:', Object.keys(req.auth));
        console.log('req.auth.userId:', req.auth.userId);
      }
      const resHeaders = res.getHeaders();
      console.log('[CLERK DEBUG] Response Headers:', Object.keys(resHeaders).filter(k => k.startsWith('x-clerk')).reduce((acc, k) => { acc[k] = resHeaders[k]; return acc; }, {}));
      
      const authStatus = resHeaders['x-clerk-auth-status'] || (req.auth?.userId ? 'signed-in' : 'signed-out');
      const authReason = resHeaders['x-clerk-auth-reason'] || 'none';
      const authMessage = resHeaders['x-clerk-auth-message'] || 'none';
      console.log('[CLERK DEBUG] authStatus:', authStatus);
      console.log('[CLERK DEBUG] authReason:', authReason);
      console.log('[CLERK DEBUG] authMessage:', authMessage);
      console.log('--------------------------\n');
    }

    // 1. Try to verify as Custom Admin JWT first
    const secret = process.env.JWT_SECRET;
    if (!secret && process.env.NODE_ENV === 'production') {
      console.error('CRITICAL: JWT_SECRET not configured in production!');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error',
      });
    }
    
    if (secret && authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, secret);
        if (decoded && decoded.isAdmin) {
          req.userId = decoded.clerkId;
          req.isAdminToken = true;
          return next();
        }
      } catch (err) {
        // Not a valid custom admin token, fall through to Clerk check
      }
    }

    // 2. Existing Clerk check
    const userId = req.auth?.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - Authentication required',
      });
    }
    
    req.userId = userId;
    next();
  } catch (error) {
    console.error('[AUTH] Middleware error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Unauthorized - Authentication required',
    });
  }
};

export const requireAdminMiddleware = async (req, res, next) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - Authentication required',
      });
    }

    // Strict validation against MongoDB authoritative source if it's a Clerk token
    // If it's our custom Admin token, it was already verified in requireAuthMiddleware
    if (req.isAdminToken) {
      req.user = { clerkId: userId, isAdmin: true };
      return next();
    }

    const user = await User.findOne({ clerkId: userId }).lean();
    
    if (!user || user.isAdmin !== true) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden - Admin access required',
      });
    }

    // Set a lightweight req.user for compatibility
    req.user = { clerkId: userId, isAdmin: true };
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking admin status',
    });
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    let auth = null;
    
    if (typeof req.auth === 'function') {
      auth = await req.auth();
    } else if (typeof req.auth === 'object' && req.auth) {
      auth = req.auth;
    }
    
    req.userId = auth?.userId || null;
    next();
  } catch (error) {
    req.userId = null;
    next();
  }
};
