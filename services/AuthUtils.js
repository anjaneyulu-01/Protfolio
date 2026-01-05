/**
 * Authentication Utilities
 * Helper functions for authentication and authorization
 */

const crypto = require('crypto');

class AuthUtils {
  /**
   * Generate random OTP (6 digits)
   */
  static generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Generate random password reset token
   */
  static generateResetToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Validate email format
   */
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   * Requirements: min 8 chars, at least 1 uppercase, 1 lowercase, 1 number, 1 special char
   */
  static validatePasswordStrength(password) {
    const minLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    return {
      isValid: minLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar,
      minLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecialChar,
      message: this.getPasswordStrengthMessage(
        minLength,
        hasUppercase,
        hasLowercase,
        hasNumber,
        hasSpecialChar
      )
    };
  }

  /**
   * Get password strength message
   */
  static getPasswordStrengthMessage(minLength, upper, lower, number, special) {
    const issues = [];
    if (!minLength) issues.push('at least 8 characters');
    if (!upper) issues.push('an uppercase letter');
    if (!lower) issues.push('a lowercase letter');
    if (!number) issues.push('a number');
    if (!special) issues.push('a special character (!@#$%^&*)');

    if (issues.length === 0) {
      return 'Strong password';
    }

    return `Password must contain: ${issues.join(', ')}`;
  }

  /**
   * Check if email is already in use (utility)
   */
  static async isEmailExists(userModel, email) {
    const user = await userModel.findByEmail(email);
    return user !== null;
  }

  /**
   * Check if user is verified
   */
  static isUserVerified(user) {
    return user && user.isVerified === true;
  }

  /**
   * Check if user is admin
   */
  static isAdmin(user) {
    return user && user.isAdmin === true;
  }

  /**
   * Sanitize user object for response
   */
  static sanitizeUser(user) {
    if (!user) return null;
    const { password, ...safeUser } = user;
    return safeUser;
  }

  /**
   * Create JWT payload
   */
  static createTokenPayload(user) {
    return {
      userId: user._id.toString(),
      email: user.email,
      isAdmin: user.isAdmin,
      isVerified: user.isVerified
    };
  }

  /**
   * Validate token payload
   */
  static validateTokenPayload(payload) {
    return payload && payload.userId && payload.email;
  }

  /**
   * Generate secure random string
   */
  static generateRandomString(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Hash string using SHA256
   */
  static hashString(str) {
    return crypto.createHash('sha256').update(str).digest('hex');
  }

  /**
   * Generate verification code
   */
  static generateVerificationCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Check if string is a valid MongoDB ObjectId
   */
  static isValidObjectId(id) {
    return /^[0-9a-fA-F]{24}$/.test(id);
  }

  /**
   * Calculate password strength percentage
   */
  static getPasswordStrengthPercentage(password) {
    let strength = 0;

    if (password.length >= 8) strength += 20;
    if (password.length >= 12) strength += 10;
    if (password.length >= 16) strength += 10;
    if (/[a-z]/.test(password)) strength += 15;
    if (/[A-Z]/.test(password)) strength += 15;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength += 10;

    return Math.min(strength, 100);
  }

  /**
   * Get password strength level
   */
  static getPasswordStrengthLevel(password) {
    const strength = this.getPasswordStrengthPercentage(password);
    
    if (strength < 30) return { level: 'Weak', color: 'red' };
    if (strength < 60) return { level: 'Fair', color: 'orange' };
    if (strength < 80) return { level: 'Good', color: 'yellow' };
    return { level: 'Strong', color: 'green' };
  }
}

module.exports = AuthUtils;
