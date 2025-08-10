import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

// Create context
const SocketContext = createContext();

// Socket provider component
export const SocketProvider = ({ children }) => {
  const { user, token } = useAuth();
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  // Initialize socket connection
  useEffect(() => {
    if (user && token) {
      const socket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5000', {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        upgrade: true,
        rememberUpgrade: true,
        timeout: 20000,
        forceNew: true
      });

      // Connection events
      socket.on('connect', () => {
        console.log('Socket connected:', socket.id);
        setIsConnected(true);
        setConnectionError(null);
      });

      socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setIsConnected(false);
        
        if (reason === 'io server disconnect') {
          // Server disconnected us, try to reconnect
          socket.connect();
        }
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setConnectionError(error.message);
        setIsConnected(false);
        
        if (error.message === 'Authentication error: Invalid token') {
          toast.error('Authentication failed. Please login again.');
        }
      });

      socket.on('error', (error) => {
        console.error('Socket error:', error);
        toast.error('Connection error occurred');
      });

      // Store socket reference
      socketRef.current = socket;

      // Cleanup on unmount
      return () => {
        if (socket) {
          socket.disconnect();
        }
      };
    }
  }, [user, token]);

  // Socket event handlers
  const setupSocketHandlers = (handlers) => {
    if (!socketRef.current) return;

    const socket = socketRef.current;

    // Remove existing listeners
    Object.keys(handlers).forEach(event => {
      socket.off(event);
    });

    // Add new listeners
    Object.entries(handlers).forEach(([event, handler]) => {
      socket.on(event, handler);
    });
  };

  // Emit events
  const emit = (event, data) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit:', event);
    }
  };

  // Join room
  const joinRoom = (roomId, password = null) => {
    emit('join-room', { roomId, password });
  };

  // Leave room
  const leaveRoom = (roomId) => {
    emit('leave-room', { roomId });
  };

  // WebRTC signaling
  const sendOffer = (targetUserId, offer) => {
    emit('offer', { targetUserId, offer });
  };

  const sendAnswer = (targetUserId, answer) => {
    emit('answer', { targetUserId, answer });
  };

  const sendIceCandidate = (targetUserId, candidate) => {
    emit('ice-candidate', { targetUserId, candidate });
  };

  // Screen sharing
  const startScreenShare = (roomId) => {
    emit('screen-share-started', { roomId });
  };

  const stopScreenShare = (roomId) => {
    emit('screen-share-stopped', { roomId });
  };

  // Chat
  const sendChatMessage = (roomId, message, type = 'text') => {
    emit('chat-message', { roomId, message, type });
  };

  // Whiteboard
  const sendWhiteboardDraw = (roomId, drawingData) => {
    emit('whiteboard-draw', { roomId, drawingData });
  };

  const sendWhiteboardClear = (roomId) => {
    emit('whiteboard-clear', { roomId });
  };

  // File sharing
  const sendFileUploaded = (roomId, fileInfo) => {
    emit('file-uploaded', { roomId, fileInfo });
  };

  // User actions
  const sendUserAction = (roomId, action, value) => {
    emit('user-action', { roomId, action, value });
  };

  // Recording
  const startRecording = (roomId) => {
    emit('recording-started', { roomId });
  };

  const stopRecording = (roomId) => {
    emit('recording-stopped', { roomId });
  };

  // Typing indicators
  const startTyping = (roomId) => {
    emit('typing-start', { roomId });
  };

  const stopTyping = (roomId) => {
    emit('typing-stop', { roomId });
  };

  // Get socket instance
  const getSocket = () => socketRef.current;

  // Check if connected
  const checkConnection = () => {
    return socketRef.current && isConnected;
  };

  // Reconnect manually
  const reconnect = () => {
    if (socketRef.current) {
      socketRef.current.connect();
    }
  };

  // Context value
  const value = {
    // Connection state
    isConnected,
    connectionError,
    
    // Core functions
    setupSocketHandlers,
    emit,
    getSocket,
    checkConnection,
    reconnect,
    
    // Room management
    joinRoom,
    leaveRoom,
    
    // WebRTC signaling
    sendOffer,
    sendAnswer,
    sendIceCandidate,
    
    // Features
    startScreenShare,
    stopScreenShare,
    sendChatMessage,
    sendWhiteboardDraw,
    sendWhiteboardClear,
    sendFileUploaded,
    sendUserAction,
    startRecording,
    stopRecording,
    startTyping,
    stopTyping
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

// Custom hook to use socket context
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;