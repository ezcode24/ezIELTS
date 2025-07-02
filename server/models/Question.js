const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Question title is required'],
    trim: true
  },
  module: {
    type: String,
    required: [true, 'Module is required'],
    enum: ['listening', 'reading', 'writing', 'speaking']
  },
  examType: {
    type: String,
    required: [true, 'Exam type is required'],
    enum: ['academic', 'general', 'both']
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  bandLevel: {
    type: Number,
    min: [1, 'Band level must be at least 1'],
    max: [9, 'Band level cannot exceed 9']
  },

  // Question Type and Content
  questionType: {
    type: String,
    required: [true, 'Question type is required'],
    enum: [
      // Listening Question Types
      'multiple-choice-single',
      'multiple-choice-multiple',
      'matching',
      'plan-map-diagram-labeling',
      'form-note-table-flowchart-summary-completion',
      'sentence-completion',
      
      // Reading Question Types
      'multiple-choice',
      'identifying-information',
      'identifying-writers-views',
      'matching-headings',
      'matching-features',
      'matching-sentence-endings',
      'sentence-completion',
      'summary-note-table-flowchart-completion',
      'diagram-label-completion',
      'short-answer-questions',
      
      // Writing Question Types
      'task-1-academic',
      'task-1-general',
      'task-2-essay',
      
      // Speaking Question Types
      'warm-up',
      'part-1',
      'part-2-cue-card',
      'part-3-discussion'
    ]
  },

  // Question Content
  content: {
    question: {
      type: String,
      required: [true, 'Question content is required']
    },
    instructions: String,
    passage: String, // For reading questions
    audioFile: String, // For listening questions
    imageFile: String, // For visual questions
    diagramFile: String, // For diagram labeling
    mapFile: String, // For map questions
    planFile: String, // For plan questions
    
    // For multiple choice questions
    options: [{
      id: String,
      text: String,
      isCorrect: Boolean
    }],
    
    // For matching questions
    matchingItems: [{
      id: String,
      text: String,
      category: String
    }],
    
    // For completion questions
    blanks: [{
      id: String,
      position: Number,
      correctAnswer: String,
      acceptableAnswers: [String], // Alternative correct answers
      maxLength: Number
    }],
    
    // For writing tasks
    writingPrompt: {
      task: String,
      requirements: [String],
      wordLimit: {
        min: Number,
        max: Number
      },
      timeLimit: Number, // in minutes
      visualData: String // URL to chart/graph for Task 1 Academic
    },
    
    // For speaking tasks
    speakingPrompt: {
      question: String,
      followUpQuestions: [String],
      preparationTime: Number, // in seconds
      speakingTime: Number, // in seconds
      cueCard: {
        topic: String,
        points: [String]
      }
    }
  },

  // Answer Configuration
  answers: {
    correctAnswers: [String], // For questions with single/multiple correct answers
    scoringMethod: {
      type: String,
      enum: ['exact-match', 'partial-credit', 'manual'],
      default: 'exact-match'
    },
    points: {
      type: Number,
      default: 1
    },
    negativePoints: {
      type: Number,
      default: 0
    }
  },

  // Section and Grouping
  section: {
    type: String,
    required: [true, 'Section is required']
  },
  sectionNumber: {
    type: Number,
    required: [true, 'Section number is required']
  },
  questionNumber: {
    type: Number,
    required: [true, 'Question number is required']
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuestionGroup'
  },

  // Metadata
  tags: [String],
  topics: [String],
  skills: [{
    type: String,
    enum: ['listening', 'reading', 'writing', 'speaking', 'vocabulary', 'grammar', 'pronunciation']
  }],
  
  // Statistics
  usageCount: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0
  },
  successRate: {
    type: Number,
    default: 0
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  
  // Version Control
  version: {
    type: Number,
    default: 1
  },
  previousVersions: [{
    version: Number,
    content: mongoose.Schema.Types.Mixed,
    updatedAt: Date,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
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
  reviewNotes: String
}, {
  timestamps: true
});

// Indexes
questionSchema.index({ module: 1, examType: 1, questionType: 1 });
questionSchema.index({ difficulty: 1, bandLevel: 1 });
questionSchema.index({ isActive: 1, isPublished: 1 });
questionSchema.index({ tags: 1 });
questionSchema.index({ section: 1, sectionNumber: 1, questionNumber: 1 });
questionSchema.index({ usageCount: -1 });
questionSchema.index({ averageScore: -1 });

// Virtual for full question identifier
questionSchema.virtual('fullIdentifier').get(function() {
  return `${this.module.toUpperCase()}-${this.sectionNumber}-${this.questionNumber}`;
});

// Instance methods
questionSchema.methods.incrementUsage = function() {
  this.usageCount += 1;
  return this.save();
};

questionSchema.methods.updateStats = function(score) {
  const totalAttempts = this.usageCount;
  const currentTotal = this.averageScore * (totalAttempts - 1);
  this.averageScore = (currentTotal + score) / totalAttempts;
  this.successRate = (this.successRate * (totalAttempts - 1) + (score > 0 ? 1 : 0)) / totalAttempts;
  return this.save();
};

questionSchema.methods.createVersion = function(userId) {
  const versionData = {
    version: this.version + 1,
    content: {
      question: this.content.question,
      instructions: this.content.instructions,
      passage: this.content.passage,
      options: this.content.options,
      matchingItems: this.content.matchingItems,
      blanks: this.content.blanks,
      writingPrompt: this.content.writingPrompt,
      speakingPrompt: this.content.speakingPrompt
    },
    updatedAt: new Date(),
    updatedBy: userId
  };
  
  this.previousVersions.push(versionData);
  this.version += 1;
  return this.save();
};

// Static methods
questionSchema.statics.findByModule = function(module, examType = null) {
  const query = { module, isActive: true, isPublished: true };
  if (examType && examType !== 'both') {
    query.examType = { $in: [examType, 'both'] };
  }
  return this.find(query).sort({ sectionNumber: 1, questionNumber: 1 });
};

questionSchema.statics.findByDifficulty = function(difficulty, module = null) {
  const query = { difficulty, isActive: true, isPublished: true };
  if (module) {
    query.module = module;
  }
  return this.find(query);
};

questionSchema.statics.getQuestionStats = function() {
  return this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$module',
        totalQuestions: { $sum: 1 },
        averageDifficulty: { $avg: { $cond: [
          { $eq: ['$difficulty', 'easy'] }, 1,
          { $cond: [{ $eq: ['$difficulty', 'medium'] }, 2, 3] }
        ]}},
        averageScore: { $avg: '$averageScore' },
        totalUsage: { $sum: '$usageCount' }
      }
    }
  ]);
};

// Pre-save middleware
questionSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    this.markModified('content');
  }
  next();
});

module.exports = mongoose.model('Question', questionSchema); 