import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

// Action types
const ROOM_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ROOM: 'SET_ROOM',
  SET_PARTICIPANTS: 'SET_PARTICIPANTS',
  ADD_PARTICIPANT: 'ADD_PARTICIPANT',
  REMOVE_PARTICIPANT: 'REMOVE_PARTICIPANT',
  UPDATE_PARTICIPANT: 'UPDATE_PARTICIPANT',
  SET_CHAT_MESSAGES: 'SET_CHAT_MESSAGES',
  ADD_CHAT_MESSAGE: 'ADD_CHAT_MESSAGE',
  SET_WHITEBOARD_DATA: 'SET_WHITEBOARD_DATA',
  ADD_WHITEBOARD_DRAWING: 'ADD_WHITEBOARD_DRAWING',
  CLEAR_WHITEBOARD: 'CLEAR_WHITEBOARD',
  SET_FILES: 'SET_FILES',
  ADD_FILE: 'ADD_FILE',
  REMOVE_FILE: 'REMOVE_FILE',
  SET_SCREEN_SHARE: 'SET_SCREEN_SHARE',
  SET_RECORDING: 'SET_RECORDING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  RESET_ROOM: 'RESET_ROOM'
};

// Initial state
const initialState = {
  currentRoom: null,
  participants: [],
  chatMessages: [],
  whiteboardData: [],
  files: [],
  screenShare: {
    isActive: false,
    userId: null,
    stream: null
  },
  recording: {
    isActive: false,
    startedBy: null,
    startTime: null
  },
  loading: false,
  error: null
};

// Reducer function
const roomReducer = (state, action) => {
  switch (action.type) {
    case ROOM_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };
    
    case ROOM_ACTIONS.SET_ROOM:
      return {
        ...state,
        currentRoom: action.payload,
        loading: false
      };
    
    case ROOM_ACTIONS.SET_PARTICIPANTS:
      return {
        ...state,
        participants: action.payload
      };
    
    case ROOM_ACTIONS.ADD_PARTICIPANT:
      return {
        ...state,
        participants: [...state.participants, action.payload]
      };
    
    case ROOM_ACTIONS.REMOVE_PARTICIPANT:
      return {
        ...state,
        participants: state.participants.filter(p => p.userId !== action.payload)
      };
    
    case ROOM_ACTIONS.UPDATE_PARTICIPANT:
      return {
        ...state,
        participants: state.participants.map(p => 
          p.userId === action.payload.userId 
            ? { ...p, ...action.payload.updates }
            : p
        )
      };
    
    case ROOM_ACTIONS.SET_CHAT_MESSAGES:
      return {
        ...state,
        chatMessages: action.payload
      };
    
    case ROOM_ACTIONS.ADD_CHAT_MESSAGE:
      return {
        ...state,
        chatMessages: [...state.chatMessages, action.payload]
      };
    
    case ROOM_ACTIONS.SET_WHITEBOARD_DATA:
      return {
        ...state,
        whiteboardData: action.payload
      };
    
    case ROOM_ACTIONS.ADD_WHITEBOARD_DRAWING:
      return {
        ...state,
        whiteboardData: [...state.whiteboardData, action.payload]
      };
    
    case ROOM_ACTIONS.CLEAR_WHITEBOARD:
      return {
        ...state,
        whiteboardData: []
      };
    
    case ROOM_ACTIONS.SET_FILES:
      return {
        ...state,
        files: action.payload
      };
    
    case ROOM_ACTIONS.ADD_FILE:
      return {
        ...state,
        files: [...state.files, action.payload]
      };
    
    case ROOM_ACTIONS.REMOVE_FILE:
      return {
        ...state,
        files: state.files.filter(f => f.id !== action.payload)
      };
    
    case ROOM_ACTIONS.SET_SCREEN_SHARE:
      return {
        ...state,
        screenShare: action.payload
      };
    
    case ROOM_ACTIONS.SET_RECORDING:
      return {
        ...state,
        recording: action.payload
      };
    
    case ROOM_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    
    case ROOM_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    
    case ROOM_ACTIONS.RESET_ROOM:
      return {
        ...initialState
      };
    
    default:
      return state;
  }
};

// Create context
const RoomContext = createContext();

// Room provider component
export const RoomProvider = ({ children }) => {
  const [state, dispatch] = useReducer(roomReducer, initialState);
  const { user } = useAuth();
  const { 
    setupSocketHandlers, 
    joinRoom: socketJoinRoom, 
    leaveRoom: socketLeaveRoom,
    sendChatMessage: socketSendChatMessage,
    sendWhiteboardDraw: socketSendWhiteboardDraw,
    sendWhiteboardClear: socketSendWhiteboardClear,
    sendFileUploaded: socketSendFileUploaded,
    startScreenShare: socketStartScreenShare,
    stopScreenShare: socketStopScreenShare,
    startRecording: socketStartRecording,
    stopRecording: socketStopRecording
  } = useSocket();

  // Set up socket event handlers when room context is used
  useEffect(() => {
    if (!user) return;

    const handlers = {
      // Room events
      'room-joined': handleRoomJoined,
      'room-left': handleRoomLeft,
      'room-error': handleRoomError,
      
      // Participant events
      'participant-joined': handleParticipantJoined,
      'participant-left': handleParticipantLeft,
      'participant-updated': handleParticipantUpdated,
      
      // Chat events
      'chat-message': handleChatMessage,
      
      // Whiteboard events
      'whiteboard-draw': handleWhiteboardDraw,
      'whiteboard-clear': handleWhiteboardClear,
      
      // File events
      'file-uploaded': handleFileUploaded,
      'file-removed': handleFileRemoved,
      
      // Screen share events
      'screen-share-started': handleScreenShareStarted,
      'screen-share-stopped': handleScreenShareStopped,
      
      // Recording events
      'recording-started': handleRecordingStarted,
      'recording-stopped': handleRecordingStopped
    };

    setupSocketHandlers(handlers);
  }, [user, setupSocketHandlers]);

  // Event handlers
  const handleRoomJoined = (data) => {
    dispatch({ type: ROOM_ACTIONS.SET_ROOM, payload: data.room });
    dispatch({ type: ROOM_ACTIONS.SET_PARTICIPANTS, payload: data.participants });
    dispatch({ type: ROOM_ACTIONS.SET_CHAT_MESSAGES, payload: data.chatHistory || [] });
    dispatch({ type: ROOM_ACTIONS.SET_WHITEBOARD_DATA, payload: data.whiteboardHistory || [] });
    dispatch({ type: ROOM_ACTIONS.SET_FILES, payload: data.files || [] });
    
    toast.success(`Joined room: ${data.room.name}`);
  };

  const handleRoomLeft = () => {
    dispatch({ type: ROOM_ACTIONS.RESET_ROOM });
    toast.success('Left room successfully');
  };

  const handleRoomError = (data) => {
    dispatch({ type: ROOM_ACTIONS.SET_ERROR, payload: data.error });
    toast.error(data.error);
  };

  const handleParticipantJoined = (data) => {
    dispatch({ type: ROOM_ACTIONS.ADD_PARTICIPANT, payload: data.participant });
    if (data.participant.userId !== user.id) {
      toast.success(`${data.participant.name} joined the room`);
    }
  };

  const handleParticipantLeft = (data) => {
    dispatch({ type: ROOM_ACTIONS.REMOVE_PARTICIPANT, payload: data.userId });
    toast.info(`${data.participantName} left the room`);
  };

  const handleParticipantUpdated = (data) => {
    dispatch({ 
      type: ROOM_ACTIONS.UPDATE_PARTICIPANT, 
      payload: { userId: data.userId, updates: data.updates }
    });
  };

  const handleChatMessage = (data) => {
    dispatch({ type: ROOM_ACTIONS.ADD_CHAT_MESSAGE, payload: data.message });
  };

  const handleWhiteboardDraw = (data) => {
    dispatch({ type: ROOM_ACTIONS.ADD_WHITEBOARD_DRAWING, payload: data.drawingData });
  };

  const handleWhiteboardClear = () => {
    dispatch({ type: ROOM_ACTIONS.CLEAR_WHITEBOARD });
  };

  const handleFileUploaded = (data) => {
    dispatch({ type: ROOM_ACTIONS.ADD_FILE, payload: data.fileInfo });
    toast.success(`File uploaded: ${data.fileInfo.name}`);
  };

  const handleFileRemoved = (data) => {
    dispatch({ type: ROOM_ACTIONS.REMOVE_FILE, payload: data.fileId });
  };

  const handleScreenShareStarted = (data) => {
    dispatch({ 
      type: ROOM_ACTIONS.SET_SCREEN_SHARE, 
      payload: { 
        isActive: true, 
        userId: data.userId, 
        stream: data.stream 
      }
    });
    
    if (data.userId !== user.id) {
      toast.info(`${data.participantName} started screen sharing`);
    }
  };

  const handleScreenShareStopped = (data) => {
    dispatch({ 
      type: ROOM_ACTIONS.SET_SCREEN_SHARE, 
      payload: { 
        isActive: false, 
        userId: null, 
        stream: null 
      }
    });
    
    if (data.userId !== user.id) {
      toast.info(`${data.participantName} stopped screen sharing`);
    }
  };

  const handleRecordingStarted = (data) => {
    dispatch({ 
      type: ROOM_ACTIONS.SET_RECORDING, 
      payload: { 
        isActive: true, 
        startedBy: data.userId, 
        startTime: new Date().toISOString()
      }
    });
    
    toast.success('Recording started');
  };

  const handleRecordingStopped = () => {
    dispatch({ 
      type: ROOM_ACTIONS.SET_RECORDING, 
      payload: { 
        isActive: false, 
        startedBy: null, 
        startTime: null
      }
    });
    
    toast.success('Recording stopped');
  };

  // Room actions
  const joinRoom = async (roomId, password = null) => {
    try {
      dispatch({ type: ROOM_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: ROOM_ACTIONS.CLEAR_ERROR });
      
      socketJoinRoom(roomId, password);
    } catch (error) {
      dispatch({ type: ROOM_ACTIONS.SET_ERROR, payload: error.message });
    }
  };

  const leaveRoom = () => {
    if (state.currentRoom) {
      socketLeaveRoom(state.currentRoom.id);
    }
  };

  // Chat actions
  const sendMessage = (message, type = 'text') => {
    if (!state.currentRoom) return;
    
    const messageData = {
      roomId: state.currentRoom.id,
      message,
      type
    };
    
    socketSendChatMessage(state.currentRoom.id, message, type);
  };

  // Whiteboard actions
  const drawOnWhiteboard = (drawingData) => {
    if (!state.currentRoom) return;
    
    socketSendWhiteboardDraw(state.currentRoom.id, drawingData);
  };

  const clearWhiteboard = () => {
    if (!state.currentRoom) return;
    
    socketSendWhiteboardClear(state.currentRoom.id);
  };

  // File actions
  const uploadFile = (file) => {
    if (!state.currentRoom) return;
    
    // In a real app, you'd upload the file to a server first
    const fileInfo = {
      id: Date.now().toString(),
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedBy: user.id,
      uploadedAt: new Date().toISOString()
    };
    
    socketSendFileUploaded(state.currentRoom.id, fileInfo);
  };

  const removeFile = (fileId) => {
    if (!state.currentRoom) return;
    
    // In a real app, you'd also remove the file from the server
    dispatch({ type: ROOM_ACTIONS.REMOVE_FILE, payload: fileId });
  };

  // Screen share actions
  const startScreenSharing = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      
      dispatch({ 
        type: ROOM_ACTIONS.SET_SCREEN_SHARE, 
        payload: { 
          isActive: true, 
          userId: user.id, 
          stream 
        }
      });
      
      socketStartScreenShare(state.currentRoom.id);
      toast.success('Screen sharing started');
    } catch (error) {
      toast.error('Failed to start screen sharing');
    }
  };

  const stopScreenSharing = () => {
    if (state.screenShare.stream) {
      state.screenShare.stream.getTracks().forEach(track => track.stop());
    }
    
    dispatch({ 
      type: ROOM_ACTIONS.SET_SCREEN_SHARE, 
      payload: { 
        isActive: false, 
        userId: null, 
        stream: null 
      }
    });
    
    socketStopScreenShare(state.currentRoom.id);
    toast.success('Screen sharing stopped');
  };

  // Recording actions
  const startRecording = () => {
    if (!state.currentRoom) return;
    
    socketStartRecording(state.currentRoom.id);
  };

  const stopRecording = () => {
    if (!state.currentRoom) return;
    
    socketStopRecording(state.currentRoom.id);
  };

  // Utility functions
  const getParticipantById = (userId) => {
    return state.participants.find(p => p.userId === userId);
  };

  const isParticipantInRoom = (userId) => {
    return state.participants.some(p => p.userId === userId);
  };

  const getCurrentUserParticipant = () => {
    return state.participants.find(p => p.userId === user?.id);
  };

  const clearError = () => {
    dispatch({ type: ROOM_ACTIONS.CLEAR_ERROR });
  };

  // Context value
  const value = {
    // State
    currentRoom: state.currentRoom,
    participants: state.participants,
    chatMessages: state.chatMessages,
    whiteboardData: state.whiteboardData,
    files: state.files,
    screenShare: state.screenShare,
    recording: state.recording,
    loading: state.loading,
    error: state.error,
    
    // Actions
    joinRoom,
    leaveRoom,
    sendMessage,
    drawOnWhiteboard,
    clearWhiteboard,
    uploadFile,
    removeFile,
    startScreenSharing,
    stopScreenSharing,
    startRecording,
    stopRecording,
    
    // Utility functions
    getParticipantById,
    isParticipantInRoom,
    getCurrentUserParticipant,
    clearError
  };

  return (
    <RoomContext.Provider value={value}>
      {children}
    </RoomContext.Provider>
  );
};

// Custom hook to use room context
export const useRoom = () => {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useRoom must be used within a RoomProvider');
  }
  return context;
};

export default RoomContext;