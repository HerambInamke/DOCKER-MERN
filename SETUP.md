# DevHub Setup Guide

## Quick Start

### Option 1: Docker (Recommended)
```bash
# Windows
start-docker.bat

# Linux/Mac
chmod +x start-docker.sh
./start-docker.sh
```

### Option 2: Manual Setup
```bash
# Windows
start-dev.bat

# Linux/Mac
make dev
```

## Manual Installation

### Prerequisites
- Node.js 18+ 
- MongoDB (or use Docker)
- Git

### Step 1: Install Dependencies
```bash
# Backend
cd server
npm install

# Frontend  
cd ../client
npm install
```

### Step 2: Environment Setup
```bash
# Copy environment files
cp server/.env.example server/.env
cp client/.env.example client/.env
```

### Step 3: Start MongoDB
```bash
# Option A: Local MongoDB
mongod

# Option B: Docker MongoDB
docker run -d -p 27017:27017 --name mongodb mongo:7.0
```

### Step 4: Start Services
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client  
npm run dev
```

## Access Points
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **MongoDB Admin**: http://localhost:8081 (if using Docker)

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Kill processes on ports
   npx kill-port 5000 5173 27017
   ```

2. **MongoDB connection failed**
   - Check if MongoDB is running
   - Verify connection string in server/.env

3. **Dependencies not installed**
   ```bash
   # Clear cache and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Docker issues**
   ```bash
   # Clean Docker
   docker-compose down -v
   docker system prune -f
   ```

## Features Available

✅ **User Authentication**
- Register/Login with email/password
- JWT token-based authentication
- Protected routes

✅ **Project Management**
- Create, edit, delete projects
- Upload project images
- GitHub repository links
- Live demo URLs

✅ **Social Features**
- User profiles
- Follow/unfollow users
- Upvote projects
- Comment on projects

✅ **Discovery**
- Browse all projects
- Search and filter
- User profiles
- Project details

✅ **Responsive Design**
- Mobile-friendly
- Modern UI with Tailwind CSS
- Dark/light theme support

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Projects
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get single project
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `POST /api/projects/:id/upvote` - Upvote project

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:username` - Get user profile
- `POST /api/users/:id/follow` - Follow user

### Comments
- `GET /api/projects/:id/comments` - Get project comments
- `POST /api/projects/:id/comments` - Add comment
- `PUT /api/comments/:id` - Update comment
- `DELETE /api/comments/:id` - Delete comment

## Development

### File Structure
```
DOCKER-MERN/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React context
│   │   └── utils/         # Utilities
├── server/               # Node.js backend
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── middleware/       # Custom middleware
│   └── uploads/         # File uploads
├── docker-compose.yml    # Production setup
└── docker-compose.dev.yml # Development setup
```

### Adding New Features

1. **Backend**: Add routes in `server/routes/`
2. **Frontend**: Add pages in `client/src/pages/`
3. **Database**: Update models in `server/models/`
4. **API**: Update client API calls in `client/src/utils/api.js`

## Production Deployment

### Environment Variables
```env
# Production .env
NODE_ENV=production
MONGODB_URI=mongodb://your-production-db
JWT_SECRET=your-production-secret
CLIENT_URL=https://your-domain.com
```

### Docker Production
```bash
docker-compose up --build -d
```

### Manual Production
```bash
# Build frontend
cd client
npm run build

# Start backend
cd ../server
npm start
```

## Support

If you encounter issues:
1. Check the console for errors
2. Verify all services are running
3. Check environment variables
4. Review the logs in terminal

For more help, check the main README.md file.
