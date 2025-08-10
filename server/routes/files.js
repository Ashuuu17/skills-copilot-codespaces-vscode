const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = process.env.FILE_UPLOAD_PATH || './uploads';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

const fileFilter = (req, file, cb) => {
  // List of allowed file types
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'application/json',
    'application/zip',
    'application/x-zip-compressed',
    'audio/mpeg',
    'audio/wav',
    'video/mp4',
    'video/webm',
    'video/ogg'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024, // 50MB default
  }
});

// In-memory storage for file metadata
const fileMetadata = new Map();

// Upload file
router.post('/upload', authMiddleware, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileId = crypto.randomBytes(16).toString('hex');
    const metadata = {
      id: fileId,
      originalName: req.file.originalname,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
      uploadedBy: req.user._id,
      uploadedByUsername: req.user.username,
      uploadedAt: new Date(),
      path: req.file.path,
    };

    fileMetadata.set(fileId, metadata);

    res.json({
      message: 'File uploaded successfully',
      file: {
        id: fileId,
        name: metadata.originalName,
        size: metadata.size,
        type: metadata.mimetype,
        uploadedBy: metadata.uploadedByUsername,
        uploadedAt: metadata.uploadedAt,
      }
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Download file
router.get('/:fileId/download', authMiddleware, (req, res) => {
  try {
    const { fileId } = req.params;
    const metadata = fileMetadata.get(fileId);

    if (!metadata) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (!fs.existsSync(metadata.path)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${metadata.originalName}"`);
    res.setHeader('Content-Type', metadata.mimetype);
    res.sendFile(path.resolve(metadata.path));
  } catch (error) {
    console.error('File download error:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// Get file info
router.get('/:fileId/info', authMiddleware, (req, res) => {
  try {
    const { fileId } = req.params;
    const metadata = fileMetadata.get(fileId);

    if (!metadata) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.json({
      file: {
        id: fileId,
        name: metadata.originalName,
        size: metadata.size,
        type: metadata.mimetype,
        uploadedBy: metadata.uploadedByUsername,
        uploadedAt: metadata.uploadedAt,
      }
    });
  } catch (error) {
    console.error('File info error:', error);
    res.status(500).json({ error: 'Failed to get file info' });
  }
});

// Delete file
router.delete('/:fileId', authMiddleware, (req, res) => {
  try {
    const { fileId } = req.params;
    const metadata = fileMetadata.get(fileId);

    if (!metadata) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check if user owns the file
    if (metadata.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this file' });
    }

    // Delete file from disk
    if (fs.existsSync(metadata.path)) {
      fs.unlinkSync(metadata.path);
    }

    // Remove metadata
    fileMetadata.delete(fileId);

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('File delete error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// List files (for debugging/admin purposes)
router.get('/', authMiddleware, (req, res) => {
  try {
    const files = Array.from(fileMetadata.values()).map(metadata => ({
      id: metadata.id,
      name: metadata.originalName,
      size: metadata.size,
      type: metadata.mimetype,
      uploadedBy: metadata.uploadedByUsername,
      uploadedAt: metadata.uploadedAt,
    }));

    res.json({ files });
  } catch (error) {
    console.error('File list error:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large' });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: 'Unexpected file field' });
    }
  }
  
  if (error.message === 'File type not allowed') {
    return res.status(400).json({ error: 'File type not allowed' });
  }

  console.error('File handling error:', error);
  res.status(500).json({ error: 'File handling error' });
});

module.exports = router;