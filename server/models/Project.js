const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Project title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters'],
  },
  description: {
    type: String,
    required: [true, 'Project description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
  },
  shortDescription: {
    type: String,
    required: [true, 'Short description is required'],
    maxlength: [200, 'Short description cannot exceed 200 characters'],
  },
  githubUrl: {
    type: String,
    required: [true, 'GitHub URL is required'],
    match: [/^https:\/\/github\.com\/[a-zA-Z0-9-]+\/[a-zA-Z0-9._-]+$/, 'Please enter a valid GitHub URL'],
  },
  liveUrl: {
    type: String,
    match: [/^https?:\/\/.+/, 'Please enter a valid URL'],
    default: '',
  },
  images: [{
    url: {
      type: String,
      required: true,
    },
    alt: {
      type: String,
      default: '',
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],
  technologies: [{
    type: String,
    trim: true,
  }],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
  },
  visibility: {
    type: String,
    enum: ['public', 'private'],
    default: 'public',
  },
  featured: {
    type: Boolean,
    default: false,
  },
  upvotes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  views: {
    type: Number,
    default: 0,
  },
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
  }],
  collaborators: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    role: {
      type: String,
      enum: ['contributor', 'co-author'],
      default: 'contributor',
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  metrics: {
    upvoteCount: {
      type: Number,
      default: 0,
    },
    commentCount: {
      type: Number,
      default: 0,
    },
    shareCount: {
      type: Number,
      default: 0,
    },
  },
}, {
  timestamps: true,
});

// Indexes for better performance
projectSchema.index({ author: 1 });
projectSchema.index({ tags: 1 });
projectSchema.index({ technologies: 1 });
projectSchema.index({ status: 1, visibility: 1 });
projectSchema.index({ 'metrics.upvoteCount': -1 });
projectSchema.index({ createdAt: -1 });

// Text search index
projectSchema.index({
  title: 'text',
  description: 'text',
  shortDescription: 'text',
  tags: 'text',
  technologies: 'text'
}, {
  weights: {
    title: 10,
    shortDescription: 5,
    tags: 3,
    technologies: 2,
    description: 1
  },
  name: 'project_text_search'
});

// Virtual for upvote count
projectSchema.virtual('upvoteCount').get(function() {
  return this.upvotes.length;
});

// Virtual for comment count
projectSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Method to check if user has upvoted
projectSchema.methods.hasUserUpvoted = function(userId) {
  return this.upvotes.some(upvote => upvote.user.toString() === userId.toString());
};

// Method to add upvote
projectSchema.methods.addUpvote = function(userId) {
  if (!this.hasUserUpvoted(userId)) {
    this.upvotes.push({ user: userId });
    this.metrics.upvoteCount = this.upvotes.length;
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to remove upvote
projectSchema.methods.removeUpvote = function(userId) {
  this.upvotes = this.upvotes.filter(upvote => upvote.user.toString() !== userId.toString());
  this.metrics.upvoteCount = this.upvotes.length;
  return this.save();
};

// Method to increment views
projectSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

module.exports = mongoose.model('Project', projectSchema);
 
