/**
 * User Model Schema & Operations
 * Handles user authentication, OTP verification, and profile management
 */

const { ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');

class UserModel {
  constructor(db) {
    this.collection = db.collection('users');
    this.otpCollection = db.collection('otp_verifications');
  }

  /**
   * Initialize collections with indexes
   */
  async initialize() {
    try {
      // Users collection indexes
      await this.collection.createIndex({ email: 1 }, { unique: true });
      await this.collection.createIndex({ createdAt: 1 });
      
      // OTP collection indexes with TTL (expires after 10 minutes)
      await this.otpCollection.createIndex({ createdAt: 1 }, { expireAfterSeconds: 600 });
      await this.otpCollection.createIndex({ email: 1 });
      
      console.log('✅ User model indexes created');
    } catch (err) {
      console.error('Error creating indexes:', err);
    }
  }

  /**
   * User Schema
   */
  static schema = {
    _id: 'ObjectId',
    email: 'String (unique)',
    password: 'String (hashed)',
    fullName: 'String',
    isVerified: 'Boolean',
    verifiedAt: 'Date',
    isAdmin: 'Boolean (default: false)',
    lastLogin: 'Date',
    createdAt: 'Date',
    updatedAt: 'Date',
    profile: {
      bio: 'String',
      avatar: 'String (URL)',
      phone: 'String',
      location: 'String'
    },
    preferences: {
      emailNotifications: 'Boolean',
      theme: 'String (light/dark)',
      language: 'String'
    }
  };

  /**
   * Create a new user
   */
  async createUser(userData) {
    const user = {
      email: userData.email,
      password: userData.password, // Should be hashed before calling
      fullName: userData.fullName || '',
      isVerified: false,
      verifiedAt: null,
      isAdmin: false,
      lastLogin: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      profile: {
        bio: '',
        avatar: null,
        phone: '',
        location: ''
      },
      preferences: {
        emailNotifications: true,
        theme: 'dark',
        language: 'en'
      }
    };

    const result = await this.collection.insertOne(user);
    return { _id: result.insertedId, ...user };
  }

  /**
   * Find user by email
   */
  async findByEmail(email) {
    return await this.collection.findOne({ email: email.toLowerCase() });
  }

  /**
   * Find user by ID
   */
  async findById(userId) {
    return await this.collection.findOne({ _id: new ObjectId(userId) });
  }

  /**
   * Verify user email
   */
  async verifyEmail(userId) {
    const result = await this.collection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          isVerified: true,
          verifiedAt: new Date(),
          updatedAt: new Date()
        }
      }
    );
    return result.modifiedCount > 0;
  }

  /**
   * Update last login
   */
  async updateLastLogin(userId) {
    await this.collection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { lastLogin: new Date(), updatedAt: new Date() } }
    );
  }

  /**
   * Update user profile
   */
  async updateProfile(userId, profileData) {
    const updateData = {
      updatedAt: new Date()
    };

    // Handle nested profile updates
    if (profileData.bio) updateData['profile.bio'] = profileData.bio;
    if (profileData.avatar) updateData['profile.avatar'] = profileData.avatar;
    if (profileData.phone) updateData['profile.phone'] = profileData.phone;
    if (profileData.location) updateData['profile.location'] = profileData.location;
    if (profileData.fullName) updateData['fullName'] = profileData.fullName;

    const result = await this.collection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateData }
    );

    if (result.modifiedCount > 0) {
      return await this.findById(userId);
    }
    return null;
  }

  /**
   * Save OTP for email verification
   */
  async saveOTP(email, otp) {
    const otpData = {
      email: email.toLowerCase(),
      otp: otp,
      createdAt: new Date(),
      verified: false
    };

    // Delete old OTP for this email
    await this.otpCollection.deleteMany({ email: email.toLowerCase() });

    const result = await this.otpCollection.insertOne(otpData);
    return result.insertedId;
  }

  /**
   * Verify OTP
   */
  async verifyOTP(email, otp) {
    const otpRecord = await this.otpCollection.findOne({
      email: email.toLowerCase(),
      otp: otp,
      verified: false
    });

    if (!otpRecord) {
      return { valid: false, message: 'Invalid OTP' };
    }

    // Check if OTP is expired (older than 10 minutes)
    const ageInSeconds = (new Date() - otpRecord.createdAt) / 1000;
    if (ageInSeconds > 600) {
      return { valid: false, message: 'OTP expired' };
    }

    // Mark OTP as verified
    await this.otpCollection.updateOne(
      { _id: otpRecord._id },
      { $set: { verified: true } }
    );

    return { valid: true, message: 'OTP verified successfully' };
  }

  /**
   * Get user without password
   */
  getUserSafe(user) {
    if (!user) return null;
    const { password, ...safeUser } = user;
    return safeUser;
  }

  /**
   * Get all users (admin only)
   */
  async getAllUsers(limit = 50, skip = 0) {
    const users = await this.collection
      .find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    return users.map(user => this.getUserSafe(user));
  }

  /**
   * Delete user (admin only)
   */
  async deleteUser(userId) {
    const result = await this.collection.deleteOne({ _id: new ObjectId(userId) });
    return result.deletedCount > 0;
  }

  /**
   * Change password
   */
  async changePassword(userId, newHashedPassword) {
    const result = await this.collection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          password: newHashedPassword,
          updatedAt: new Date()
        }
      }
    );
    return result.modifiedCount > 0;
  }

  /**
   * Get user count
   */
  async getUserCount() {
    return await this.collection.countDocuments({});
  }

  /**
   * Get verified users count
   */
  async getVerifiedUsersCount() {
    return await this.collection.countDocuments({ isVerified: true });
  }

  /**
   * Verify password (static method)
   */
  static async verifyPassword(plainPassword, hashedPassword) {
    if (!plainPassword || !hashedPassword) {
      return false;
    }
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Hash password (static method)
   */
  static async hashPassword(password) {
    return await bcrypt.hash(password, 10);
  }
}

module.exports = UserModel;
