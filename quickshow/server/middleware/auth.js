import { clerkClient, requireAuth } from '@clerk/express';

export const requireAuthMiddleware = (req, res, next) => {
  try {
    requireAuth()(req, res, next);
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized - Authentication required',
    });
  }
};

export const requireAdminMiddleware = async (req, res, next) => {
  try {
    const userId = req.auth?.userId;

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

export const optionalAuth = (req, res, next) => {
  const userId = req.auth?.userId;
  req.userId = userId || null;
  next();
};
