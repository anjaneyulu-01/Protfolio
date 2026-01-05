/**
 * Project Model Schema & Operations
 */

const { ObjectId } = require('mongodb');

class ProjectModel {
  constructor(db) {
    this.collection = db.collection('projects');
  }

  async initialize() {
    try {
      await this.collection.createIndex({ userId: 1, createdAt: -1 });
      await this.collection.createIndex({ title: 'text', description: 'text' });
      console.log('✅ Project model indexes created');
    } catch (err) {
      console.error('Error creating indexes:', err);
    }
  }

  /**
   * Project Schema
   */
  static schema = {
    _id: 'ObjectId',
    userId: 'ObjectId (reference to User)',
    title: 'String',
    description: 'String',
    image: 'String (URL)',
    technologies: ['String'],
    liveLink: 'String (URL)',
    githubLink: 'String (URL)',
    featured: 'Boolean',
    views: 'Number',
    createdAt: 'Date',
    updatedAt: 'Date'
  };

  /**
   * Create a new project
   */
  async createProject(userId, projectData) {
    const project = {
      userId: new ObjectId(userId),
      title: projectData.title,
      description: projectData.description,
      image: projectData.image || null,
      technologies: projectData.technologies || [],
      liveLink: projectData.liveLink || null,
      githubLink: projectData.githubLink || null,
      featured: projectData.featured || false,
      views: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await this.collection.insertOne(project);
    return { _id: result.insertedId, ...project };
  }

  /**
   * Get all projects for a user
   */
  async getProjectsByUserId(userId) {
    return await this.collection
      .find({ userId: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .toArray();
  }

  /**
   * Get featured projects
   */
  async getFeaturedProjects(userId) {
    return await this.collection
      .find({ userId: new ObjectId(userId), featured: true })
      .sort({ createdAt: -1 })
      .toArray();
  }

  /**
   * Get project by ID
   */
  async getProjectById(projectId) {
    return await this.collection.findOne({ _id: new ObjectId(projectId) });
  }

  /**
   * Update project
   */
  async updateProject(projectId, updateData) {
    const update = { updatedAt: new Date() };
    
    if (updateData.title) update.title = updateData.title;
    if (updateData.description) update.description = updateData.description;
    if (updateData.image !== undefined) update.image = updateData.image;
    if (updateData.technologies) update.technologies = updateData.technologies;
    if (updateData.liveLink !== undefined) update.liveLink = updateData.liveLink;
    if (updateData.githubLink !== undefined) update.githubLink = updateData.githubLink;
    if (updateData.featured !== undefined) update.featured = updateData.featured;

    const result = await this.collection.updateOne(
      { _id: new ObjectId(projectId) },
      { $set: update }
    );

    if (result.modifiedCount > 0) {
      return await this.getProjectById(projectId);
    }
    return null;
  }

  /**
   * Increment project views
   */
  async incrementViews(projectId) {
    await this.collection.updateOne(
      { _id: new ObjectId(projectId) },
      { $inc: { views: 1 } }
    );
  }

  /**
   * Delete project
   */
  async deleteProject(projectId) {
    const result = await this.collection.deleteOne({ _id: new ObjectId(projectId) });
    return result.deletedCount > 0;
  }

  /**
   * Get user's project count
   */
  async getProjectCount(userId) {
    return await this.collection.countDocuments({ userId: new ObjectId(userId) });
  }
}

module.exports = ProjectModel;
