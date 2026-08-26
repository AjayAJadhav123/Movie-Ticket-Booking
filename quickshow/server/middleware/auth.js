import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const requireAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - Authentication required',
      });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET;
    
    if (!secret) {
      console.error('CRITICAL: JWT_SECRET not configured');
      return res.status(500).json({ success: false, message: 'Server configuration error' });
    }

    const decoded = jwt.verify(token, secret);
    
    // Check if user still exists
    const userId = decoded.id || decoded.userId || decoded._id;
    const user = await User.findById(userId).lean();
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists' });
    }

    // Verify token version (if user was forced to log out)
    if ((user.tokenVersion || 0) !== (decoded.tokenVersion || 0)) {
      return res.status(401).json({ success: false, message: 'Token expired or revoked' });
    }

    req.userId = user._id.toString(); // Standardize to MongoDB ObjectId string
    req.isAdminToken = user.isAdmin === true || user.admin === true || decoded.isAdmin === true || decoded.admin === true;
    
    // Attach user payload
    req.decodedToken = {
      name: user.name,
      email: user.email,
      image: user.image
    };

    next();
  } catch (error) {
    console.error('[AUTH] Middleware error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Unauthorized - Invalid or expired token',
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

    // req.isAdminToken is set in requireAuthMiddleware
    if (!req.isAdminToken) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden - Admin access required',
      });
    }

    req.user = { id: userId, isAdmin: true };
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
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const secret = process.env.JWT_SECRET;
      
      if (secret) {
        const decoded = jwt.verify(token, secret);
        const user = await User.findById(decoded.id).lean();
        
        if (user && (user.tokenVersion || 0) === (decoded.tokenVersion || 0)) {
          req.userId = user._id.toString();
        }
      }
    }
  } catch (error) {
    // Ignore error for optional auth
    req.userId = null;
  }
  
  if (req.userId === undefined) req.userId = null;
  next();
};

