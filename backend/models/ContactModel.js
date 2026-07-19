/**
 * Contact Message Model Schema & Operations
 */

const { ObjectId } = require('mongodb');

class ContactModel {
  constructor(db) {
    this.collection = db.collection('contact_messages');
  }

  async initialize() {
    try {
      await this.collection.createIndex({ createdAt: -1 });
      await this.collection.createIndex({ email: 1 });
      await this.collection.createIndex({ status: 1 });
      console.log('✅ Contact model indexes created');
    } catch (err) {
      console.error('Error creating indexes:', err);
    }
  }

  /**
   * Contact Message Schema
   */
  static schema = {
    _id: 'ObjectId',
    name: 'String',
    email: 'String',
    subject: 'String',
    message: 'String',
    phone: 'String (optional)',
    status: 'String (new, read, replied)',
    replied: 'Boolean',
    repliedAt: 'Date (optional)',
    replyMessage: 'String (optional)',
    createdAt: 'Date',
    updatedAt: 'Date'
  };

  /**
   * Create a new contact message
   */
  async createMessage(messageData) {
    const message = {
      name: messageData.name,
      email: messageData.email.toLowerCase(),
      subject: messageData.subject,
      message: messageData.message,
      phone: messageData.phone || '',
      status: 'new',
      replied: false,
      repliedAt: null,
      replyMessage: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await this.collection.insertOne(message);
    return { _id: result.insertedId, ...message };
  }

  /**
   * Get all contact messages
   */
  async getAllMessages(limit = 50, skip = 0) {
    return await this.collection
      .find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
  }

  /**
   * Get messages by status
   */
  async getMessagesByStatus(status) {
    return await this.collection
      .find({ status: status })
      .sort({ createdAt: -1 })
      .toArray();
  }

  /**
   * Get message by ID
   */
  async getMessageById(messageId) {
    return await this.collection.findOne({ _id: new ObjectId(messageId) });
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId) {
    const result = await this.collection.updateOne(
      { _id: new ObjectId(messageId) },
      {
        $set: {
          status: 'read',
          updatedAt: new Date()
        }
      }
    );
    return result.modifiedCount > 0;
  }

  /**
   * Reply to message
   */
  async replyToMessage(messageId, replyMessage) {
    const result = await this.collection.updateOne(
      { _id: new ObjectId(messageId) },
      {
        $set: {
          replied: true,
          repliedAt: new Date(),
          replyMessage: replyMessage,
          status: 'replied',
          updatedAt: new Date()
        }
      }
    );

    if (result.modifiedCount > 0) {
      return await this.getMessageById(messageId);
    }
    return null;
  }

  /**
   * Delete message
   */
  async deleteMessage(messageId) {
    const result = await this.collection.deleteOne({ _id: new ObjectId(messageId) });
    return result.deletedCount > 0;
  }

  /**
   * Get unread messages count
   */
  async getUnreadCount() {
    return await this.collection.countDocuments({ status: 'new' });
  }

  /**
   * Get messages by email
   */
  async getMessagesByEmail(email) {
    return await this.collection
      .find({ email: email.toLowerCase() })
      .sort({ createdAt: -1 })
      .toArray();
  }

  /**
   * Get message statistics
   */
  async getStats() {
    const total = await this.collection.countDocuments({});
    const unread = await this.collection.countDocuments({ status: 'new' });
    const replied = await this.collection.countDocuments({ replied: true });

    return { total, unread, replied };
  }
}

module.exports = ContactModel;
