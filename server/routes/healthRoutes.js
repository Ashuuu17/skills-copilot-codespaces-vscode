const express = require('express');
const mongoose = require('mongoose');
const os = require('os');
const path = require('path');
const fs = require('fs').promises;

const router = express.Router();

// @route   GET /api/health
// @desc    Basic health check
// @access  Public
router.get('/', async (req, res) => {
  try {
    const health = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0'
    };

    res.json(health);
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// @route   GET /api/health/detailed
// @desc    Detailed health check with system info
// @access  Public
router.get('/detailed', async (req, res) => {
  try {
    // Check database connection
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // Get system information
    const systemInfo = {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
        usagePercent: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2)
      },
      cpu: {
        cores: os.cpus().length,
        loadAverage: os.loadavg()
      },
      uptime: os.uptime()
    };

    // Check disk space for uploads directory
    let diskSpace = null;
    try {
      const uploadsPath = path.join(__dirname, '../uploads');
      const stats = await fs.stat(uploadsPath);
      diskSpace = {
        path: uploadsPath,
        exists: true,
        size: stats.size
      };
    } catch (error) {
      diskSpace = {
        path: path.join(__dirname, '../uploads'),
        exists: false,
        error: error.message
      };
    }

    const detailedHealth = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      database: {
        status: dbStatus,
        connection: mongoose.connection.host || 'N/A'
      },
      system: systemInfo,
      disk: diskSpace
    };

    res.json(detailedHealth);
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// @route   GET /api/health/ready
// @desc    Readiness probe for Kubernetes/container orchestration
// @access  Public
router.get('/ready', async (req, res) => {
  try {
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        status: 'NOT_READY',
        timestamp: new Date().toISOString(),
        reason: 'Database not connected',
        database: {
          status: 'disconnected',
          readyState: mongoose.connection.readyState
        }
      });
    }

    // Check if uploads directory is accessible
    try {
      const uploadsPath = path.join(__dirname, '../uploads');
      await fs.access(uploadsPath);
    } catch (error) {
      return res.status(503).json({
        status: 'NOT_READY',
        timestamp: new Date().toISOString(),
        reason: 'Uploads directory not accessible',
        error: error.message
      });
    }

    res.json({
      status: 'READY',
      timestamp: new Date().toISOString(),
      database: {
        status: 'connected',
        connection: mongoose.connection.host
      },
      uploads: {
        status: 'accessible',
        path: path.join(__dirname, '../uploads')
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'NOT_READY',
      timestamp: new Date().toISOString(),
      reason: 'Health check failed',
      error: error.message
    });
  }
});

// @route   GET /api/health/live
// @desc    Liveness probe for Kubernetes/container orchestration
// @access  Public
router.get('/live', async (req, res) => {
  try {
    // Basic liveness check - just check if the process is running
    const liveness = {
      status: 'ALIVE',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      pid: process.pid,
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal
      }
    };

    res.json(liveness);
  } catch (error) {
    res.status(500).json({
      status: 'DEAD',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// @route   GET /api/health/metrics
// @desc    Metrics endpoint for monitoring systems
// @access  Public
router.get('/metrics', async (req, res) => {
  try {
    const metrics = {
      timestamp: new Date().toISOString(),
      process: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      },
      system: {
        memory: {
          total: os.totalmem(),
          free: os.freemem(),
          used: os.totalmem() - os.freemem()
        },
        cpu: {
          cores: os.cpus().length,
          loadAverage: os.loadavg()
        },
        uptime: os.uptime()
      },
      database: {
        status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        host: mongoose.connection.host || 'N/A'
      }
    };

    // Format as Prometheus-style metrics
    let prometheusMetrics = '';
    prometheusMetrics += `# HELP process_uptime_seconds Process uptime in seconds\n`;
    prometheusMetrics += `# TYPE process_uptime_seconds gauge\n`;
    prometheusMetrics += `process_uptime_seconds ${metrics.process.uptime}\n\n`;
    
    prometheusMetrics += `# HELP process_memory_bytes Process memory usage in bytes\n`;
    prometheusMetrics += `# TYPE process_memory_bytes gauge\n`;
    prometheusMetrics += `process_memory_bytes{type="heap_used"} ${metrics.process.memory.heapUsed}\n`;
    prometheusMetrics += `process_memory_bytes{type="heap_total"} ${metrics.process.memory.heapTotal}\n\n`;
    
    prometheusMetrics += `# HELP system_memory_bytes System memory in bytes\n`;
    prometheusMetrics += `# TYPE system_memory_bytes gauge\n`;
    prometheusMetrics += `system_memory_bytes{type="total"} ${metrics.system.memory.total}\n`;
    prometheusMetrics += `system_memory_bytes{type="free"} ${metrics.system.memory.free}\n`;
    prometheusMetrics += `system_memory_bytes{type="used"} ${metrics.system.memory.used}\n\n`;
    
    prometheusMetrics += `# HELP database_status Database connection status\n`;
    prometheusMetrics += `# TYPE database_status gauge\n`;
    prometheusMetrics += `database_status ${mongoose.connection.readyState === 1 ? 1 : 0}\n`;

    res.set('Content-Type', 'text/plain');
    res.send(prometheusMetrics);
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

module.exports = router;