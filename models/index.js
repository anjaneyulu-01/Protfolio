/**
 * Models Index
 * Centralized model imports and initialization
 */

const UserModel = require('./UserModel');
const ProjectModel = require('./ProjectModel');
const SkillModel = require('./SkillModel');
const CertificateModel = require('./CertificateModel');
const HackathonModel = require('./HackathonModel');
const ContactModel = require('./ContactModel');

/**
 * Initialize all models
 */
async function initializeModels(db) {
  try {
    const userModel = new UserModel(db);
    const projectModel = new ProjectModel(db);
    const skillModel = new SkillModel(db);
    const certificateModel = new CertificateModel(db);
    const hackathonModel = new HackathonModel(db);
    const contactModel = new ContactModel(db);

    // Create indexes
    await userModel.initialize();
    await projectModel.initialize();
    await skillModel.initialize();
    await certificateModel.initialize();
    await hackathonModel.initialize();
    await contactModel.initialize();

    console.log('✅ All models initialized successfully');

    return {
      userModel,
      projectModel,
      skillModel,
      certificateModel,
      hackathonModel,
      contactModel
    };
  } catch (err) {
    console.error('❌ Error initializing models:', err);
    throw err;
  }
}

module.exports = {
  initializeModels,
  UserModel,
  ProjectModel,
  SkillModel,
  CertificateModel,
  HackathonModel,
  ContactModel
};
