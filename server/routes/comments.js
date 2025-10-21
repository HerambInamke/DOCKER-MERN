const express = require('express');
const { body, validationResult } = require('express-validator');
const Comment = require('../models/Comment');
const Project = require('../models/Project');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/projects/:projectId/comments
// @desc    Get comments for a project with threading (max 2 levels)
// @access  Public
router.get('/projects/:projectId/comments', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Get top-level comments (no parent)
    const topLevelComments = await Comment.find({
      project: req.params.projectId,
      parentComment: null,
      isDeleted: false,
    })
      .populate('author', 'username firstName lastName avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get replies for each top-level comment (max 2 levels deep)
    const commentsWithReplies = await Promise.all(
      topLevelComments.map(async (comment) => {
        const replies = await Comment.find({
          parentComment: comment._id,
          isDeleted: false,
        })
          .populate('author', 'username firstName lastName avatar')
          .populate({
            path: 'replies',
            populate: {
              path: 'author',
              select: 'username firstName lastName avatar',
            },
          })
          .sort({ createdAt: 1 }) // Show replies in chronological order
          .limit(10) // Limit replies per comment
          .lean();

        return {
          ...comment,
          replies
        };
      })
    );

    const total = await Comment.countDocuments({
      project: req.params.projectId,
      parentComment: null,
      isDeleted: false,
    });

    res.json({
      comments: commentsWithReplies,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/projects/:projectId/comments
// @desc    Create new comment
// @access  Private
router.post('/projects/:projectId/comments', auth, [
  body('content')
    .notEmpty()
    .withMessage('Comment content is required')
    .isLength({ max: 1000 })
    .withMessage('Comment cannot exceed 1000 characters'),
  body('parentComment')
    .optional()
    .isMongoId()
    .withMessage('Invalid parent comment ID'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if project exists
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const commentData = {
      content: req.body.content,
      author: req.user._id,
      project: req.params.projectId,
      parentComment: req.body.parentComment || null,
    };

    const comment = new Comment(commentData);
    await comment.save();

    // If it's a reply, add to parent comment's replies and create notification
    if (req.body.parentComment) {
      const parentComment = await Comment.findById(req.body.parentComment).populate('author');
      if (parentComment) {
        parentComment.replies.push(comment._id);
        parentComment.metrics.replyCount = parentComment.replies.length;
        await parentComment.save();

        // Create notification for parent comment author (if not the same user)
        if (parentComment.author._id.toString() !== req.user._id.toString()) {
          const Project = require('../models/Project');
          const project = await Project.findById(req.params.projectId);
          const NotificationService = require('../services/notificationService');
          
          await NotificationService.createReplyNotification(
            parentComment.author._id,
            req.user,
            project,
            comment
          );
        }
      }
    }

    // Update project comment count
    project.comments.push(comment._id);
    project.metrics.commentCount = project.comments.length;
    await project.save();

    const populatedComment = await Comment.findById(comment._id)
      .populate('author', 'username firstName lastName avatar');

    res.status(201).json({
      message: 'Comment created successfully',
      comment: populatedComment,
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ message: 'Server error during comment creation' });
  }
});

// @route   PUT /api/comments/:id
// @desc    Update comment
// @access  Private
router.put('/:id', auth, [
  body('content')
    .notEmpty()
    .withMessage('Comment content is required')
    .isLength({ max: 1000 })
    .withMessage('Comment cannot exceed 1000 characters'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user is the author
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this comment' });
    }

    await comment.editComment(req.body.content);

    const updatedComment = await Comment.findById(comment._id)
      .populate('author', 'username firstName lastName avatar');

    res.json({
      message: 'Comment updated successfully',
      comment: updatedComment,
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ message: 'Server error during comment update' });
  }
});

// @route   DELETE /api/comments/:id
// @desc    Delete comment
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user is the author or admin/moderator
    if (comment.author.toString() !== req.user._id.toString() && 
        !['admin', 'moderator'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    await comment.softDelete();

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ message: 'Server error during comment deletion' });
  }
});

// @route   POST /api/comments/:id/like
// @desc    Like/unlike comment
// @access  Private
router.post('/:id/like', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const hasLiked = comment.hasUserLiked(req.user._id);

    if (hasLiked) {
      await comment.removeLike(req.user._id);
      res.json({ message: 'Like removed', liked: false });
    } else {
      await comment.addLike(req.user._id);
      res.json({ message: 'Comment liked', liked: true });
    }
  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({ message: 'Server error during like' });
  }
});

module.exports = router;
