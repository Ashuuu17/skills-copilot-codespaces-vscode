const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom token for request body size
morgan.token('body-size', (req) => {
  if (req.body) {
    return JSON.stringify(req.body).length;
  }
  return 0;
});

// Custom token for response time in milliseconds
morgan.token('response-time-ms', (req, res) => {
  if (!res._header || !req._startAt) return '';
  const diff = process.hrtime(req._startAt);
  const ms = diff[0] * 1e3 + diff[1] * 1e-6;
  return ms.toFixed(2);
});

// Custom token for user agent
morgan.token('user-agent', (req) => {
  return req.get('User-Agent') || 'Unknown';
});

// Custom token for IP address
morgan.token('ip', (req) => {
  return req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'Unknown';
});

// Custom token for user ID (if authenticated)
morgan.token('user-id', (req) => {
  return req.user ? req.user.id : 'Anonymous';
});

// Custom token for request method and status
morgan.token('method-status', (req, res) => {
  const method = req.method;
  const status = res.statusCode;
  let color = '\x1b[0m'; // Reset
  
  if (status >= 500) color = '\x1b[31m'; // Red for server errors
  else if (status >= 400) color = '\x1b[33m'; // Yellow for client errors
  else if (status >= 300) color = '\x1b[36m'; // Cyan for redirects
  else if (status >= 200) color = '\x1b[32m'; // Green for success
  
  return `${color}${method} ${status}\x1b[0m`;
});

// Development logging format
const devFormat = ':method-status :url :response-time-ms ms - :user-id - :ip';

// Production logging format (more detailed)
const prodFormat = ':method :url :status :response-time-ms ms :body-size bytes :user-id :ip :user-agent';

// Create write streams for different log types
const accessLogStream = fs.createWriteStream(
  path.join(logsDir, 'access.log'),
  { flags: 'a' }
);

const errorLogStream = fs.createWriteStream(
  path.join(logsDir, 'error.log'),
  { flags: 'a' }
);

const combinedLogStream = fs.createWriteStream(
  path.join(logsDir, 'combined.log'),
  { flags: 'a' }
);

// Development logger
const devLogger = morgan(devFormat, {
  skip: (req, res) => res.statusCode < 400, // Only log errors in dev
  stream: process.stdout
});

// Production access logger
const accessLogger = morgan(prodFormat, {
  stream: accessLogStream
});

// Production combined logger
const combinedLogger = morgan('combined', {
  stream: combinedLogStream
});

// Error logger (only for errors)
const errorLogger = morgan(prodFormat, {
  skip: (req, res) => res.statusCode < 400, // Only log errors
  stream: errorLogStream
});

// Custom logging middleware for additional request information
const requestLogger = (req, res, next) => {
  // Add timestamp to request
  req._startAt = process.hrtime();
  
  // Log request start
  console.log(`\n🚀 ${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  // Log request details in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`📝 Request Headers:`, req.headers);
    if (req.body && Object.keys(req.body).length > 0) {
      console.log(`📦 Request Body:`, req.body);
    }
    if (req.query && Object.keys(req.query).length > 0) {
      console.log(`🔍 Query Params:`, req.query);
    }
  }
  
  // Log response when finished
  res.on('finish', () => {
    const duration = process.hrtime(req._startAt);
    const ms = duration[0] * 1e3 + duration[1] * 1e-6;
    
    const statusColor = res.statusCode >= 400 ? '\x1b[31m' : '\x1b[32m';
    const resetColor = '\x1b[0m';
    
    console.log(`✅ ${statusColor}${res.statusCode}${resetColor} - ${req.method} ${req.url} - ${ms.toFixed(2)}ms`);
    
    // Log response details in development
    if (process.env.NODE_ENV === 'development' && res.statusCode >= 400) {
      console.log(`❌ Error Response:`, res.locals.error || 'No error details');
    }
  });
  
  next();
};

// Error logging middleware
const errorLoggerMiddleware = (err, req, res, next) => {
  const timestamp = new Date().toISOString();
  const errorLog = {
    timestamp,
    method: req.method,
    url: req.url,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    userId: req.user ? req.user.id : 'Anonymous',
    error: {
      message: err.message,
      stack: err.stack,
      name: err.name
    },
    requestBody: req.body,
    requestQuery: req.query,
    requestHeaders: req.headers
  };
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error occurred:', errorLog);
  }
  
  // Write to error log file
  const errorLogEntry = `${timestamp} - ${req.method} ${req.url} - ${err.message}\n`;
  fs.appendFileSync(path.join(logsDir, 'error.log'), errorLogEntry);
  
  // Pass error to next middleware
  next(err);
};

// Performance monitoring middleware
const performanceLogger = (req, res, next) => {
  const start = process.hrtime();
  
  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(start);
    const duration = seconds * 1000 + nanoseconds / 1000000; // Convert to milliseconds
    
    // Log slow requests (> 1 second)
    if (duration > 1000) {
      console.warn(`🐌 Slow request detected: ${req.method} ${req.url} took ${duration.toFixed(2)}ms`);
      
      // Log to performance log file
      const perfLog = `${new Date().toISOString()} - SLOW REQUEST: ${req.method} ${req.url} - ${duration.toFixed(2)}ms\n`;
      fs.appendFileSync(path.join(logsDir, 'performance.log'), perfLog);
    }
    
    // Log very slow requests (> 5 seconds)
    if (duration > 5000) {
      console.error(`🚨 Very slow request: ${req.method} ${req.url} took ${duration.toFixed(2)}ms`);
      
      // Log to error log file
      const errorLog = `${new Date().toISOString()} - VERY SLOW REQUEST: ${req.method} ${req.url} - ${duration.toFixed(2)}ms\n`;
      fs.appendFileSync(path.join(logsDir, 'error.log'), errorLog);
    }
  });
  
  next();
};

// Export appropriate logger based on environment
const getLogger = () => {
  if (process.env.NODE_ENV === 'production') {
    return {
      access: accessLogger,
      combined: combinedLogger,
      error: errorLogger,
      request: requestLogger,
      performance: performanceLogger,
      errorMiddleware: errorLoggerMiddleware
    };
  } else {
    return {
      access: devLogger,
      combined: devLogger,
      error: devLogger,
      request: requestLogger,
      performance: performanceLogger,
      errorMiddleware: errorLoggerMiddleware
    };
  }
};

module.exports = getLogger();