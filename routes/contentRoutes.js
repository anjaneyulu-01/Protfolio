/**
 * Portfolio Content Routes
 * Routes for managing projects, skills, certificates, and hackathons
 */

const express = require('express');
const { verifyTokenMiddleware, verifyEmailMiddleware, verifyAdminMiddleware } = require('../services/AuthMiddleware');

/**
 * Create content routes
 * @param {Object} models - Database models
 * @param {string} jwtSecret - JWT secret key
 */
function createContentRoutes(models, jwtSecret) {
  const router = express.Router();
  const { ProjectModel, SkillModel, CertificateModel, HackathonModel } = models;

  const verifyAuth = verifyTokenMiddleware(jwtSecret);

  // ==================== PROJECTS ROUTES ====================

  /**
   * GET /api/content/projects
   * Get all projects (public, with optional user filter)
   */
  router.get('/projects', async (req, res) => {
    try {
      const { userId, featured } = req.query;
      let projects;

      if (featured === 'true') {
        projects = await ProjectModel.getFeaturedProjects();
      } else if (userId) {
        projects = await ProjectModel.getProjectsByUserId(userId);
      } else {
        projects = await ProjectModel.getAll();
      }

      res.json({
        success: true,
        data: projects
      });
    } catch (error) {
      console.error('Get projects error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch projects'
      });
    }
  });

  /**
   * GET /api/content/projects/:id
   * Get project by ID
   */
  router.get('/projects/:id', async (req, res) => {
    try {
      const project = await ProjectModel.findById(req.params.id);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      // Increment views
      await ProjectModel.incrementViews(req.params.id);

      res.json({
        success: true,
        data: project
      });
    } catch (error) {
      console.error('Get project error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch project'
      });
    }
  });

  /**
   * POST /api/content/projects
   * Create new project (protected)
   */
  router.post('/projects', verifyAuth, verifyEmailMiddleware, async (req, res) => {
    try {
      const { title, description, image, technologies, liveLink, githubLink, featured } = req.body;

      if (!title || !description) {
        return res.status(400).json({
          success: false,
          message: 'Title and description are required'
        });
      }

      const projectData = {
        userId: req.userId,
        title,
        description,
        image: image || null,
        technologies: technologies || [],
        liveLink: liveLink || null,
        githubLink: githubLink || null,
        featured: featured || false,
        views: 0
      };

      const project = await ProjectModel.createProject(projectData);

      res.status(201).json({
        success: true,
        message: 'Project created successfully',
        data: project
      });
    } catch (error) {
      console.error('Create project error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create project'
      });
    }
  });

  /**
   * PUT /api/content/projects/:id
   * Update project (protected, owner only)
   */
  router.put('/projects/:id', verifyAuth, async (req, res) => {
    try {
      const project = await ProjectModel.findById(req.params.id);

      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      if (project.userId.toString() !== req.userId) {
        return res.status(403).json({
          success: false,
          message: 'Only project owner can update'
        });
      }

      const updatedProject = await ProjectModel.updateProject(req.params.id, req.body);

      res.json({
        success: true,
        message: 'Project updated successfully',
        data: updatedProject
      });
    } catch (error) {
      console.error('Update project error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update project'
      });
    }
  });

  /**
   * DELETE /api/content/projects/:id
   * Delete project (protected, owner only)
   */
  router.delete('/projects/:id', verifyAuth, async (req, res) => {
    try {
      const project = await ProjectModel.findById(req.params.id);

      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      if (project.userId.toString() !== req.userId) {
        return res.status(403).json({
          success: false,
          message: 'Only project owner can delete'
        });
      }

      await ProjectModel.deleteProject(req.params.id);

      res.json({
        success: true,
        message: 'Project deleted successfully'
      });
    } catch (error) {
      console.error('Delete project error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete project'
      });
    }
  });

  // ==================== SKILLS ROUTES ====================

  /**
   * GET /api/content/skills
   * Get all skills (public, with optional user filter)
   */
  router.get('/skills', async (req, res) => {
    try {
      const { userId, category } = req.query;
      let skills;

      if (userId && category) {
        skills = await SkillModel.getSkillsByCategory(userId, category);
      } else if (userId) {
        skills = await SkillModel.getSkillsByUserId(userId);
      } else {
        skills = await SkillModel.getAll();
      }

      res.json({
        success: true,
        data: skills
      });
    } catch (error) {
      console.error('Get skills error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch skills'
      });
    }
  });

  /**
   * POST /api/content/skills
   * Create new skill (protected)
   */
  router.post('/skills', verifyAuth, verifyEmailMiddleware, async (req, res) => {
    try {
      const { name, category, proficiency, icon } = req.body;

      if (!name || !category) {
        return res.status(400).json({
          success: false,
          message: 'Name and category are required'
        });
      }

      const skillData = {
        userId: req.userId,
        name,
        category,
        proficiency: Math.min(100, Math.max(1, proficiency || 50)),
        icon: icon || null,
        endorsements: 0
      };

      const skill = await SkillModel.createSkill(skillData);

      res.status(201).json({
        success: true,
        message: 'Skill added successfully',
        data: skill
      });
    } catch (error) {
      console.error('Create skill error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add skill'
      });
    }
  });

  /**
   * PUT /api/content/skills/:id
   * Update skill (protected, owner only)
   */
  router.put('/skills/:id', verifyAuth, async (req, res) => {
    try {
      const skill = await SkillModel.findById(req.params.id);

      if (!skill) {
        return res.status(404).json({
          success: false,
          message: 'Skill not found'
        });
      }

      if (skill.userId.toString() !== req.userId) {
        return res.status(403).json({
          success: false,
          message: 'Only skill owner can update'
        });
      }

      const updatedSkill = await SkillModel.updateSkill(req.params.id, req.body);

      res.json({
        success: true,
        message: 'Skill updated successfully',
        data: updatedSkill
      });
    } catch (error) {
      console.error('Update skill error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update skill'
      });
    }
  });

  /**
   * DELETE /api/content/skills/:id
   * Delete skill (protected, owner only)
   */
  router.delete('/skills/:id', verifyAuth, async (req, res) => {
    try {
      const skill = await SkillModel.findById(req.params.id);

      if (!skill) {
        return res.status(404).json({
          success: false,
          message: 'Skill not found'
        });
      }

      if (skill.userId.toString() !== req.userId) {
        return res.status(403).json({
          success: false,
          message: 'Only skill owner can delete'
        });
      }

      await SkillModel.deleteSkill(req.params.id);

      res.json({
        success: true,
        message: 'Skill deleted successfully'
      });
    } catch (error) {
      console.error('Delete skill error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete skill'
      });
    }
  });

  /**
   * POST /api/content/skills/:id/endorse
   * Add endorsement to skill (public)
   */
  router.post('/skills/:id/endorse', async (req, res) => {
    try {
      const skill = await SkillModel.findById(req.params.id);
      if (!skill) {
        return res.status(404).json({
          success: false,
          message: 'Skill not found'
        });
      }

      const updatedSkill = await SkillModel.addEndorsement(req.params.id);

      res.json({
        success: true,
        message: 'Endorsement added',
        data: updatedSkill
      });
    } catch (error) {
      console.error('Endorse skill error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add endorsement'
      });
    }
  });

  // ==================== CERTIFICATES ROUTES ====================

  /**
   * GET /api/content/certificates
   * Get all certificates (public)
   */
  router.get('/certificates', async (req, res) => {
    try {
      const { userId } = req.query;
      let certificates;

      if (userId) {
        certificates = await CertificateModel.getCertificatesByUserId(userId);
      } else {
        certificates = await CertificateModel.getAll();
      }

      res.json({
        success: true,
        data: certificates
      });
    } catch (error) {
      console.error('Get certificates error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch certificates'
      });
    }
  });

  /**
   * POST /api/content/certificates
   * Create new certificate (protected)
   */
  router.post('/certificates', verifyAuth, async (req, res) => {
    try {
      const { title, issuer, issueDate, expiryDate, credentialUrl, credentialId, image, skills } = req.body;

      if (!title) {
        return res.status(400).json({
          success: false,
          message: 'Title is required'
        });
      }

      const certificateData = {
        userId: req.userId,
        title,
        issuer: issuer || '',
        issueDate: issueDate ? new Date(issueDate) : new Date(),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        credentialUrl: credentialUrl || null,
        credentialId: credentialId || null,
        image: image || null,
        skills: skills || []
      };

      const certificate = await CertificateModel.createCertificate(certificateData);

      res.status(201).json({
        success: true,
        message: 'Certificate added successfully',
        data: certificate
      });
    } catch (error) {
      console.error('Create certificate error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add certificate'
      });
    }
  });

  /**
   * PUT /api/content/certificates/:id
   * Update certificate (protected, owner only)
   */
  router.put('/certificates/:id', verifyAuth, async (req, res) => {
    try {
      const certificate = await CertificateModel.findById(req.params.id);

      if (!certificate) {
        return res.status(404).json({
          success: false,
          message: 'Certificate not found'
        });
      }

      if (certificate.userId.toString() !== req.userId) {
        return res.status(403).json({
          success: false,
          message: 'Only certificate owner can update'
        });
      }

      const updatedCertificate = await CertificateModel.updateCertificate(req.params.id, req.body);

      res.json({
        success: true,
        message: 'Certificate updated successfully',
        data: updatedCertificate
      });
    } catch (error) {
      console.error('Update certificate error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update certificate'
      });
    }
  });

  /**
   * DELETE /api/content/certificates/:id
   * Delete certificate (protected, owner only)
   */
  router.delete('/certificates/:id', verifyAuth, async (req, res) => {
    try {
      const certificate = await CertificateModel.findById(req.params.id);

      if (!certificate) {
        return res.status(404).json({
          success: false,
          message: 'Certificate not found'
        });
      }

      if (certificate.userId.toString() !== req.userId) {
        return res.status(403).json({
          success: false,
          message: 'Only certificate owner can delete'
        });
      }

      await CertificateModel.deleteCertificate(req.params.id);

      res.json({
        success: true,
        message: 'Certificate deleted successfully'
      });
    } catch (error) {
      console.error('Delete certificate error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete certificate'
      });
    }
  });

  // ==================== HACKATHONS ROUTES ====================

  /**
   * GET /api/content/hackathons
   * Get all hackathons (public)
   */
  router.get('/hackathons', async (req, res) => {
    try {
      const { userId } = req.query;
      let hackathons;

      if (userId) {
        hackathons = await HackathonModel.getHackathonsByUserId(userId);
      } else {
        hackathons = await HackathonModel.getAll();
      }

      res.json({
        success: true,
        data: hackathons
      });
    } catch (error) {
      console.error('Get hackathons error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch hackathons'
      });
    }
  });

  /**
   * POST /api/content/hackathons
   * Create new hackathon entry (protected)
   */
  router.post('/hackathons', verifyAuth, verifyEmailMiddleware, async (req, res) => {
    try {
      const { title, eventName, eventDate, location, achievement, technologies, image, links, teamSize } = req.body;

      if (!title || !eventName) {
        return res.status(400).json({
          success: false,
          message: 'Title and event name are required'
        });
      }

      const hackathonData = {
        userId: req.userId,
        title,
        eventName,
        eventDate: eventDate ? new Date(eventDate) : new Date(),
        location: location || null,
        achievement: achievement || null,
        technologies: technologies || [],
        image: image || null,
        links: links || {},
        teamSize: teamSize || 1
      };

      const hackathon = await HackathonModel.createHackathon(hackathonData);

      res.status(201).json({
        success: true,
        message: 'Hackathon entry created successfully',
        data: hackathon
      });
    } catch (error) {
      console.error('Create hackathon error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create hackathon entry'
      });
    }
  });

  /**
   * PUT /api/content/hackathons/:id
   * Update hackathon entry (protected, owner only)
   */
  router.put('/hackathons/:id', verifyAuth, async (req, res) => {
    try {
      const hackathon = await HackathonModel.findById(req.params.id);

      if (!hackathon) {
        return res.status(404).json({
          success: false,
          message: 'Hackathon entry not found'
        });
      }

      if (hackathon.userId.toString() !== req.userId) {
        return res.status(403).json({
          success: false,
          message: 'Only entry owner can update'
        });
      }

      const updatedHackathon = await HackathonModel.updateHackathon(req.params.id, req.body);

      res.json({
        success: true,
        message: 'Hackathon entry updated successfully',
        data: updatedHackathon
      });
    } catch (error) {
      console.error('Update hackathon error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update hackathon entry'
      });
    }
  });

  /**
   * DELETE /api/content/hackathons/:id
   * Delete hackathon entry (protected, owner only)
   */
  router.delete('/hackathons/:id', verifyAuth, async (req, res) => {
    try {
      const hackathon = await HackathonModel.findById(req.params.id);

      if (!hackathon) {
        return res.status(404).json({
          success: false,
          message: 'Hackathon entry not found'
        });
      }

      if (hackathon.userId.toString() !== req.userId) {
        return res.status(403).json({
          success: false,
          message: 'Only entry owner can delete'
        });
      }

      await HackathonModel.deleteHackathon(req.params.id);

      res.json({
        success: true,
        message: 'Hackathon entry deleted successfully'
      });
    } catch (error) {
      console.error('Delete hackathon error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete hackathon entry'
      });
    }
  });

  return router;
}

module.exports = createContentRoutes;
