const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const auth = require('../middleware/auth');
const Room = require('../models/Room');
const File = require('../models/File');
const User = require('../models/User'); // Added missing import for User

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'text/csv',
      'video/mp4', 'video/webm', 'video/ogg',
      'audio/mpeg', 'audio/wav', 'audio/ogg'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'), false);
    }
  }
});

// @route   POST /api/files/upload/:roomId
// @desc    Upload a file to a room
// @access  Private
router.post('/upload/:roomId', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { roomId } = req.params;
    const { description } = req.body;

    // Check if room exists and user has access
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (!room.participants.includes(req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Create file record
    const file = new File({
      name: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype,
      description: description || '',
      uploadedBy: req.user.id,
      room: roomId
    });

    await file.save();

    // Populate user info
    await file.populate('uploadedBy', 'name avatar');

    res.json(file);
  } catch (error) {
    console.error('File upload error:', error);
    
    // Clean up uploaded file if there was an error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }

    if (error.message === 'File type not allowed') {
      return res.status(400).json({ message: 'File type not allowed' });
    }

    res.status(500).json({ message: 'File upload failed' });
  }
});

// @route   GET /api/files/room/:roomId
// @desc    Get all files in a room
// @access  Private
router.get('/room/:roomId', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Check if room exists and user has access
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (!room.participants.includes(req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get files with pagination
    const files = await File.find({ room: roomId })
      .populate('uploadedBy', 'name avatar')
      .sort({ uploadedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    // Get total count
    const total = await File.countDocuments({ room: roomId });

    res.json({
      files,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error getting files:', error);
    res.status(500).json({ message: 'Failed to get files' });
  }
});

// @route   GET /api/files/:fileId
// @desc    Get file info by ID
// @access  Private
router.get('/:fileId', auth, async (req, res) => {
  try {
    const { fileId } = req.params;

    const file = await File.findById(fileId)
      .populate('uploadedBy', 'name avatar')
      .populate('room', 'name');

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Check if user has access to the room
    const room = await Room.findById(file.room);
    if (!room || !room.participants.includes(req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(file);
  } catch (error) {
    console.error('Error getting file:', error);
    res.status(500).json({ message: 'Failed to get file' });
  }
});

// @route   GET /api/files/:fileId/download
// @desc    Download a file
// @access  Private
router.get('/:fileId/download', auth, async (req, res) => {
  try {
    const { fileId } = req.params;

    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Check if user has access to the room
    const room = await Room.findById(file.room);
    if (!room || !room.participants.includes(req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if file exists on disk
    try {
      await fs.access(file.path);
    } catch (error) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    // Set headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
    res.setHeader('Content-Type', file.mimetype);
    res.setHeader('Content-Length', file.size);

    // Stream the file
    const fileStream = require('fs').createReadStream(file.path);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ message: 'Download failed' });
  }
});

// @route   PUT /api/files/:fileId
// @desc    Update file description
// @access  Private (file uploader only)
router.put('/:fileId', auth, async (req, res) => {
  try {
    const { fileId } = req.params;
    const { description } = req.body;

    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Check if user is the uploader
    if (file.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    file.description = description || '';
    await file.save();

    // Populate user info
    await file.populate('uploadedBy', 'name avatar');

    res.json(file);
  } catch (error) {
    console.error('Error updating file:', error);
    res.status(500).json({ message: 'Failed to update file' });
  }
});

// @route   DELETE /api/files/:fileId
// @desc    Delete a file
// @access  Private (file uploader or room creator only)
router.delete('/:fileId', auth, async (req, res) => {
  try {
    const { fileId } = req.params;

    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Check if user is the uploader or room creator
    const room = await Room.findById(file.room);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const isUploader = file.uploadedBy.toString() === req.user.id;
    const isRoomCreator = room.createdBy.toString() === req.user.id;

    if (!isUploader && !isRoomCreator) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Delete file from disk
    try {
      await fs.unlink(file.path);
    } catch (unlinkError) {
      console.error('Error deleting file from disk:', unlinkError);
      // Continue with database deletion even if disk deletion fails
    }

    // Delete file record
    await File.findByIdAndDelete(fileId);

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ message: 'Failed to delete file' });
  }
});

// @route   GET /api/files/user/uploads
// @desc    Get files uploaded by the current user
// @access  Private
router.get('/user/uploads', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const files = await File.find({ uploadedBy: req.user.id })
      .populate('room', 'name')
      .sort({ uploadedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    // Get total count
    const total = await File.countDocuments({ uploadedBy: req.user.id });

    res.json({
      files,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error getting user uploads:', error);
    res.status(500).json({ message: 'Failed to get uploads' });
  }
});

// @route   POST /api/files/:fileId/share
// @desc    Share a file with another user
// @access  Private
router.post('/:fileId/share', auth, async (req, res) => {
  try {
    const { fileId } = req.params;
    const { userId } = req.body;

    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Check if user has access to the file
    const room = await Room.findById(file.room);
    if (!room || !room.participants.includes(req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if target user exists
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // In a real app, you might want to implement file sharing logic here
    // For now, we'll just return a success message
    res.json({ message: 'File shared successfully' });
  } catch (error) {
    console.error('Error sharing file:', error);
    res.status(500).json({ message: 'Failed to share file' });
  }
});

module.exports = router;