const mongoose = require('mongoose');

const speakingBookingSchema = new mongoose.Schema({
  // Basic Information
  bookingId: {
    type: String,
    required: [true, 'Booking ID is required'],
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: [true, 'Exam ID is required']
  },
  submissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Submission',
    required: [true, 'Submission ID is required']
  },

  // Booking Details
  scheduledDate: {
    type: Date,
    required: [true, 'Scheduled date is required']
  },
  scheduledTime: {
    type: String, // HH:MM format
    required: [true, 'Scheduled time is required']
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  duration: {
    type: Number,
    default: 15, // minutes
    min: [5, 'Duration must be at least 5 minutes'],
    max: [60, 'Duration cannot exceed 60 minutes']
  },

  // Status and Progress
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'],
    default: 'pending'
  },
  examType: {
    type: String,
    enum: ['academic', 'general'],
    required: true
  },

  // Examiner Information
  examinerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  examinerNotes: String,
  examinerRating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },

  // Meeting Details
  meeting: {
    platform: {
      type: String,
      enum: ['zoom', 'teams', 'skype', 'google-meet', 'custom'],
      default: 'zoom'
    },
    meetingId: String,
    meetingPassword: String,
    meetingUrl: String,
    joinInstructions: String,
    recordingUrl: String,
    recordingConsent: {
      type: Boolean,
      default: false
    }
  },

  // Google Calendar Integration
  googleCalendar: {
    eventId: String,
    calendarId: String,
    syncStatus: {
      type: String,
      enum: ['pending', 'synced', 'failed', 'updated'],
      default: 'pending'
    },
    lastSyncAt: Date,
    syncError: String
  },

  // Notifications
  notifications: {
    sent: {
      confirmation: { type: Boolean, default: false },
      reminder24h: { type: Boolean, default: false },
      reminder1h: { type: Boolean, default: false },
      reminder15min: { type: Boolean, default: false }
    },
    scheduled: {
      reminder24h: Date,
      reminder1h: Date,
      reminder15min: Date
    }
  },

  // Rescheduling
  rescheduling: {
    allowed: {
      type: Boolean,
      default: true
    },
    deadline: {
      type: Number, // hours before scheduled time
      default: 24
    },
    rescheduleCount: {
      type: Number,
      default: 0
    },
    maxReschedules: {
      type: Number,
      default: 2
    },
    history: [{
      fromDate: Date,
      toDate: Date,
      reason: String,
      requestedAt: Date,
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }]
  },

  // Technical Requirements
  technicalRequirements: {
    microphone: {
      type: String,
      enum: ['required', 'recommended', 'optional'],
      default: 'required'
    },
    camera: {
      type: String,
      enum: ['required', 'recommended', 'optional'],
      default: 'required'
    },
    internetSpeed: {
      type: String,
      enum: ['minimum', 'recommended'],
      default: 'recommended'
    },
    browser: {
      type: String,
      default: 'Chrome or Firefox'
    }
  },

  // Pre-exam Checklist
  checklist: {
    identityVerified: {
      type: Boolean,
      default: false
    },
    technicalTestCompleted: {
      type: Boolean,
      default: false
    },
    rulesAccepted: {
      type: Boolean,
      default: false
    },
    environmentChecked: {
      type: Boolean,
      default: false
    }
  },

  // Exam Session
  session: {
    startedAt: Date,
    endedAt: Date,
    actualDuration: Number, // in minutes
    connectionQuality: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor'],
      default: 'good'
    },
    technicalIssues: [{
      issue: String,
      timestamp: Date,
      resolved: Boolean
    }],
    interruptions: [{
      reason: String,
      startTime: Date,
      endTime: Date,
      duration: Number // in seconds
    }]
  },

  // Results and Feedback
  results: {
    overallScore: {
      type: Number,
      min: [0, 'Score cannot be negative'],
      max: [9, 'Score cannot exceed 9']
    },
    fluencyScore: {
      type: Number,
      min: [0, 'Score cannot be negative'],
      max: [9, 'Score cannot exceed 9']
    },
    coherenceScore: {
      type: Number,
      min: [0, 'Score cannot be negative'],
      max: [9, 'Score cannot exceed 9']
    },
    lexicalResourceScore: {
      type: Number,
      min: [0, 'Score cannot be negative'],
      max: [9, 'Score cannot exceed 9']
    },
    grammaticalRangeScore: {
      type: Number,
      min: [0, 'Score cannot be negative'],
      max: [9, 'Score cannot exceed 9']
    },
    pronunciationScore: {
      type: Number,
      min: [0, 'Score cannot be negative'],
      max: [9, 'Score cannot exceed 9']
    },
    feedback: {
      strengths: [String],
      weaknesses: [String],
      recommendations: [String],
      examinerComments: String
    },
    gradedAt: Date,
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },

  // Metadata
  metadata: {
    userAgent: String,
    ipAddress: String,
    location: {
      country: String,
      city: String,
      timezone: String
    },
    deviceInfo: {
      browser: String,
      operatingSystem: String,
      screenResolution: String
    }
  },

  // Audit
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
speakingBookingSchema.index({ userId: 1, status: 1 });
speakingBookingSchema.index({ scheduledDate: 1, scheduledTime: 1 });
speakingBookingSchema.index({ examinerId: 1, scheduledDate: 1 });
speakingBookingSchema.index({ bookingId: 1 });
speakingBookingSchema.index({ 'googleCalendar.eventId': 1 });
speakingBookingSchema.index({ status: 1, scheduledDate: 1 });

// Virtual for full scheduled datetime
speakingBookingSchema.virtual('scheduledDateTime').get(function() {
  if (!this.scheduledDate || !this.scheduledTime) return null;
  
  const [hours, minutes] = this.scheduledTime.split(':');
  const scheduledDateTime = new Date(this.scheduledDate);
  scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  return scheduledDateTime;
});

// Virtual for time until booking
speakingBookingSchema.virtual('timeUntilBooking').get(function() {
  const now = new Date();
  const scheduled = this.scheduledDateTime;
  if (!scheduled) return null;
  
  return scheduled.getTime() - now.getTime();
});

// Virtual for can be rescheduled
speakingBookingSchema.virtual('canBeRescheduled').get(function() {
  if (!this.rescheduling.allowed) return false;
  if (this.rescheduling.rescheduleCount >= this.rescheduling.maxReschedules) return false;
  
  const deadline = new Date(this.scheduledDateTime);
  deadline.setHours(deadline.getHours() - this.rescheduling.deadline);
  
  return new Date() < deadline;
});

// Instance methods
speakingBookingSchema.methods.generateBookingId = function() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `SPK-${timestamp}-${random}`.toUpperCase();
};

speakingBookingSchema.methods.updateStatus = function(newStatus, updatedBy = null) {
  this.status = newStatus;
  if (updatedBy) {
    this.updatedBy = updatedBy;
  }
  return this.save();
};

speakingBookingSchema.methods.reschedule = function(newDate, newTime, reason, approvedBy = null) {
  if (!this.canBeRescheduled) {
    throw new Error('Booking cannot be rescheduled');
  }

  const oldDate = this.scheduledDate;
  const oldTime = this.scheduledTime;

  this.scheduledDate = newDate;
  this.scheduledTime = newTime;
  this.rescheduling.rescheduleCount += 1;
  
  this.rescheduling.history.push({
    fromDate: oldDate,
    toDate: newDate,
    reason,
    requestedAt: new Date(),
    approvedBy
  });

  // Reset Google Calendar sync
  this.googleCalendar.syncStatus = 'pending';
  this.googleCalendar.lastSyncAt = null;
  this.googleCalendar.syncError = null;

  return this.save();
};

speakingBookingSchema.methods.startSession = function() {
  this.status = 'in-progress';
  this.session.startedAt = new Date();
  return this.save();
};

speakingBookingSchema.methods.endSession = function() {
  this.status = 'completed';
  this.session.endedAt = new Date();
  
  if (this.session.startedAt) {
    this.session.actualDuration = Math.round(
      (this.session.endedAt - this.session.startedAt) / (1000 * 60)
    );
  }
  
  return this.save();
};

speakingBookingSchema.methods.addTechnicalIssue = function(issue) {
  this.session.technicalIssues.push({
    issue,
    timestamp: new Date(),
    resolved: false
  });
  return this.save();
};

speakingBookingSchema.methods.recordInterruption = function(reason, startTime, endTime) {
  const duration = Math.round((endTime - startTime) / 1000);
  this.session.interruptions.push({
    reason,
    startTime,
    endTime,
    duration
  });
  return this.save();
};

// Static methods
speakingBookingSchema.statics.findAvailableSlots = function(date, examinerId = null) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const query = {
    scheduledDate: {
      $gte: startOfDay,
      $lte: endOfDay
    },
    status: { $in: ['pending', 'confirmed'] }
  };

  if (examinerId) {
    query.examinerId = examinerId;
  }

  return this.find(query).sort({ scheduledTime: 1 });
};

speakingBookingSchema.statics.findUpcomingBookings = function(userId, limit = 10) {
  return this.find({
    userId,
    status: { $in: ['pending', 'confirmed'] },
    scheduledDate: { $gte: new Date() }
  })
    .populate('examId', 'title examType')
    .sort({ scheduledDate: 1, scheduledTime: 1 })
    .limit(limit);
};

speakingBookingSchema.statics.findOverdueBookings = function() {
  const now = new Date();
  return this.find({
    status: 'confirmed',
    scheduledDate: { $lt: now },
    'session.startedAt': { $exists: false }
  }).populate('userId', 'firstName lastName email');
};

speakingBookingSchema.statics.getBookingStats = function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        scheduledDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        averageScore: { $avg: '$results.overallScore' }
      }
    }
  ]);
};

// Pre-save middleware
speakingBookingSchema.pre('save', function(next) {
  // Generate booking ID if not exists
  if (!this.bookingId) {
    this.bookingId = this.generateBookingId();
  }

  // Schedule notifications if booking is confirmed
  if (this.status === 'confirmed' && this.scheduledDateTime) {
    const scheduledTime = this.scheduledDateTime;
    
    this.notifications.scheduled.reminder24h = new Date(scheduledTime.getTime() - 24 * 60 * 60 * 1000);
    this.notifications.scheduled.reminder1h = new Date(scheduledTime.getTime() - 60 * 60 * 1000);
    this.notifications.scheduled.reminder15min = new Date(scheduledTime.getTime() - 15 * 60 * 1000);
  }

  next();
});

module.exports = mongoose.model('SpeakingBooking', speakingBookingSchema); 