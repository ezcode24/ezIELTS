const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token, authorization denied'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Add user to request object
    req.user = user;
    next();

  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};

// Admin authorization middleware
const adminAuth = async (req, res, next) => {
  try {
    // First authenticate the user
    await auth(req, res, async () => {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required.'
        });
      }
      next();
    });
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in admin authentication'
    });
  }
};

// Moderator authorization middleware
const moderatorAuth = async (req, res, next) => {
  try {
    // First authenticate the user
    await auth(req, res, async () => {
      // Check if user is admin or moderator
      if (!['admin', 'moderator'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Moderator privileges required.'
        });
      }
      next();
    });
  } catch (error) {
    console.error('Moderator auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in moderator authentication'
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return next();
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    
    if (user && user.isActive) {
      req.user = user;
    }
    
    next();

  } catch (error) {
    // If token is invalid, just continue without user
    next();
  }
};

// Permission-based authorization middleware
const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      // First authenticate the user
      await auth(req, res, async () => {
        // Check if user has the required permission
        if (req.user.role === 'admin') {
          // Admins have all permissions
          return next();
        }
        
        if (req.user.permissions && req.user.permissions.includes(permission)) {
          return next();
        }
        
        return res.status(403).json({
          success: false,
          message: `Access denied. ${permission} permission required.`
        });
      });
    } catch (error) {
      console.error('Permission middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error in permission check'
      });
    }
  };
};

// Rate limiting middleware for authentication endpoints
const authRateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
};

// Specific rate limiting for login attempts
const loginRateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // limit each IP to 3 login attempts per windowMs
  message: {
    success: false,
    message: 'Too many login attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
};

// Specific rate limiting for registration
const registerRateLimit = {
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 registration attempts per hour
  message: {
    success: false,
    message: 'Too many registration attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
};

// Specific rate limiting for password reset
const passwordResetRateLimit = {
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 password reset attempts per hour
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
};

module.exports = {
  auth,
  adminAuth,
  moderatorAuth,
  optionalAuth,
  requirePermission,
  authRateLimit,
  loginRateLimit,
  registerRateLimit,
  passwordResetRateLimit
}; 