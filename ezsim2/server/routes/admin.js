const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const User = require('../models/User');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const Submission = require('../models/Submission');
const Transaction = require('../models/Transaction');
const SupportTicket = require('../models/SupportTicket');

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Private/Admin
router.get('/dashboard', [auth, admin], async (req, res) => {
  try {
    const { period = '30d' } = req.query;

    let dateFilter = {};
    const now = new Date();
    
    switch (period) {
      case '7d':
        dateFilter = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
        break;
      case '30d':
        dateFilter = { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
        break;
      case '90d':
        dateFilter = { $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) };
        break;
      case '1y':
        dateFilter = { $gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) };
        break;
    }

    // User statistics
    const userStats = await User.aggregate([
      { $match: { createdAt: dateFilter } },
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          verifiedUsers: { $sum: { $cond: ['$isEmailVerified', 1, 0] } },
          activeUsers: { $sum: { $cond: ['$isActive', 1, 0] } }
        }
      }
    ]);

    // Exam statistics
    const examStats = await Exam.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalExams: { $sum: 1 },
          totalAttempts: { $sum: '$statistics.totalAttempts' },
          averageScore: { $avg: '$statistics.averageScore' }
        }
      }
    ]);

    // Submission statistics
    const submissionStats = await Submission.aggregate([
      { $match: { createdAt: dateFilter } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          averageScore: { $avg: '$scores.overall.bandScore' }
        }
      }
    ]);

    // Financial statistics
    const financialStats = await Transaction.aggregate([
      { $match: { createdAt: dateFilter, status: 'completed' } },
      {
        $group: {
          _id: '$type',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Support ticket statistics
    const ticketStats = await SupportTicket.aggregate([
      { $match: { createdAt: dateFilter } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Recent activities
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('firstName lastName email createdAt');

    const recentSubmissions = await Submission.find()
      .populate('userId', 'firstName lastName')
      .populate('examId', 'title')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentTransactions = await Transaction.find()
      .populate('userId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      period,
      userStats: userStats[0] || { totalUsers: 0, verifiedUsers: 0, activeUsers: 0 },
      examStats: examStats[0] || { totalExams: 0, totalAttempts: 0, averageScore: 0 },
      submissionStats,
      financialStats,
      ticketStats,
      recentUsers,
      recentSubmissions,
      recentTransactions
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/admin/users
// @desc    Get all users (Admin only)
// @access  Private/Admin
router.get('/users', [auth, admin], async (req, res) => {
  try {
    const { status, role, page = 1, limit = 20, search } = req.query;

    const query = {};
    if (status) query.isActive = status === 'active';
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/admin/users/:id
// @desc    Get user details (Admin only)
// @access  Private/Admin
router.get('/users/:id', [auth, admin], async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('referredBy', 'firstName lastName email');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user statistics
    const submissionStats = await Submission.getUserStats(req.params.id);
    const transactionStats = await Transaction.getUserTransactionStats(req.params.id);
    const referralStats = await Transaction.getReferralStats(req.params.id);

    res.json({
      user,
      statistics: {
        submissions: submissionStats[0] || {},
        transactions: transactionStats,
        referrals: referralStats[0] || {}
      }
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Update user (Admin only)
// @access  Private/Admin
router.put('/users/:id', [
  auth,
  admin,
  [
    body('firstName', 'First name is required').not().isEmpty(),
    body('lastName', 'Last name is required').not().isEmpty(),
    body('email', 'Please include a valid email').isEmail(),
    body('role', 'Role is required').isIn(['user', 'admin', 'moderator'])
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const {
      firstName,
      lastName,
      email,
      role,
      isActive,
      isEmailVerified,
      wallet
    } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is already taken by another user
    const existingUser = await User.findOne({ email, _id: { $ne: req.params.id } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    // Update user fields
    user.firstName = firstName;
    user.lastName = lastName;
    user.email = email;
    user.role = role;
    user.isActive = isActive !== undefined ? isActive : user.isActive;
    user.isEmailVerified = isEmailVerified !== undefined ? isEmailVerified : user.isEmailVerified;
    
    if (wallet) {
      user.wallet = { ...user.wallet, ...wallet };
    }

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json(userResponse);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user (Admin only)
// @access  Private/Admin
router.delete('/users/:id', [auth, admin], async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has any submissions
    const submissionsCount = await Submission.countDocuments({ userId: req.params.id });
    if (submissionsCount > 0) {
      return res.status(400).json({
        message: 'Cannot delete user with existing submissions',
        submissionsCount
      });
    }

    // Soft delete
    user.isActive = false;
    user.isDeleted = true;
    user.deletedAt = Date.now();
    await user.save();

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/admin/users/:id/wallet-adjustment
// @desc    Adjust user wallet (Admin only)
// @access  Private/Admin
router.post('/users/:id/wallet-adjustment', [
  auth,
  admin,
  [
    body('amount', 'Amount is required').isFloat(),
    body('type', 'Type is required').isIn(['credit', 'debit']),
    body('reason', 'Reason is required').not().isEmpty()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { amount, type, reason } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const balanceBefore = user.wallet.balance;
    const balanceAfter = type === 'credit' 
      ? balanceBefore + amount 
      : balanceBefore - amount;

    if (balanceAfter < 0) {
      return res.status(400).json({ message: 'Insufficient balance for debit' });
    }

    // Update user wallet
    user.wallet.balance = balanceAfter;
    await user.save();

    // Create transaction record
    const transaction = new Transaction({
      userId: req.params.id,
      type: 'admin-adjustment',
      amount: amount,
      direction: type,
      status: 'completed',
      balanceBefore,
      balanceAfter,
      description: `Admin adjustment: ${reason}`,
      admin: {
        processedBy: req.user.id,
        reason,
        notes: `Admin adjustment by ${req.user.firstName} ${req.user.lastName}`
      }
    });

    await transaction.save();

    res.json({
      message: 'Wallet adjustment completed successfully',
      user: {
        id: user._id,
        wallet: user.wallet
      },
      transaction: transaction.summary
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/admin/analytics
// @desc    Get detailed analytics (Admin only)
// @access  Private/Admin
router.get('/analytics', [auth, admin], async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // User growth analytics
    const userGrowth = await User.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          newUsers: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Exam performance analytics
    const examPerformance = await Submission.aggregate([
      { $match: { ...dateFilter, status: 'completed' } },
      {
        $lookup: {
          from: 'exams',
          localField: 'examId',
          foreignField: '_id',
          as: 'exam'
        }
      },
      { $unwind: '$exam' },
      {
        $group: {
          _id: '$exam.module',
          totalAttempts: { $sum: 1 },
          averageScore: { $avg: '$scores.overall.bandScore' },
          passRate: {
            $avg: { $cond: [{ $gte: ['$scores.overall.bandScore', 6.0] }, 1, 0] }
          }
        }
      }
    ]);

    // Financial analytics
    const financialAnalytics = await Transaction.aggregate([
      { $match: { ...dateFilter, status: 'completed' } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalRevenue: {
            $sum: { $cond: [{ $eq: ['$direction', 'credit'] }, '$amount', 0] }
          },
          totalExpenses: {
            $sum: { $cond: [{ $eq: ['$direction', 'debit'] }, '$amount', 0] }
          },
          transactionCount: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Support analytics
    const supportAnalytics = await SupportTicket.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$category',
          totalTickets: { $sum: 1 },
          resolvedTickets: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
          },
          averageResolutionTime: { $avg: '$sla.actualResolutionTime' }
        }
      }
    ]);

    res.json({
      userGrowth,
      examPerformance,
      financialAnalytics,
      supportAnalytics
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/admin/system-status
// @desc    Get system status (Admin only)
// @access  Private/Admin
router.get('/system-status', [auth, admin], async (req, res) => {
  try {
    // Database status
    const dbStatus = {
      connected: true,
      collections: {
        users: await User.countDocuments(),
        exams: await Exam.countDocuments(),
        questions: await Question.countDocuments(),
        submissions: await Submission.countDocuments(),
        transactions: await Transaction.countDocuments(),
        tickets: await SupportTicket.countDocuments()
      }
    };

    // System metrics
    const systemMetrics = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version,
      platform: process.platform
    };

    // Active sessions (simplified)
    const activeSessions = await Submission.countDocuments({
      status: 'in-progress',
      startedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    res.json({
      dbStatus,
      systemMetrics,
      activeSessions,
      timestamp: new Date()
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/admin/bulk-actions
// @desc    Perform bulk actions (Admin only)
// @access  Private/Admin
router.post('/bulk-actions', [
  auth,
  admin,
  [
    body('action', 'Action is required').isIn(['activate-users', 'deactivate-users', 'delete-users', 'export-data']),
    body('userIds', 'User IDs are required').isArray({ min: 1 })
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { action, userIds } = req.body;

    let result;
    switch (action) {
      case 'activate-users':
        result = await User.updateMany(
          { _id: { $in: userIds } },
          { isActive: true }
        );
        break;

      case 'deactivate-users':
        result = await User.updateMany(
          { _id: { $in: userIds } },
          { isActive: false }
        );
        break;

      case 'delete-users':
        result = await User.updateMany(
          { _id: { $in: userIds } },
          { isActive: false, isDeleted: true, deletedAt: Date.now() }
        );
        break;

      case 'export-data':
        const users = await User.find({ _id: { $in: userIds } })
          .select('-password')
          .lean();
        result = { exportedUsers: users };
        break;
    }

    res.json({
      message: `Bulk action '${action}' completed successfully`,
      result
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router; 