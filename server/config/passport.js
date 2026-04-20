const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');

const createUsername = async (base) => {
  const sanitizedBase = (base || 'devhub_user')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 20) || 'devhub_user';

  let username = sanitizedBase;
  let suffix = 1;

  while (await User.exists({ username })) {
    username = `${sanitizedBase}_${suffix}`;
    suffix += 1;
  }

  return username;
};

const splitName = (displayName = '') => {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || 'DevHub',
    lastName: parts.slice(1).join(' ') || 'User',
  };
};

const upsertOAuthUser = async ({ provider, providerId, email, displayName, avatar, username }) => {
  const providerField = provider === 'google' ? 'googleId' : 'githubId';
  const existingUser = await User.findOne({
    $or: [
      { [providerField]: providerId },
      ...(email ? [{ email }] : []),
    ],
  });

  if (existingUser) {
    existingUser[providerField] = providerId;
    existingUser.displayName = existingUser.displayName || displayName || '';
    existingUser.avatar = existingUser.avatar || avatar || null;
    if (provider === 'github' && username && !existingUser.github) {
      existingUser.github = username;
    }
    await existingUser.save();
    return existingUser;
  }

  const name = splitName(displayName);
  return User.create({
    username: await createUsername(username || email?.split('@')[0] || displayName),
    email: email || `${provider}_${providerId}@devhub.local`,
    displayName: displayName || `${name.firstName} ${name.lastName}`,
    firstName: name.firstName,
    lastName: name.lastName,
    avatar: avatar || null,
    isVerified: true,
    [providerField]: providerId,
    ...(provider === 'github' && username ? { github: username } : {}),
  });
};

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const user = await upsertOAuthUser({
          provider: 'google',
          providerId: profile.id,
          email,
          displayName: profile.displayName,
          avatar: profile.photos?.[0]?.value,
        });
        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }
  ));
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:5000/api/auth/github/callback',
      scope: ['user:email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const primaryEmail = profile.emails?.find(email => email.primary)?.value || profile.emails?.[0]?.value;
        const user = await upsertOAuthUser({
          provider: 'github',
          providerId: profile.id,
          email: primaryEmail,
          displayName: profile.displayName || profile.username,
          avatar: profile.photos?.[0]?.value,
          username: profile.username,
        });
        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }
  ));
}

module.exports = passport;
