const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Project = require('../models/Project');
const Comment = require('../models/Comment');
const { auth } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// @route   GET /api/projects
// @desc    Get all projects with filtering and pagination
// @access  Public
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('sort').optional().isIn(['newest', 'oldest', 'popular', 'trending']).withMessage('Invalid sort option'),
  query('tags').optional().isString().withMessage('Tags must be a string'),
  query('technologies').optional().isString().withMessage('Technologies must be a string'),
  query('author').optional().isMongoId().withMessage('Invalid author ID'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {
      status: 'published',
      visibility: 'public',
    };

    if (req.query.tags) {
      const tags = req.query.tags.split(',').map(tag => tag.trim().toLowerCase());
      filter.tags = { $in: tags };
    }

    if (req.query.technologies) {
      const technologies = req.query.technologies.split(',').map(tech => tech.trim());
      filter.technologies = { $in: technologies };
    }

    if (req.query.author) {
      filter.author = req.query.author;
    }

    // Build sort object
    let sort = {};
    switch (req.query.sort) {
      case 'oldest':
        sort = { createdAt: 1 };
        break;
      case 'popular':
        sort = { 'metrics.upvoteCount': -1 };
        break;
      case 'trending':
        // Trending: combination of upvotes and recent activity
        sort = { 
          'metrics.upvoteCount': -1,
          createdAt: -1 
        };
        break;
      default:
        sort = { createdAt: -1 };
    }

    const projects = await Project.find(filter)
      .populate('author', 'username firstName lastName avatar')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Project.countDocuments(filter);

    res.json({
      projects,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/projects/:id
// @desc    Get single project
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('author', 'username firstName lastName avatar bio')
      .populate('collaborators.user', 'username firstName lastName avatar');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Increment view count
    await project.incrementViews();

    res.json({ project });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/projects
// @desc    Create new project
// @access  Private
router.post('/', auth, [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 100 })
    .withMessage('Title cannot exceed 100 characters'),
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
  body('shortDescription')
    .notEmpty()
    .withMessage('Short description is required')
    .isLength({ max: 200 })
    .withMessage('Short description cannot exceed 200 characters'),
  body('githubUrl')
    .isURL()
    .withMessage('Please enter a valid GitHub URL')
    .matches(/^https:\/\/github\.com\/[a-zA-Z0-9-]+\/[a-zA-Z0-9._-]+$/)
    .withMessage('Please enter a valid GitHub repository URL'),
  body('liveUrl')
    .optional()
    .isURL()
    .withMessage('Please enter a valid live URL'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('technologies')
    .optional()
    .isArray()
    .withMessage('Technologies must be an array'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const projectData = {
      ...req.body,
      author: req.user._id,
    };

    const project = new Project(projectData);
    await project.save();

    const populatedProject = await Project.findById(project._id)
      .populate('author', 'username firstName lastName avatar');

    res.status(201).json({
      message: 'Project created successfully',
      project: populatedProject,
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Server error during project creation' });
  }
});

// @route   PUT /api/projects/:id
// @desc    Update project
// @access  Private
router.put('/:id', auth, [
  body('title')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Title cannot exceed 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
  body('shortDescription')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Short description cannot exceed 200 characters'),
  body('githubUrl')
    .optional()
    .isURL()
    .withMessage('Please enter a valid GitHub URL'),
  body('liveUrl')
    .optional()
    .isURL()
    .withMessage('Please enter a valid live URL'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is the author or admin
    if (project.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this project' });
    }

    const allowedUpdates = [
      'title', 'description', 'shortDescription', 'githubUrl', 'liveUrl',
      'tags', 'technologies', 'status', 'visibility'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('author', 'username firstName lastName avatar');

    res.json({
      message: 'Project updated successfully',
      project: updatedProject,
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ message: 'Server error during project update' });
  }
});

// @route   DELETE /api/projects/:id
// @desc    Delete project
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is the author or admin
    if (project.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this project' });
    }

    // Delete associated comments
    await Comment.deleteMany({ project: req.params.id });

    await Project.findByIdAndDelete(req.params.id);

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ message: 'Server error during project deletion' });
  }
});

// @route   POST /api/projects/:id/upvote
// @desc    Upvote/unupvote project
// @access  Private
router.post('/:id/upvote', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const hasUpvoted = project.hasUserUpvoted(req.user._id);

    if (hasUpvoted) {
      await project.removeUpvote(req.user._id);
      res.json({ message: 'Upvote removed', upvoted: false });
    } else {
      await project.addUpvote(req.user._id);
      res.json({ message: 'Project upvoted', upvoted: true });
    }
  } catch (error) {
    console.error('Upvote error:', error);
    res.status(500).json({ message: 'Server error during upvote' });
  }
});

// @route   POST /api/projects/:id/images
// @desc    Upload project images
// @access  Private
router.post('/:id/images', auth, upload.array('images', 5), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is the author
    if (project.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to upload images for this project' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No images uploaded' });
    }

    const images = req.files.map((file, index) => ({
      url: file.path,
      alt: req.body.alt || `Project image ${index + 1}`,
      isPrimary: index === 0 && project.images.length === 0,
    }));

    project.images.push(...images);
    await project.save();

    res.json({
      message: 'Images uploaded successfully',
      images: project.images,
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ message: 'Server error during image upload' });
  }
});

module.exports = router;
