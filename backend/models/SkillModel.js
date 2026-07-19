/**
 * Skill Model Schema & Operations
 */

const { ObjectId } = require('mongodb');

class SkillModel {
  constructor(db) {
    this.collection = db.collection('skills');
  }

  async initialize() {
    try {
      await this.collection.createIndex({ userId: 1, category: 1 });
      await this.collection.createIndex({ userId: 1, createdAt: -1 });
      console.log('✅ Skill model indexes created');
    } catch (err) {
      console.error('Error creating indexes:', err);
    }
  }

  /**
   * Skill Schema
   */
  static schema = {
    _id: 'ObjectId',
    userId: 'ObjectId (reference to User)',
    name: 'String',
    category: 'String (Programming, Frontend, Backend, DevOps, etc)',
    proficiency: 'Number (1-100)',
    icon: 'String (emoji or URL)',
    endorsements: 'Number',
    createdAt: 'Date',
    updatedAt: 'Date'
  };

  /**
   * Create a new skill
   */
  async createSkill(userId, skillData) {
    const skill = {
      userId: new ObjectId(userId),
      name: skillData.name,
      category: skillData.category || 'General',
      proficiency: skillData.proficiency || 50,
      icon: skillData.icon || '⭐',
      endorsements: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await this.collection.insertOne(skill);
    return { _id: result.insertedId, ...skill };
  }

  /**
   * Get all skills for a user
   */
  async getSkillsByUserId(userId) {
    return await this.collection
      .find({ userId: new ObjectId(userId) })
      .sort({ category: 1, proficiency: -1 })
      .toArray();
  }

  /**
   * Get skills by category
   */
  async getSkillsByCategory(userId, category) {
    return await this.collection
      .find({ userId: new ObjectId(userId), category: category })
      .sort({ proficiency: -1 })
      .toArray();
  }

  /**
   * Get skill by ID
   */
  async getSkillById(skillId) {
    return await this.collection.findOne({ _id: new ObjectId(skillId) });
  }

  /**
   * Update skill
   */
  async updateSkill(skillId, updateData) {
    const update = { updatedAt: new Date() };

    if (updateData.name) update.name = updateData.name;
    if (updateData.category) update.category = updateData.category;
    if (updateData.proficiency !== undefined) update.proficiency = updateData.proficiency;
    if (updateData.icon) update.icon = updateData.icon;

    const result = await this.collection.updateOne(
      { _id: new ObjectId(skillId) },
      { $set: update }
    );

    if (result.modifiedCount > 0) {
      return await this.getSkillById(skillId);
    }
    return null;
  }

  /**
   * Add endorsement
   */
  async addEndorsement(skillId) {
    await this.collection.updateOne(
      { _id: new ObjectId(skillId) },
      { $inc: { endorsements: 1 }, $set: { updatedAt: new Date() } }
    );
  }

  /**
   * Delete skill
   */
  async deleteSkill(skillId) {
    const result = await this.collection.deleteOne({ _id: new ObjectId(skillId) });
    return result.deletedCount > 0;
  }

  /**
   * Get user's skill count
   */
  async getSkillCount(userId) {
    return await this.collection.countDocuments({ userId: new ObjectId(userId) });
  }

  /**
   * Get skill categories
   */
  async getCategories(userId) {
    return await this.collection.distinct('category', { userId: new ObjectId(userId) });
  }
}

module.exports = SkillModel;
