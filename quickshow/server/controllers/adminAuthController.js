import User from '../models/User.js';
import jwt from 'jsonwebtoken';

export const exchangeClerkTokenForAdmin = async (req, res) => {
  try {
    // The auth token is verified by clerkMiddleware
    const clerkUserId = req.auth?.userId;

    if (!clerkUserId) {
      return res.status(401).json({ success: false, message: 'Invalid Clerk session' });
    }

    // Verify against database
    const user = await User.findOne({ clerkId: clerkUserId }).lean();

    if (!user || user.isAdmin !== true) {
      return res.status(403).json({ success: false, message: 'Forbidden - Not an Admin' });
    }

    // Generate custom Admin JWT - JWT_SECRET must be configured in production
    const secret = process.env.JWT_SECRET;
    
    if (!secret) {
      console.error('CRITICAL: JWT_SECRET not configured - admin token generation failed');
      return res.status(500).json({ 
        success: false, 
        message: 'Server configuration error - JWT_SECRET required' 
      });
    }
    
    const adminToken = jwt.sign(
      { 
        clerkId: clerkUserId, 
        isAdmin: true,
        email: user.email,
        name: user.name
      }, 
      secret,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      success: true,
      adminToken,
      message: 'Admin token generated successfully'
    });

  } catch (error) {
    console.error('Error exchanging admin token:', error);
    return res.status(500).json({ success: false, message: 'Server error during token exchange' });
  }
};
