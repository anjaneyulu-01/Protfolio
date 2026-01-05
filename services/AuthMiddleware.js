/**
 * Authentication Middleware
 * Middleware for JWT verification and protected routes
 */

const AuthUtils = require('./AuthUtils');

/**
 * Middleware to verify JWT token and attach user to request
 */
const verifyTokenMiddleware = (jwtSecret) => {
  return (req, res, next) => {
    try {
      // Get token from Authorization header or cookies
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1] || req.cookies?.accessToken;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'No authentication token provided'
        });
      }

      // Verify token
      const decoded = require('jsonwebtoken').verify(token, jwtSecret);
      
      // Attach user info to request
      req.userId = decoded.userId;
      req.userEmail = decoded.email;
      req.isAdmin = decoded.isAdmin;
      req.isVerified = decoded.isVerified;

      next();
    } catch (error) {
      console.error('Token verification error:', error.message);
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Authentication token has expired'
        });
      }

      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid authentication token'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Token verification failed'
      });
    }
  };
};

/**
 * Middleware to verify user is admin
 */
const verifyAdminMiddleware = (req, res, next) => {
  if (!req.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }

  next();
};

/**
 * Middleware to verify user is verified (passed OTP verification)
 */
const verifyEmailMiddleware = (req, res, next) => {
  if (!req.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Email verification required. Please verify your email to continue.'
    });
  }

  next();
};

/**
 * Middleware to handle authentication errors
 */
const handleAuthError = (err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  next(err);
};

/**
 * Optional token middleware - doesn't fail if no token, just attaches user if valid
 */
const optionalTokenMiddleware = (jwtSecret) => {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1] || req.cookies?.accessToken;

      if (token) {
        const decoded = require('jsonwebtoken').verify(token, jwtSecret);
        req.userId = decoded.userId;
        req.userEmail = decoded.email;
        req.isAdmin = decoded.isAdmin;
        req.isVerified = decoded.isVerified;
        req.isAuthenticated = true;
      } else {
        req.isAuthenticated = false;
      }

      next();
    } catch (error) {
      req.isAuthenticated = false;
      next();
    }
  };
};

/**
 * Rate limiting middleware
 */
const rateLimitMiddleware = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const attempts = new Map();

  return (req, res, next) => {
    const key = `${req.ip}-${req.path}`;
    const now = Date.now();

    if (!attempts.has(key)) {
      attempts.set(key, []);
    }

    const userAttempts = attempts.get(key);
    const recentAttempts = userAttempts.filter(time => now - time < windowMs);

    if (recentAttempts.length >= maxAttempts) {
      return res.status(429).json({
        success: false,
        message: `Too many requests. Please try again later.`
      });
    }

    recentAttempts.push(now);
    attempts.set(key, recentAttempts);

    next();
  };
};

/**
 * OTP rate limiting - stricter limits
 */
const otpRateLimitMiddleware = (maxAttempts = 3, windowMs = 60 * 1000) => {
  const attempts = new Map();

  return (req, res, next) => {
    const key = req.body?.email || req.query?.email || req.ip;
    const now = Date.now();

    if (!attempts.has(key)) {
      attempts.set(key, []);
    }

    const userAttempts = attempts.get(key);
    const recentAttempts = userAttempts.filter(time => now - time < windowMs);

    if (recentAttempts.length >= maxAttempts) {
      const resetTime = new Date(recentAttempts[0] + windowMs).toLocaleTimeString();
      return res.status(429).json({
        success: false,
        message: `Too many OTP requests. Please try again after ${resetTime}`
      });
    }

    recentAttempts.push(now);
    attempts.set(key, recentAttempts);

    next();
  };
};

/**
 * Validation middleware factory
 */
const validateRequestData = (schema) => {
  return (req, res, next) => {
    try {
      const data = req.body || req.query || req.params;
      
      // Basic validation
      if (schema.email && data.email) {
        if (!AuthUtils.isValidEmail(data.email)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid email format'
          });
        }
      }

      if (schema.password && data.password) {
        const validation = AuthUtils.validatePasswordStrength(data.password);
        if (!validation.isValid) {
          return res.status(400).json({
            success: false,
            message: validation.message
          });
        }
      }

      if (schema.otp && data.otp) {
        if (!/^\d{6}$/.test(data.otp)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid OTP format. Must be 6 digits'
          });
        }
      }

      next();
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Request validation failed'
      });
    }
  };
};

/**
 * Check if email already exists (middleware)
 */
const checkEmailExists = (userModel) => {
  return async (req, res, next) => {
    try {
      const email = req.body?.email;
      if (!email) {
        return next();
      }

      const exists = await AuthUtils.isEmailExists(userModel, email);
      if (exists) {
        return res.status(400).json({
          success: false,
          message: 'Email already registered'
        });
      }

      next();
    } catch (error) {
      console.error('Email check error:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking email'
      });
    }
  };
};

module.exports = {
  verifyTokenMiddleware,
  verifyAdminMiddleware,
  verifyEmailMiddleware,
  handleAuthError,
  optionalTokenMiddleware,
  rateLimitMiddleware,
  otpRateLimitMiddleware,
  validateRequestData,
  checkEmailExists
};
