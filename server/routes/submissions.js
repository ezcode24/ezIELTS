const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const Submission = require('../models/Submission');
const Exam = require('../models/Exam');
const Question = require('../models/Question');

// @route   GET /api/submissions
// @desc    Get user submissions
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { status, examId, page = 1, limit = 10 } = req.query;

    const query = { userId: req.user.id };
    if (status) query.status = status;
    if (examId) query.examId = examId;

    const submissions = await Submission.find(query)
      .populate('examId', 'title module examType')
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

// @route   GET /api/submissions/:id
// @desc    Get submission details
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const submission = await Submission.findOne({
      _id: req.params.id,
      userId: req.user.id
    }).populate('examId', 'title module instructions');

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    res.json(submission);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Submission not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/submissions/:id/save-answer
// @desc    Save answer for a question
// @access  Private
router.post('/:id/save-answer', [
  auth,
  [
    body('module', 'Module is required').isIn(['listening', 'reading', 'writing', 'speaking']),
    body('questionId', 'Question ID is required').not().isEmpty(),
    body('answer', 'Answer is required').not().isEmpty()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { module, questionId, answer, timeSpent } = req.body;

    const submission = await Submission.findOne({
      _id: req.params.id,
      userId: req.user.id,
      status: 'in-progress'
    });

    if (!submission) {
      return res.status(404).json({ message: 'Active submission not found' });
    }

    // Add or update answer
    const answerData = {
      questionId,
      answer,
      timeSpent: timeSpent || 0,
      timestamp: new Date()
    };

    // Check if answer already exists
    const existingAnswerIndex = submission.answers[module].findIndex(
      a => a.questionId.toString() === questionId
    );

    if (existingAnswerIndex >= 0) {
      submission.answers[module][existingAnswerIndex] = answerData;
    } else {
      submission.answers[module].push(answerData);
    }

    await submission.save();

    res.json({
      message: 'Answer saved successfully',
      submission: {
        id: submission._id,
        answers: submission.answers[module]
      }
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Submission not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/submissions/:id/complete-module
// @desc    Mark a module as completed
// @access  Private
router.post('/:id/complete-module', [
  auth,
  [
    body('module', 'Module is required').isIn(['listening', 'reading', 'writing', 'speaking'])
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { module } = req.body;

    const submission = await Submission.findOne({
      _id: req.params.id,
      userId: req.user.id,
      status: 'in-progress'
    });

    if (!submission) {
      return res.status(404).json({ message: 'Active submission not found' });
    }

    // Update module progress
    await submission.updateProgress(module, 'completed');

    res.json({
      message: `${module} module completed successfully`,
      submission: {
        id: submission._id,
        progress: submission.progress,
        status: submission.status
      }
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Submission not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/submissions/:id/submit
// @desc    Submit the entire exam
// @access  Private
router.post('/:id/submit', auth, async (req, res) => {
  try {
    const submission = await Submission.findOne({
      _id: req.params.id,
      userId: req.user.id,
      status: 'in-progress'
    });

    if (!submission) {
      return res.status(404).json({ message: 'Active submission not found' });
    }

    // Check if all modules are completed
    const allCompleted = Object.values(submission.progress).every(p => p === 'completed');
    if (!allCompleted) {
      return res.status(400).json({ message: 'All modules must be completed before submission' });
    }

    // Mark as completed
    submission.status = 'completed';
    submission.completedAt = new Date();

    // Calculate scores for listening and reading (auto-graded)
    if (submission.answers.listening.length > 0) {
      await submission.calculateListeningScore();
    }

    if (submission.answers.reading.length > 0) {
      await submission.calculateReadingScore();
    }

    // Calculate overall score
    await submission.calculateOverallScore();

    await submission.save();

    res.json({
      message: 'Exam submitted successfully',
      submission: {
        id: submission._id,
        status: submission.status,
        scores: submission.scores,
        completedAt: submission.completedAt
      }
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Submission not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/submissions/:id/result
// @desc    Get detailed exam result
// @access  Private
router.get('/:id/result', auth, async (req, res) => {
  try {
    const submission = await Submission.findOne({
      _id: req.params.id,
      userId: req.user.id,
      status: { $in: ['completed', 'graded'] }
    }).populate('examId', 'title module instructions');

    if (!submission) {
      return res.status(404).json({ message: 'Submission result not found' });
    }

    // Get questions for review
    const exam = await Exam.findById(submission.examId._id);
    const questions = await Question.find({
      _id: { $in: exam.questions }
    });

    // Create review data
    const review = {
      listening: submission.answers.listening.map(answer => {
        const question = questions.find(q => q._id.toString() === answer.questionId.toString());
        return {
          questionId: answer.questionId,
          question: question ? question.content.question : 'Question not found',
          userAnswer: answer.answer,
          correctAnswer: question ? question.answers.correctAnswers[0] : null,
          isCorrect: answer.isCorrect,
          score: answer.score,
          timeSpent: answer.timeSpent
        };
      }),
      reading: submission.answers.reading.map(answer => {
        const question = questions.find(q => q._id.toString() === answer.questionId.toString());
        return {
          questionId: answer.questionId,
          question: question ? question.content.question : 'Question not found',
          userAnswer: answer.answer,
          correctAnswer: question ? question.answers.correctAnswers[0] : null,
          isCorrect: answer.isCorrect,
          score: answer.score,
          timeSpent: answer.timeSpent
        };
      }),
      writing: submission.answers.writing,
      speaking: submission.answers.speaking
    };

    res.json({
      submission,
      review,
      analytics: submission.analytics,
      feedback: submission.feedback
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Submission not found' });
    }
    res.status(500).send('Server Error');
  }
});

// Admin routes for submission management
// @route   GET /api/submissions/admin/all
// @desc    Get all submissions (Admin only)
// @access  Private/Admin
router.get('/admin/all', [auth, admin], async (req, res) => {
  try {
    const { status, userId, examId, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (userId) query.userId = userId;
    if (examId) query.examId = examId;

    const submissions = await Submission.find(query)
      .populate('userId', 'firstName lastName email')
      .populate('examId', 'title module examType')
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

// @route   GET /api/submissions/admin/:id
// @desc    Get submission details (Admin only)
// @access  Private/Admin
router.get('/admin/:id', [auth, admin], async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('userId', 'firstName lastName email')
      .populate('examId', 'title module instructions')
      .populate('grading.gradedBy', 'firstName lastName');

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    res.json(submission);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Submission not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/submissions/admin/:id/grade
// @desc    Grade a submission (Admin only)
// @access  Private/Admin
router.post('/admin/:id/grade', [
  auth,
  admin,
  [
    body('scores', 'Scores are required').isObject(),
    body('feedback', 'Feedback is required').isObject()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { scores, feedback, gradingNotes } = req.body;

    const submission = await Submission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Update scores and feedback
    submission.scores = { ...submission.scores, ...scores };
    submission.feedback = { ...submission.feedback, ...feedback };

    // Update grading information
    submission.grading = {
      gradedBy: req.user.id,
      gradingMethod: 'manual',
      gradingNotes: gradingNotes || submission.grading.gradingNotes,
      gradingTime: submission.grading.gradingTime || 0
    };

    submission.status = 'graded';
    submission.gradedAt = new Date();

    // Recalculate overall score
    await submission.calculateOverallScore();

    await submission.save();

    res.json({
      message: 'Submission graded successfully',
      submission: {
        id: submission._id,
        scores: submission.scores,
        status: submission.status,
        gradedAt: submission.gradedAt
      }
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Submission not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/submissions/admin/:id/flag
// @desc    Flag submission for review (Admin only)
// @access  Private/Admin
router.post('/admin/:id/flag', [
  auth,
  admin,
  [
    body('reason', 'Flag reason is required').not().isEmpty()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { reason } = req.body;

    const submission = await Submission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    await submission.flagForReview(reason);

    res.json({
      message: 'Submission flagged for review',
      submission: {
        id: submission._id,
        flagged: submission.integrity.flaggedForReview,
        reason: submission.integrity.reviewReason
      }
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Submission not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/submissions/admin/statistics
// @desc    Get submission statistics (Admin only)
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

    const stats = await Submission.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          averageScore: { $avg: '$scores.overall.bandScore' },
          averageTime: { $avg: '$analytics.totalTimeSpent' }
        }
      }
    ]);

    // Get module-wise statistics
    const moduleStats = await Submission.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$examId',
          submissions: { $sum: 1 },
          avgListening: { $avg: '$scores.listening.bandScore' },
          avgReading: { $avg: '$scores.reading.bandScore' },
          avgWriting: { $avg: '$scores.writing.overallScore' },
          avgSpeaking: { $avg: '$scores.speaking.overallScore' }
        }
      },
      {
        $lookup: {
          from: 'exams',
          localField: '_id',
          foreignField: '_id',
          as: 'exam'
        }
      },
      { $unwind: '$exam' }
    ]);

    res.json({
      statusStats: stats,
      moduleStats
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/submissions/admin/flagged
// @desc    Get flagged submissions (Admin only)
// @access  Private/Admin
router.get('/admin/flagged', [auth, admin], async (req, res) => {
  try {
    const flaggedSubmissions = await Submission.find({
      'integrity.flaggedForReview': true
    })
      .populate('userId', 'firstName lastName email')
      .populate('examId', 'title module')
      .sort({ createdAt: -1 });

    res.json(flaggedSubmissions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router; 