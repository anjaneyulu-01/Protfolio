/**
 * Email Service
 * Handles all email operations including OTP verification
 * Uses Brevo API for direct email delivery
 */

const axios = require('axios');

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

class EmailService {
  constructor() {
    // Validate required environment variables
    if (!process.env.BREVO_API_KEY) {
      throw new Error('BREVO_API_KEY is missing');
    }
    if (!process.env.EMAIL_FROM) {
      throw new Error('EMAIL_FROM is missing');
    }
  }

  /**
   * Send email via Brevo API
   */
  async sendEmail({ to, subject, htmlContent }) {
    try {
      const response = await axios.post(
        BREVO_API_URL,
        {
          sender: {
            email: process.env.EMAIL_FROM.trim(),
            name: 'NewRoots',
          },
          to: [{ email: to }],
          subject,
          htmlContent,
        },
        {
          headers: {
            'api-key': process.env.BREVO_API_KEY,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );
      return response.data;
    } catch (err) {
      // ...existing code...
      throw err;
    }
  }

  /**
   * Verify email configuration
   */
  async verifyConnection() {
    try {
      // Test by sending a verification check
      // ...existing code...
      return true;
    } catch (err) {
      console.error('❌ Email service error:', err);
      return false;
    }
  }

  /**
   * Send OTP to email
   */
  async sendOTP(recipientEmail, otp, name = 'User') {
    try {
      await this.sendEmail({
        to: recipientEmail,
        subject: 'Your NewRoots OTP Code',
        htmlContent: this.getOTPEmailTemplate(otp, name)
      });
      // ...existing code...
      return { success: true, messageId: 'sent' };
    } catch (err) {
      // ...existing code...
      return { success: false, error: err.message };
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(recipientEmail, fullName) {
    try {
      await this.sendEmail({
        to: recipientEmail,
        subject: 'Welcome to NewRoots',
        htmlContent: this.getWelcomeEmailTemplate(fullName)
      });
      // ...existing code...
      return { success: true, messageId: 'sent' };
    } catch (err) {
      // ...existing code...
      return { success: false, error: err.message };
    }
  }

  /**
   * Send contact reply email
   */
  async sendContactReply(recipientEmail, senderName, replyMessage) {
    try {
      await this.sendEmail({
        to: recipientEmail,
        subject: 'Response to Your Contact Message',
        htmlContent: this.getContactReplyTemplate(senderName, replyMessage)
      });
      // ...existing code...
      return { success: true, messageId: 'sent' };
    } catch (err) {
      // ...existing code...
      return { success: false, error: err.message };
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(recipientEmail, resetLink) {
    try {
      await this.sendEmail({
        to: recipientEmail,
        subject: 'Reset your NewRoots Password',
        htmlContent: this.getPasswordResetTemplate(resetLink)
      });
      console.log(`✅ Password reset email sent to ${recipientEmail}`);
      return { success: true, messageId: 'sent' };
    } catch (err) {
      console.error(`❌ Error sending password reset email:`, err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * OTP Email Template
   */
  getOTPEmailTemplate(otp, name) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; color: white;">
          <h1>NewRoots Account Verification</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <p>Hello ${name},</p>
          <p>Thank you for registering with NewRoots. To verify your email address and complete your registration, please use the following OTP:</p>
          
          <div style="background: white; border: 2px solid #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 10px;">
            <h2 style="color: #667eea; letter-spacing: 5px; margin: 0;">${otp}</h2>
          </div>

          <p><strong>⏱️ This OTP is valid for 10 minutes only.</strong></p>
          
          <p style="color: #666; font-size: 14px;">If you didn't request this verification, please ignore this email.</p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          
          <p style="color: #999; font-size: 12px;">
            © 2026 NewRoots. All rights reserved.
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Welcome Email Template
   */
  getWelcomeEmailTemplate(fullName) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; color: white;">
          <h1>Welcome to NewRoots! 🎉</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <p>Hello ${fullName},</p>
          <p>Your email has been verified successfully! Your account is now active and ready to use.</p>
          
          <div style="background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #667eea; border-radius: 5px;">
            <h3>What you can do now:</h3>
            <ul>
              <li>Create and showcase your projects</li>
              <li>Add your skills and proficiencies</li>
              <li>Display your certificates and achievements</li>
              <li>Share your hackathon experiences</li>
              <li>Connect with visitors through contact messages</li>
            </ul>
          </div>

          <p>Start building your portfolio now and make an amazing impression!</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" 
               style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Go to Dashboard
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          
          <p style="color: #999; font-size: 12px;">
            © 2026 NewRoots. All rights reserved.
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Contact Reply Email Template
   */
  getContactReplyTemplate(senderName, replyMessage) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; color: white;">
          <h1>Response to Your Message</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <p>Hello ${senderName},</p>
          <p>Thank you for reaching out. Here's the response to your message:</p>
          
          <div style="background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #667eea; border-radius: 5px;">
            <p>${replyMessage.replace(/\n/g, '<br>')}</p>
          </div>

          <p>If you have any further questions, feel free to reach out again.</p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          
          <p style="color: #999; font-size: 12px;">
            © 2026 NewRoots. All rights reserved.
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Password Reset Email Template
   */
  getPasswordResetTemplate(resetLink) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; color: white;">
          <h1>Password Reset Request</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <p>We received a request to reset the password associated with your NewRoots account. Click the button below to create a new password.</p>
          
          <p style="color: #666; font-size: 14px;"><strong>⏱️ This link is valid for 1 hour only.</strong></p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>

          <p style="font-size: 14px; color: #666;">If the button doesn't work, copy and paste this link in your browser:</p>
          <p style="font-size: 12px; color: #0066cc; word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 4px; font-family: 'Courier New', monospace;">
            <a href="${resetLink}" style="color: #0066cc; text-decoration: none;">${resetLink}</a>
          </p>
          
          <p style="color: #666; font-size: 14px;">If you didn't request this reset, you can safely ignore this email.</p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px;">
            © 2026 NewRoots. All rights reserved.
          </p>
        </div>
      </div>
    `;
  }
}

module.exports = EmailService;
