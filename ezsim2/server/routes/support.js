const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const SupportTicket = require('../models/SupportTicket');
const User = require('../models/User');

// @route   POST /api/support/tickets
// @desc    Create a new support ticket
// @access  Private
router.post('/tickets', [
  auth,
  [
    body('subject', 'Subject is required').not().isEmpty(),
    body('description', 'Description is required').not().isEmpty(),
    body('category', 'Category is required').isIn([
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
    ]),
    body('priority', 'Priority is required').isIn(['low', 'medium', 'high', 'urgent'])
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const {
      subject,
      description,
      category,
      priority,
      relatedExam,
      relatedSubmission,
      relatedTransaction,
      attachments
    } = req.body;

    const ticket = new SupportTicket({
      userId: req.user.id,
      subject,
      description,
      category,
      priority,
      relatedExam,
      relatedSubmission,
      relatedTransaction,
      attachments: attachments || [],
      metadata: {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
        browser: req.headers['user-agent']?.includes('Chrome') ? 'Chrome' : 'Other',
        operatingSystem: req.headers['user-agent']?.includes('Windows') ? 'Windows' : 'Other'
      }
    });

    await ticket.save();

    // Add initial message
    await ticket.addMessage(req.user.id, description, {
      senderType: 'user',
      attachments: attachments || []
    });

    res.status(201).json({
      message: 'Support ticket created successfully',
      ticket: {
        id: ticket._id,
        ticketId: ticket.ticketId,
        subject: ticket.subject,
        status: ticket.status,
        priority: ticket.priority,
        createdAt: ticket.createdAt
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/support/tickets
// @desc    Get user's support tickets
// @access  Private
router.get('/tickets', auth, async (req, res) => {
  try {
    const { status, category, page = 1, limit = 10 } = req.query;

    const query = { userId: req.user.id };
    if (status) query.status = status;
    if (category) query.category = category;

    const tickets = await SupportTicket.find(query)
      .populate('assignedTo', 'firstName lastName email')
      .populate('relatedExam', 'title examType')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await SupportTicket.countDocuments(query);

    res.json({
      tickets,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/support/tickets/:id
// @desc    Get ticket details
// @access  Private
router.get('/tickets/:id', auth, async (req, res) => {
  try {
    const ticket = await SupportTicket.findOne({
      _id: req.params.id,
      userId: req.user.id
    })
      .populate('assignedTo', 'firstName lastName email')
      .populate('relatedExam', 'title examType')
      .populate('relatedSubmission', 'examId')
      .populate('relatedTransaction', 'transactionId amount type');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    res.json(ticket);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/support/tickets/:id/messages
// @desc    Add message to ticket
// @access  Private
router.post('/tickets/:id/messages', [
  auth,
  [
    body('message', 'Message is required').not().isEmpty()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { message, attachments } = req.body;

    const ticket = await SupportTicket.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    if (ticket.status === 'closed') {
      return res.status(400).json({ message: 'Cannot add message to closed ticket' });
    }

    await ticket.addMessage(req.user.id, message, {
      senderType: 'user',
      attachments: attachments || []
    });

    res.json({
      message: 'Message added successfully',
      ticket: {
        id: ticket._id,
        status: ticket.status,
        messages: ticket.messages
      }
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/support/tickets/:id
// @desc    Update ticket
// @access  Private
router.put('/tickets/:id', [
  auth,
  [
    body('subject', 'Subject is required').not().isEmpty(),
    body('description', 'Description is required').not().isEmpty()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { subject, description, priority } = req.body;

    const ticket = await SupportTicket.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    if (ticket.status === 'closed') {
      return res.status(400).json({ message: 'Cannot update closed ticket' });
    }

    ticket.subject = subject;
    ticket.description = description;
    if (priority) ticket.priority = priority;
    ticket.updatedAt = Date.now();

    await ticket.save();

    res.json({
      message: 'Ticket updated successfully',
      ticket: {
        id: ticket._id,
        subject: ticket.subject,
        description: ticket.description,
        priority: ticket.priority,
        updatedAt: ticket.updatedAt
      }
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/support/tickets/:id/close
// @desc    Close ticket
// @access  Private
router.post('/tickets/:id/close', auth, async (req, res) => {
  try {
    const ticket = await SupportTicket.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    if (ticket.status === 'closed') {
      return res.status(400).json({ message: 'Ticket is already closed' });
    }

    await ticket.updateStatus('closed');

    res.json({
      message: 'Ticket closed successfully',
      ticket: {
        id: ticket._id,
        status: ticket.status
      }
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    res.status(500).send('Server Error');
  }
});

// Admin routes for support management
// @route   GET /api/support/admin/tickets
// @desc    Get all tickets (Admin only)
// @access  Private/Admin
router.get('/admin/tickets', [auth, admin], async (req, res) => {
  try {
    const { status, priority, category, assignedTo, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;
    if (assignedTo) query.assignedTo = assignedTo;

    const tickets = await SupportTicket.find(query)
      .populate('userId', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .populate('relatedExam', 'title examType')
      .sort({ priority: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await SupportTicket.countDocuments(query);

    res.json({
      tickets,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/support/admin/tickets/:id
// @desc    Get ticket details (Admin only)
// @access  Private/Admin
router.get('/admin/tickets/:id', [auth, admin], async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate('userId', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .populate('relatedExam', 'title examType')
      .populate('relatedSubmission', 'examId')
      .populate('relatedTransaction', 'transactionId amount type');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    res.json(ticket);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/support/admin/tickets/:id/assign
// @desc    Assign ticket to admin (Admin only)
// @access  Private/Admin
router.post('/admin/tickets/:id/assign', [auth, admin], async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    await ticket.assignTo(req.user.id);

    res.json({
      message: 'Ticket assigned successfully',
      ticket: {
        id: ticket._id,
        assignedTo: ticket.assignedTo,
        status: ticket.status
      }
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/support/admin/tickets/:id/messages
// @desc    Add admin message to ticket (Admin only)
// @access  Private/Admin
router.post('/admin/tickets/:id/messages', [
  auth,
  admin,
  [
    body('message', 'Message is required').not().isEmpty()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { message, isInternal = false, attachments } = req.body;

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    await ticket.addMessage(req.user.id, message, {
      senderType: 'admin',
      isInternal,
      attachments: attachments || []
    });

    res.json({
      message: 'Admin message added successfully',
      ticket: {
        id: ticket._id,
        messages: ticket.messages
      }
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/support/admin/tickets/:id/status
// @desc    Update ticket status (Admin only)
// @access  Private/Admin
router.put('/admin/tickets/:id/status', [
  auth,
  admin,
  [
    body('status', 'Status is required').isIn(['open', 'in-progress', 'waiting-for-user', 'resolved', 'closed'])
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { status, resolutionNotes } = req.body;

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    await ticket.updateStatus(status, req.user.id);

    if (status === 'resolved' && resolutionNotes) {
      ticket.resolution.resolutionNotes = resolutionNotes;
      await ticket.save();
    }

    res.json({
      message: 'Ticket status updated successfully',
      ticket: {
        id: ticket._id,
        status: ticket.status,
        resolution: ticket.resolution
      }
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/support/admin/tickets/:id/escalate
// @desc    Escalate ticket (Admin only)
// @access  Private/Admin
router.post('/admin/tickets/:id/escalate', [
  auth,
  admin,
  [
    body('escalatedTo', 'Escalated to user ID is required').not().isEmpty(),
    body('reason', 'Escalation reason is required').not().isEmpty()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { escalatedTo, reason } = req.body;

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    await ticket.escalate(escalatedTo, reason, req.user.id);

    res.json({
      message: 'Ticket escalated successfully',
      ticket: {
        id: ticket._id,
        escalation: ticket.escalation,
        assignedTo: ticket.assignedTo,
        priority: ticket.priority
      }
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/support/admin/statistics
// @desc    Get support statistics (Admin only)
// @access  Private/Admin
router.get('/admin/statistics', [auth, admin], async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const stats = await SupportTicket.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          averageResolutionTime: { $avg: '$sla.actualResolutionTime' }
        }
      }
    ]);

    const categoryStats = await SupportTicket.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          averageResolutionTime: { $avg: '$sla.actualResolutionTime' }
        }
      }
    ]);

    const priorityStats = await SupportTicket.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      statusStats: stats,
      categoryStats,
      priorityStats
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/support/admin/overdue
// @desc    Get overdue tickets (Admin only)
// @access  Private/Admin
router.get('/admin/overdue', [auth, admin], async (req, res) => {
  try {
    const overdueTickets = await SupportTicket.getOverdueTickets();
    res.json(overdueTickets);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router; 