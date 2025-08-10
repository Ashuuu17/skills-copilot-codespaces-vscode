const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Room = require('../models/Room');

// Store active connections
const activeConnections = new Map(); // userId -> socket
const roomParticipants = new Map(); // roomId -> Set of userIds
const userRooms = new Map(); // userId -> roomId

const setupSocketHandlers = (io) => {
  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.userId = user._id;
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.user.username} connected: ${socket.id}`);
    
    // Store connection
    activeConnections.set(socket.userId, socket);
    
    // Update user online status
    updateUserStatus(socket.userId, true);

    // Handle joining a room
    socket.on('join-room', async (data) => {
      try {
        const { roomId, password } = data;
        
        // Verify room exists and user has access
        const room = await Room.findById(roomId);
        if (!room) {
          socket.emit('room-error', { message: 'Room not found' });
          return;
        }

        // Check password if room is private
        if (room.settings.isPrivate && room.settings.password && room.settings.password !== password) {
          socket.emit('room-error', { message: 'Incorrect room password' });
          return;
        }

        // Check participant limit
        const currentParticipants = roomParticipants.get(roomId)?.size || 0;
        if (currentParticipants >= room.settings.maxParticipants) {
          socket.emit('room-error', { message: 'Room is full' });
          return;
        }

        // Join socket room
        socket.join(roomId);
        
        // Update tracking maps
        if (!roomParticipants.has(roomId)) {
          roomParticipants.set(roomId, new Set());
        }
        roomParticipants.get(roomId).add(socket.userId);
        userRooms.set(socket.userId, roomId);

        // Add user to room participants if not already there
        await room.addParticipant(socket.userId, 'participant');

        // Notify others in the room
        socket.to(roomId).emit('user-joined', {
          userId: socket.userId,
          username: socket.user.username,
          firstName: socket.user.firstName,
          lastName: socket.user.lastName,
          avatar: socket.user.avatar
        });

        // Send room info to the joining user
        const roomInfo = await Room.findById(roomId)
          .populate('participants.user', 'username firstName lastName avatar')
          .populate('creator', 'username firstName lastName avatar');

        socket.emit('room-joined', {
          room: roomInfo,
          participants: Array.from(roomParticipants.get(roomId)).map(id => 
            activeConnections.get(id)?.user || { _id: id }
          )
        });

        console.log(`User ${socket.user.username} joined room ${room.name}`);

      } catch (error) {
        console.error('Join room error:', error);
        socket.emit('room-error', { message: 'Failed to join room' });
      }
    });

    // Handle leaving a room
    socket.on('leave-room', async (data) => {
      try {
        const { roomId } = data;
        
        // Leave socket room
        socket.leave(roomId);
        
        // Update tracking maps
        if (roomParticipants.has(roomId)) {
          roomParticipants.get(roomId).delete(socket.userId);
          if (roomParticipants.get(roomId).size === 0) {
            roomParticipants.delete(roomId);
          }
        }
        userRooms.delete(socket.userId);

        // Update room participant status
        const room = await Room.findById(roomId);
        if (room) {
          await room.removeParticipant(socket.userId);
        }

        // Notify others in the room
        socket.to(roomId).emit('user-left', {
          userId: socket.userId,
          username: socket.user.username
        });

        console.log(`User ${socket.user.username} left room ${roomId}`);

      } catch (error) {
        console.error('Leave room error:', error);
      }
    });

    // WebRTC signaling
    socket.on('offer', (data) => {
      const { targetUserId, offer } = data;
      const targetSocket = activeConnections.get(targetUserId);
      
      if (targetSocket) {
        targetSocket.emit('offer', {
          offer,
          fromUserId: socket.userId,
          fromUsername: socket.user.username
        });
      }
    });

    socket.on('answer', (data) => {
      const { targetUserId, answer } = data;
      const targetSocket = activeConnections.get(targetUserId);
      
      if (targetSocket) {
        targetSocket.emit('answer', {
          answer,
          fromUserId: socket.userId,
          fromUsername: socket.user.username
        });
      }
    });

    socket.on('ice-candidate', (data) => {
      const { targetUserId, candidate } = data;
      const targetSocket = activeConnections.get(targetUserId);
      
      if (targetSocket) {
        targetSocket.emit('ice-candidate', {
          candidate,
          fromUserId: socket.userId
        });
      }
    });

    // Screen sharing
    socket.on('screen-share-started', (data) => {
      const { roomId } = data;
      socket.to(roomId).emit('screen-share-started', {
        userId: socket.userId,
        username: socket.user.username
      });
    });

    socket.on('screen-share-stopped', (data) => {
      const { roomId } = data;
      socket.to(roomId).emit('screen-share-stopped', {
        userId: socket.userId,
        username: socket.user.username
      });
    });

    // Chat messages
    socket.on('chat-message', async (data) => {
      try {
        const { roomId, message, type = 'text' } = data;
        
        // Save message to database
        const room = await Room.findById(roomId);
        if (room) {
          room.chatHistory.push({
            user: socket.userId,
            message,
            type,
            timestamp: new Date()
          });
          await room.save();
        }

        // Broadcast to room
        socket.to(roomId).emit('chat-message', {
          userId: socket.userId,
          username: socket.user.username,
          message,
          type,
          timestamp: new Date()
        });

      } catch (error) {
        console.error('Chat message error:', error);
      }
    });

    // Whiteboard drawing
    socket.on('whiteboard-draw', (data) => {
      const { roomId, drawingData } = data;
      
      // Broadcast drawing to room
      socket.to(roomId).emit('whiteboard-draw', {
        userId: socket.userId,
        username: socket.user.username,
        drawingData
      });
    });

    socket.on('whiteboard-clear', (data) => {
      const { roomId } = data;
      
      // Broadcast clear to room
      socket.to(roomId).emit('whiteboard-clear', {
        userId: socket.userId,
        username: socket.user.username
      });
    });

    // File sharing
    socket.on('file-uploaded', async (data) => {
      try {
        const { roomId, fileInfo } = data;
        
        // Save file info to database
        const room = await Room.findById(roomId);
        if (room) {
          room.files.push({
            name: fileInfo.name,
            originalName: fileInfo.originalName,
            path: fileInfo.path,
            size: fileInfo.size,
            type: fileInfo.type,
            uploadedBy: socket.userId
          });
          await room.save();
        }

        // Broadcast to room
        socket.to(roomId).emit('file-uploaded', {
          userId: socket.userId,
          username: socket.user.username,
          fileInfo
        });

      } catch (error) {
        console.error('File upload error:', error);
      }
    });

    // User actions (mute, video toggle, etc.)
    socket.on('user-action', (data) => {
      const { roomId, action, value } = data;
      
      socket.to(roomId).emit('user-action', {
        userId: socket.userId,
        username: socket.user.username,
        action,
        value
      });
    });

    // Room recording
    socket.on('recording-started', async (data) => {
      try {
        const { roomId } = data;
        
        // Update room recording status
        const room = await Room.findById(roomId);
        if (room && room.settings.recordingEnabled) {
          room.recording.isRecording = true;
          room.recording.startTime = new Date();
          await room.save();
        }

        // Broadcast to room
        socket.to(roomId).emit('recording-started', {
          userId: socket.userId,
          username: socket.user.username
        });

      } catch (error) {
        console.error('Recording start error:', error);
      }
    });

    socket.on('recording-stopped', async (data) => {
      try {
        const { roomId } = data;
        
        // Update room recording status
        const room = await Room.findById(roomId);
        if (room) {
          room.recording.isRecording = false;
          room.recording.endTime = new Date();
          await room.save();
        }

        // Broadcast to room
        socket.to(roomId).emit('recording-stopped', {
          userId: socket.userId,
          username: socket.user.username
        });

      } catch (error) {
        console.error('Recording stop error:', error);
      }
    });

    // Typing indicators
    socket.on('typing-start', (data) => {
      const { roomId } = data;
      socket.to(roomId).emit('typing-start', {
        userId: socket.userId,
        username: socket.user.username
      });
    });

    socket.on('typing-stop', (data) => {
      const { roomId } = data;
      socket.to(roomId).emit('typing-stop', {
        userId: socket.userId
      });
    });

    // Disconnect handling
    socket.on('disconnect', async () => {
      console.log(`User ${socket.user.username} disconnected: ${socket.id}`);
      
      // Remove from active connections
      activeConnections.delete(socket.userId);
      
      // Update user status
      updateUserStatus(socket.userId, false);
      
      // Handle room cleanup
      const roomId = userRooms.get(socket.userId);
      if (roomId) {
        // Leave room
        if (roomParticipants.has(roomId)) {
          roomParticipants.get(roomId).delete(socket.userId);
          if (roomParticipants.get(roomId).size === 0) {
            roomParticipants.delete(roomId);
          }
        }
        userRooms.delete(socket.userId);

        // Notify others
        socket.to(roomId).emit('user-left', {
          userId: socket.userId,
          username: socket.user.username
        });

        // Update room participant status
        try {
          const room = await Room.findById(roomId);
          if (room) {
            await room.removeParticipant(socket.userId);
          }
        } catch (error) {
          console.error('Room cleanup error:', error);
        }
      }
    });
  });
};

// Helper function to update user online status
const updateUserStatus = async (userId, isOnline) => {
  try {
    await User.findByIdAndUpdate(userId, {
      isOnline,
      lastSeen: new Date()
    });
  } catch (error) {
    console.error('Update user status error:', error);
  }
};

// Helper function to get room participants
const getRoomParticipants = (roomId) => {
  return Array.from(roomParticipants.get(roomId) || []);
};

// Helper function to broadcast to room
const broadcastToRoom = (roomId, event, data) => {
  const io = require('../index').io;
  io.to(roomId).emit(event, data);
};

module.exports = {
  setupSocketHandlers,
  getRoomParticipants,
  broadcastToRoom,
  activeConnections,
  roomParticipants
};