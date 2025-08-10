# Development Guide

This guide provides detailed instructions for setting up and developing the Video Conference App.

## 🚀 Quick Setup

### Option 1: Automated Setup (Recommended)
```bash
# Make the script executable (if not already)
chmod +x start.sh

# Run the startup script
./start.sh
```

### Option 2: Manual Setup
Follow the step-by-step instructions below.

## 📋 Prerequisites

### Required Software
- **Node.js** (v16 or higher)
  ```bash
  # Check version
  node --version
  
  # Install via nvm (recommended)
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
  nvm install 16
  nvm use 16
  ```

- **npm** (comes with Node.js)
  ```bash
  # Check version
  npm --version
  ```

- **MongoDB** (local or cloud)
  ```bash
  # Local installation (Ubuntu/Debian)
  sudo apt update
  sudo apt install mongodb
  
  # Start MongoDB service
  sudo systemctl start mongod
  sudo systemctl enable mongod
  
  # Check status
  sudo systemctl status mongod
  ```

### Optional Software
- **Git** for version control
- **VS Code** with recommended extensions
- **Postman** or **Insomnia** for API testing

## 🔧 Environment Setup

### 1. Server Configuration

```bash
cd server

# Copy environment template
cp .env.example .env

# Edit the configuration
nano .env
```

**Required Environment Variables:**
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/video-conference-app

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-change-in-production

# File Upload Configuration
MAX_FILE_SIZE=52428800
UPLOAD_PATH=./uploads

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

### 2. Client Configuration

```bash
cd client

# Copy environment template
cp .env.example .env

# Edit the configuration
nano .env
```

**Required Environment Variables:**
```env
# API Configuration
REACT_APP_API_URL=http://localhost:5000/api

# Socket.io Configuration
REACT_APP_SOCKET_URL=http://localhost:5000

# App Configuration
REACT_APP_APP_NAME=Video Conference App
REACT_APP_APP_VERSION=1.0.0
```

## 📦 Dependency Installation

### Server Dependencies
```bash
cd server
npm install
```

**Key Dependencies:**
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT authentication
- `socket.io` - Real-time communication
- `multer` - File upload handling

### Client Dependencies
```bash
cd client
npm install
```

**Key Dependencies:**
- `react` - UI framework
- `tailwindcss` - CSS framework
- `framer-motion` - Animations
- `lucide-react` - Icons
- `react-router-dom` - Routing

## 🚀 Starting the Application

### Development Mode

#### Start Server
```bash
cd server
npm run dev
```

#### Start Client (in new terminal)
```bash
cd client
npm start
```

### Production Mode

#### Build Client
```bash
cd client
npm run build
```

#### Start Production Server
```bash
cd server
npm start
```

## 🧪 Testing

### Server Tests
```bash
cd server
npm test
```

### Client Tests
```bash
cd client
npm test
```

### API Testing
Use Postman or curl to test the API endpoints:

```bash
# Test server health
curl http://localhost:5000/api/health

# Test user registration
curl -X POST http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

## 🔍 Development Workflow

### 1. Code Structure
```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── contexts/      # React contexts for state
│   │   ├── hooks/         # Custom React hooks
│   │   ├── pages/         # Page components
│   │   ├── services/      # API service functions
│   │   └── utils/         # Utility functions
│   └── public/            # Static assets
├── server/                 # Node.js backend
│   ├── config/            # Configuration files
│   ├── middleware/        # Express middleware
│   ├── models/            # Mongoose data models
│   ├── routes/            # API route handlers
│   └── uploads/           # File upload directory
└── docs/                  # Documentation
```

### 2. Git Workflow
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "Add new feature"

# Push to remote
git push origin feature/new-feature

# Create pull request
# Merge to main branch
```

### 3. Code Quality
```bash
# Lint server code
cd server
npm run lint

# Lint client code
cd client
npm run lint

# Fix auto-fixable issues
npm run lint:fix
```

## 🐛 Debugging

### Server Debugging
```bash
# Enable debug logging
DEBUG=* npm run dev

# Use VS Code debugger
# Add breakpoints in server.js or route files
```

### Client Debugging
```bash
# Use React DevTools browser extension
# Enable React.StrictMode in index.js
# Use console.log and browser dev tools
```

### Database Debugging
```bash
# Connect to MongoDB shell
mongosh

# Show databases
show dbs

# Use database
use video-conference-app

# Show collections
show collections

# Query data
db.users.find()
```

## 📱 Feature Development

### Adding New Features

1. **Plan the Feature**
   - Define requirements
   - Design API endpoints
   - Plan UI components

2. **Backend First**
   - Create/update models
   - Implement API routes
   - Add validation
   - Write tests

3. **Frontend Integration**
   - Create UI components
   - Add state management
   - Implement API calls
   - Add error handling

4. **Testing**
   - Unit tests
   - Integration tests
   - User testing

### Common Patterns

#### API Response Format
```javascript
// Success response
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}

// Error response
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

#### Component Structure
```javascript
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const ComponentName = ({ prop1, prop2 }) => {
  const [state, setState] = useState(initialValue);
  
  useEffect(() => {
    // Side effects
  }, [dependencies]);
  
  const handleEvent = () => {
    // Event handling
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="component-classes"
    >
      {/* Component content */}
    </motion.div>
  );
};

export default ComponentName;
```

## 🔒 Security Considerations

### Authentication
- JWT tokens with expiration
- Password hashing with bcrypt
- Input validation and sanitization

### File Uploads
- File type validation
- Size limits
- Secure file storage

### API Security
- CORS configuration
- Rate limiting
- Input validation

## 🚀 Deployment

### Environment Variables
Ensure all production environment variables are set:
```bash
NODE_ENV=production
MONGO_URI=your-production-mongodb-uri
JWT_SECRET=your-production-jwt-secret
CORS_ORIGIN=your-production-domain
```

### Build Process
```bash
# Build client
cd client
npm run build

# Start production server
cd ../server
npm start
```

### Monitoring
- Use PM2 for process management
- Set up logging
- Monitor performance metrics

## 📚 Resources

### Documentation
- [React Documentation](https://reactjs.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/)
- [MongoDB Manual](https://docs.mongodb.com/manual/)
- [Socket.io Documentation](https://socket.io/docs/)

### Tools
- [Postman](https://www.postman.com/) - API testing
- [MongoDB Compass](https://www.mongodb.com/products/compass) - Database GUI
- [VS Code Extensions](https://marketplace.visualstudio.com/) - Development tools

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📞 Support

- Check existing issues
- Create new issue with details
- Join our community chat
- Review documentation

---

**Happy Developing! 🎉**