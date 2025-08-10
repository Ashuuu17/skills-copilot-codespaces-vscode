const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Room name is required'],
    trim: true,
    maxlength: [100, 'Room name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['host', 'co-host', 'participant'],
      default: 'participant'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    },
    permissions: {
      canShareScreen: { type: Boolean, default: true },
      canDraw: { type: Boolean, default: true },
      canChat: { type: Boolean, default: true },
      canMuteOthers: { type: Boolean, default: false },
      canRemoveOthers: { type: Boolean, default: false }
    }
  }],
  settings: {
    isPrivate: {
      type: Boolean,
      default: false
    },
    password: {
      type: String,
      default: null
    },
    maxParticipants: {
      type: Number,
      default: 50,
      min: [1, 'Max participants must be at least 1'],
      max: [100, 'Max participants cannot exceed 100']
    },
    allowScreenShare: {
      type: Boolean,
      default: true
    },
    allowFileSharing: {
      type: Boolean,
      default: true
    },
    allowWhiteboard: {
      type: Boolean,
      default: true
    },
    recordingEnabled: {
      type: Boolean,
      default: false
    },
    waitingRoom: {
      type: Boolean,
      default: false
    }
  },
  status: {
    type: String,
    enum: ['waiting', 'active', 'ended', 'paused'],
    default: 'waiting'
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date,
    default: null
  },
  whiteboardData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  chatHistory: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: {
      type: String,
      required: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    type: {
      type: String,
      enum: ['text', 'system', 'file'],
      default: 'text'
    }
  }],
  files: [{
    name: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    path: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    type: {
      type: String,
      required: true
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  recording: {
    isRecording: {
      type: Boolean,
      default: false
    },
    startTime: {
      type: Date,
      default: null
    },
    endTime: {
      type: Date,
      default: null
    },
    filePath: {
      type: String,
      default: null
    }
  },
  analytics: {
    totalParticipants: {
      type: Number,
      default: 0
    },
    totalDuration: {
      type: Number,
      default: 0
    },
    peakParticipants: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
roomSchema.index({ creator: 1 });
roomSchema.index({ status: 1 });
roomSchema.index({ 'participants.user': 1 });
roomSchema.index({ createdAt: -1 });

// Virtual for current participant count
roomSchema.virtual('currentParticipantCount').get(function() {
  return this.participants.filter(p => p.isActive).length;
});

// Virtual for room duration
roomSchema.virtual('duration').get(function() {
  if (this.status === 'ended' && this.endTime) {
    return this.endTime - this.startTime;
  }
  return Date.now() - this.startTime;
});

// Pre-save middleware to update analytics
roomSchema.pre('save', function(next) {
  if (this.isModified('participants')) {
    this.analytics.totalParticipants = this.participants.length;
    this.analytics.peakParticipants = Math.max(
      this.analytics.peakParticipants,
      this.participants.length
    );
  }
  next();
});

// Instance method to add participant
roomSchema.methods.addParticipant = function(userId, role = 'participant') {
  const existingParticipant = this.participants.find(
    p => p.user.toString() === userId.toString()
  );
  
  if (existingParticipant) {
    existingParticipant.isActive = true;
    existingParticipant.joinedAt = new Date();
  } else {
    this.participants.push({
      user: userId,
      role,
      joinedAt: new Date(),
      isActive: true
    });
  }
  
  return this.save();
};

// Instance method to remove participant
roomSchema.methods.removeParticipant = function(userId) {
  const participant = this.participants.find(
    p => p.user.toString() === userId.toString()
  );
  
  if (participant) {
    participant.isActive = false;
  }
  
  return this.save();
};

// Instance method to check if user can perform action
roomSchema.methods.canPerformAction = function(userId, action) {
  const participant = this.participants.find(
    p => p.user.toString() === userId.toString() && p.isActive
  );
  
  if (!participant) return false;
  
  switch (action) {
    case 'shareScreen':
      return participant.permissions.canShareScreen;
    case 'draw':
      return participant.permissions.canDraw;
    case 'chat':
      return participant.permissions.canChat;
    case 'muteOthers':
      return participant.permissions.canMuteOthers;
    case 'removeOthers':
      return participant.permissions.canRemoveOthers;
    default:
      return false;
  }
};

module.exports = mongoose.model('Room', roomSchema);