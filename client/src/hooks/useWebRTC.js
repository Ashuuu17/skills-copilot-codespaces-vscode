import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const STUN_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

const useWebRTC = (roomId, user) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  const socketRef = useRef(null);
  const peerConnectionsRef = useRef(new Map());
  const localVideoRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    if (!roomId || !user) return;

    socketRef.current = io('/', {
      transports: ['websocket', 'polling'],
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('Socket connected');
      setConnectionStatus('connected');
      socket.emit('join-room', {
        roomId,
        userId: user.id,
        username: user.username,
      });
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnectionStatus('disconnected');
    });

    socket.on('user-joined', ({ userId, username, socketId }) => {
      console.log('User joined:', username);
      setConnectedUsers(prev => [...prev, { userId, username, socketId }]);
      createPeerConnection(socketId, false);
    });

    socket.on('user-left', ({ userId, username, socketId }) => {
      console.log('User left:', username);
      setConnectedUsers(prev => prev.filter(u => u.socketId !== socketId));
      setRemoteStreams(prev => {
        const newStreams = new Map(prev);
        newStreams.delete(socketId);
        return newStreams;
      });
      
      if (peerConnectionsRef.current.has(socketId)) {
        peerConnectionsRef.current.get(socketId).close();
        peerConnectionsRef.current.delete(socketId);
      }
    });

    socket.on('room-users', (users) => {
      setConnectedUsers(users);
      users.forEach(user => {
        createPeerConnection(user.socketId, true);
      });
    });

    socket.on('offer', async ({ offer, senderSocketId }) => {
      const pc = peerConnectionsRef.current.get(senderSocketId);
      if (pc) {
        await pc.setRemoteDescription(offer);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('answer', {
          answer,
          targetSocketId: senderSocketId,
        });
      }
    });

    socket.on('answer', async ({ answer, senderSocketId }) => {
      const pc = peerConnectionsRef.current.get(senderSocketId);
      if (pc) {
        await pc.setRemoteDescription(answer);
      }
    });

    socket.on('ice-candidate', async ({ candidate, senderSocketId }) => {
      const pc = peerConnectionsRef.current.get(senderSocketId);
      if (pc) {
        await pc.addIceCandidate(candidate);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [roomId, user]);

  // Get user media
  const getUserMedia = useCallback(async (video = true, audio = true) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: video ? { width: 1280, height: 720 } : false,
        audio: audio ? { echoCancellation: true, noiseSuppression: true } : false,
      });
      
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  }, []);

  // Create peer connection
  const createPeerConnection = useCallback((socketId, shouldCreateOffer) => {
    if (peerConnectionsRef.current.has(socketId)) {
      return peerConnectionsRef.current.get(socketId);
    }

    const pc = new RTCPeerConnection({
      iceServers: STUN_SERVERS,
    });

    // Add local stream tracks
    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }

    // Handle remote stream
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      setRemoteStreams(prev => new Map(prev.set(socketId, remoteStream)));
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('ice-candidate', {
          candidate: event.candidate,
          targetSocketId: socketId,
        });
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log('Connection state:', pc.connectionState);
    };

    peerConnectionsRef.current.set(socketId, pc);

    // Create offer if needed
    if (shouldCreateOffer) {
      createOffer(socketId);
    }

    return pc;
  }, [localStream]);

  // Create offer
  const createOffer = useCallback(async (socketId) => {
    const pc = peerConnectionsRef.current.get(socketId);
    if (pc && socketRef.current) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socketRef.current.emit('offer', {
        offer,
        targetSocketId: socketId,
      });
    }
  }, []);

  // Initialize media on mount
  useEffect(() => {
    getUserMedia(isVideoEnabled, isAudioEnabled);
    
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      peerConnectionsRef.current.forEach(pc => pc.close());
    };
  }, []);

  // Update peer connections when local stream changes
  useEffect(() => {
    if (localStream) {
      peerConnectionsRef.current.forEach(pc => {
        // Remove old tracks
        pc.getSenders().forEach(sender => {
          if (sender.track) {
            pc.removeTrack(sender);
          }
        });
        
        // Add new tracks
        localStream.getTracks().forEach(track => {
          pc.addTrack(track, localStream);
        });
      });

      // Recreate offers for existing connections
      peerConnectionsRef.current.forEach((pc, socketId) => {
        createOffer(socketId);
      });
    }
  }, [localStream, createOffer]);

  // Toggle video
  const toggleVideo = useCallback(async () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    } else {
      // Get new stream with video
      const newStream = await getUserMedia(!isVideoEnabled, isAudioEnabled);
      setLocalStream(newStream);
      setIsVideoEnabled(!isVideoEnabled);
    }
  }, [localStream, isVideoEnabled, isAudioEnabled, getUserMedia]);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  }, [localStream]);

  // Start screen sharing
  const startScreenShare = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      const videoTrack = screenStream.getVideoTracks()[0];
      
      // Replace video track in all peer connections
      peerConnectionsRef.current.forEach(pc => {
        const sender = pc.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      });

      // Update local stream
      if (localStream) {
        const audioTrack = localStream.getAudioTracks()[0];
        const newStream = new MediaStream([videoTrack]);
        if (audioTrack) {
          newStream.addTrack(audioTrack);
        }
        setLocalStream(newStream);
      }

      setIsScreenSharing(true);

      // Notify other users
      if (socketRef.current) {
        socketRef.current.emit('start-screen-share', { roomId });
      }

      // Handle screen share end
      videoTrack.onended = () => {
        stopScreenShare();
      };

    } catch (error) {
      console.error('Error starting screen share:', error);
    }
  }, [localStream, roomId]);

  // Stop screen sharing
  const stopScreenShare = useCallback(async () => {
    try {
      // Get camera stream back
      const cameraStream = await getUserMedia(isVideoEnabled, isAudioEnabled);
      const videoTrack = cameraStream.getVideoTracks()[0];

      if (videoTrack) {
        // Replace screen share track with camera track
        peerConnectionsRef.current.forEach(pc => {
          const sender = pc.getSenders().find(s => 
            s.track && s.track.kind === 'video'
          );
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
        });
      }

      setIsScreenSharing(false);

      // Notify other users
      if (socketRef.current) {
        socketRef.current.emit('stop-screen-share', { roomId });
      }

    } catch (error) {
      console.error('Error stopping screen share:', error);
    }
  }, [isVideoEnabled, isAudioEnabled, getUserMedia, roomId]);

  // Leave room
  const leaveRoom = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
    peerConnectionsRef.current.forEach(pc => pc.close());
    peerConnectionsRef.current.clear();
    
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    
    setLocalStream(null);
    setRemoteStreams(new Map());
    setConnectedUsers([]);
  }, [localStream]);

  return {
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
  };
};

export default useWebRTC;