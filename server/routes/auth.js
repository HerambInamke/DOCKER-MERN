const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const passport = require('../config/passport');

const router = express.Router();

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

const getClientAuthRedirect = (token) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  return `${clientUrl}/auth/callback?token=${encodeURIComponent(token)}`;
};

const requireOAuthConfig = (provider) => (req, res, next) => {
  const upperProvider = provider.toUpperCase();
  if (!process.env[`${upperProvider}_CLIENT_ID`] || !process.env[`${upperProvider}_CLIENT_SECRET`]) {
    const message = `${provider} login is not configured yet. Add ${upperProvider}_CLIENT_ID and ${upperProvider}_CLIENT_SECRET to server/.env.`;
    if (req.accepts('html')) {
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      return res.redirect(`${clientUrl}/login?error=${encodeURIComponent(message)}`);
    }
    return res.status(503).json({ message });
  }
  next();
};

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', [
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('displayName')
    .optional({ checkFalsy: true })
    .isLength({ max: 80 })
    .withMessage('Display name cannot exceed 80 characters'),
  body('firstName')
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ max: 50 })
    .withMessage('First name cannot exceed 50 characters'),
  body('lastName')
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ max: 50 })
    .withMessage('Last name cannot exceed 50 characters'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, firstName, lastName, displayName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        message: existingUser.email === email ? 'Email already registered' : 'Username already taken'
      });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      displayName: displayName || `${firstName} ${lastName}`,
      firstName,
      lastName,
    });

    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: user.getPublicProfile(),
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(400).json({ message: 'Account is deactivated' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: user.getPublicProfile(),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      user: req.user.getPublicProfile(),
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, [
  body('firstName')
    .optional()
    .isLength({ max: 50 })
    .withMessage('First name cannot exceed 50 characters'),
  body('lastName')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Last name cannot exceed 50 characters'),
  body('displayName')
    .optional({ checkFalsy: true })
    .isLength({ max: 80 })
    .withMessage('Display name cannot exceed 80 characters'),
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  body('location')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Location cannot exceed 100 characters'),
  body('college')
    .optional({ checkFalsy: true })
    .isLength({ max: 120 })
    .withMessage('College cannot exceed 120 characters'),
  body('website')
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage('Please enter a valid URL'),
  body('github')
    .optional({ checkFalsy: true })
    .matches(/^[a-zA-Z0-9-]+$/)
    .withMessage('Please enter a valid GitHub username'),
  body('twitter')
    .optional({ checkFalsy: true })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Please enter a valid Twitter username'),
  body('linkedin')
    .optional({ checkFalsy: true })
    .matches(/^[a-zA-Z0-9-]+$/)
    .withMessage('Please enter a valid LinkedIn username'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const allowedUpdates = [
      'displayName', 'firstName', 'lastName', 'bio', 'location', 'college', 'website',
      'github', 'twitter', 'linkedin', 'skills', 'preferences'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Profile updated successfully',
      user: user.getPublicProfile(),
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error during profile update' });
  }
});

// @route   GET /api/auth/google
// @desc    Start Google OAuth login/register
// @access  Public
router.get('/google', requireOAuthConfig('google'), passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false,
}));

// @route   GET /api/auth/google/callback
// @desc    Complete Google OAuth login/register
// @access  Public
router.get('/google/callback', requireOAuthConfig('google'), passport.authenticate('google', {
  session: false,
  failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=google_oauth_failed`,
}), (req, res) => {
  const token = generateToken(req.user._id);
  res.redirect(getClientAuthRedirect(token));
});

// @route   GET /api/auth/github
// @desc    Start GitHub OAuth login/register
// @access  Public
router.get('/github', requireOAuthConfig('github'), passport.authenticate('github', {
  scope: ['user:email'],
  session: false,
}));

// @route   GET /api/auth/github/callback
// @desc    Complete GitHub OAuth login/register
// @access  Public
router.get('/github/callback', requireOAuthConfig('github'), passport.authenticate('github', {
  session: false,
  failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=github_oauth_failed`,
}), (req, res) => {
  const token = generateToken(req.user._id);
  res.redirect(getClientAuthRedirect(token));
});

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', auth, [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ message: 'Server error during password change' });
  }
});

module.exports = router;
