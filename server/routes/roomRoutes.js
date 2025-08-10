const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Room = require('../models/Room');
const User = require('../models/User');

const router = express.Router();

// @route   POST /api/rooms
// @desc    Create a new room
// @access  Private
router.post('/', auth, [
  body('name', 'Room name is required').not().isEmpty(),
  body('description', 'Description is required').not().isEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, isPrivate, password } = req.body;

    // Create new room
    const room = new Room({
      name,
      description,
      isPrivate: isPrivate || false,
      password: isPrivate && password ? password : undefined,
      createdBy: req.user.id,
      participants: [req.user.id]
    });

    await room.save();

    // Populate creator info
    await room.populate('createdBy', 'name avatar');

    res.json(room);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/rooms
// @desc    Get all public rooms and user's private rooms
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;

    // Build query
    let query = {
      $or: [
        { isPrivate: false }, // Public rooms
        { participants: req.user.id } // User's private rooms
      ]
    };

    // Add search filter
    if (search) {
      query.$and = [
        {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
          ]
        }
      ];
    }

    const rooms = await Room.find(query)
      .populate('createdBy', 'name avatar')
      .populate('participants', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    // Get total count
    const total = await Room.countDocuments(query);

    res.json({
      rooms,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/rooms/:id
// @desc    Get room by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('createdBy', 'name avatar')
      .populate('participants', 'name avatar email');

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if user has access to private room
    if (room.isPrivate && !room.participants.includes(req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(room);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/rooms/:id
// @desc    Update room
// @access  Private (room creator only)
router.put('/:id', auth, [
  body('name', 'Room name is required').not().isEmpty(),
  body('description', 'Description is required').not().isEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, isPrivate, password } = req.body;

    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if user is the creator
    if (room.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Update room
    room.name = name;
    room.description = description;
    room.isPrivate = isPrivate || false;
    room.password = isPrivate && password ? password : undefined;

    await room.save();

    res.json(room);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST /api/rooms/:id/join
// @desc    Join a room
// @access  Private
router.post('/:id/join', auth, async (req, res) => {
  try {
    const { password } = req.body;
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if user is already in the room
    if (room.participants.includes(req.user.id)) {
      return res.status(400).json({ message: 'Already in room' });
    }

    // Check if room is private and requires password
    if (room.isPrivate) {
      if (!password) {
        return res.status(400).json({ message: 'Password required for private room' });
      }
      if (room.password && room.password !== password) {
        return res.status(400).json({ message: 'Invalid password' });
      }
    }

    // Add user to room
    room.participants.push(req.user.id);
    await room.save();

    // Populate room data
    await room.populate('createdBy', 'name avatar');
    await room.populate('participants', 'name avatar');

    res.json(room);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST /api/rooms/:id/leave
// @desc    Leave a room
// @access  Private
router.post('/:id/leave', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if user is in the room
    if (!room.participants.includes(req.user.id)) {
      return res.status(400).json({ message: 'Not in room' });
    }

    // Remove user from room
    room.participants = room.participants.filter(
      participant => participant.toString() !== req.user.id
    );

    // If no participants left, delete the room
    if (room.participants.length === 0) {
      await Room.findByIdAndDelete(req.params.id);
      return res.json({ message: 'Room deleted (no participants left)' });
    }

    // If creator left, assign new creator
    if (room.createdBy.toString() === req.user.id) {
      room.createdBy = room.participants[0];
    }

    await room.save();

    res.json({ message: 'Left room successfully' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   DELETE /api/rooms/:id
// @desc    Delete a room
// @access  Private (room creator only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if user is the creator
    if (room.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Room.findByIdAndDelete(req.params.id);

    res.json({ message: 'Room deleted' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST /api/rooms/:id/participants/:userId/remove
// @desc    Remove participant from room (creator only)
// @access  Private
router.post('/:id/participants/:userId/remove', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if user is the creator
    if (room.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const userIdToRemove = req.params.userId;

    // Check if user to remove is in the room
    if (!room.participants.includes(userIdToRemove)) {
      return res.status(400).json({ message: 'User not in room' });
    }

    // Remove user from room
    room.participants = room.participants.filter(
      participant => participant.toString() !== userIdToRemove
    );

    await room.save();

    res.json({ message: 'Participant removed successfully' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   GET /api/rooms/user/joined
// @desc    Get rooms that the current user has joined
// @access  Private
router.get('/user/joined', auth, async (req, res) => {
  try {
    const rooms = await Room.find({ participants: req.user.id })
      .populate('createdBy', 'name avatar')
      .populate('participants', 'name avatar')
      .sort({ lastActivity: -1 });

    res.json(rooms);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/rooms/user/created
// @desc    Get rooms created by the current user
// @access  Private
router.get('/user/created', auth, async (req, res) => {
  try {
    const rooms = await Room.find({ createdBy: req.user.id })
      .populate('participants', 'name avatar')
      .sort({ createdAt: -1 });

    res.json(rooms);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/rooms/:id/activity
// @desc    Update room's last activity timestamp
// @access  Private
router.post('/:id/activity', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if user is in the room
    if (!room.participants.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not in room' });
    }

    room.lastActivity = new Date();
    await room.save();

    res.json({ message: 'Activity updated' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.status(500).send('Server error');
  }
});

module.exports = router;