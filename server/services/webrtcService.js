const crypto = require('crypto');

class WebRTCService {
  constructor() {
    this.peerConnections = new Map(); // Track peer connections
    this.iceServers = this.getDefaultIceServers();
    this.mediaConstraints = this.getDefaultMediaConstraints();
  }

  /**
   * Get default ICE servers for WebRTC
   * @returns {Array} Array of ICE server configurations
   */
  getDefaultIceServers() {
    return [
      {
        urls: [
          'stun:stun.l.google.com:19302',
          'stun:stun1.l.google.com:19302',
          'stun:stun2.l.google.com:19302'
        ]
      },
      // Add TURN servers for production (these are examples)
      // {
      //   urls: 'turn:your-turn-server.com:3478',
      //   username: 'username',
      //   credential: 'password'
      // }
    ];
  }

  /**
   * Get default media constraints for getUserMedia
   * @returns {Object} Media constraints object
   */
  getDefaultMediaConstraints() {
    return {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 48000,
        channelCount: 2
      },
      video: {
        width: { ideal: 1280, min: 640 },
        height: { ideal: 720, min: 480 },
        frameRate: { ideal: 30, min: 15 },
        facingMode: 'user'
      }
      // screen: {
      //   video: {
      //     cursor: 'always',
      //     displaySurface: 'monitor'
      //   }
      // }
    };
  }

  /**
   * Create a new peer connection
   * @param {string} peerId - Unique identifier for the peer
   * @param {Object} options - Connection options
   * @returns {Object} Peer connection info
   */
  createPeerConnection(peerId, options = {}) {
    try {
      // Generate connection ID
      const connectionId = crypto.randomBytes(16).toString('hex');
      
      // Create peer connection configuration
      const config = {
        iceServers: options.iceServers || this.iceServers,
        iceCandidatePoolSize: options.iceCandidatePoolSize || 10,
        bundlePolicy: options.bundlePolicy || 'balanced',
        rtcpMuxPolicy: options.rtcpMuxPolicy || 'require',
        iceTransportPolicy: options.iceTransportPolicy || 'all'
      };

      // Create peer connection object
      const peerConnection = {
        id: connectionId,
        peerId,
        config,
        state: 'new',
        iceConnectionState: 'new',
        connectionState: 'new',
        createdAt: new Date(),
        lastActivity: new Date(),
        stats: {
          bytesReceived: 0,
          bytesSent: 0,
          packetsReceived: 0,
          packetsSent: 0
        }
      };

      // Store the connection
      this.peerConnections.set(connectionId, peerConnection);

      console.log(`🔗 Created peer connection: ${connectionId} for peer: ${peerId}`);

      return {
        connectionId,
        config,
        success: true
      };

    } catch (error) {
      console.error('Error creating peer connection:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Add ICE candidate to peer connection
   * @param {string} connectionId - Connection identifier
   * @param {Object} candidate - ICE candidate object
   * @returns {Object} Result of adding candidate
   */
  addIceCandidate(connectionId, candidate) {
    try {
      const connection = this.peerConnections.get(connectionId);
      
      if (!connection) {
        return {
          success: false,
          error: 'Connection not found'
        };
      }

      // Update connection state
      connection.iceConnectionState = 'checking';
      connection.lastActivity = new Date();

      console.log(`🧊 Added ICE candidate to connection: ${connectionId}`);

      return {
        success: true,
        connectionId,
        candidate
      };

    } catch (error) {
      console.error('Error adding ICE candidate:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Set remote description for peer connection
   * @param {string} connectionId - Connection identifier
   * @param {Object} description - Remote description object
   * @returns {Object} Result of setting remote description
   */
  setRemoteDescription(connectionId, description) {
    try {
      const connection = this.peerConnections.get(connectionId);
      
      if (!connection) {
        return {
          success: false,
          error: 'Connection not found'
        };
      }

      // Update connection state
      connection.state = 'have-remote-offer';
      connection.lastActivity = new Date();

      console.log(`📝 Set remote description for connection: ${connectionId}`);

      return {
        success: true,
        connectionId,
        description
      };

    } catch (error) {
      console.error('Error setting remote description:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create offer for peer connection
   * @param {string} connectionId - Connection identifier
   * @param {Object} options - Offer options
   * @returns {Object} Offer object
   */
  createOffer(connectionId, options = {}) {
    try {
      const connection = this.peerConnections.get(connectionId);
      
      if (!connection) {
        return {
          success: false,
          error: 'Connection not found'
        };
      }

      // Update connection state
      connection.state = 'have-local-offer';
      connection.lastActivity = new Date();

      // Generate offer (this would be done on the client side in actual implementation)
      const offer = {
        type: 'offer',
        sdp: 'Generated offer SDP would go here',
        connectionId,
        timestamp: new Date().toISOString()
      };

      console.log(`📤 Created offer for connection: ${connectionId}`);

      return {
        success: true,
        offer
      };

    } catch (error) {
      console.error('Error creating offer:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create answer for peer connection
   * @param {string} connectionId - Connection identifier
   * @returns {Object} Answer object
   */
  createAnswer(connectionId) {
    try {
      const connection = this.peerConnections.get(connectionId);
      
      if (!connection) {
        return {
          success: false,
          error: 'Connection not found'
        };
      }

      // Update connection state
      connection.state = 'stable';
      connection.lastActivity = new Date();

      // Generate answer (this would be done on the client side in actual implementation)
      const answer = {
        type: 'answer',
        sdp: 'Generated answer SDP would go here',
        connectionId,
        timestamp: new Date().toISOString()
      };

      console.log(`📥 Created answer for connection: ${connectionId}`);

      return {
        success: true,
        answer
      };

    } catch (error) {
      console.error('Error creating answer:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update connection state
   * @param {string} connectionId - Connection identifier
   * @param {string} state - New connection state
   * @returns {Object} Result of state update
   */
  updateConnectionState(connectionId, state) {
    try {
      const connection = this.peerConnections.get(connectionId);
      
      if (!connection) {
        return {
          success: false,
          error: 'Connection not found'
        };
      }

      // Update connection state
      connection.connectionState = state;
      connection.lastActivity = new Date();

      console.log(`🔄 Updated connection state: ${connectionId} -> ${state}`);

      return {
        success: true,
        connectionId,
        state
      };

    } catch (error) {
      console.error('Error updating connection state:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update ICE connection state
   * @param {string} connectionId - Connection identifier
   * @param {string} state - New ICE connection state
   * @returns {Object} Result of state update
   */
  updateIceConnectionState(connectionId, state) {
    try {
      const connection = this.peerConnections.get(connectionId);
      
      if (!connection) {
        return {
          success: false,
          error: 'Connection not found'
        };
      }

      // Update ICE connection state
      connection.iceConnectionState = state;
      connection.lastActivity = new Date();

      console.log(`🧊 Updated ICE connection state: ${connectionId} -> ${state}`);

      return {
        success: true,
        connectionId,
        state
      };

    } catch (error) {
      console.error('Error updating ICE connection state:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get connection statistics
   * @param {string} connectionId - Connection identifier
   * @returns {Object} Connection statistics
   */
  getConnectionStats(connectionId) {
    try {
      const connection = this.peerConnections.get(connectionId);
      
      if (!connection) {
        return {
          success: false,
          error: 'Connection not found'
        };
      }

      return {
        success: true,
        stats: connection.stats,
        state: connection.state,
        iceConnectionState: connection.iceConnectionState,
        connectionState: connection.connectionState,
        createdAt: connection.createdAt,
        lastActivity: connection.lastActivity
      };

    } catch (error) {
      console.error('Error getting connection stats:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Close peer connection
   * @param {string} connectionId - Connection identifier
   * @returns {Object} Result of closing connection
   */
  closeConnection(connectionId) {
    try {
      const connection = this.peerConnections.get(connectionId);
      
      if (!connection) {
        return {
          success: false,
          error: 'Connection not found'
        };
      }

      // Update connection state
      connection.state = 'closed';
      connection.iceConnectionState = 'closed';
      connection.connectionState = 'closed';
      connection.lastActivity = new Date();

      // Remove from tracking
      this.peerConnections.delete(connectionId);

      console.log(`🔒 Closed peer connection: ${connectionId}`);

      return {
        success: true,
        connectionId
      };

    } catch (error) {
      console.error('Error closing connection:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get all active connections
   * @returns {Array} Array of active connections
   */
  getActiveConnections() {
    const activeConnections = [];
    
    for (const [connectionId, connection] of this.peerConnections.entries()) {
      if (connection.state !== 'closed') {
        activeConnections.push({
          connectionId,
          peerId: connection.peerId,
          state: connection.state,
          iceConnectionState: connection.iceConnectionState,
          connectionState: connection.connectionState,
          createdAt: connection.createdAt,
          lastActivity: connection.lastActivity
        });
      }
    }

    return activeConnections;
  }

  /**
   * Clean up old/inactive connections
   * @param {number} maxAge - Maximum age in milliseconds (default: 1 hour)
   * @returns {number} Number of connections cleaned up
   */
  cleanupOldConnections(maxAge = 60 * 60 * 1000) {
    const now = new Date();
    let cleanedCount = 0;

    for (const [connectionId, connection] of this.peerConnections.entries()) {
      const age = now - connection.lastActivity;
      
      if (age > maxAge || connection.state === 'closed') {
        this.peerConnections.delete(connectionId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} old/inactive connections`);
    }

    return cleanedCount;
  }

  /**
   * Get media constraints for specific use case
   * @param {string} useCase - Use case ('video', 'audio', 'screen', 'custom')
   * @param {Object} customConstraints - Custom constraints to override defaults
   * @returns {Object} Media constraints object
   */
  getMediaConstraints(useCase = 'video', customConstraints = {}) {
    let constraints = { ...this.mediaConstraints };

    switch (useCase) {
      case 'audio-only':
        constraints = {
          audio: constraints.audio,
          video: false
        };
        break;
      
      case 'video-only':
        constraints = {
          audio: false,
          video: constraints.video
        };
        break;
      
      case 'screen':
        constraints = {
          audio: false,
          video: {
            cursor: 'always',
            displaySurface: 'monitor',
            logicalSurface: true
          }
        };
        break;
      
      case 'custom':
        constraints = { ...constraints, ...customConstraints };
        break;
      
      default:
        // Use default constraints (video + audio)
        break;
    }

    return constraints;
  }

  /**
   * Validate SDP offer/answer
   * @param {Object} sdp - SDP object to validate
   * @returns {Object} Validation result
   */
  validateSDP(sdp) {
    try {
      if (!sdp || typeof sdp !== 'object') {
        return {
          isValid: false,
          error: 'SDP must be an object'
        };
      }

      if (!sdp.type || !['offer', 'answer'].includes(sdp.type)) {
        return {
          isValid: false,
          error: 'SDP type must be "offer" or "answer"'
        };
      }

      if (!sdp.sdp || typeof sdp.sdp !== 'string') {
        return {
          isValid: false,
          error: 'SDP content must be a string'
        };
      }

      return {
        isValid: true
      };

    } catch (error) {
      return {
        isValid: false,
        error: error.message
      };
    }
  }
}

module.exports = WebRTCService;