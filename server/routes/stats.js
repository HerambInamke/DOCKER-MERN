const express = require('express');
const User = require('../models/User');
const Project = require('../models/Project');
const Comment = require('../models/Comment');

const router = express.Router();

// @route   GET /api/stats
// @desc    Get platform statistics
// @access  Public
router.get('/', async (req, res) => {
  try {
    const [
      userCount,
      projectCount,
      commentCount,
      upvoteCount
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Project.countDocuments({ status: 'published', visibility: 'public' }),
      Comment.countDocuments({ isDeleted: false }),
      Project.aggregate([
        { $match: { status: 'published', visibility: 'public' } },
        { $group: { _id: null, totalUpvotes: { $sum: { $size: '$upvotes' } } } }
      ])
    ]);

    const totalUpvotes = upvoteCount.length > 0 ? upvoteCount[0].totalUpvotes : 0;

    res.json({
      users: userCount,
      projects: projectCount,
      comments: commentCount,
      upvotes: totalUpvotes,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
 
