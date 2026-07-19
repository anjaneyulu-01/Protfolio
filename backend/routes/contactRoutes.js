/**
 * Contact Routes
 * Routes for handling contact messages from website visitors
 */

const express = require('express');
const { verifyTokenMiddleware } = require('../services/AuthMiddleware');
const AuthUtils = require('../services/AuthUtils');

/**
 * Create contact routes
 * @param {Object} models - Database models
 * @param {Object} emailService - Email service
 * @param {string} jwtSecret - JWT secret key
 */
function createContactRoutes(models, emailService, jwtSecret) {
  const router = express.Router();
  const { ContactModel, UserModel } = models;

  const verifyAuth = verifyTokenMiddleware(jwtSecret);

  /**
   * POST /api/contact
   * Submit contact message (public)
   */
  router.post('/', async (req, res) => {
    try {
      const { name, email, subject, message, phone } = req.body;

      // Validate input
      if (!name || !email || !subject || !message) {
        return res.status(400).json({
          success: false,
          message: 'Name, email, subject, and message are required'
        });
      }

      if (!AuthUtils.isValidEmail(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      }

      if (message.length < 10) {
        return res.status(400).json({
          success: false,
          message: 'Message must be at least 10 characters long'
        });
      }

      // Create contact message
      const contactData = {
        name,
        email,
        subject,
        message,
        phone: phone || null,
        status: 'new',
        replied: false
      };

      const contact = await ContactModel.createMessage(contactData);

      // Send confirmation email to user
      try {
        await emailService.sendContactConfirmation(email, name);
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
        // Don't fail the request if email fails
      }

      res.status(201).json({
        success: true,
        message: 'Message received. We will get back to you soon!',
        data: {
          id: contact._id,
          email: contact.email
        }
      });
    } catch (error) {
      console.error('Submit contact error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit message'
      });
    }
  });

  /**
   * GET /api/contact
   * Get all contact messages (protected - admin only)
   */
  router.get('/', verifyAuth, async (req, res) => {
    try {
      const user = await UserModel.findById(req.userId);

      if (!user || !user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }

      const { status, limit = 50, page = 1 } = req.query;
      const skip = (page - 1) * limit;

      let messages;
      if (status) {
        messages = await ContactModel.getMessagesByStatus(status, { skip, limit });
      } else {
        messages = await ContactModel.getAllMessages({ skip, limit });
      }

      const stats = await ContactModel.getStats();

      res.json({
        success: true,
        data: messages,
        stats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: messages.length
        }
      });
    } catch (error) {
      console.error('Get contact messages error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch messages'
      });
    }
  });

  /**
   * GET /api/contact/:id
   * Get single contact message (protected - admin only)
   */
  router.get('/:id', verifyAuth, async (req, res) => {
    try {
      const user = await UserModel.findById(req.userId);

      if (!user || !user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }

      const message = await ContactModel.findById(req.params.id);

      if (!message) {
        return res.status(404).json({
          success: false,
          message: 'Message not found'
        });
      }

      // Mark as read
      if (message.status === 'new') {
        await ContactModel.markAsRead(req.params.id);
      }

      res.json({
        success: true,
        data: message
      });
    } catch (error) {
      console.error('Get contact message error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch message'
      });
    }
  });

  /**
   * POST /api/contact/:id/reply
   * Reply to contact message (protected - admin only)
   */
  router.post('/:id/reply', verifyAuth, async (req, res) => {
    try {
      const { replyMessage } = req.body;

      if (!replyMessage) {
        return res.status(400).json({
          success: false,
          message: 'Reply message is required'
        });
      }

      const user = await UserModel.findById(req.userId);

      if (!user || !user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }

      const message = await ContactModel.findById(req.params.id);

      if (!message) {
        return res.status(404).json({
          success: false,
          message: 'Message not found'
        });
      }

      // Reply to message
      const updatedMessage = await ContactModel.replyToMessage(req.params.id, replyMessage);

      // Send reply email
      try {
        await emailService.sendContactReply(
          message.email,
          message.name,
          replyMessage
        );
      } catch (emailError) {
        console.error('Failed to send reply email:', emailError);
        // Don't fail the request if email fails
      }

      res.json({
        success: true,
        message: 'Reply sent successfully',
        data: updatedMessage
      });
    } catch (error) {
      console.error('Reply to contact error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send reply'
      });
    }
  });

  /**
   * PUT /api/contact/:id/status
   * Update message status (protected - admin only)
   */
  router.put('/:id/status', verifyAuth, async (req, res) => {
    try {
      const { status } = req.body;

      if (!status || !['new', 'read', 'replied'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Valid status is required (new, read, replied)'
        });
      }

      const user = await UserModel.findById(req.userId);

      if (!user || !user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }

      const message = await ContactModel.findById(req.params.id);

      if (!message) {
        return res.status(404).json({
          success: false,
          message: 'Message not found'
        });
      }

      const updatedMessage = await ContactModel.updateStatus(req.params.id, status);

      res.json({
        success: true,
        message: 'Status updated successfully',
        data: updatedMessage
      });
    } catch (error) {
      console.error('Update contact status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update status'
      });
    }
  });

  /**
   * DELETE /api/contact/:id
   * Delete contact message (protected - admin only)
   */
  router.delete('/:id', verifyAuth, async (req, res) => {
    try {
      const user = await UserModel.findById(req.userId);

      if (!user || !user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }

      const message = await ContactModel.findById(req.params.id);

      if (!message) {
        return res.status(404).json({
          success: false,
          message: 'Message not found'
        });
      }

      await ContactModel.deleteMessage(req.params.id);

      res.json({
        success: true,
        message: 'Message deleted successfully'
      });
    } catch (error) {
      console.error('Delete contact message error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete message'
      });
    }
  });

  /**
   * GET /api/contact/stats/summary
   * Get contact statistics (protected - admin only)
   */
  router.get('/stats/summary', verifyAuth, async (req, res) => {
    try {
      const user = await UserModel.findById(req.userId);

      if (!user || !user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }

      const stats = await ContactModel.getStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get contact stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch statistics'
      });
    }
  });

  return router;
}

module.exports = createContactRoutes;
