const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const http = require('http');

// Import configuration
const config = require('./config/config');

// Import middleware
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');
const { accessLogger, errorLoggerMiddleware, performanceLogger } = require('./middleware/logger');

// Import services
const SocketService = require('./services/SocketService');
const WebRTCService = require('./services/WebRTCService');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const roomRoutes = require('./routes/roomRoutes');
const healthRoutes = require('./routes/healthRoutes');

// Import models
const User = require('./models/User');
const Room = require('./models/Room');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.io service
const socketService = new SocketService(server);
const webRTCService = new WebRTCService();

// Connect to MongoDB
mongoose.connect(config.database.uri, config.database.options)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    
    // Create indexes if they don't exist
    return Promise.all([
      User.createIndexes(),
      Room.createIndexes()
    ]);
  })
  .then(() => {
    console.log('✅ Database indexes created');
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "ws:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: config.server.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: config.fileUpload.maxSize }));
app.use(express.urlencoded({ extended: true, limit: config.fileUpload.maxSize }));

// Logging middleware
app.use(accessLogger);
app.use(performanceLogger);

// Rate limiting middleware
app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);

// Static file serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Health check endpoint (no rate limiting)
app.use('/health', healthRoutes);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rooms', roomRoutes);

// WebSocket connection endpoint
app.get('/socket.io/', (req, res) => {
  res.send('WebSocket endpoint');
});

// Error handling middleware
app.use(errorLoggerMiddleware);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
      path: req.originalUrl
    }
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const validationErrors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));

    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: validationErrors
      }
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      error: {
        code: 'CONFLICT',
        message: `${field} already exists`,
        field: field
      }
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_ERROR',
        message: 'Invalid token'
      }
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_ERROR',
        message: 'Token expired'
      }
    });
  }

  // Default error
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: config.server.nodeEnv === 'production' 
        ? 'Internal server error' 
        : err.message
    }
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  
  server.close(() => {
    console.log('HTTP server closed');
    
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  
  server.close(() => {
    console.log('HTTP server closed');
    
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});

// Start server
const PORT = config.server.port;
const HOST = config.server.host;

server.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
  console.log(`📊 Environment: ${config.server.nodeEnv}`);
  console.log(`🔌 WebSocket endpoint: ws://${HOST}:${PORT}`);
  console.log(`📁 Upload directory: ${path.join(__dirname, 'uploads')}`);
  console.log(`📝 Logs directory: ${path.join(__dirname, 'logs')}`);
  
  // Initialize Socket.io after server starts
  socketService.initialize();
  
  // Log startup time
  const startupTime = Date.now();
  console.log(`⏱️  Startup time: ${Date.now() - startupTime}ms`);
});

// Export for testing
module.exports = { app, server };