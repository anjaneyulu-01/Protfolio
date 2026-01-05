/**
 * Certificate Model Schema & Operations
 */

const { ObjectId } = require('mongodb');

class CertificateModel {
  constructor(db) {
    this.collection = db.collection('certificates');
  }

  async initialize() {
    try {
      await this.collection.createIndex({ userId: 1, issueDate: -1 });
      await this.collection.createIndex({ userId: 1, createdAt: -1 });
      console.log('✅ Certificate model indexes created');
    } catch (err) {
      console.error('Error creating indexes:', err);
    }
  }

  /**
   * Certificate Schema
   */
  static schema = {
    _id: 'ObjectId',
    userId: 'ObjectId (reference to User)',
    title: 'String',
    issuer: 'String (Coursera, Udemy, etc)',
    issueDate: 'Date',
    expiryDate: 'Date (optional)',
    credentialUrl: 'String (URL)',
    credentialId: 'String (optional)',
    image: 'String (URL)',
    skills: ['String'],
    createdAt: 'Date',
    updatedAt: 'Date'
  };

  /**
   * Create a new certificate
   */
  async createCertificate(userId, certData) {
    const cert = {
      userId: new ObjectId(userId),
      title: certData.title,
      issuer: certData.issuer,
      issueDate: new Date(certData.issueDate),
      expiryDate: certData.expiryDate ? new Date(certData.expiryDate) : null,
      credentialUrl: certData.credentialUrl || '',
      credentialId: certData.credentialId || '',
      image: certData.image || null,
      skills: certData.skills || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await this.collection.insertOne(cert);
    return { _id: result.insertedId, ...cert };
  }

  /**
   * Get all certificates for a user
   */
  async getCertificatesByUserId(userId) {
    return await this.collection
      .find({ userId: new ObjectId(userId) })
      .sort({ issueDate: -1 })
      .toArray();
  }

  /**
   * Get certificate by ID
   */
  async getCertificateById(certId) {
    return await this.collection.findOne({ _id: new ObjectId(certId) });
  }

  /**
   * Update certificate
   */
  async updateCertificate(certId, updateData) {
    const update = { updatedAt: new Date() };

    if (updateData.title) update.title = updateData.title;
    if (updateData.issuer) update.issuer = updateData.issuer;
    if (updateData.issueDate) update.issueDate = new Date(updateData.issueDate);
    if (updateData.expiryDate) update.expiryDate = new Date(updateData.expiryDate);
    if (updateData.credentialUrl !== undefined) update.credentialUrl = updateData.credentialUrl;
    if (updateData.credentialId !== undefined) update.credentialId = updateData.credentialId;
    if (updateData.image !== undefined) update.image = updateData.image;
    if (updateData.skills) update.skills = updateData.skills;

    const result = await this.collection.updateOne(
      { _id: new ObjectId(certId) },
      { $set: update }
    );

    if (result.modifiedCount > 0) {
      return await this.getCertificateById(certId);
    }
    return null;
  }

  /**
   * Delete certificate
   */
  async deleteCertificate(certId) {
    const result = await this.collection.deleteOne({ _id: new ObjectId(certId) });
    return result.deletedCount > 0;
  }

  /**
   * Get user's certificate count
   */
  async getCertificateCount(userId) {
    return await this.collection.countDocuments({ userId: new ObjectId(userId) });
  }

  /**
   * Get certificates by issuer
   */
  async getCertificatesByIssuer(userId, issuer) {
    return await this.collection
      .find({ userId: new ObjectId(userId), issuer: issuer })
      .sort({ issueDate: -1 })
      .toArray();
  }

  /**
   * Get valid certificates (not expired)
   */
  async getValidCertificates(userId) {
    const now = new Date();
    return await this.collection
      .find({
        userId: new ObjectId(userId),
        $or: [
          { expiryDate: null },
          { expiryDate: { $gt: now } }
        ]
      })
      .sort({ issueDate: -1 })
      .toArray();
  }
}

module.exports = CertificateModel;
