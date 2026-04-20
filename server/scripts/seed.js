require('dotenv').config();

const mongoose = require('mongoose');
const User = require('../models/User');
const Project = require('../models/Project');
const Comment = require('../models/Comment');

const users = [
  {
    username: 'maya_frontend',
    email: 'maya@example.com',
    password: 'password123',
    firstName: 'Maya',
    lastName: 'Shah',
    bio: 'Frontend engineer building useful React interfaces with clean data flows.',
    location: 'Pune, India',
    github: 'maya-shah',
    twitter: 'maya_codes',
    linkedin: 'maya-shah',
    website: 'https://example.com',
    skills: ['React', 'Tailwind CSS', 'Vite', 'Accessibility'],
  },
  {
    username: 'arjun_api',
    email: 'arjun@example.com',
    password: 'password123',
    firstName: 'Arjun',
    lastName: 'Rao',
    bio: 'Backend developer focused on APIs, MongoDB, and developer platforms.',
    location: 'Bengaluru, India',
    github: 'arjun-rao',
    skills: ['Node.js', 'Express', 'MongoDB', 'Docker'],
  },
  {
    username: 'nisha_fullstack',
    email: 'nisha@example.com',
    password: 'password123',
    firstName: 'Nisha',
    lastName: 'Kapoor',
    bio: 'Full-stack maker shipping small products with polished workflows.',
    location: 'Mumbai, India',
    github: 'nisha-kapoor',
    linkedin: 'nisha-kapoor',
    skills: ['React', 'Node.js', 'MongoDB', 'Product Design'],
  },
];

const projectTemplates = [
  {
    author: 'maya_frontend',
    title: 'LaunchBoard',
    shortDescription: 'A kanban-style launch tracker for indie product teams.',
    description:
      'LaunchBoard helps small teams track product launches from idea to post-launch review. It includes status columns, simple metrics, and a focused review checklist.',
    githubUrl: 'https://github.com/maya-shah/launchboard',
    liveUrl: 'https://launchboard.example.com',
    tags: ['productivity', 'dashboard', 'kanban'],
    technologies: ['React', 'Tailwind CSS', 'Vite'],
    views: 128,
    metrics: { upvoteCount: 12, commentCount: 0, shareCount: 3 },
  },
  {
    author: 'arjun_api',
    title: 'API Pulse',
    shortDescription: 'A lightweight API health monitor with history and alerts.',
    description:
      'API Pulse checks service health, stores response timings, and exposes a clean dashboard for uptime and recent incidents.',
    githubUrl: 'https://github.com/arjun-rao/api-pulse',
    liveUrl: 'https://api-pulse.example.com',
    tags: ['monitoring', 'api', 'devops'],
    technologies: ['Node.js', 'Express', 'MongoDB', 'Docker'],
    views: 214,
    metrics: { upvoteCount: 24, commentCount: 0, shareCount: 5 },
  },
  {
    author: 'nisha_fullstack',
    title: 'Snippet Studio',
    shortDescription: 'A searchable code snippet library for teams.',
    description:
      'Snippet Studio lets developers save reusable snippets, tag them by stack, and discover team-approved examples quickly.',
    githubUrl: 'https://github.com/nisha-kapoor/snippet-studio',
    liveUrl: 'https://snippet-studio.example.com',
    tags: ['developer-tools', 'search', 'knowledge-base'],
    technologies: ['React', 'Node.js', 'Express', 'MongoDB'],
    views: 342,
    metrics: { upvoteCount: 31, commentCount: 0, shareCount: 8 },
  },
  {
    author: 'maya_frontend',
    title: 'A11y Notes',
    shortDescription: 'A practical accessibility checklist app for UI reviews.',
    description:
      'A11y Notes turns accessibility review into reusable checklists for forms, navigation, contrast, keyboard flows, and content structure.',
    githubUrl: 'https://github.com/maya-shah/a11y-notes',
    liveUrl: '',
    tags: ['accessibility', 'frontend', 'checklist'],
    technologies: ['React', 'Tailwind CSS'],
    views: 89,
    metrics: { upvoteCount: 9, commentCount: 0, shareCount: 1 },
  },
  {
    author: 'arjun_api',
    title: 'Docker MERN Starter',
    shortDescription: 'A Docker-first MERN starter with separate dev and production flows.',
    description:
      'This starter includes a React client, Express API, MongoDB, Mongo Express, and production Nginx setup so teams can start with a consistent local environment.',
    githubUrl: 'https://github.com/arjun-rao/docker-mern-starter',
    liveUrl: '',
    tags: ['mern', 'docker', 'starter'],
    technologies: ['Docker', 'React', 'Express', 'MongoDB'],
    views: 177,
    metrics: { upvoteCount: 18, commentCount: 0, shareCount: 4 },
  },
  {
    author: 'nisha_fullstack',
    title: 'Portfolio Signals',
    shortDescription: 'A profile analytics dashboard for developer portfolios.',
    description:
      'Portfolio Signals aggregates public project metrics, profile activity, and technology tags into a clean profile overview.',
    githubUrl: 'https://github.com/nisha-kapoor/portfolio-signals',
    liveUrl: 'https://portfolio-signals.example.com',
    tags: ['portfolio', 'analytics', 'profile'],
    technologies: ['React', 'Express', 'MongoDB', 'Recharts'],
    views: 156,
    metrics: { upvoteCount: 16, commentCount: 0, shareCount: 2 },
  },
];

const comments = [
  'This is a clean idea. The project scope feels practical.',
  'Nice work. The GitHub repo gives enough context to understand the stack.',
  'I like how focused this is. Would be useful for small teams.',
];

const seed = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required. Start MongoDB and check server/.env first.');
  }

  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });

  await Promise.all([
    User.deleteMany({ email: { $in: users.map(user => user.email) } }),
    Project.deleteMany({ githubUrl: { $in: projectTemplates.map(project => project.githubUrl) } }),
    Comment.deleteMany({ content: { $in: comments } }),
  ]);

  const createdUsers = {};
  for (const userData of users) {
    const user = new User(userData);
    await user.save();
    createdUsers[user.username] = user;
  }

  for (const template of projectTemplates) {
    const project = new Project({
      ...template,
      author: createdUsers[template.author]._id,
      status: 'published',
      visibility: 'public',
      upvotes: Object.values(createdUsers)
        .filter(user => user.username !== template.author)
        .slice(0, Math.min(2, template.metrics.upvoteCount))
        .map(user => ({ user: user._id })),
    });

    project.metrics.upvoteCount = project.upvotes.length;
    await project.save();

    const commentDocs = await Promise.all(
      comments.slice(0, 2).map((content, index) => {
        const author = Object.values(createdUsers)[index];
        return Comment.create({
          content,
          author: author._id,
          project: project._id,
        });
      })
    );

    project.comments = commentDocs.map(comment => comment._id);
    project.metrics.commentCount = commentDocs.length;
    await project.save();
  }

  console.log('Seed complete.');
  console.log('Try logging in with maya@example.com / password123');
  await mongoose.disconnect();
};

seed().catch(async error => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
