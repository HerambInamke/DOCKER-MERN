# 🚀 DevHub Quick Start Guide

## What You Get

A complete social platform for developers with:
- ✅ User authentication (register/login)
- ✅ Project management (create, edit, showcase)
- ✅ Social features (follow, upvote, comment)
- ✅ User profiles and portfolios
- ✅ Search and discovery
- ✅ Responsive design
- ✅ Docker support

## 🏃‍♂️ Quick Start (3 Options)

### Option 1: Docker (Easiest)
```bash
# Windows
start-docker.bat

# Linux/Mac
./start-docker.sh
```

### Option 2: Manual Setup
```bash
# Windows
start-dev.bat

# Linux/Mac
make dev
```

### Option 3: Step by Step
```bash
# 1. Install dependencies
cd server && npm install
cd ../client && npm install

# 2. Start MongoDB (if not using Docker)
# Option A: Local MongoDB
mongod

# Option B: Docker MongoDB
docker run -d -p 27017:27017 --name mongodb mongo:7.0

# 3. Start backend
cd server && npm run dev

# 4. Start frontend (new terminal)
cd client && npm run dev
```

## 🌐 Access Your App

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **MongoDB Admin**: http://localhost:8081 (Docker only)

## 🎯 First Steps

1. **Open** http://localhost:5173
2. **Register** a new account
3. **Create** your first project
4. **Explore** other users and projects
5. **Customize** your profile

## 🔧 Configuration

### Environment Files
- `server/.env` - Backend configuration
- `client/.env` - Frontend configuration

### Key Settings
```env
# server/.env
MONGODB_URI=mongodb://localhost:27017/devhub
JWT_SECRET=your-secret-key
PORT=5000

# client/.env  
VITE_API_URL=http://localhost:5000
```

## 🐛 Troubleshooting

### Port Issues
```bash
# Kill processes on ports
npx kill-port 5000 5173 27017
```

### MongoDB Issues
```bash
# Check if MongoDB is running
mongosh --eval "db.adminCommand('ping')"
```

### Docker Issues
```bash
# Clean Docker
docker-compose down -v
docker system prune -f
```

### Dependency Issues
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📱 Features Available

### Authentication
- User registration and login
- JWT-based authentication
- Protected routes

### Projects
- Create and manage projects
- Upload project images
- GitHub repository links
- Live demo URLs
- Tags and technologies

### Social Features
- User profiles
- Follow/unfollow users
- Upvote projects
- Comment system
- User discovery

### UI/UX
- Responsive design
- Modern Tailwind CSS
- Dark/light themes
- Mobile-friendly

## 🚀 Production Deployment

### Docker Production
```bash
docker-compose up --build -d
```

### Manual Production
```bash
# Build frontend
cd client && npm run build

# Start backend
cd ../server && npm start
```

## 📚 API Documentation

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Projects
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get single project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:username` - Get user profile
- `POST /api/users/:id/follow` - Follow user

## 🎉 You're Ready!

Your DevHub platform is now running! Start building your developer community.

For detailed documentation, see `README.md` and `SETUP.md`.
 
