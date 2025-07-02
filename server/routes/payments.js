const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// @route   POST /api/payments/create-payment-intent
// @desc    Create Stripe payment intent
// @access  Private
router.post('/create-payment-intent', [
  auth,
  [
    body('amount', 'Amount is required').isFloat({ min: 1 }),
    body('currency', 'Currency is required').isIn(['usd', 'eur', 'gbp']),
    body('description', 'Description is required').not().isEmpty()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { amount, currency, description, metadata = {} } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency,
      description: description,
      metadata: {
        userId: req.user.id,
        userEmail: req.user.email,
        ...metadata
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (err) {
    console.error('Payment intent creation error:', err);
    res.status(500).json({ message: 'Failed to create payment intent' });
  }
});

// @route   POST /api/payments/confirm-payment
// @desc    Confirm payment and update wallet
// @access  Private
router.post('/confirm-payment', [
  auth,
  [
    body('paymentIntentId', 'Payment intent ID is required').not().isEmpty(),
    body('amount', 'Amount is required').isFloat({ min: 1 })
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { paymentIntentId, amount, description = 'Wallet top-up' } = req.body;

    // Verify payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ message: 'Payment not completed' });
    }

    if (paymentIntent.metadata.userId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized payment' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const balanceBefore = user.wallet.balance;
    const balanceAfter = balanceBefore + amount;

    // Update user wallet
    user.wallet.balance = balanceAfter;
    await user.save();

    // Create transaction record
    const transaction = new Transaction({
      userId: req.user.id,
      type: 'wallet-topup',
      amount: amount,
      direction: 'credit',
      status: 'completed',
      balanceBefore,
      balanceAfter,
      payment: {
        method: 'stripe',
        gateway: 'stripe',
        paymentIntentId: paymentIntentId,
        chargeId: paymentIntent.latest_charge,
        fees: {
          amount: paymentIntent.application_fee_amount ? paymentIntent.application_fee_amount / 100 : 0,
          currency: paymentIntent.currency
        }
      },
      description: description,
      metadata: {
        userEmail: req.user.email,
        userFullName: `${req.user.firstName} ${req.user.lastName}`,
        paymentIntentId: paymentIntentId
      }
    });

    await transaction.save();

    res.json({
      message: 'Payment confirmed successfully',
      transaction: transaction.summary,
      newBalance: balanceAfter
    });
  } catch (err) {
    console.error('Payment confirmation error:', err);
    res.status(500).json({ message: 'Failed to confirm payment' });
  }
});

// @route   POST /api/payments/process-refund
// @desc    Process refund for a transaction
// @access  Private
router.post('/process-refund', [
  auth,
  [
    body('transactionId', 'Transaction ID is required').not().isEmpty(),
    body('reason', 'Refund reason is required').not().isEmpty()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { transactionId, reason, amount } = req.body;

    const transaction = await Transaction.findOne({
      _id: transactionId,
      userId: req.user.id,
      status: 'completed'
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const refundAmount = amount || transaction.amount;

    // Process refund through Stripe if it was a Stripe payment
    let refundId = null;
    if (transaction.payment.gateway === 'stripe' && transaction.payment.chargeId) {
      const refund = await stripe.refunds.create({
        charge: transaction.payment.chargeId,
        amount: Math.round(refundAmount * 100), // Convert to cents
        reason: 'requested_by_customer'
      });
      refundId = refund.id;
    }

    // Update user wallet
    const user = await User.findById(req.user.id);
    const balanceBefore = user.wallet.balance;
    const balanceAfter = balanceBefore - refundAmount;

    if (balanceAfter < 0) {
      return res.status(400).json({ message: 'Insufficient balance for refund' });
    }

    user.wallet.balance = balanceAfter;
    await user.save();

    // Create refund transaction
    const refundTransaction = new Transaction({
      userId: req.user.id,
      type: 'refund',
      amount: refundAmount,
      direction: 'debit',
      status: 'completed',
      balanceBefore,
      balanceAfter,
      relatedTransaction: transaction._id,
      payment: {
        method: transaction.payment.method,
        gateway: transaction.payment.gateway,
        refundId: refundId
      },
      description: `Refund: ${reason}`,
      admin: {
        processedBy: req.user.id,
        reason,
        notes: `Refund processed by user`
      }
    });

    await refundTransaction.save();

    // Update original transaction
    transaction.status = 'refunded';
    transaction.refundedAt = new Date();
    await transaction.save();

    res.json({
      message: 'Refund processed successfully',
      refundTransaction: refundTransaction.summary,
      newBalance: balanceAfter
    });
  } catch (err) {
    console.error('Refund processing error:', err);
    res.status(500).json({ message: 'Failed to process refund' });
  }
});

// @route   GET /api/payments/transactions
// @desc    Get user transactions
// @access  Private
router.get('/transactions', auth, async (req, res) => {
  try {
    const { type, status, page = 1, limit = 20 } = req.query;

    const query = { userId: req.user.id };
    if (type) query.type = type;
    if (status) query.status = status;

    const transactions = await Transaction.find(query)
      .populate('examId', 'title examType')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Transaction.countDocuments(query);

    res.json({
      transactions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/payments/transactions/:id
// @desc    Get transaction details
// @access  Private
router.get('/transactions/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user.id
    }).populate('examId', 'title examType');

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json(transaction);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/payments/webhook
// @desc    Stripe webhook handler
// @access  Public
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object);
        break;
      
      case 'charge.refunded':
        await handleRefund(event.data.object);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook processing error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Webhook handlers
async function handlePaymentSuccess(paymentIntent) {
  try {
    const transaction = await Transaction.findOne({
      'payment.paymentIntentId': paymentIntent.id
    });

    if (transaction) {
      transaction.status = 'completed';
      transaction.processedAt = new Date();
      await transaction.save();

      // Update user wallet if not already updated
      const user = await User.findById(transaction.userId);
      if (user) {
        user.wallet.balance += transaction.amount;
        await user.save();
      }
    }
  } catch (err) {
    console.error('Payment success handler error:', err);
  }
}

async function handlePaymentFailure(paymentIntent) {
  try {
    const transaction = await Transaction.findOne({
      'payment.paymentIntentId': paymentIntent.id
    });

    if (transaction) {
      transaction.status = 'failed';
      transaction.failedAt = new Date();
      transaction.error = {
        code: paymentIntent.last_payment_error?.code,
        message: paymentIntent.last_payment_error?.message
      };
      await transaction.save();
    }
  } catch (err) {
    console.error('Payment failure handler error:', err);
  }
}

async function handleRefund(charge) {
  try {
    const transaction = await Transaction.findOne({
      'payment.chargeId': charge.id
    });

    if (transaction) {
      transaction.status = 'refunded';
      transaction.refundedAt = new Date();
      await transaction.save();
    }
  } catch (err) {
    console.error('Refund handler error:', err);
  }
}

// @route   POST /api/payments/request-withdrawal
// @desc    Request wallet withdrawal
// @access  Private
router.post('/request-withdrawal', [
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
    const { amount, paymentMethod, paymentDetails, reason } = req.body;

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
      direction: 'debit',
      status: 'pending',
      balanceBefore: user.wallet.balance,
      balanceAfter: user.wallet.balance - amount,
      payment: {
        method: paymentMethod,
        paymentDetails: paymentDetails
      },
      description: `Withdrawal request: ${reason || 'User requested withdrawal'}`,
      metadata: {
        userEmail: req.user.email,
        userFullName: `${req.user.firstName} ${req.user.lastName}`
      }
    });

    await transaction.save();

    // Update user wallet
    user.wallet.balance -= amount;
    await user.save();

    res.json({
      message: 'Withdrawal request submitted successfully',
      transaction: transaction.summary,
      newBalance: user.wallet.balance
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/payments/wallet-balance
// @desc    Get user wallet balance
// @access  Private
router.get('/wallet-balance', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('wallet');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      balance: user.wallet.balance,
      currency: user.wallet.currency
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router; 