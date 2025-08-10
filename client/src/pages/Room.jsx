import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Phone, 
  PhoneOff, 
  Users, 
  MessageSquare, 
  FileText, 
  PaintBucket,
  Settings,
  Maximize,
  Minimize,
  Copy,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import useWebRTC from '../hooks/useWebRTC';
import VideoPlayer from '../components/VideoPlayer';
import ChatPanel from '../components/ChatPanel';
import Whiteboard from '../components/Whiteboard';
import FileUpload from '../components/FileUpload';
import { encryptionManager } from '../utils/encryption';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const Room = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState('participants');
  const [copied, setCopied] = useState(false);
  const [socket, setSocket] = useState(null);

  const {
    localStream,
    remoteStreams,
    connectedUsers,
    isVideoEnabled,
    isAudioEnabled,
    isScreenSharing,
    connectionStatus,
    localVideoRef,
    toggleVideo,
    toggleAudio,
    startScreenShare,
    stopScreenShare,
    leaveRoom,
  } = useWebRTC(roomId, user);

  // Initialize socket and encryption
  useEffect(() => {
    if (!roomId || !user) return;

    const newSocket = io('/', {
      transports: ['websocket', 'polling'],
    });

    setSocket(newSocket);

    // Initialize encryption for the room
    encryptionManager.performKeyExchange(roomId, user.id);

    return () => {
      newSocket.disconnect();
    };
  }, [roomId, user]);

  // Handle file sharing
  const handleFileShared = (fileData) => {
    if (socket) {
      socket.emit('file-share', {
        roomId,
        fileData: encryptionManager.encryptFileData(fileData)
      });
    }
  };

  // Copy room ID
  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      toast.success('Room ID copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy room ID');
    }
  };

  // Leave room and redirect
  const handleLeaveRoom = () => {
    leaveRoom();
    navigate('/dashboard');
    toast.success('Left the room');
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Toggle screen share
  const handleToggleScreenShare = () => {
    if (isScreenSharing) {
      stopScreenShare();
    } else {
      startScreenShare();
    }
  };

  // Get user info for connected users
  const getUserInfo = (socketId) => {
    return connectedUsers.find(u => u.socketId === socketId) || { username: 'Unknown User' };
  };

  // Get grid layout classes
  const getGridLayout = () => {
    const totalVideos = 1 + remoteStreams.size; // +1 for local video
    
    if (totalVideos === 1) return 'grid-cols-1';
    if (totalVideos === 2) return 'grid-cols-2';
    if (totalVideos <= 4) return 'grid-cols-2 grid-rows-2';
    if (totalVideos <= 6) return 'grid-cols-3 grid-rows-2';
    if (totalVideos <= 9) return 'grid-cols-3 grid-rows-3';
    return 'grid-cols-4'; // For more than 9 participants
  };

  return (
    <div className="h-screen bg-secondary-900 flex flex-col">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-secondary-800 border-b border-secondary-700 px-6 py-4 flex items-center justify-between"
      >
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-white font-medium">Room: {roomId}</span>
            <button
              onClick={copyRoomId}
              className="text-secondary-400 hover:text-white transition-colors"
              title="Copy Room ID"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-400" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
          
          <div className="text-secondary-400 text-sm">
            {connectedUsers.length + 1} participant{connectedUsers.length !== 0 ? 's' : ''}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            connectionStatus === 'connected' 
              ? 'bg-green-500/20 text-green-400' 
              : connectionStatus === 'connecting'
              ? 'bg-yellow-500/20 text-yellow-400'
              : 'bg-red-500/20 text-red-400'
          }`}>
            {connectionStatus}
          </div>

          <button
            onClick={toggleFullscreen}
            className="text-secondary-400 hover:text-white p-2 rounded-lg hover:bg-secondary-700 transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? (
              <Minimize className="h-5 w-5" />
            ) : (
              <Maximize className="h-5 w-5" />
            )}
          </button>
        </div>
      </motion.header>

      <div className="flex-1 flex">
        {/* Main Video Area */}
        <div className="flex-1 p-4">
          <div className={`grid ${getGridLayout()} gap-4 h-full`}>
            {/* Local Video */}
            <VideoPlayer
              stream={localStream}
              isLocal={true}
              username={user?.username || 'You'}
              isVideoEnabled={isVideoEnabled}
              isAudioEnabled={isAudioEnabled}
              isScreenSharing={isScreenSharing}
              onToggleAudio={toggleAudio}
              onToggleVideo={toggleVideo}
              onToggleScreenShare={handleToggleScreenShare}
              className="min-h-48"
            />

            {/* Remote Videos */}
            {Array.from(remoteStreams.entries()).map(([socketId, stream]) => {
              const userInfo = getUserInfo(socketId);
              return (
                <VideoPlayer
                  key={socketId}
                  stream={stream}
                  isLocal={false}
                  username={userInfo.username}
                  className="min-h-48"
                />
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-80 bg-secondary-800 border-l border-secondary-700 flex flex-col"
        >
          {/* Sidebar Tabs */}
          <div className="flex border-b border-secondary-700">
            <button
              onClick={() => setActiveTab('participants')}
              className={`flex-1 p-4 text-sm font-medium transition-colors ${
                activeTab === 'participants'
                  ? 'text-primary-400 bg-secondary-700'
                  : 'text-secondary-400 hover:text-white'
              }`}
            >
              <Users className="h-4 w-4 mx-auto mb-1" />
              Participants
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 p-4 text-sm font-medium transition-colors ${
                activeTab === 'chat'
                  ? 'text-primary-400 bg-secondary-700'
                  : 'text-secondary-400 hover:text-white'
              }`}
            >
              <MessageSquare className="h-4 w-4 mx-auto mb-1" />
              Chat
            </button>
            <button
              onClick={() => setActiveTab('whiteboard')}
              className={`flex-1 p-4 text-sm font-medium transition-colors ${
                activeTab === 'whiteboard'
                  ? 'text-primary-400 bg-secondary-700'
                  : 'text-secondary-400 hover:text-white'
              }`}
            >
              <PaintBucket className="h-4 w-4 mx-auto mb-1" />
              Whiteboard
            </button>
            <button
              onClick={() => setActiveTab('files')}
              className={`flex-1 p-4 text-sm font-medium transition-colors ${
                activeTab === 'files'
                  ? 'text-primary-400 bg-secondary-700'
                  : 'text-secondary-400 hover:text-white'
              }`}
            >
              <FileText className="h-4 w-4 mx-auto mb-1" />
              Files
            </button>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 p-4">
            {activeTab === 'participants' && (
              <div className="space-y-3">
                <h3 className="text-white font-medium mb-4">
                  Participants ({connectedUsers.length + 1})
                </h3>
                
                {/* Current User */}
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-secondary-700">
                  <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {user?.username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">
                      {user?.username} (You)
                    </p>
                    <p className="text-secondary-400 text-xs">Host</p>
                  </div>
                  <div className="flex space-x-1">
                    {!isAudioEnabled && (
                      <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">M</span>
                      </div>
                    )}
                    {!isVideoEnabled && (
                      <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">V</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Connected Users */}
                {connectedUsers.map((connectedUser, index) => (
                  <motion.div
                    key={connectedUser.socketId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center space-x-3 p-3 rounded-lg bg-secondary-700"
                  >
                    <div className="w-8 h-8 bg-secondary-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">
                        {connectedUser.username?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium">
                        {connectedUser.username}
                      </p>
                      <p className="text-secondary-400 text-xs">Participant</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {activeTab === 'chat' && (
              <ChatPanel
                socket={socket}
                roomId={roomId}
                username={user?.username}
                userId={user?.id}
              />
            )}

            {activeTab === 'whiteboard' && (
              <Whiteboard
                roomId={roomId}
                username={user?.username}
                socket={socket}
              />
            )}

            {activeTab === 'files' && (
              <FileUpload
                onFileShared={handleFileShared}
                roomId={roomId}
              />
            )}
          </div>
        </motion.div>
      </div>

      {/* Bottom Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-secondary-800 border-t border-secondary-700 p-4"
      >
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={toggleAudio}
            className={`p-4 rounded-full transition-all duration-200 ${
              isAudioEnabled
                ? 'bg-secondary-700 hover:bg-secondary-600 text-white'
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
            title={isAudioEnabled ? 'Mute' : 'Unmute'}
          >
            {isAudioEnabled ? (
              <Phone className="h-6 w-6" />
            ) : (
              <PhoneOff className="h-6 w-6" />
            )}
          </button>

          <button
            onClick={toggleVideo}
            className={`p-4 rounded-full transition-all duration-200 ${
              isVideoEnabled
                ? 'bg-secondary-700 hover:bg-secondary-600 text-white'
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
            title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
          >
            {isVideoEnabled ? (
              <Phone className="h-6 w-6" />
            ) : (
              <PhoneOff className="h-6 w-6" />
            )}
          </button>

          <button
            onClick={handleToggleScreenShare}
            className={`p-4 rounded-full transition-all duration-200 ${
              isScreenSharing
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-secondary-700 hover:bg-secondary-600 text-white'
            }`}
            title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
          >
            <Phone className="h-6 w-6" />
          </button>

          <button
            onClick={handleLeaveRoom}
            className="p-4 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all duration-200"
            title="Leave room"
          >
            <PhoneOff className="h-6 w-6" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Room;