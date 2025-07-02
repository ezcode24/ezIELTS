const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Exam title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  examType: {
    type: String,
    required: [true, 'Exam type is required'],
    enum: ['academic', 'general']
  },
  version: {
    type: String,
    default: '1.0'
  },

  // Exam Structure
  modules: {
    listening: {
      enabled: {
        type: Boolean,
        default: true
      },
      duration: {
        type: Number,
        default: 30, // minutes
        min: [1, 'Duration must be at least 1 minute']
      },
      sections: [{
        sectionNumber: Number,
        title: String,
        description: String,
        duration: Number,
        questions: [{
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Question'
        }]
      }]
    },
    reading: {
      enabled: {
        type: Boolean,
        default: true
      },
      duration: {
        type: Number,
        default: 60, // minutes
        min: [1, 'Duration must be at least 1 minute']
      },
      sections: [{
        sectionNumber: Number,
        title: String,
        description: String,
        passage: String,
        questions: [{
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Question'
        }]
      }]
    },
    writing: {
      enabled: {
        type: Boolean,
        default: true
      },
      duration: {
        type: Number,
        default: 60, // minutes
        min: [1, 'Duration must be at least 1 minute']
      },
      tasks: [{
        taskNumber: Number,
        taskType: {
          type: String,
          enum: ['task-1-academic', 'task-1-general', 'task-2-essay']
        },
        duration: Number,
        question: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Question'
        }
      }]
    },
    speaking: {
      enabled: {
        type: Boolean,
        default: true
      },
      duration: {
        type: Number,
        default: 15, // minutes
        min: [1, 'Duration must be at least 1 minute']
      },
      parts: [{
        partNumber: Number,
        title: String,
        description: String,
        duration: Number,
        preparationTime: Number,
        questions: [{
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Question'
        }]
      }]
    }
  },

  // Timing Configuration
  totalDuration: {
    type: Number,
    required: [true, 'Total duration is required'],
    min: [1, 'Total duration must be at least 1 minute']
  },
  breaks: [{
    name: String,
    duration: Number, // in minutes
    position: String // 'after-listening', 'after-reading', etc.
  }],

  // Scoring Configuration
  scoring: {
    listening: {
      totalQuestions: Number,
      passingScore: {
        type: Number,
        default: 0
      },
      bandScoreMapping: {
        type: Map,
        of: Number
      }
    },
    reading: {
      totalQuestions: Number,
      passingScore: {
        type: Number,
        default: 0
      },
      bandScoreMapping: {
        type: Map,
        of: Number
      }
    },
    writing: {
      task1Weight: {
        type: Number,
        default: 0.33
      },
      task2Weight: {
        type: Number,
        default: 0.67
      }
    },
    speaking: {
      criteria: [{
        name: String,
        weight: Number,
        description: String
      }]
    }
  },

  // Difficulty and Band Level
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  targetBandLevel: {
    type: Number,
    min: [1, 'Target band level must be at least 1'],
    max: [9, 'Target band level cannot exceed 9']
  },

  // Instructions and Guidelines
  instructions: {
    general: [String],
    listening: [String],
    reading: [String],
    writing: [String],
    speaking: [String]
  },
  
  guidelines: {
    allowedMaterials: [String],
    prohibitedItems: [String],
    technicalRequirements: [String],
    submissionGuidelines: [String]
  },

  // Status and Availability
  status: {
    type: String,
    enum: ['draft', 'review', 'published', 'archived'],
    default: 'draft'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  
  // Availability Settings
  availability: {
    startDate: Date,
    endDate: Date,
    maxAttempts: {
      type: Number,
      default: 1
    },
    timeWindow: {
      startTime: String, // HH:MM format
      endTime: String,   // HH:MM format
      timezone: {
        type: String,
        default: 'UTC'
      }
    }
  },

  // Pricing
  pricing: {
    price: {
      type: Number,
      required: [true, 'Exam price is required'],
      min: [0, 'Price cannot be negative']
    },
    currency: {
      type: String,
      default: 'USD'
    },
    discountCodes: [{
      code: String,
      discountType: {
        type: String,
        enum: ['percentage', 'fixed']
      },
      discountValue: Number,
      validFrom: Date,
      validUntil: Date,
      maxUses: Number,
      currentUses: {
        type: Number,
        default: 0
      }
    }]
  },

  // Statistics
  statistics: {
    totalAttempts: {
      type: Number,
      default: 0
    },
    averageScore: {
      type: Number,
      default: 0
    },
    passRate: {
      type: Number,
      default: 0
    },
    averageCompletionTime: {
      type: Number,
      default: 0
    }
  },

  // Metadata
  tags: [String],
  categories: [String],
  skills: [{
    type: String,
    enum: ['listening', 'reading', 'writing', 'speaking', 'vocabulary', 'grammar', 'pronunciation']
  }],

  // Audit
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewDate: Date,
  reviewNotes: String,

  // Version Control
  versionHistory: [{
    version: String,
    changes: [String],
    updatedAt: Date,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }]
}, {
  timestamps: true
});

// Indexes
examSchema.index({ examType: 1, status: 1, isActive: 1 });
examSchema.index({ difficulty: 1, targetBandLevel: 1 });
examSchema.index({ 'availability.startDate': 1, 'availability.endDate': 1 });
examSchema.index({ 'pricing.price': 1 });
examSchema.index({ tags: 1 });
examSchema.index({ createdAt: -1 });

// Virtual for total questions count
examSchema.virtual('totalQuestions').get(function() {
  let total = 0;
  
  if (this.modules.listening.enabled) {
    this.modules.listening.sections.forEach(section => {
      total += section.questions.length;
    });
  }
  
  if (this.modules.reading.enabled) {
    this.modules.reading.sections.forEach(section => {
      total += section.questions.length;
    });
  }
  
  if (this.modules.writing.enabled) {
    total += this.modules.writing.tasks.length;
  }
  
  if (this.modules.speaking.enabled) {
    this.modules.speaking.parts.forEach(part => {
      total += part.questions.length;
    });
  }
  
  return total;
});

// Virtual for exam availability status
examSchema.virtual('isAvailable').get(function() {
  if (!this.isActive || this.status !== 'published') {
    return false;
  }
  
  const now = new Date();
  
  if (this.availability.startDate && now < this.availability.startDate) {
    return false;
  }
  
  if (this.availability.endDate && now > this.availability.endDate) {
    return false;
  }
  
  return true;
});

// Instance methods
examSchema.methods.calculateTotalDuration = function() {
  let total = 0;
  
  Object.values(this.modules).forEach(module => {
    if (module.enabled) {
      total += module.duration;
    }
  });
  
  // Add break time
  this.breaks.forEach(breakItem => {
    total += breakItem.duration;
  });
  
  return total;
};

examSchema.methods.updateStatistics = function(submissionData) {
  const { score, completionTime } = submissionData;
  
  this.statistics.totalAttempts += 1;
  
  // Update average score
  const currentTotal = this.statistics.averageScore * (this.statistics.totalAttempts - 1);
  this.statistics.averageScore = (currentTotal + score) / this.statistics.totalAttempts;
  
  // Update pass rate (assuming 6.0 is passing)
  const isPass = score >= 6.0;
  const currentPasses = this.statistics.passRate * (this.statistics.totalAttempts - 1);
  this.statistics.passRate = (currentPasses + (isPass ? 1 : 0)) / this.statistics.totalAttempts;
  
  // Update average completion time
  const currentTimeTotal = this.statistics.averageCompletionTime * (this.statistics.totalAttempts - 1);
  this.statistics.averageCompletionTime = (currentTimeTotal + completionTime) / this.statistics.totalAttempts;
  
  return this.save();
};

examSchema.methods.createVersion = function(userId, changes) {
  const versionData = {
    version: `1.${this.versionHistory.length + 1}`,
    changes,
    updatedAt: new Date(),
    updatedBy: userId
  };
  
  this.versionHistory.push(versionData);
  this.version = versionData.version;
  return this.save();
};

// Static methods
examSchema.statics.findAvailable = function(examType = null) {
  const query = {
    isActive: true,
    status: 'published',
    $or: [
      { isPublic: true },
      { 'availability.startDate': { $lte: new Date() } },
      { 'availability.startDate': { $exists: false } }
    ],
    $or: [
      { 'availability.endDate': { $gte: new Date() } },
      { 'availability.endDate': { $exists: false } }
    ]
  };
  
  if (examType) {
    query.examType = examType;
  }
  
  return this.find(query).sort({ createdAt: -1 });
};

examSchema.statics.getExamStats = function() {
  return this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$examType',
        totalExams: { $sum: 1 },
        averagePrice: { $avg: '$pricing.price' },
        totalAttempts: { $sum: '$statistics.totalAttempts' },
        averageScore: { $avg: '$statistics.averageScore' }
      }
    }
  ]);
};

// Pre-save middleware
examSchema.pre('save', function(next) {
  // Calculate total duration if not set
  if (!this.totalDuration) {
    this.totalDuration = this.calculateTotalDuration();
  }
  
  // Update question counts in scoring
  if (this.modules.listening.enabled) {
    this.scoring.listening.totalQuestions = this.modules.listening.sections.reduce((total, section) => {
      return total + section.questions.length;
    }, 0);
  }
  
  if (this.modules.reading.enabled) {
    this.scoring.reading.totalQuestions = this.modules.reading.sections.reduce((total, section) => {
      return total + section.questions.length;
    }, 0);
  }
  
  next();
});

module.exports = mongoose.model('Exam', examSchema); 