import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useRoom } from '../contexts/RoomContext';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Share2,
  Monitor,
  MonitorOff,
  MessageSquare,
  FileText,
  Edit3,
  Users,
  Settings,
  MoreVertical,
  Send,
  Paperclip,
  Download,
  Trash2,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  Record,
  Square,
  Camera,
  CameraOff
} from 'lucide-react';

const Room = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    currentRoom,
    participants,
    chatMessages,
    whiteboardData,
    files,
    screenShare,
    recording,
    loading,
    error,
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
    stopRecording
  } = useRoom();

  // Local state
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [chatInput, setChatInput] = useState('');
  const [isWhiteboardActive, setIsWhiteboardActive] = useState(false);
  const [whiteboardTool, setWhiteboardTool] = useState('pen');
  const [whiteboardColor, setWhiteboardColor] = useState('#000000');
  const [whiteboardSize, setWhiteboardSize] = useState(2);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Refs
  const localVideoRef = useRef(null);
  const remoteVideosRef = useRef({});
  const whiteboardCanvasRef = useRef(null);
  const chatContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Join room on component mount
  useEffect(() => {
    if (roomId) {
      joinRoom(roomId);
    }

    return () => {
      leaveRoom();
    };
  }, [roomId, joinRoom, leaveRoom]);

  // Scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Handle chat submission
  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (chatInput.trim()) {
      sendMessage(chatInput.trim());
      setChatInput('');
    }
  };

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      uploadFile(file);
    }
  };

  // Whiteboard drawing functions
  const startDrawing = useCallback((e) => {
    if (!isWhiteboardActive) return;
    
    const canvas = whiteboardCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawing(true);
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = whiteboardColor;
    ctx.lineWidth = whiteboardSize;
    ctx.lineCap = 'round';
  }, [isWhiteboardActive, whiteboardColor, whiteboardSize]);

  const draw = useCallback((e) => {
    if (!isDrawing || !isWhiteboardActive) return;
    
    const canvas = whiteboardCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
  }, [isDrawing, isWhiteboardActive]);

  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    const canvas = whiteboardCanvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.closePath();
    
    // Send drawing data to other participants
    if (canvas.toDataURL) {
      const drawingData = {
        type: 'drawing',
        data: canvas.toDataURL(),
        timestamp: Date.now()
      };
      drawOnWhiteboard(drawingData);
    }
  }, [isDrawing, drawOnWhiteboard]);

  // Toggle video/audio
  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
    // In a real app, you'd also toggle the actual video stream
  };

  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled);
    setIsMuted(!isMuted);
    // In a real app, you'd also toggle the actual audio stream
  };

  // Handle room leave
  const handleLeaveRoom = () => {
    leaveRoom();
    navigate('/dashboard');
  };

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Joining room...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!currentRoom) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-lg mb-4">Room not found</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Room Header */}
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700/50">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-400 hover:text-white transition-colors duration-200"
            >
              ← Back
            </button>
            <div>
              <h1 className="text-xl font-semibold text-white">{currentRoom.name}</h1>
              <p className="text-gray-400 text-sm">
                {participants.length} participant{participants.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Recording indicator */}
            {recording.isActive && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-lg">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-red-400 text-sm">Recording</span>
              </div>
            )}
            
            {/* Screen share indicator */}
            {screenShare.isActive && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                <Monitor className="w-4 h-4 text-blue-400" />
                <span className="text-blue-400 text-sm">Screen Sharing</span>
              </div>
            )}
            
            {/* Room controls */}
            <button
              onClick={() => setShowParticipants(!showParticipants)}
              className="p-2 text-gray-400 hover:text-white transition-colors duration-200"
            >
              <Users className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-400 hover:text-white transition-colors duration-200"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-120px)]">
        {/* Main Video Area */}
        <main className="flex-1 relative">
          {/* Video Grid */}
          <div className="h-full p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full">
              {/* Local Video */}
              <div className="relative bg-slate-800 rounded-lg overflow-hidden">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-white text-sm">
                  You
                </div>
                {!isVideoEnabled && (
                  <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
                    <div className="text-center">
                      <CameraOff className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-400">Camera Off</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Remote Videos */}
              {participants
                .filter(p => p.userId !== user?.id)
                .map((participant, index) => (
                  <div key={participant.userId} className="relative bg-slate-800 rounded-lg overflow-hidden">
                    <video
                      ref={el => remoteVideosRef.current[participant.userId] = el}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-white text-sm">
                      {participant.name}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Main Controls */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
            <div className="flex items-center space-x-4 bg-slate-800/90 backdrop-blur-sm rounded-full px-6 py-3 border border-slate-700/50">
              {/* Audio Control */}
              <button
                onClick={toggleAudio}
                className={`p-3 rounded-full transition-all duration-200 ${
                  isAudioEnabled && !isMuted
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {isAudioEnabled && !isMuted ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>

              {/* Video Control */}
              <button
                onClick={toggleVideo}
                className={`p-3 rounded-full transition-all duration-200 ${
                  isVideoEnabled
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>

              {/* Screen Share */}
              <button
                onClick={screenShare.isActive ? stopScreenSharing : startScreenSharing}
                className={`p-3 rounded-full transition-all duration-200 ${
                  screenShare.isActive
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
              >
                {screenShare.isActive ? <MonitorOff className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
              </button>

              {/* Recording */}
              <button
                onClick={recording.isActive ? stopRecording : startRecording}
                className={`p-3 rounded-full transition-all duration-200 ${
                  recording.isActive
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
              >
                {recording.isActive ? <Square className="w-5 h-5" /> : <Record className="w-5 h-5" />}
              </button>

              {/* Whiteboard */}
              <button
                onClick={() => setIsWhiteboardActive(!isWhiteboardActive)}
                className={`p-3 rounded-full transition-all duration-200 ${
                  isWhiteboardActive
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
              >
                <Edit3 className="w-5 h-5" />
              </button>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="p-3 rounded-full bg-gray-600 text-white hover:bg-gray-700 transition-all duration-200"
              >
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>

              {/* Leave Room */}
              <button
                onClick={handleLeaveRoom}
                className="p-3 rounded-full bg-red-600 text-white hover:bg-red-700 transition-all duration-200"
              >
                <PhoneOff className="w-5 h-5" />
              </button>
            </div>
          </div>
        </main>

        {/* Sidebar */}
        <aside className="w-80 bg-slate-800/50 backdrop-blur-sm border-l border-slate-700/50">
          {/* Tab Navigation */}
          <div className="flex border-b border-slate-700/50">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors duration-200 ${
                activeTab === 'chat'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setActiveTab('participants')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors duration-200 ${
                activeTab === 'participants'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Participants
            </button>
            <button
              onClick={() => setActiveTab('files')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors duration-200 ${
                activeTab === 'files'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Files
            </button>
            <button
              onClick={() => setActiveTab('whiteboard')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors duration-200 ${
                activeTab === 'whiteboard'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Whiteboard
            </button>
          </div>

          {/* Tab Content */}
          <div className="h-full overflow-y-auto">
            <AnimatePresence mode="wait">
              {activeTab === 'chat' && (
                <motion.div
                  key="chat"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="h-full flex flex-col"
                >
                  {/* Chat Messages */}
                  <div
                    ref={chatContainerRef}
                    className="flex-1 p-4 space-y-3 overflow-y-auto"
                  >
                    {chatMessages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${message.userId === user?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs px-3 py-2 rounded-lg ${
                            message.userId === user?.id
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-700 text-white'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {message.userName} • {new Date(message.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Chat Input */}
                  <div className="p-4 border-t border-slate-700/50">
                    <form onSubmit={handleChatSubmit} className="flex space-x-2">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        type="submit"
                        disabled={!chatInput.trim()}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                </motion.div>
              )}

              {activeTab === 'participants' && (
                <motion.div
                  key="participants"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-4 space-y-3"
                >
                  {participants.map((participant) => (
                    <div
                      key={participant.userId}
                      className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {participant.name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">{participant.name}</p>
                        <p className="text-gray-400 text-sm">
                          {participant.userId === user?.id ? 'You' : 'Participant'}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {participant.isVideoEnabled && (
                          <Video className="w-4 h-4 text-green-400" />
                        )}
                        {participant.isAudioEnabled && (
                          <Mic className="w-4 h-4 text-green-400" />
                        )}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}

              {activeTab === 'files' && (
                <motion.div
                  key="files"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-4"
                >
                  <div className="mb-4">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      <Paperclip className="w-4 h-4 inline mr-2" />
                      Upload File
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>

                  <div className="space-y-3">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg"
                      >
                        <FileText className="w-8 h-8 text-blue-400" />
                        <div className="flex-1">
                          <p className="text-white font-medium text-sm">{file.name}</p>
                          <p className="text-gray-400 text-xs">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button className="p-1 text-gray-400 hover:text-blue-400 transition-colors duration-200">
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeFile(file.id)}
                            className="p-1 text-gray-400 hover:text-red-400 transition-colors duration-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'whiteboard' && (
                <motion.div
                  key="whiteboard"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-4"
                >
                  {/* Whiteboard Tools */}
                  <div className="mb-4 space-y-3">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setWhiteboardTool('pen')}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                          whiteboardTool === 'pen'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                        }`}
                      >
                        Pen
                      </button>
                      <button
                        onClick={() => setWhiteboardTool('eraser')}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                          whiteboardTool === 'eraser'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                        }`}
                      >
                        Eraser
                      </button>
                    </div>

                    <div className="flex items-center space-x-3">
                      <label className="text-sm text-gray-300">Color:</label>
                      <input
                        type="color"
                        value={whiteboardColor}
                        onChange={(e) => setWhiteboardColor(e.target.value)}
                        className="w-8 h-8 rounded border border-slate-600"
                      />
                      <label className="text-sm text-gray-300">Size:</label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={whiteboardSize}
                        onChange={(e) => setWhiteboardSize(parseInt(e.target.value))}
                        className="flex-1"
                      />
                    </div>

                    <button
                      onClick={clearWhiteboard}
                      className="w-full px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                    >
                      <RotateCcw className="w-4 h-4 inline mr-2" />
                      Clear Whiteboard
                    </button>
                  </div>

                  {/* Whiteboard Canvas */}
                  <div className="border border-slate-600 rounded-lg overflow-hidden">
                    <canvas
                      ref={whiteboardCanvasRef}
                      width={300}
                      height={400}
                      className="w-full h-80 bg-white cursor-crosshair"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Room;