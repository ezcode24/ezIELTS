const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Submission = require('../models/Submission');

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
  auth,
  [
    body('firstName', 'First name is required').not().isEmpty(),
    body('lastName', 'Last name is required').not().isEmpty(),
    body('email', 'Please include a valid email').isEmail(),
    body('phone', 'Phone number is required').not().isEmpty(),
    body('dateOfBirth', 'Date of birth is required').not().isEmpty(),
    body('country', 'Country is required').not().isEmpty(),
    body('city', 'City is required').not().isEmpty(),
    body('timezone', 'Timezone is required').not().isEmpty()
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
      phone,
      dateOfBirth,
      country,
      city,
      timezone,
      bio,
      profilePicture
    } = req.body;

    // Check if email is already taken by another user
    const existingUser = await User.findOne({ email, _id: { $ne: req.user.id } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user fields
    user.firstName = firstName;
    user.lastName = lastName;
    user.email = email;
    user.phone = phone;
    user.dateOfBirth = dateOfBirth;
    user.country = country;
    user.city = city;
    user.timezone = timezone;
    user.bio = bio || user.bio;
    user.profilePicture = profilePicture || user.profilePicture;
    user.updatedAt = Date.now();

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json(userResponse);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/users/wallet
// @desc    Get user wallet information
// @access  Private
router.get('/wallet', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('wallet referralCode');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get recent transactions
    const transactions = await Transaction.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      balance: user.wallet.balance,
      referralCode: user.referralCode,
      transactions
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/users/wallet/withdraw
// @desc    Request wallet withdrawal
// @access  Private
router.post('/wallet/withdraw', [
  auth,
  [
    body('amount', 'Amount is required').isFloat({ min: 1 }),
    body('paymentMethod', 'Payment method is required').not().isEmpty(),
    body('paymentDetails', 'Payment details are required').not().isEmpty()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { amount, paymentMethod, paymentDetails } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.wallet.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Create withdrawal transaction
    const transaction = new Transaction({
      userId: req.user.id,
      type: 'withdrawal',
      amount: amount,
      status: 'pending',
      paymentMethod,
      paymentDetails,
      description: `Withdrawal request via ${paymentMethod}`
    });

    await transaction.save();

    // Update user wallet
    user.wallet.balance -= amount;
    user.wallet.pendingWithdrawals += amount;
    await user.save();

    res.json({
      message: 'Withdrawal request submitted successfully',
      transaction: transaction,
      newBalance: user.wallet.balance
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/users/referrals
// @desc    Get user referral information
// @access  Private
router.get('/referrals', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('referralCode referralStats');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get referred users
    const referredUsers = await User.find({ referredBy: user.referralCode })
      .select('firstName lastName email createdAt')
      .sort({ createdAt: -1 });

    res.json({
      referralCode: user.referralCode,
      referralStats: user.referralStats,
      referredUsers
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/users/dashboard
// @desc    Get user dashboard data
// @access  Private
router.get('/dashboard', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('wallet referralStats');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get recent exam submissions
    const recentSubmissions = await Submission.find({ userId: req.user.id })
      .populate('examId', 'title module')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get exam statistics
    const examStats = await Submission.aggregate([
      { $match: { userId: req.user.id } },
      {
        $group: {
          _id: '$examId',
          totalExams: { $sum: 1 },
          averageScore: { $avg: '$overallScore' },
          bestScore: { $max: '$overallScore' },
          lastAttempt: { $max: '$createdAt' }
        }
      }
    ]);

    // Get recent transactions
    const recentTransactions = await Transaction.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      wallet: user.wallet,
      referralStats: user.referralStats,
      recentSubmissions,
      examStats,
      recentTransactions
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/users/exam-history
// @desc    Get user exam history
// @access  Private
router.get('/exam-history', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, module } = req.query;

    const query = { userId: req.user.id };
    if (module) {
      query['examId.module'] = module;
    }

    const submissions = await Submission.find(query)
      .populate('examId', 'title module duration')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Submission.countDocuments(query);

    res.json({
      submissions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/users/performance-analytics
// @desc    Get user performance analytics
// @access  Private
router.get('/performance-analytics', auth, async (req, res) => {
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

    // Get performance by module
    const modulePerformance = await Submission.aggregate([
      { $match: { userId: req.user.id, createdAt: dateFilter } },
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
          totalExams: { $sum: 1 },
          averageScore: { $avg: '$overallScore' },
          bestScore: { $max: '$overallScore' },
          lowestScore: { $min: '$overallScore' }
        }
      }
    ]);

    // Get score progression over time
    const scoreProgression = await Submission.find({
      userId: req.user.id,
      createdAt: dateFilter
    })
      .populate('examId', 'title module')
      .sort({ createdAt: 1 })
      .select('overallScore createdAt examId');

    res.json({
      modulePerformance,
      scoreProgression,
      period
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/users/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', [
  auth,
  [
    body('currentPassword', 'Current password is required').not().isEmpty(),
    body('newPassword', 'New password must be at least 6 characters').isLength({ min: 6 })
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/users/account
// @desc    Delete user account
// @access  Private
router.delete('/account', [
  auth,
  [
    body('password', 'Password is required for account deletion').not().isEmpty()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { password } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Password is incorrect' });
    }

    // Delete user data (soft delete)
    user.isDeleted = true;
    user.deletedAt = Date.now();
    await user.save();

    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router; 