import { clerkClient, verifyToken } from '@clerk/express';
import { jwtDecode } from 'jwt-decode';

export const requireAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - Authentication required',
      });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix
    
    // Decode the token to get userId
    let decoded;
    try {
      decoded = jwtDecode(token);
    } catch (error) {
      console.error('[AUTH] Token decode failed:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - Authentication required',
      });
    }

    const userId = decoded?.sub; // Clerk stores userId in 'sub' claim
    
    if (!userId) {
      console.error('[AUTH] No userId in token. Decoded:', Object.keys(decoded));
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
    // Get userId from middleware (set by requireAuthMiddleware or from req.auth)
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - Authentication required',
      });
    }

    const user = await clerkClient.users.getUser(userId);

    const isAdmin =
      user.publicMetadata?.isAdmin === true ||
      user.privateMetadata?.isAdmin === true;

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden - Admin access required',
      });
    }

    req.user = user;
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
