const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false
  },
  phone: {
    type: String,
    trim: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer-not-to-say']
  },
  country: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  timezone: {
    type: String,
    default: 'UTC'
  },

  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,

  // Role and Permissions
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  permissions: [{
    type: String,
    enum: ['read', 'write', 'delete', 'admin']
  }],

  // Wallet System
  wallet: {
    balance: {
      type: Number,
      default: 0,
      min: [0, 'Balance cannot be negative']
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },

  // Referral System
  referralCode: {
    type: String,
    unique: true,
    sparse: true
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  referralCount: {
    type: Number,
    default: 0
  },
  totalReferralEarnings: {
    type: Number,
    default: 0
  },

  // Exam Tickets
  examTickets: [{
    ticketId: {
      type: String,
      required: true
    },
    examType: {
      type: String,
      enum: ['academic', 'general'],
      required: true
    },
    status: {
      type: String,
      enum: ['purchased', 'used', 'expired'],
      default: 'purchased'
    },
    purchasedAt: {
      type: Date,
      default: Date.now
    },
    usedAt: Date,
    expiresAt: Date,
    price: {
      type: Number,
      required: true
    }
  }],

  // Exam History
  examHistory: [{
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam'
    },
    submissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Submission'
    },
    examType: {
      type: String,
      enum: ['academic', 'general']
    },
    completedAt: Date,
    overallScore: Number,
    listeningScore: Number,
    readingScore: Number,
    writingScore: Number,
    speakingScore: Number,
    status: {
      type: String,
      enum: ['in-progress', 'completed', 'graded'],
      default: 'in-progress'
    }
  }],

  // Preferences
  preferences: {
    language: {
      type: String,
      default: 'en'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      }
    },
    examReminders: {
      type: Boolean,
      default: true
    },
    marketingEmails: {
      type: Boolean,
      default: false
    }
  },

  // Profile
  profilePicture: {
    type: String
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  targetBandScore: {
    type: Number,
    min: [1, 'Target band score must be at least 1'],
    max: [9, 'Target band score cannot exceed 9']
  },
  testDate: Date,

  // Analytics
  totalExamsTaken: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0
  },
  bestScore: {
    type: Number,
    default: 0
  },
  studyStreak: {
    type: Number,
    default: 0
  },
  lastStudyDate: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for referral link
userSchema.virtual('referralLink').get(function() {
  return `${process.env.FRONTEND_URL}/register?ref=${this.referralCode}`;
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ referralCode: 1 });
userSchema.index({ 'examTickets.status': 1 });
userSchema.index({ createdAt: -1 });

// Pre-save middleware
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (error) {
    next(error);
  }
});

// Generate referral code if not exists
userSchema.pre('save', function(next) {
  if (!this.referralCode) {
    this.referralCode = this.generateReferralCode();
  }
  next();
});

// Instance methods
userSchema.methods.generateReferralCode = function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

userSchema.methods.incrementLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts
  if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Static methods
userSchema.statics.findByReferralCode = function(referralCode) {
  return this.findOne({ referralCode });
};

userSchema.statics.getReferralStats = function(userId) {
  return this.aggregate([
    { $match: { referredBy: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalReferrals: { $sum: 1 },
        totalEarnings: { $sum: '$totalReferralEarnings' }
      }
    }
  ]);
};

module.exports = mongoose.model('User', userSchema); 