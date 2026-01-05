/**
 * Authentication Routes
 * Routes for user registration, login, and OTP verification
 */

const express = require('express');
const AuthUtils = require('../services/AuthUtils');
const {
  otpRateLimitMiddleware,
  validateRequestData,
  checkEmailExists,
  verifyTokenMiddleware,
  verifyEmailMiddleware
} = require('../services/AuthMiddleware');

/**
 * Create authentication routes
 * @param {Object} models - Database models
 * @param {Object} emailService - Email service
 * @param {string} jwtSecret - JWT secret key
 */
function createAuthRoutes(models, emailService, jwtSecret) {
  const router = express.Router();
  const { UserModel } = models;

  /**
   * POST /api/auth/register
   * Register a new user with email and password
   */
  router.post(
    '/register',
    otpRateLimitMiddleware(5, 60000),
    validateRequestData({ email: true, password: true }),
    checkEmailExists(UserModel),
    async (req, res) => {
      try {
        const { email, password, fullName } = req.body;

        // Validate input
        if (!email || !password) {
          return res.status(400).json({
            success: false,
            message: 'Email and password are required'
          });
        }

        if (!AuthUtils.isValidEmail(email)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid email format'
          });
        }

        const passwordValidation = AuthUtils.validatePasswordStrength(password);
        if (!passwordValidation.isValid) {
          return res.status(400).json({
            success: false,
            message: passwordValidation.message
          });
        }

        // Check if user already exists
        const existingUser = await UserModel.findByEmail(email);
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: 'Email already registered'
          });
        }

        // Hash password before creating user
        const hashedPassword = await UserModel.hashPassword(password);

        // Create new user
        const newUser = await UserModel.createUser({
          email,
          password: hashedPassword,
          fullName: fullName || email.split('@')[0]
        });

        // Generate and save OTP
        const otp = AuthUtils.generateOTP();
        await UserModel.saveOTP(email, otp);

        // Send OTP email
        await emailService.sendOTP(email, otp);

        res.status(201).json({
          success: true,
          message: 'Registration successful. Check your email for OTP verification code.',
          data: {
            email: newUser.email,
            fullName: newUser.fullName
          }
        });
      } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
          success: false,
          message: error.message || 'Registration failed'
        });
      }
    }
  );

  /**
   * POST /api/auth/verify-otp
   * Verify OTP and activate user account
   */
  router.post('/verify-otp', validateRequestData({ email: true, otp: true }), async (req, res) => {
    try {
      const { email, otp } = req.body;

      // Validate input
      if (!email || !otp) {
        return res.status(400).json({
          success: false,
          message: 'Email and OTP are required'
        });
      }

      if (!AuthUtils.isValidEmail(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      }

      // Find user
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Verify OTP
      const isValid = await UserModel.verifyOTP(email, otp);
      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired OTP'
        });
      }

      // Mark user as verified
      await UserModel.verifyEmail(email);

      // Send welcome email
      await emailService.sendWelcomeEmail(email, user.fullName || 'User');

      res.json({
        success: true,
        message: 'Email verified successfully. You can now login.',
        data: {
          email: user.email,
          fullName: user.fullName
        }
      });
    } catch (error) {
      console.error('OTP verification error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'OTP verification failed'
      });
    }
  });

  /**
   * POST /api/auth/resend-otp
   * Resend OTP to email
   */
  router.post('/resend-otp', otpRateLimitMiddleware(3, 120000), async (req, res) => {
    try {
      const { email } = req.body;

      // Validate input
      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required'
        });
      }

      if (!AuthUtils.isValidEmail(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      }

      // Find user
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if already verified
      if (user.isVerified) {
        return res.status(400).json({
          success: false,
          message: 'Email already verified. Please login.'
        });
      }

      // Generate new OTP
      const otp = AuthUtils.generateOTP();
      await UserModel.saveOTP(email, otp);

      // Send OTP email
      await emailService.sendOTP(email, otp);

      res.json({
        success: true,
        message: 'OTP sent to email. Check your inbox.'
      });
    } catch (error) {
      console.error('Resend OTP error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to resend OTP'
      });
    }
  });

  /**
   * POST /api/auth/login
   * Login user with email and password
   */
  router.post('/login', validateRequestData({ email: true, password: true }), async (req, res) => {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }

      // Find user
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Check if email is verified
      if (!user.isVerified) {
        return res.status(403).json({
          success: false,
          message: 'Email not verified. Please verify your email first.',
          requiresOTPVerification: true
        });
      }

      // Verify password
      const isPasswordValid = await UserModel.verifyPassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Update last login
      await UserModel.updateLastLogin(user._id);

      // Create JWT token
      const tokenPayload = AuthUtils.createTokenPayload(user);
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(tokenPayload, jwtSecret, { expiresIn: '24h' });

      // Set secure cookie
      res.cookie('accessToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: user._id,
            email: user.email,
            fullName: user.fullName,
            isAdmin: user.isAdmin,
            isVerified: user.isVerified
          }
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Login failed'
      });
    }
  });

  /**
   * POST /api/auth/logout
   * Logout user
   */
  router.post('/logout', (req, res) => {
    try {
      res.clearCookie('accessToken');
      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    }
  });

  /**
   * GET /api/auth/me
   * Get current user profile (protected route)
   */
  router.get('/me', verifyTokenMiddleware(jwtSecret), async (req, res) => {
    try {
      const user = await UserModel.findById(req.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          isAdmin: user.isAdmin,
          isVerified: user.isVerified,
          profile: user.profile,
          lastLogin: user.lastLogin
        }
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch profile'
      });
    }
  });

  /**
   * POST /api/auth/change-password
   * Change user password (protected route)
   */
  router.post(
    '/change-password',
    verifyTokenMiddleware(jwtSecret),
    validateRequestData({ password: true }),
    async (req, res) => {
      try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
          return res.status(400).json({
            success: false,
            message: 'Current and new passwords are required'
          });
        }

        if (currentPassword === newPassword) {
          return res.status(400).json({
            success: false,
            message: 'New password must be different from current password'
          });
        }

        const passwordValidation = AuthUtils.validatePasswordStrength(newPassword);
        if (!passwordValidation.isValid) {
          return res.status(400).json({
            success: false,
            message: passwordValidation.message
          });
        }

        // Verify current password
        const user = await UserModel.findById(req.userId);
        const isCurrentPasswordValid = await UserModel.verifyPassword(
          currentPassword,
          user.password
        );

        if (!isCurrentPasswordValid) {
          return res.status(401).json({
            success: false,
            message: 'Current password is incorrect'
          });
        }

        // Hash new password before updating
        const hashedPassword = await UserModel.hashPassword(newPassword);

        // Update password
        await UserModel.changePassword(req.userEmail, hashedPassword);

        res.json({
          success: true,
          message: 'Password changed successfully'
        });
      } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to change password'
        });
      }
    }
  );

  /**
   * POST /api/auth/request-password-reset
   * Request password reset (not protected - no auth needed)
   */
  router.post('/request-password-reset', otpRateLimitMiddleware(3, 3600000), async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required'
        });
      }

      if (!AuthUtils.isValidEmail(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      }

      // Find user
      const user = await UserModel.findByEmail(email);
      if (!user) {
        // For security, don't reveal if email exists
        return res.json({
          success: true,
          message: 'If email exists, password reset link has been sent'
        });
      }

      // Generate reset token
      const resetToken = AuthUtils.generateResetToken();
      const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

      // Save reset token (use OTP collection for now)
      await UserModel.saveOTP(email, resetToken, 3600); // 1 hour expiry

      // Send password reset email
      await emailService.sendPasswordResetEmail(email, resetLink);

      res.json({
        success: true,
        message: 'If email exists, password reset link has been sent'
      });
    } catch (error) {
      console.error('Password reset request error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process password reset request'
      });
    }
  });

  return router;
}

module.exports = createAuthRoutes;
