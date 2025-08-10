import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Monitor, 
  Volume2, 
  VolumeX 
} from 'lucide-react';

const VideoPlayer = ({ 
  stream, 
  isLocal = false, 
  username = 'User', 
  isVideoEnabled = true, 
  isAudioEnabled = true, 
  isScreenSharing = false, 
  className = '',
  showControls = true,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare
}) => {
  const videoRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`video-container relative group ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal} // Always mute local video to prevent feedback
        className="w-full h-full object-cover"
      />

      {/* Video Disabled Overlay */}
      {!isVideoEnabled && (
        <div className="absolute inset-0 bg-secondary-800 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-secondary-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white text-xl font-semibold">
                {username.charAt(0).toUpperCase()}
              </span>
            </div>
            <p className="text-white text-sm font-medium">{username}</p>
          </div>
        </div>
      )}

      {/* Username Badge */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ 
          opacity: isHovered || !isVideoEnabled ? 1 : 0.8, 
          y: 0 
        }}
        className="absolute bottom-4 left-4 bg-black/60 text-white px-3 py-1 rounded-lg text-sm font-medium backdrop-blur-sm"
      >
        <div className="flex items-center space-x-2">
          <span>{username}</span>
          {isLocal && <span className="text-xs text-green-400">(You)</span>}
          {isScreenSharing && (
            <Monitor className="h-3 w-3 text-blue-400" />
          )}
        </div>
      </motion.div>

      {/* Audio/Video Status Indicators */}
      <div className="absolute top-4 right-4 flex space-x-2">
        {!isAudioEnabled && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="bg-red-500 p-1.5 rounded-full"
          >
            <MicOff className="h-3 w-3 text-white" />
          </motion.div>
        )}
        {!isVideoEnabled && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="bg-red-500 p-1.5 rounded-full"
          >
            <VideoOff className="h-3 w-3 text-white" />
          </motion.div>
        )}
      </div>

      {/* Local Video Controls */}
      {isLocal && showControls && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: isHovered ? 1 : 0,
            y: isHovered ? 0 : 20
          }}
          className="video-controls"
        >
          <button
            onClick={onToggleAudio}
            className={`p-3 rounded-full transition-colors ${
              isAudioEnabled 
                ? 'bg-secondary-700/80 hover:bg-secondary-600/80 text-white' 
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
            title={isAudioEnabled ? 'Mute' : 'Unmute'}
          >
            {isAudioEnabled ? (
              <Mic className="h-5 w-5" />
            ) : (
              <MicOff className="h-5 w-5" />
            )}
          </button>

          <button
            onClick={onToggleVideo}
            className={`p-3 rounded-full transition-colors ${
              isVideoEnabled 
                ? 'bg-secondary-700/80 hover:bg-secondary-600/80 text-white' 
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
            title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
          >
            {isVideoEnabled ? (
              <Video className="h-5 w-5" />
            ) : (
              <VideoOff className="h-5 w-5" />
            )}
          </button>

          <button
            onClick={onToggleScreenShare}
            className={`p-3 rounded-full transition-colors ${
              isScreenSharing
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-secondary-700/80 hover:bg-secondary-600/80 text-white'
            }`}
            title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
          >
            <Monitor className="h-5 w-5" />
          </button>
        </motion.div>
      )}

      {/* Remote Video Controls */}
      {!isLocal && showControls && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: isHovered ? 1 : 0
          }}
          className="absolute bottom-4 right-4"
        >
          <button
            onClick={toggleMute}
            className={`p-2 rounded-full transition-colors ${
              isMuted 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-secondary-700/80 hover:bg-secondary-600/80'
            } text-white`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>
        </motion.div>
      )}

      {/* Connection Status */}
      {!stream && (
        <div className="absolute inset-0 bg-secondary-800 flex items-center justify-center">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2"
            />
            <p className="text-white text-sm">Connecting...</p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default VideoPlayer;