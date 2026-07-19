/**
 * Hackathon Model Schema & Operations
 */

const { ObjectId } = require('mongodb');

class HackathonModel {
  constructor(db) {
    this.collection = db.collection('hackathons');
  }

  async initialize() {
    try {
      await this.collection.createIndex({ userId: 1, eventDate: -1 });
      await this.collection.createIndex({ userId: 1, createdAt: -1 });
      console.log('✅ Hackathon model indexes created');
    } catch (err) {
      console.error('Error creating indexes:', err);
    }
  }

  /**
   * Hackathon Schema
   */
  static schema = {
    _id: 'ObjectId',
    userId: 'ObjectId (reference to User)',
    title: 'String',
    eventName: 'String',
    eventDate: 'Date',
    location: 'String',
    description: 'String',
    achievement: 'String (1st Place, 2nd Place, Finalist, etc)',
    technologies: ['String'],
    image: 'String (URL)',
    links: {
      projectUrl: 'String (URL, optional)',
      certificateUrl: 'String (URL, optional)',
      devpostUrl: 'String (URL, optional)'
    },
    teamSize: 'Number',
    createdAt: 'Date',
    updatedAt: 'Date'
  };

  /**
   * Create a new hackathon entry
   */
  async createHackathon(userId, hackathonData) {
    const hackathon = {
      userId: new ObjectId(userId),
      title: hackathonData.title,
      eventName: hackathonData.eventName,
      eventDate: new Date(hackathonData.eventDate),
      location: hackathonData.location || '',
      description: hackathonData.description || '',
      achievement: hackathonData.achievement || '',
      technologies: hackathonData.technologies || [],
      image: hackathonData.image || null,
      links: {
        projectUrl: hackathonData.projectUrl || null,
        certificateUrl: hackathonData.certificateUrl || null,
        devpostUrl: hackathonData.devpostUrl || null
      },
      teamSize: hackathonData.teamSize || 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await this.collection.insertOne(hackathon);
    return { _id: result.insertedId, ...hackathon };
  }

  /**
   * Get all hackathons for a user
   */
  async getHackathonsByUserId(userId) {
    return await this.collection
      .find({ userId: new ObjectId(userId) })
      .sort({ eventDate: -1 })
      .toArray();
  }

  /**
   * Get hackathon by ID
   */
  async getHackathonById(hackathonId) {
    return await this.collection.findOne({ _id: new ObjectId(hackathonId) });
  }

  /**
   * Update hackathon
   */
  async updateHackathon(hackathonId, updateData) {
    const update = { updatedAt: new Date() };

    if (updateData.title) update.title = updateData.title;
    if (updateData.eventName) update.eventName = updateData.eventName;
    if (updateData.eventDate) update.eventDate = new Date(updateData.eventDate);
    if (updateData.location) update.location = updateData.location;
    if (updateData.description) update.description = updateData.description;
    if (updateData.achievement) update.achievement = updateData.achievement;
    if (updateData.technologies) update.technologies = updateData.technologies;
    if (updateData.image !== undefined) update.image = updateData.image;
    if (updateData.teamSize !== undefined) update.teamSize = updateData.teamSize;

    // Handle nested links
    if (updateData.projectUrl !== undefined) update['links.projectUrl'] = updateData.projectUrl;
    if (updateData.certificateUrl !== undefined) update['links.certificateUrl'] = updateData.certificateUrl;
    if (updateData.devpostUrl !== undefined) update['links.devpostUrl'] = updateData.devpostUrl;

    const result = await this.collection.updateOne(
      { _id: new ObjectId(hackathonId) },
      { $set: update }
    );

    if (result.modifiedCount > 0) {
      return await this.getHackathonById(hackathonId);
    }
    return null;
  }

  /**
   * Delete hackathon
   */
  async deleteHackathon(hackathonId) {
    const result = await this.collection.deleteOne({ _id: new ObjectId(hackathonId) });
    return result.deletedCount > 0;
  }

  /**
   * Get user's hackathon count
   */
  async getHackathonCount(userId) {
    return await this.collection.countDocuments({ userId: new ObjectId(userId) });
  }

  /**
   * Get hackathons by achievement
   */
  async getHackathonsByAchievement(userId, achievement) {
    return await this.collection
      .find({ userId: new ObjectId(userId), achievement: achievement })
      .sort({ eventDate: -1 })
      .toArray();
  }

  /**
   * Get winning hackathons
   */
  async getWinningHackathons(userId) {
    return await this.collection
      .find({
        userId: new ObjectId(userId),
        achievement: {
          $in: ['1st Place', 'Winner', 'Grand Prize', '2nd Place', '3rd Place']
        }
      })
      .sort({ eventDate: -1 })
      .toArray();
  }
}

module.exports = HackathonModel;
