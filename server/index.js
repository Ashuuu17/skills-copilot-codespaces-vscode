require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const fileRoutes = require('./routes/files');
const authMiddleware = require('./middleware/auth');

const app = express();
const server = http.createServer(app);

// Socket.io setup with CORS
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      mediaSrc: ["'self'", "blob:"],
      connectSrc: ["'self'", "ws:", "wss:"]
    }
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rtc_app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Store active users and rooms
const activeUsers = new Map();
const rooms = new Map();

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join room
  socket.on('join-room', ({ roomId, userId, username }) => {
    socket.join(roomId);
    
    // Store user info
    activeUsers.set(socket.id, { userId, username, roomId });
    
    // Add user to room
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }
    rooms.get(roomId).add({
      socketId: socket.id,
      userId,
      username
    });

    // Notify other users in the room
    socket.to(roomId).emit('user-joined', {
      userId,
      username,
      socketId: socket.id
    });

    // Send current room users to the new user
    const roomUsers = Array.from(rooms.get(roomId) || []);
    socket.emit('room-users', roomUsers.filter(user => user.socketId !== socket.id));
  });

  // WebRTC signaling
  socket.on('offer', ({ offer, targetSocketId }) => {
    socket.to(targetSocketId).emit('offer', {
      offer,
      senderSocketId: socket.id
    });
  });

  socket.on('answer', ({ answer, targetSocketId }) => {
    socket.to(targetSocketId).emit('answer', {
      answer,
      senderSocketId: socket.id
    });
  });

  socket.on('ice-candidate', ({ candidate, targetSocketId }) => {
    socket.to(targetSocketId).emit('ice-candidate', {
      candidate,
      senderSocketId: socket.id
    });
  });

  // Screen sharing
  socket.on('start-screen-share', ({ roomId }) => {
    socket.to(roomId).emit('user-started-screen-share', {
      userId: activeUsers.get(socket.id)?.userId,
      socketId: socket.id
    });
  });

  socket.on('stop-screen-share', ({ roomId }) => {
    socket.to(roomId).emit('user-stopped-screen-share', {
      userId: activeUsers.get(socket.id)?.userId,
      socketId: socket.id
    });
  });

  // Whiteboard events
  socket.on('whiteboard-draw', ({ roomId, drawData }) => {
    socket.to(roomId).emit('whiteboard-draw', {
      drawData,
      userId: activeUsers.get(socket.id)?.userId
    });
  });

  socket.on('whiteboard-clear', ({ roomId }) => {
    socket.to(roomId).emit('whiteboard-clear', {
      userId: activeUsers.get(socket.id)?.userId
    });
  });

  // Chat messages
  socket.on('chat-message', ({ roomId, message }) => {
    const user = activeUsers.get(socket.id);
    if (user) {
      io.to(roomId).emit('chat-message', {
        message,
        username: user.username,
        userId: user.userId,
        timestamp: new Date().toISOString()
      });
    }
  });

  // File sharing
  socket.on('file-share', ({ roomId, fileData }) => {
    const user = activeUsers.get(socket.id);
    if (user) {
      socket.to(roomId).emit('file-shared', {
        fileData,
        sharedBy: user.username,
        userId: user.userId,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    const user = activeUsers.get(socket.id);
    if (user) {
      const { roomId, userId, username } = user;
      
      // Remove from room
      if (rooms.has(roomId)) {
        const roomUsers = rooms.get(roomId);
        for (let user of roomUsers) {
          if (user.socketId === socket.id) {
            roomUsers.delete(user);
            break;
          }
        }
        
        // Clean up empty rooms
        if (roomUsers.size === 0) {
          rooms.delete(roomId);
        }
      }
      
      // Notify other users
      socket.to(roomId).emit('user-left', {
        userId,
        username,
        socketId: socket.id
      });
      
      // Remove from active users
      activeUsers.delete(socket.id);
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});