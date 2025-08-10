require('dotenv').config();

const config = {
  // Server Configuration
  server: {
    port: process.env.PORT || 5000,
    host: process.env.HOST || '0.0.0.0',
    environment: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000'
  },

  // Database Configuration
  database: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/video-conference-app',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: process.env.DB_MAX_POOL_SIZE || 10,
      serverSelectionTimeoutMS: process.env.DB_SERVER_SELECTION_TIMEOUT || 5000,
      socketTimeoutMS: process.env.DB_SOCKET_TIMEOUT || 45000,
      bufferMaxEntries: 0
    }
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-here-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    issuer: process.env.JWT_ISSUER || 'video-conference-app',
    audience: process.env.JWT_AUDIENCE || 'video-conference-users'
  },

  // File Upload Configuration
  fileUpload: {
    maxSize: parseInt(process.env.MAX_FILE_SIZE) || 52428800, // 50MB
    uploadPath: process.env.UPLOAD_PATH || './uploads',
    allowedTypes: [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'text/csv',
      'video/mp4', 'video/webm', 'video/ogg',
      'audio/mpeg', 'audio/wav', 'audio/ogg'
    ],
    maxFiles: parseInt(process.env.MAX_FILES_PER_UPLOAD) || 10
  },

  // Rate Limiting Configuration
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
  },

  // Security Configuration
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    sessionSecret: process.env.SESSION_SECRET || 'your-session-secret-here',
    cookieSecret: process.env.COOKIE_SECRET || 'your-cookie-secret-here',
    helmet: {
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
      }
    }
  },

  // WebRTC Configuration
  webrtc: {
    iceServers: [
      {
        urls: [
          'stun:stun.l.google.com:19302',
          'stun:stun1.l.google.com:19302',
          'stun:stun2.l.google.com:19302'
        ]
      }
    ],
    iceCandidatePoolSize: 10,
    bundlePolicy: 'balanced',
    rtcpMuxPolicy: 'require',
    iceTransportPolicy: 'all'
  },

  // Socket.io Configuration
  socket: {
    corsOrigin: process.env.SOCKET_CORS_ORIGIN || process.env.CORS_ORIGIN || 'http://localhost:3000',
    pingTimeout: parseInt(process.env.SOCKET_PING_TIMEOUT) || 60000,
    pingInterval: parseInt(process.env.SOCKET_PING_INTERVAL) || 25000,
    upgradeTimeout: parseInt(process.env.SOCKET_UPGRADE_TIMEOUT) || 10000,
    maxHttpBufferSize: parseInt(process.env.SOCKET_MAX_HTTP_BUFFER_SIZE) || 1e6
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined',
    directory: process.env.LOG_DIRECTORY || './logs',
    maxSize: process.env.LOG_MAX_SIZE || '20m',
    maxFiles: process.env.LOG_MAX_FILES || '14d'
  },

  // Email Configuration (for future use)
  email: {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  },

  // Redis Configuration (for future use)
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB) || 0
  },

  // AWS S3 Configuration (for future use)
  s3: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1',
    bucket: process.env.AWS_S3_BUCKET
  },

  // Feature Flags
  features: {
    recording: process.env.ENABLE_RECORDING !== 'false',
    whiteboard: process.env.ENABLE_WHITEBOARD !== 'false',
    fileSharing: process.env.ENABLE_FILE_SHARING !== 'false',
    screenSharing: process.env.ENABLE_SCREEN_SHARING !== 'false',
    chat: process.env.ENABLE_CHAT !== 'false',
    breakoutRooms: process.env.ENABLE_BREAKOUT_ROOMS === 'true',
    analytics: process.env.ENABLE_ANALYTICS === 'true'
  },

  // Room Configuration
  rooms: {
    maxParticipants: parseInt(process.env.MAX_ROOM_PARTICIPANTS) || 50,
    maxRoomsPerUser: parseInt(process.env.MAX_ROOMS_PER_USER) || 10,
    defaultSettings: {
      allowChat: true,
      allowScreenShare: true,
      allowRecording: false,
      allowWhiteboard: true,
      requirePassword: false,
      maxDuration: 24 * 60 * 60 * 1000 // 24 hours in milliseconds
    }
  },

  // User Configuration
  users: {
    maxAvatarSize: parseInt(process.env.MAX_AVATAR_SIZE) || 5 * 1024 * 1024, // 5MB
    allowedAvatarTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    defaultAvatar: process.env.DEFAULT_AVATAR || '/default-avatar.png',
    maxBioLength: parseInt(process.env.MAX_BIO_LENGTH) || 500
  },

  // Validation Configuration
  validation: {
    password: {
      minLength: parseInt(process.env.PASSWORD_MIN_LENGTH) || 6,
      requireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE !== 'false',
      requireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE !== 'false',
      requireNumbers: process.env.PASSWORD_REQUIRE_NUMBERS !== 'false',
      requireSpecialChars: process.env.PASSWORD_REQUIRE_SPECIAL_CHARS === 'true'
    },
    username: {
      minLength: parseInt(process.env.USERNAME_MIN_LENGTH) || 3,
      maxLength: parseInt(process.env.USERNAME_MAX_LENGTH) || 30,
      allowedChars: /^[a-zA-Z0-9_-]+$/
    }
  },

  // Performance Configuration
  performance: {
    compression: {
      level: parseInt(process.env.COMPRESSION_LEVEL) || 6,
      threshold: parseInt(process.env.COMPRESSION_THRESHOLD) || 1024
    },
    timeout: {
      server: parseInt(process.env.SERVER_TIMEOUT) || 30000,
      socket: parseInt(process.env.SOCKET_TIMEOUT) || 20000
    }
  }
};

// Environment-specific overrides
if (config.server.environment === 'production') {
  config.security.helmet.contentSecurityPolicy.directives.connectSrc.push('https:');
  config.logging.level = 'warn';
  config.features.analytics = true;
}

if (config.server.environment === 'test') {
  config.database.uri = process.env.TEST_MONGO_URI || 'mongodb://localhost:27017/video-conference-test';
  config.logging.level = 'error';
  config.features.recording = false;
  config.features.analytics = false;
}

// Validation
const validateConfig = () => {
  const required = ['JWT_SECRET'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn(`⚠️  Warning: Missing required environment variables: ${missing.join(', ')}`);
    
    if (config.server.environment === 'production') {
      console.error('❌ Production environment requires all environment variables to be set');
      process.exit(1);
    }
  }
  
  // Validate JWT secret strength in production
  if (config.server.environment === 'production' && config.jwt.secret.length < 32) {
    console.error('❌ JWT_SECRET must be at least 32 characters long in production');
    process.exit(1);
  }
  
  console.log('✅ Configuration validation passed');
};

// Initialize configuration
validateConfig();

module.exports = config;