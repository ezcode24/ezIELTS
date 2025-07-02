const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const SpeakingBooking = require('../models/SpeakingBooking');
const Exam = require('../models/Exam');
const Submission = require('../models/Submission');
const User = require('../models/User');

// @route   POST /api/speaking/book
// @desc    Book a speaking test slot
// @access  Private
router.post('/book', [
  auth,
  [
    body('examId', 'Exam ID is required').not().isEmpty(),
    body('submissionId', 'Submission ID is required').not().isEmpty(),
    body('scheduledDate', 'Scheduled date is required').isISO8601(),
    body('scheduledTime', 'Scheduled time is required').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('timezone', 'Timezone is required').not().isEmpty()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const {
      examId,
      submissionId,
      scheduledDate,
      scheduledTime,
      timezone,
      duration = 15,
      addToGoogleCalendar = false
    } = req.body;

    // Verify exam exists and is valid
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    if (!exam.modules.speaking.enabled) {
      return res.status(400).json({ message: 'Speaking module is not enabled for this exam' });
    }

    // Verify submission exists and belongs to user
    const submission = await Submission.findOne({
      _id: submissionId,
      userId: req.user.id,
      examId: examId
    });

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Check if user already has a booking for this submission
    const existingBooking = await SpeakingBooking.findOne({
      userId: req.user.id,
      submissionId: submissionId
    });

    if (existingBooking) {
      return res.status(400).json({ 
        message: 'You already have a booking for this exam',
        bookingId: existingBooking.bookingId
      });
    }

    // Check if slot is available
    const [hours, minutes] = scheduledTime.split(':');
    const scheduledDateTime = new Date(scheduledDate);
    scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    // Check if the time is in the future
    if (scheduledDateTime <= new Date()) {
      return res.status(400).json({ message: 'Scheduled time must be in the future' });
    }

    // Check for conflicts (simplified - in production, you'd check examiner availability)
    const conflictingBookings = await SpeakingBooking.find({
      scheduledDate: scheduledDate,
      scheduledTime: scheduledTime,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (conflictingBookings.length >= 3) { // Assuming max 3 concurrent bookings
      return res.status(400).json({ message: 'This time slot is not available' });
    }

    // Create booking
    const booking = new SpeakingBooking({
      userId: req.user.id,
      examId: examId,
      submissionId: submissionId,
      scheduledDate: scheduledDate,
      scheduledTime: scheduledTime,
      timezone: timezone,
      duration: duration,
      examType: exam.examType,
      createdBy: req.user.id,
      metadata: {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip
      }
    });

    await booking.save();

    // Add to Google Calendar if requested
    if (addToGoogleCalendar) {
      try {
        // This would integrate with Google Calendar API
        // For now, we'll just mark it as pending
        booking.googleCalendar.syncStatus = 'pending';
        await booking.save();
      } catch (error) {
        console.error('Google Calendar sync error:', error);
        // Don't fail the booking if calendar sync fails
      }
    }

    res.status(201).json({
      message: 'Speaking test booked successfully',
      booking: {
        id: booking._id,
        bookingId: booking.bookingId,
        scheduledDate: booking.scheduledDate,
        scheduledTime: booking.scheduledTime,
        timezone: booking.timezone,
        duration: booking.duration,
        status: booking.status,
        meeting: booking.meeting
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/speaking/bookings
// @desc    Get user's speaking bookings
// @access  Private
router.get('/bookings', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = { userId: req.user.id };
    if (status) query.status = status;

    const bookings = await SpeakingBooking.find(query)
      .populate('examId', 'title examType')
      .populate('examinerId', 'firstName lastName email')
      .sort({ scheduledDate: 1, scheduledTime: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await SpeakingBooking.countDocuments(query);

    res.json({
      bookings,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/speaking/bookings/:id
// @desc    Get booking details
// @access  Private
router.get('/bookings/:id', auth, async (req, res) => {
  try {
    const booking = await SpeakingBooking.findOne({
      _id: req.params.id,
      userId: req.user.id
    })
      .populate('examId', 'title examType instructions')
      .populate('examinerId', 'firstName lastName email')
      .populate('submissionId', 'status scores');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json(booking);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/speaking/bookings/:id/reschedule
// @desc    Reschedule speaking test
// @access  Private
router.put('/bookings/:id/reschedule', [
  auth,
  [
    body('scheduledDate', 'Scheduled date is required').isISO8601(),
    body('scheduledTime', 'Scheduled time is required').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('reason', 'Reschedule reason is required').not().isEmpty()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { scheduledDate, scheduledTime, reason } = req.body;

    const booking = await SpeakingBooking.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (!booking.canBeRescheduled) {
      return res.status(400).json({ 
        message: 'Booking cannot be rescheduled at this time' 
      });
    }

    // Check if new slot is available
    const [hours, minutes] = scheduledTime.split(':');
    const scheduledDateTime = new Date(scheduledDate);
    scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    if (scheduledDateTime <= new Date()) {
      return res.status(400).json({ message: 'Scheduled time must be in the future' });
    }

    // Check for conflicts
    const conflictingBookings = await SpeakingBooking.find({
      _id: { $ne: req.params.id },
      scheduledDate: scheduledDate,
      scheduledTime: scheduledTime,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (conflictingBookings.length >= 3) {
      return res.status(400).json({ message: 'This time slot is not available' });
    }

    await booking.reschedule(scheduledDate, scheduledTime, reason);

    res.json({
      message: 'Booking rescheduled successfully',
      booking: {
        id: booking._id,
        bookingId: booking.bookingId,
        scheduledDate: booking.scheduledDate,
        scheduledTime: booking.scheduledTime,
        rescheduleCount: booking.rescheduling.rescheduleCount,
        canBeRescheduled: booking.canBeRescheduled
      }
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/speaking/bookings/:id/cancel
// @desc    Cancel speaking test booking
// @access  Private
router.post('/bookings/:id/cancel', [
  auth,
  [
    body('reason', 'Cancellation reason is required').not().isEmpty()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { reason } = req.body;

    const booking = await SpeakingBooking.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status === 'completed') {
      return res.status(400).json({ message: 'Cannot cancel completed booking' });
    }

    if (booking.status === 'in-progress') {
      return res.status(400).json({ message: 'Cannot cancel booking in progress' });
    }

    booking.status = 'cancelled';
    booking.updatedBy = req.user.id;
    await booking.save();

    res.json({
      message: 'Booking cancelled successfully',
      booking: {
        id: booking._id,
        bookingId: booking.bookingId,
        status: booking.status
      }
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/speaking/available-slots
// @desc    Get available speaking test slots
// @access  Private
router.get('/available-slots', auth, async (req, res) => {
  try {
    const { date, examinerId } = req.query;

    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    const availableSlots = await SpeakingBooking.findAvailableSlots(date, examinerId);

    // Generate time slots (9 AM to 6 PM, 30-minute intervals)
    const timeSlots = [];
    for (let hour = 9; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const isBooked = availableSlots.some(booking => booking.scheduledTime === time);
        
        timeSlots.push({
          time,
          available: !isBooked,
          bookingId: isBooked ? availableSlots.find(b => b.scheduledTime === time)?.bookingId : null
        });
      }
    }

    res.json({
      date,
      timeSlots,
      totalAvailable: timeSlots.filter(slot => slot.available).length
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/speaking/google-calendar/:id
// @desc    Add booking to Google Calendar
// @access  Private
router.post('/google-calendar/:id', auth, async (req, res) => {
  try {
    const booking = await SpeakingBooking.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // This would integrate with Google Calendar API
    // For now, we'll simulate the integration
    try {
      // Simulate Google Calendar API call
      const eventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      booking.googleCalendar.eventId = eventId;
      booking.googleCalendar.syncStatus = 'synced';
      booking.googleCalendar.lastSyncAt = new Date();
      await booking.save();

      res.json({
        message: 'Added to Google Calendar successfully',
        eventId: eventId
      });
    } catch (error) {
      booking.googleCalendar.syncStatus = 'failed';
      booking.googleCalendar.syncError = error.message;
      await booking.save();

      res.status(500).json({ 
        message: 'Failed to add to Google Calendar',
        error: error.message
      });
    }
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.status(500).send('Server Error');
  }
});

// Admin routes for speaking test management
// @route   GET /api/speaking/admin/bookings
// @desc    Get all speaking bookings (Admin only)
// @access  Private/Admin
router.get('/admin/bookings', [auth, admin], async (req, res) => {
  try {
    const { status, date, examinerId, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.scheduledDate = { $gte: startOfDay, $lte: endOfDay };
    }
    if (examinerId) query.examinerId = examinerId;

    const bookings = await SpeakingBooking.find(query)
      .populate('userId', 'firstName lastName email')
      .populate('examId', 'title examType')
      .populate('examinerId', 'firstName lastName email')
      .sort({ scheduledDate: 1, scheduledTime: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await SpeakingBooking.countDocuments(query);

    res.json({
      bookings,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/speaking/admin/bookings/:id
// @desc    Get booking details (Admin only)
// @access  Private/Admin
router.get('/admin/bookings/:id', [auth, admin], async (req, res) => {
  try {
    const booking = await SpeakingBooking.findById(req.params.id)
      .populate('userId', 'firstName lastName email')
      .populate('examId', 'title examType instructions')
      .populate('examinerId', 'firstName lastName email')
      .populate('submissionId', 'status scores')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json(booking);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/speaking/admin/bookings/:id/assign-examiner
// @desc    Assign examiner to booking (Admin only)
// @access  Private/Admin
router.put('/admin/bookings/:id/assign-examiner', [
  auth,
  admin,
  [
    body('examinerId', 'Examiner ID is required').not().isEmpty()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { examinerId } = req.body;

    const booking = await SpeakingBooking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify examiner exists and has appropriate role
    const examiner = await User.findById(examinerId);
    if (!examiner || examiner.role !== 'examiner') {
      return res.status(400).json({ message: 'Invalid examiner' });
    }

    booking.examinerId = examinerId;
    booking.updatedBy = req.user.id;
    await booking.save();

    res.json({
      message: 'Examiner assigned successfully',
      booking: {
        id: booking._id,
        bookingId: booking.bookingId,
        examinerId: booking.examinerId
      }
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/speaking/admin/bookings/:id/update-meeting
// @desc    Update meeting details (Admin only)
// @access  Private/Admin
router.put('/admin/bookings/:id/update-meeting', [
  auth,
  admin
], async (req, res) => {
  try {
    const {
      platform,
      meetingId,
      meetingPassword,
      meetingUrl,
      joinInstructions
    } = req.body;

    const booking = await SpeakingBooking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (platform) booking.meeting.platform = platform;
    if (meetingId) booking.meeting.meetingId = meetingId;
    if (meetingPassword) booking.meeting.meetingPassword = meetingPassword;
    if (meetingUrl) booking.meeting.meetingUrl = meetingUrl;
    if (joinInstructions) booking.meeting.joinInstructions = joinInstructions;

    booking.updatedBy = req.user.id;
    await booking.save();

    res.json({
      message: 'Meeting details updated successfully',
      booking: {
        id: booking._id,
        bookingId: booking.bookingId,
        meeting: booking.meeting
      }
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/speaking/admin/bookings/:id/grade
// @desc    Grade speaking test (Admin only)
// @access  Private/Admin
router.post('/admin/bookings/:id/grade', [
  auth,
  admin,
  [
    body('results', 'Results are required').isObject(),
    body('feedback', 'Feedback is required').isObject()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { results, feedback } = req.body;

    const booking = await SpeakingBooking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({ message: 'Booking must be completed before grading' });
    }

    booking.results = results;
    booking.results.gradedAt = new Date();
    booking.results.gradedBy = req.user.id;
    booking.updatedBy = req.user.id;
    await booking.save();

    res.json({
      message: 'Speaking test graded successfully',
      booking: {
        id: booking._id,
        bookingId: booking.bookingId,
        results: booking.results
      }
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/speaking/admin/statistics
// @desc    Get speaking test statistics (Admin only)
// @access  Private/Admin
router.get('/admin/statistics', [auth, admin], async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.scheduledDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const stats = await SpeakingBooking.getBookingStats(startDate, endDate);

    // Get examiner performance stats
    const examinerStats = await SpeakingBooking.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$examinerId',
          totalBookings: { $sum: 1 },
          completedBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          averageScore: { $avg: '$results.overallScore' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'examiner'
        }
      },
      { $unwind: '$examiner' }
    ]);

    res.json({
      statusStats: stats,
      examinerStats
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router; 