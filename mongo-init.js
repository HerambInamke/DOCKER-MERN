// MongoDB initialization script
db = db.getSiblingDB('devhub');

// Create collections
db.createCollection('users');
db.createCollection('projects');
db.createCollection('comments');

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "username": 1 }, { unique: true });
db.users.createIndex({ "github": 1 });
db.users.createIndex({ "skills": 1 });

db.projects.createIndex({ "author": 1 });
db.projects.createIndex({ "tags": 1 });
db.projects.createIndex({ "technologies": 1 });
db.projects.createIndex({ "status": 1, "visibility": 1 });
db.projects.createIndex({ "metrics.upvoteCount": -1 });
db.projects.createIndex({ "createdAt": -1 });

db.comments.createIndex({ "project": 1, "createdAt": -1 });
db.comments.createIndex({ "author": 1 });
db.comments.createIndex({ "parentComment": 1 });

print('Database initialized successfully');
