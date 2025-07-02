const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  // Basic Information
  transactionId: {
    type: String,
    required: [true, 'Transaction ID is required'],
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  
  // Transaction Details
  type: {
    type: String,
    required: [true, 'Transaction type is required'],
    enum: [
      'wallet-topup',
      'exam-purchase',
      'referral-bonus',
      'refund',
      'admin-adjustment',
      'discount-application',
      'subscription-payment',
      'cancellation-fee'
    ]
  },
  
  // Amount Information
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true
  },
  
  // Transaction Direction
  direction: {
    type: String,
    required: [true, 'Transaction direction is required'],
    enum: ['credit', 'debit']
  },
  
  // Balance Information
  balanceBefore: {
    type: Number,
    required: [true, 'Balance before transaction is required']
  },
  balanceAfter: {
    type: Number,
    required: [true, 'Balance after transaction is required']
  },
  
  // Status
  status: {
    type: String,
    required: [true, 'Transaction status is required'],
    enum: ['pending', 'completed', 'failed', 'cancelled', 'refunded']
  },
  
  // Payment Information (for external payments)
  payment: {
    method: {
      type: String,
      enum: ['stripe', 'paypal', 'bank-transfer', 'wallet', 'admin', 'referral']
    },
    gateway: String,
    gatewayTransactionId: String,
    paymentIntentId: String,
    chargeId: String,
    refundId: String,
    fees: {
      amount: Number,
      currency: String
    }
  },
  
  // Related Entities
  relatedTransaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam'
  },
  ticketId: String,
  submissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Submission'
  },
  
  // Referral Information
  referral: {
    referrerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    referredUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    referralCode: String,
    bonusPercentage: Number
  },
  
  // Discount Information
  discount: {
    code: String,
    discountType: {
      type: String,
      enum: ['percentage', 'fixed']
    },
    discountValue: Number,
    originalAmount: Number
  },
  
  // Description and Metadata
  description: {
    type: String,
    required: [true, 'Transaction description is required']
  },
  metadata: {
    examType: String,
    examTitle: String,
    userEmail: String,
    userFullName: String,
    ipAddress: String,
    userAgent: String,
    location: {
      country: String,
      city: String,
      timezone: String
    }
  },
  
  // Admin Information
  admin: {
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String,
    reason: String
  },
  
  // Timestamps
  processedAt: Date,
  failedAt: Date,
  cancelledAt: Date,
  refundedAt: Date,
  
  // Error Information
  error: {
    code: String,
    message: String,
    details: mongoose.Schema.Types.Mixed
  },
  
  // Audit Trail
  auditTrail: [{
    action: String,
    timestamp: Date,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    details: String
  }]
}, {
  timestamps: true
});

// Indexes
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ transactionId: 1 });
transactionSchema.index({ type: 1, status: 1 });
transactionSchema.index({ 'payment.gatewayTransactionId': 1 });
transactionSchema.index({ 'payment.paymentIntentId': 1 });
transactionSchema.index({ examId: 1 });
transactionSchema.index({ ticketId: 1 });
transactionSchema.index({ 'referral.referrerId': 1 });
transactionSchema.index({ 'referral.referredUserId': 1 });

// Virtual for transaction summary
transactionSchema.virtual('summary').get(function() {
  return {
    id: this.transactionId,
    type: this.type,
    amount: this.amount,
    currency: this.currency,
    direction: this.direction,
    status: this.status,
    description: this.description,
    createdAt: this.createdAt
  };
});

// Instance methods
transactionSchema.methods.addAuditTrail = function(action, performedBy, details) {
  this.auditTrail.push({
    action,
    timestamp: new Date(),
    performedBy,
    details
  });
  return this.save();
};

transactionSchema.methods.markAsCompleted = function() {
  this.status = 'completed';
  this.processedAt = new Date();
  return this.save();
};

transactionSchema.methods.markAsFailed = function(error) {
  this.status = 'failed';
  this.failedAt = new Date();
  this.error = error;
  return this.save();
};

transactionSchema.methods.markAsCancelled = function(reason, adminId) {
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  this.admin = {
    processedBy: adminId,
    reason,
    notes: `Transaction cancelled: ${reason}`
  };
  return this.save();
};

transactionSchema.methods.markAsRefunded = function(refundId, adminId, reason) {
  this.status = 'refunded';
  this.refundedAt = new Date();
  this.payment.refundId = refundId;
  this.admin = {
    processedBy: adminId,
    reason,
    notes: `Transaction refunded: ${reason}`
  };
  return this.save();
};

// Static methods
transactionSchema.statics.generateTransactionId = function() {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TXN-${timestamp}-${random}`;
};

transactionSchema.statics.findByUser = function(userId, options = {}) {
  const query = { userId };
  
  if (options.type) {
    query.type = options.type;
  }
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.startDate && options.endDate) {
    query.createdAt = {
      $gte: new Date(options.startDate),
      $lte: new Date(options.endDate)
    };
  }
  
  return this.find(query)
    .populate('examId', 'title examType')
    .populate('referral.referrerId', 'firstName lastName email')
    .populate('referral.referredUserId', 'firstName lastName email')
    .sort({ createdAt: -1 });
};

transactionSchema.statics.getUserTransactionStats = function(userId) {
  return this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId), status: 'completed' } },
    {
      $group: {
        _id: '$type',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        averageAmount: { $avg: '$amount' }
      }
    }
  ]);
};

transactionSchema.statics.getReferralStats = function(userId) {
  return this.aggregate([
    { 
      $match: { 
        'referral.referrerId': mongoose.Types.ObjectId(userId),
        type: 'referral-bonus',
        status: 'completed'
      } 
    },
    {
      $group: {
        _id: null,
        totalReferrals: { $sum: 1 },
        totalEarnings: { $sum: '$amount' },
        averageBonus: { $avg: '$amount' }
      }
    }
  ]);
};

transactionSchema.statics.getFinancialReport = function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: {
          type: '$type',
          month: { $month: '$createdAt' },
          year: { $year: '$createdAt' }
        },
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        credits: {
          $sum: {
            $cond: [{ $eq: ['$direction', 'credit'] }, '$amount', 0]
          }
        },
        debits: {
          $sum: {
            $cond: [{ $eq: ['$direction', 'debit'] }, '$amount', 0]
          }
        }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    }
  ]);
};

// Pre-save middleware
transactionSchema.pre('save', function(next) {
  // Generate transaction ID if not exists
  if (!this.transactionId) {
    this.transactionId = this.constructor.generateTransactionId();
  }
  
  // Calculate balance after transaction
  if (this.direction === 'credit') {
    this.balanceAfter = this.balanceBefore + this.amount;
  } else {
    this.balanceAfter = this.balanceBefore - this.amount;
  }
  
  next();
});

// Post-save middleware
transactionSchema.post('save', async function(doc) {
  // Update user wallet balance
  if (doc.status === 'completed') {
    const User = mongoose.model('User');
    await User.findByIdAndUpdate(doc.userId, {
      'wallet.balance': doc.balanceAfter
    });
  }
});

module.exports = mongoose.model('Transaction', transactionSchema); 