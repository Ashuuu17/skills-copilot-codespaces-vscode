const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Room = require('../models/Room');

class SocketService {
  constructor(server) {
    this.io = socketIO(server, {
      cors: {
        origin: process.env.SOCKET_CORS_ORIGIN || process.env.CORS_ORIGIN || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    this.rooms = new Map(); // Track active rooms and participants
    this.userSockets = new Map(); // Track user socket connections
    this.setupMiddleware();
    this.setupEventHandlers();
  }

  setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // Remove 'Bearer ' prefix if present
        const cleanToken = token.replace('Bearer ', '');
        
        const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
          return next(new Error('User not found'));
        }

        socket.user = user;
        next();
      } catch (error) {
        next(new Error('Invalid authentication token'));
      }
    });
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 User connected: ${socket.user.name} (${socket.user.id})`);
      
      // Store user socket mapping
      this.userSockets.set(socket.user.id, socket.id);
      
      // Handle user joining a room
      socket.on('join-room', async (data) => {
        await this.handleJoinRoom(socket, data);
      });

      // Handle user leaving a room
      socket.on('leave-room', async (data) => {
        await this.handleLeaveRoom(socket, data);
      });

      // Handle WebRTC signaling
      socket.on('webrtc-signal', (data) => {
        this.handleWebRTCSignal(socket, data);
      });

      // Handle chat messages
      socket.on('chat-message', async (data) => {
        await this.handleChatMessage(socket, data);
      });

      // Handle screen sharing
      socket.on('screen-share-start', (data) => {
        this.handleScreenShareStart(socket, data);
      });

      socket.on('screen-share-stop', (data) => {
        this.handleScreenShareStop(socket, data);
      });

      // Handle whiteboard updates
      socket.on('whiteboard-update', (data) => {
        this.handleWhiteboardUpdate(socket, data);
      });

      // Handle file sharing notifications
      socket.on('file-shared', (data) => {
        this.handleFileShared(socket, data);
      });

      // Handle participant status updates
      socket.on('status-update', (data) => {
        this.handleStatusUpdate(socket, data);
      });

      // Handle room recording
      socket.on('recording-start', (data) => {
        this.handleRecordingStart(socket, data);
      });

      socket.on('recording-stop', (data) => {
        this.handleRecordingStop(socket, data);
      });

      // Handle disconnection
      socket.on('disconnect', async () => {
        await this.handleDisconnect(socket);
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error('Socket error:', error);
      });
    });
  }

  async handleJoinRoom(socket, data) {
    try {
      const { roomId, password } = data;
      
      // Verify room exists and user can join
      const room = await Room.findById(roomId);
      if (!room) {
        socket.emit('room-error', { message: 'Room not found' });
        return;
      }

      // Check if room is private and requires password
      if (room.isPrivate && room.password && room.password !== password) {
        socket.emit('room-error', { message: 'Invalid room password' });
        return;
      }

      // Join the socket room
      socket.join(roomId);
      
      // Add user to room participants if not already there
      if (!room.participants.includes(socket.user.id)) {
        room.participants.push(socket.user.id);
        await room.save();
      }

      // Update room activity
      room.lastActivity = new Date();
      await room.save();

      // Initialize room tracking if not exists
      if (!this.rooms.has(roomId)) {
        this.rooms.set(roomId, {
          participants: new Set(),
          screenSharer: null,
          recording: false,
          whiteboard: []
        });
      }

      // Add participant to room
      this.rooms.get(roomId).participants.add(socket.user.id);

      // Notify other participants
      socket.to(roomId).emit('participant-joined', {
        user: {
          id: socket.user.id,
          name: socket.user.name,
          avatar: socket.user.avatar
        },
        timestamp: new Date().toISOString()
      });

      // Send room info to joining user
      const roomInfo = {
        id: room._id,
        name: room.name,
        description: room.description,
        isPrivate: room.isPrivate,
        participants: await this.getRoomParticipants(roomId),
        settings: room.settings || {}
      };

      socket.emit('room-joined', roomInfo);

      console.log(`👥 User ${socket.user.name} joined room: ${room.name}`);

    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('room-error', { message: 'Failed to join room' });
    }
  }

  async handleLeaveRoom(socket, data) {
    try {
      const { roomId } = data;
      
      // Leave the socket room
      socket.leave(roomId);
      
      // Remove from room tracking
      if (this.rooms.has(roomId)) {
        this.rooms.get(roomId).participants.delete(socket.user.id);
        
        // Clean up empty rooms
        if (this.rooms.get(roomId).participants.size === 0) {
          this.rooms.delete(roomId);
        }
      }

      // Update database
      await Room.findByIdAndUpdate(roomId, {
        $pull: { participants: socket.user.id },
        lastActivity: new Date()
      });

      // Notify other participants
      socket.to(roomId).emit('participant-left', {
        user: {
          id: socket.user.id,
          name: socket.user.name
        },
        timestamp: new Date().toISOString()
      });

      console.log(`👋 User ${socket.user.name} left room: ${roomId}`);

    } catch (error) {
      console.error('Error leaving room:', error);
    }
  }

  handleWebRTCSignal(socket, data) {
    const { roomId, targetUserId, signal, type } = data;
    
    // Forward WebRTC signal to target user
    const targetSocketId = this.userSockets.get(targetUserId);
    if (targetSocketId) {
      this.io.to(targetSocketId).emit('webrtc-signal', {
        fromUserId: socket.user.id,
        signal,
        type
      });
    }
  }

  async handleChatMessage(socket, data) {
    try {
      const { roomId, message, type = 'text' } = data;
      
      // Validate message
      if (!message || message.trim().length === 0) return;
      
      const chatData = {
        user: {
          id: socket.user.id,
          name: socket.user.name,
          avatar: socket.user.avatar
        },
        message: message.trim(),
        type,
        timestamp: new Date().toISOString()
      };

      // Broadcast to all users in the room
      this.io.to(roomId).emit('chat-message', chatData);

      // Store message in database if needed
      // This could be implemented to persist chat history

    } catch (error) {
      console.error('Error handling chat message:', error);
    }
  }

  handleScreenShareStart(socket, data) {
    const { roomId } = data;
    
    if (this.rooms.has(roomId)) {
      this.rooms.get(roomId).screenSharer = socket.user.id;
      
      // Notify other participants
      socket.to(roomId).emit('screen-share-started', {
        user: {
          id: socket.user.id,
          name: socket.user.name
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  handleScreenShareStop(socket, data) {
    const { roomId } = data;
    
    if (this.rooms.has(roomId)) {
      this.rooms.get(roomId).screenSharer = null;
      
      // Notify other participants
      socket.to(roomId).emit('screen-share-stopped', {
        user: {
          id: socket.user.id,
          name: socket.user.name
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  handleWhiteboardUpdate(socket, data) {
    const { roomId, update } = data;
    
    if (this.rooms.has(roomId)) {
      // Store whiteboard update
      this.rooms.get(roomId).whiteboard.push(update);
      
      // Broadcast to other participants
      socket.to(roomId).emit('whiteboard-update', {
        update,
        user: {
          id: socket.user.id,
          name: socket.user.name
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  handleFileShared(socket, data) {
    const { roomId, file } = data;
    
    // Notify other participants about shared file
    socket.to(roomId).emit('file-shared', {
      file,
      user: {
        id: socket.user.id,
        name: socket.user.name
      },
      timestamp: new Date().toISOString()
    });
  }

  handleStatusUpdate(socket, data) {
    const { roomId, status } = data;
    
    // Broadcast status update to other participants
    socket.to(roomId).emit('participant-status-updated', {
      user: {
        id: socket.user.id,
        name: socket.user.name
      },
      status,
      timestamp: new Date().toISOString()
    });
  }

  handleRecordingStart(socket, data) {
    const { roomId } = data;
    
    if (this.rooms.has(roomId)) {
      this.rooms.get(roomId).recording = true;
      
      // Notify all participants
      this.io.to(roomId).emit('recording-started', {
        user: {
          id: socket.user.id,
          name: socket.user.name
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  handleRecordingStop(socket, data) {
    const { roomId } = data;
    
    if (this.rooms.has(roomId)) {
      this.rooms.get(roomId).recording = false;
      
      // Notify all participants
      this.io.to(roomId).emit('recording-stopped', {
        user: {
          id: socket.user.id,
          name: socket.user.name
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  async handleDisconnect(socket) {
    try {
      console.log(`🔌 User disconnected: ${socket.user.name} (${socket.user.id})`);
      
      // Remove from user sockets mapping
      this.userSockets.delete(socket.user.id);
      
      // Remove from all rooms
      for (const [roomId, roomData] of this.rooms.entries()) {
        if (roomData.participants.has(socket.user.id)) {
          roomData.participants.delete(socket.user.id);
          
          // Notify other participants
          socket.to(roomId).emit('participant-disconnected', {
            user: {
              id: socket.user.id,
              name: socket.user.name
            },
            timestamp: new Date().toISOString()
          });
          
          // Clean up empty rooms
          if (roomData.participants.size === 0) {
            this.rooms.delete(roomId);
          }
        }
      }
      
      // Update database - remove user from all rooms
      await Room.updateMany(
        { participants: socket.user.id },
        { 
          $pull: { participants: socket.user.id },
          lastActivity: new Date()
        }
      );
      
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  }

  async getRoomParticipants(roomId) {
    try {
      const room = await Room.findById(roomId).populate('participants', 'name avatar');
      return room ? room.participants : [];
    } catch (error) {
      console.error('Error getting room participants:', error);
      return [];
    }
  }

  // Get active rooms info
  getActiveRooms() {
    const activeRooms = [];
    for (const [roomId, roomData] of this.rooms.entries()) {
      activeRooms.push({
        roomId,
        participantCount: roomData.participants.size,
        screenSharer: roomData.screenSharer,
        recording: roomData.recording
      });
    }
    return activeRooms;
  }

  // Get user's active rooms
  getUserActiveRooms(userId) {
    const userRooms = [];
    for (const [roomId, roomData] of this.rooms.entries()) {
      if (roomData.participants.has(userId)) {
        userRooms.push({
          roomId,
          participantCount: roomData.participants.size,
          screenSharer: roomData.screenSharer,
          recording: roomData.recording
        });
      }
    }
    return userRooms;
  }

  // Broadcast to specific room
  broadcastToRoom(roomId, event, data) {
    this.io.to(roomId).emit(event, data);
  }

  // Broadcast to specific user
  broadcastToUser(userId, event, data) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    }
  }

  // Broadcast to all connected users
  broadcastToAll(event, data) {
    this.io.emit(event, data);
  }
}

module.exports = SocketService;