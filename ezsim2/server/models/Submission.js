const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  // Basic Information
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
  ticketId: {
    type: String,
    required: [true, 'Ticket ID is required']
  },

  // Submission Status
  status: {
    type: String,
    enum: ['in-progress', 'completed', 'graded', 'cancelled'],
    default: 'in-progress'
  },
  progress: {
    listening: {
      type: String,
      enum: ['not-started', 'in-progress', 'completed'],
      default: 'not-started'
    },
    reading: {
      type: String,
      enum: ['not-started', 'in-progress', 'completed'],
      default: 'not-started'
    },
    writing: {
      type: String,
      enum: ['not-started', 'in-progress', 'completed'],
      default: 'not-started'
    },
    speaking: {
      type: String,
      enum: ['not-started', 'in-progress', 'completed'],
      default: 'not-started'
    }
  },

  // Timing Information
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  gradedAt: Date,
  
  // Module-specific timing
  moduleTiming: {
    listening: {
      startedAt: Date,
      completedAt: Date,
      duration: Number // in seconds
    },
    reading: {
      startedAt: Date,
      completedAt: Date,
      duration: Number
    },
    writing: {
      startedAt: Date,
      completedAt: Date,
      duration: Number
    },
    speaking: {
      startedAt: Date,
      completedAt: Date,
      duration: Number
    }
  },

  // Answers and Responses
  answers: {
    listening: [{
      questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question'
      },
      sectionNumber: Number,
      questionNumber: Number,
      answer: mongoose.Schema.Types.Mixed, // Can be string, array, or object
      isCorrect: Boolean,
      score: Number,
      timeSpent: Number // in seconds
    }],
    reading: [{
      questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question'
      },
      sectionNumber: Number,
      questionNumber: Number,
      answer: mongoose.Schema.Types.Mixed,
      isCorrect: Boolean,
      score: Number,
      timeSpent: Number
    }],
    writing: [{
      taskNumber: Number,
      questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question'
      },
      response: String,
      wordCount: Number,
      timeSpent: Number,
      score: Number,
      feedback: {
        taskAchievement: Number,
        coherenceCohesion: Number,
        lexicalResource: Number,
        grammaticalRangeAccuracy: Number,
        overallScore: Number,
        comments: [String]
      }
    }],
    speaking: [{
      partNumber: Number,
      questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question'
      },
      audioFile: String,
      duration: Number, // in seconds
      score: Number,
      feedback: {
        fluencyCoherence: Number,
        lexicalResource: Number,
        grammaticalRangeAccuracy: Number,
        pronunciation: Number,
        overallScore: Number,
        comments: [String],
        timestampedFeedback: [{
          timestamp: Number, // in seconds
          comment: String,
          category: String
        }]
      }
    }]
  },

  // Scores
  scores: {
    listening: {
      rawScore: Number,
      bandScore: Number,
      totalQuestions: Number,
      correctAnswers: Number,
      percentage: Number
    },
    reading: {
      rawScore: Number,
      bandScore: Number,
      totalQuestions: Number,
      correctAnswers: Number,
      percentage: Number
    },
    writing: {
      task1Score: Number,
      task2Score: Number,
      overallScore: Number,
      task1Feedback: String,
      task2Feedback: String
    },
    speaking: {
      overallScore: Number,
      detailedFeedback: String
    },
    overall: {
      bandScore: Number,
      totalScore: Number,
      maxPossibleScore: Number
    }
  },

  // Grading Information
  grading: {
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    gradingMethod: {
      type: String,
      enum: ['auto', 'manual', 'hybrid'],
      default: 'auto'
    },
    gradingNotes: String,
    gradingTime: Number, // in minutes
    qualityCheck: {
      performed: {
        type: Boolean,
        default: false
      },
      performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      performedAt: Date,
      notes: String
    }
  },

  // Technical Information
  technicalInfo: {
    browser: String,
    browserVersion: String,
    operatingSystem: String,
    deviceType: String,
    screenResolution: String,
    internetConnection: String,
    audioTestCompleted: {
      type: Boolean,
      default: false
    },
    audioTestResult: String,
    technicalIssues: [{
      type: String,
      description: String,
      timestamp: Date,
      resolved: Boolean
    }]
  },

  // Integrity and Security
  integrity: {
    fullScreenViolations: {
      type: Number,
      default: 0
    },
    tabSwitchViolations: {
      type: Number,
      default: 0
    },
    copyPasteViolations: {
      type: Number,
      default: 0
    },
    rightClickViolations: {
      type: Number,
      default: 0
    },
    suspiciousActivity: [{
      type: String,
      description: String,
      timestamp: Date,
      severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical']
      }
    }],
    flaggedForReview: {
      type: Boolean,
      default: false
    },
    reviewReason: String
  },

  // Analytics
  analytics: {
    totalTimeSpent: Number, // in seconds
    averageTimePerQuestion: Number,
    timeDistribution: {
      listening: Number,
      reading: Number,
      writing: Number,
      speaking: Number
    },
    questionDifficultyAnalysis: [{
      difficulty: String,
      correctAnswers: Number,
      totalQuestions: Number,
      averageTime: Number
    }],
    skillAnalysis: [{
      skill: String,
      score: Number,
      strength: String,
      weakness: String,
      recommendations: [String]
    }]
  },

  // Feedback and Comments
  feedback: {
    general: String,
    listening: String,
    reading: String,
    writing: String,
    speaking: String,
    improvementSuggestions: [String],
    studyRecommendations: [String]
  },

  // Metadata
  metadata: {
    examVersion: String,
    submissionVersion: String,
    tags: [String],
    notes: String
  }
}, {
  timestamps: true
});

// Indexes
submissionSchema.index({ userId: 1, examId: 1 });
submissionSchema.index({ status: 1 });
submissionSchema.index({ startedAt: -1 });
submissionSchema.index({ 'scores.overall.bandScore': -1 });
submissionSchema.index({ ticketId: 1 });
submissionSchema.index({ 'integrity.flaggedForReview': 1 });

// Virtual for completion percentage
submissionSchema.virtual('completionPercentage').get(function() {
  const modules = ['listening', 'reading', 'writing', 'speaking'];
  const completedModules = modules.filter(module => 
    this.progress[module] === 'completed'
  ).length;
  return (completedModules / modules.length) * 100;
});

// Virtual for total time spent
submissionSchema.virtual('totalTimeSpent').get(function() {
  if (this.analytics.totalTimeSpent) {
    return this.analytics.totalTimeSpent;
  }
  
  let total = 0;
  Object.values(this.moduleTiming).forEach(timing => {
    if (timing.duration) {
      total += timing.duration;
    }
  });
  return total;
});

// Instance methods
submissionSchema.methods.updateProgress = function(module, status) {
  this.progress[module] = status;
  
  if (status === 'completed') {
    this.moduleTiming[module].completedAt = new Date();
    if (this.moduleTiming[module].startedAt) {
      this.moduleTiming[module].duration = 
        (this.moduleTiming[module].completedAt - this.moduleTiming[module].startedAt) / 1000;
    }
  } else if (status === 'in-progress' && !this.moduleTiming[module].startedAt) {
    this.moduleTiming[module].startedAt = new Date();
  }
  
  // Check if all modules are completed
  const allCompleted = Object.values(this.progress).every(p => p === 'completed');
  if (allCompleted && this.status === 'in-progress') {
    this.status = 'completed';
    this.completedAt = new Date();
  }
  
  return this.save();
};

submissionSchema.methods.addAnswer = function(module, questionData) {
  if (!this.answers[module]) {
    this.answers[module] = [];
  }
  
  this.answers[module].push(questionData);
  return this.save();
};

submissionSchema.methods.calculateListeningScore = function() {
  const listeningAnswers = this.answers.listening || [];
  const correctAnswers = listeningAnswers.filter(answer => answer.isCorrect).length;
  const totalQuestions = listeningAnswers.length;
  
  this.scores.listening = {
    rawScore: correctAnswers,
    totalQuestions,
    correctAnswers,
    percentage: totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0,
    bandScore: this.calculateBandScore(correctAnswers, totalQuestions, 'listening')
  };
  
  return this.save();
};

submissionSchema.methods.calculateReadingScore = function() {
  const readingAnswers = this.answers.reading || [];
  const correctAnswers = readingAnswers.filter(answer => answer.isCorrect).length;
  const totalQuestions = readingAnswers.length;
  
  this.scores.reading = {
    rawScore: correctAnswers,
    totalQuestions,
    correctAnswers,
    percentage: totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0,
    bandScore: this.calculateBandScore(correctAnswers, totalQuestions, 'reading')
  };
  
  return this.save();
};

submissionSchema.methods.calculateOverallScore = function() {
  const scores = [];
  
  if (this.scores.listening.bandScore) {
    scores.push(this.scores.listening.bandScore);
  }
  if (this.scores.reading.bandScore) {
    scores.push(this.scores.reading.bandScore);
  }
  if (this.scores.writing.overallScore) {
    scores.push(this.scores.writing.overallScore);
  }
  if (this.scores.speaking.overallScore) {
    scores.push(this.scores.speaking.overallScore);
  }
  
  if (scores.length > 0) {
    const overallScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    this.scores.overall = {
      bandScore: Math.round(overallScore * 2) / 2, // Round to nearest 0.5
      totalScore: scores.reduce((sum, score) => sum + score, 0),
      maxPossibleScore: scores.length * 9
    };
  }
  
  return this.save();
};

submissionSchema.methods.calculateBandScore = function(correctAnswers, totalQuestions, module) {
  // This is a simplified band score calculation
  // In a real implementation, you would use official IELTS band score tables
  const percentage = (correctAnswers / totalQuestions) * 100;
  
  if (percentage >= 90) return 9.0;
  if (percentage >= 85) return 8.5;
  if (percentage >= 80) return 8.0;
  if (percentage >= 75) return 7.5;
  if (percentage >= 70) return 7.0;
  if (percentage >= 65) return 6.5;
  if (percentage >= 60) return 6.0;
  if (percentage >= 55) return 5.5;
  if (percentage >= 50) return 5.0;
  if (percentage >= 45) return 4.5;
  if (percentage >= 40) return 4.0;
  if (percentage >= 35) return 3.5;
  if (percentage >= 30) return 3.0;
  if (percentage >= 25) return 2.5;
  if (percentage >= 20) return 2.0;
  return 1.0;
};

submissionSchema.methods.flagForReview = function(reason) {
  this.integrity.flaggedForReview = true;
  this.integrity.reviewReason = reason;
  return this.save();
};

submissionSchema.methods.addIntegrityViolation = function(type, description, severity = 'low') {
  this.integrity.suspiciousActivity.push({
    type,
    description,
    timestamp: new Date(),
    severity
  });
  
  // Increment violation counters
  if (type === 'fullScreen') this.integrity.fullScreenViolations += 1;
  if (type === 'tabSwitch') this.integrity.tabSwitchViolations += 1;
  if (type === 'copyPaste') this.integrity.copyPasteViolations += 1;
  if (type === 'rightClick') this.integrity.rightClickViolations += 1;
  
  return this.save();
};

// Static methods
submissionSchema.statics.findByUser = function(userId, options = {}) {
  const query = { userId };
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.examId) {
    query.examId = options.examId;
  }
  
  return this.find(query)
    .populate('examId', 'title examType')
    .sort({ startedAt: -1 });
};

submissionSchema.statics.getUserStats = function(userId) {
  return this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId), status: 'graded' } },
    {
      $group: {
        _id: null,
        totalSubmissions: { $sum: 1 },
        averageScore: { $avg: '$scores.overall.bandScore' },
        bestScore: { $max: '$scores.overall.bandScore' },
        averageTime: { $avg: '$analytics.totalTimeSpent' }
      }
    }
  ]);
};

// Pre-save middleware
submissionSchema.pre('save', function(next) {
  // Update analytics if not set
  if (!this.analytics.totalTimeSpent) {
    this.analytics.totalTimeSpent = this.totalTimeSpent;
  }
  
  next();
});

module.exports = mongoose.model('Submission', submissionSchema); 