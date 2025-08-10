const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Room = require('../models/Room');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database to ensure they still exist
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

const verifyRoomAccess = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const userId = req.user._id;

    // Check if user has access to the room
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (!room.participants.includes(userId) && room.creator.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Access denied to this room' });
    }

    req.room = room;
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Room access verification failed' });
  }
};

module.exports = {
  authenticateToken,
  generateToken,
  verifyRoomAccess
};