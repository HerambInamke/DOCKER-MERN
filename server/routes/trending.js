const express = require('express');
const { query, validationResult } = require('express-validator');
const TrendingService = require('../services/trendingService');

const router = express.Router();

// @route   GET /api/trending/projects
// @desc    Get trending projects
// @access  Public
router.get('/projects', [
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const limit = parseInt(req.query.limit) || 10;
    const trendingProjects = await TrendingService.getTrendingProjects(limit);

    res.json({
      projects: trendingProjects,
      count: trendingProjects.length,
    });
  } catch (error) {
    console.error('Get trending projects error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/trending/tags
// @desc    Get popular tags
// @access  Public
router.get('/tags', [
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const limit = parseInt(req.query.limit) || 20;
    const popularTags = await TrendingService.getPopularTags(limit);

    res.json({
      tags: popularTags,
      count: popularTags.length,
    });
  } catch (error) {
    console.error('Get popular tags error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/trending/technologies
// @desc    Get popular technologies
// @access  Public
router.get('/technologies', [
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const limit = parseInt(req.query.limit) || 20;
    const popularTechnologies = await TrendingService.getPopularTechnologies(limit);

    res.json({
      technologies: popularTechnologies,
      count: popularTechnologies.length,
    });
  } catch (error) {
    console.error('Get popular technologies error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/trending/cache-stats
// @desc    Get cache statistics (admin only)
// @access  Private
router.get('/cache-stats', async (req, res) => {
  try {
    const stats = TrendingService.getCacheStats();
    res.json(stats);
  } catch (error) {
    console.error('Get cache stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/trending/clear-cache
// @desc    Clear trending cache (admin only)
// @access  Private
router.post('/clear-cache', async (req, res) => {
  try {
    TrendingService.clearCache();
    res.json({ message: 'Cache cleared successfully' });
  } catch (error) {
    console.error('Clear cache error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
 
