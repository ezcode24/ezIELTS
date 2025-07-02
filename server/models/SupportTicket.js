const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
  // Basic Information
  ticketId: {
    type: String,
    required: [true, 'Ticket ID is required'],
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  
  // Ticket Details
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: [200, 'Subject cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  
  // Category and Priority
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'technical-issue',
      'payment-problem',
      'exam-related',
      'account-issue',
      'refund-request',
      'general-inquiry',
      'bug-report',
      'feature-request',
      'complaint',
      'other'
    ]
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Status and Assignment
  status: {
    type: String,
    enum: ['open', 'in-progress', 'waiting-for-user', 'resolved', 'closed'],
    default: 'open'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedAt: Date,
  
  // Related Entities
  relatedExam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam'
  },
  relatedSubmission: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Submission'
  },
  relatedTransaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  
  // Attachments
  attachments: [{
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Communication History
  messages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    senderType: {
      type: String,
      enum: ['user', 'admin', 'system'],
      required: true
    },
    message: {
      type: String,
      required: true
    },
    isInternal: {
      type: Boolean,
      default: false
    },
    attachments: [{
      filename: String,
      originalName: String,
      mimeType: String,
      size: Number,
      url: String
    }],
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Resolution Information
  resolution: {
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: Date,
    resolutionType: {
      type: String,
      enum: ['fixed', 'workaround', 'not-a-bug', 'duplicate', 'by-design']
    },
    resolutionNotes: String,
    satisfactionRating: {
      type: Number,
      min: 1,
      max: 5
    },
    satisfactionFeedback: String
  },
  
  // SLA and Timing
  sla: {
    targetResolutionTime: Number, // in hours
    actualResolutionTime: Number, // in hours
    firstResponseTime: Number, // in hours
    isOverdue: {
      type: Boolean,
      default: false
    }
  },
  
  // Tags and Labels
  tags: [String],
  labels: [{
    name: String,
    color: String
  }],
  
  // Escalation
  escalation: {
    escalated: {
      type: Boolean,
      default: false
    },
    escalatedAt: Date,
    escalatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    escalatedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    escalationReason: String
  },
  
  // Follow-up
  followUp: {
    required: {
      type: Boolean,
      default: false
    },
    scheduledAt: Date,
    completedAt: Date,
    notes: String
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
    browser: String,
    operatingSystem: String,
    deviceType: String
  },
  
  // Internal Notes
  internalNotes: [{
    note: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    isPrivate: {
      type: Boolean,
      default: true
    }
  }]
}, {
  timestamps: true
});

// Indexes
supportTicketSchema.index({ ticketId: 1 });
supportTicketSchema.index({ userId: 1, createdAt: -1 });
supportTicketSchema.index({ status: 1, priority: 1 });
supportTicketSchema.index({ category: 1 });
supportTicketSchema.index({ assignedTo: 1 });
supportTicketSchema.index({ 'escalation.escalated': 1 });
supportTicketSchema.index({ createdAt: -1 });

// Virtual for ticket age
supportTicketSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt.getTime();
});

// Virtual for last activity
supportTicketSchema.virtual('lastActivity').get(function() {
  if (this.messages.length > 0) {
    return this.messages[this.messages.length - 1].createdAt;
  }
  return this.createdAt;
});

// Instance methods
supportTicketSchema.methods.generateTicketId = function() {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TKT-${timestamp}-${random}`;
};

supportTicketSchema.methods.addMessage = function(sender, message, options = {}) {
  const messageData = {
    sender,
    senderType: options.senderType || 'user',
    message,
    isInternal: options.isInternal || false,
    attachments: options.attachments || []
  };
  
  this.messages.push(messageData);
  
  // Update status if it's a user message and ticket was closed
  if (messageData.senderType === 'user' && this.status === 'closed') {
    this.status = 'open';
  }
  
  return this.save();
};

supportTicketSchema.methods.assignTo = function(adminId) {
  this.assignedTo = adminId;
  this.assignedAt = new Date();
  
  if (this.status === 'open') {
    this.status = 'in-progress';
  }
  
  return this.save();
};

supportTicketSchema.methods.updateStatus = function(status, adminId = null) {
  this.status = status;
  
  if (status === 'resolved') {
    this.resolution.resolvedBy = adminId;
    this.resolution.resolvedAt = new Date();
  }
  
  return this.save();
};

supportTicketSchema.methods.escalate = function(escalatedTo, reason, escalatedBy) {
  this.escalation = {
    escalated: true,
    escalatedAt: new Date(),
    escalatedBy,
    escalatedTo,
    escalationReason: reason
  };
  
  this.assignedTo = escalatedTo;
  this.priority = 'high';
  
  return this.save();
};

supportTicketSchema.methods.addInternalNote = function(note, addedBy) {
  this.internalNotes.push({
    note,
    addedBy,
    isPrivate: true
  });
  
  return this.save();
};

supportTicketSchema.methods.calculateSLA = function() {
  const now = Date.now();
  const created = this.createdAt.getTime();
  
  // Calculate actual resolution time
  if (this.resolution.resolvedAt) {
    this.sla.actualResolutionTime = (this.resolution.resolvedAt.getTime() - created) / (1000 * 60 * 60);
  }
  
  // Calculate first response time
  const firstAdminResponse = this.messages.find(msg => msg.senderType === 'admin');
  if (firstAdminResponse) {
    this.sla.firstResponseTime = (firstAdminResponse.createdAt.getTime() - created) / (1000 * 60 * 60);
  }
  
  // Check if overdue
  if (this.sla.targetResolutionTime && this.sla.actualResolutionTime) {
    this.sla.isOverdue = this.sla.actualResolutionTime > this.sla.targetResolutionTime;
  } else if (this.sla.targetResolutionTime) {
    const currentTime = (now - created) / (1000 * 60 * 60);
    this.sla.isOverdue = currentTime > this.sla.targetResolutionTime;
  }
  
  return this.save();
};

// Static methods
supportTicketSchema.statics.findByUser = function(userId, options = {}) {
  const query = { userId };
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.category) {
    query.category = options.category;
  }
  
  return this.find(query)
    .populate('assignedTo', 'firstName lastName email')
    .populate('relatedExam', 'title examType')
    .sort({ createdAt: -1 });
};

supportTicketSchema.statics.findAssigned = function(adminId, options = {}) {
  const query = { assignedTo: adminId };
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.priority) {
    query.priority = options.priority;
  }
  
  return this.find(query)
    .populate('userId', 'firstName lastName email')
    .populate('relatedExam', 'title examType')
    .sort({ priority: -1, createdAt: -1 });
};

supportTicketSchema.statics.getTicketStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        averageResolutionTime: { $avg: '$sla.actualResolutionTime' }
      }
    }
  ]);
};

supportTicketSchema.statics.getCategoryStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        averageResolutionTime: { $avg: '$sla.actualResolutionTime' }
      }
    }
  ]);
};

supportTicketSchema.statics.getOverdueTickets = function() {
  return this.find({ 'sla.isOverdue': true, status: { $nin: ['resolved', 'closed'] } })
    .populate('userId', 'firstName lastName email')
    .populate('assignedTo', 'firstName lastName email')
    .sort({ createdAt: 1 });
};

// Pre-save middleware
supportTicketSchema.pre('save', function(next) {
  // Generate ticket ID if not exists
  if (!this.ticketId) {
    this.ticketId = this.generateTicketId();
  }
  
  // Set target resolution time based on priority
  if (!this.sla.targetResolutionTime) {
    switch (this.priority) {
      case 'urgent':
        this.sla.targetResolutionTime = 4; // 4 hours
        break;
      case 'high':
        this.sla.targetResolutionTime = 24; // 24 hours
        break;
      case 'medium':
        this.sla.targetResolutionTime = 72; // 72 hours
        break;
      case 'low':
        this.sla.targetResolutionTime = 168; // 1 week
        break;
    }
  }
  
  next();
});

module.exports = mongoose.model('SupportTicket', supportTicketSchema); 