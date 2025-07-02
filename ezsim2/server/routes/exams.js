const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const Submission = require('../models/Submission');
const User = require('../models/User');

// @route   GET /api/exams
// @desc    Get all available exams
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { module, difficulty, page = 1, limit = 10 } = req.query;

    const query = { isActive: true };
    if (module) query.module = module;
    if (difficulty) query.difficulty = difficulty;

    const exams = await Exam.find(query)
      .select('title description module difficulty duration price isFree')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Exam.countDocuments(query);

    res.json({
      exams,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/exams/:id
// @desc    Get exam details
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .select('-questions -answers');

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    if (!exam.isActive) {
      return res.status(404).json({ message: 'Exam is not available' });
    }

    res.json(exam);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Exam not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/exams/:id/start
// @desc    Start an exam
// @access  Private
router.post('/:id/start', auth, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    if (!exam.isActive) {
      return res.status(400).json({ message: 'Exam is not available' });
    }

    // Check if user has already started this exam recently
    const existingSubmission = await Submission.findOne({
      userId: req.user.id,
      examId: req.params.id,
      status: { $in: ['in_progress', 'completed'] }
    });

    if (existingSubmission) {
      return res.status(400).json({ 
        message: 'You have already attempted this exam',
        submissionId: existingSubmission._id
      });
    }

    // Check if user has sufficient balance for paid exams
    if (!exam.isFree) {
      const user = await User.findById(req.user.id);
      if (user.wallet.balance < exam.price) {
        return res.status(400).json({ 
          message: 'Insufficient balance to start this exam',
          required: exam.price,
          current: user.wallet.balance
        });
      }
    }

    // Create new submission
    const submission = new Submission({
      userId: req.user.id,
      examId: req.params.id,
      status: 'in_progress',
      startTime: new Date(),
      endTime: new Date(Date.now() + exam.duration * 60 * 1000), // Convert minutes to milliseconds
      answers: {},
      scores: {
        listening: 0,
        reading: 0,
        writing: 0,
        speaking: 0
      }
    });

    await submission.save();

    // Deduct exam fee if applicable
    if (!exam.isFree) {
      const user = await User.findById(req.user.id);
      user.wallet.balance -= exam.price;
      user.wallet.totalSpent += exam.price;
      await user.save();

      // Create transaction record
      const Transaction = require('../models/Transaction');
      const transaction = new Transaction({
        userId: req.user.id,
        type: 'exam_purchase',
        amount: exam.price,
        status: 'completed',
        description: `Exam purchase: ${exam.title}`,
        examId: req.params.id
      });
      await transaction.save();
    }

    res.json({
      message: 'Exam started successfully',
      submission: {
        id: submission._id,
        startTime: submission.startTime,
        endTime: submission.endTime,
        duration: exam.duration
      }
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Exam not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/exams/:id/questions
// @desc    Get exam questions (only for in-progress submissions)
// @access  Private
router.get('/:id/questions', auth, async (req, res) => {
  try {
    const submission = await Submission.findOne({
      userId: req.user.id,
      examId: req.params.id,
      status: 'in_progress'
    });

    if (!submission) {
      return res.status(400).json({ message: 'No active exam session found' });
    }

    // Check if exam time has expired
    if (new Date() > submission.endTime) {
      submission.status = 'completed';
      await submission.save();
      return res.status(400).json({ message: 'Exam time has expired' });
    }

    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Get questions without answers
    const questions = await Question.find({
      _id: { $in: exam.questions }
    }).select('-correctAnswer -explanation');

    // Calculate remaining time
    const remainingTime = Math.max(0, submission.endTime - new Date());

    res.json({
      exam: {
        id: exam._id,
        title: exam.title,
        module: exam.module,
        instructions: exam.instructions
      },
      questions,
      submission: {
        id: submission._id,
        startTime: submission.startTime,
        endTime: submission.endTime,
        remainingTime: Math.floor(remainingTime / 1000), // in seconds
        answers: submission.answers
      }
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Exam not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/exams/:id/submit
// @desc    Submit exam answers
// @access  Private
router.post('/:id/submit', [
  auth,
  [
    body('answers', 'Answers are required').isObject()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { answers } = req.body;

    const submission = await Submission.findOne({
      userId: req.user.id,
      examId: req.params.id,
      status: 'in_progress'
    });

    if (!submission) {
      return res.status(400).json({ message: 'No active exam session found' });
    }

    // Check if exam time has expired
    if (new Date() > submission.endTime) {
      submission.status = 'completed';
      await submission.save();
      return res.status(400).json({ message: 'Exam time has expired' });
    }

    // Update submission with answers
    submission.answers = answers;
    submission.submittedAt = new Date();
    submission.status = 'completed';

    // Calculate scores (this would be more complex in a real implementation)
    const exam = await Exam.findById(req.params.id);
    const questions = await Question.find({
      _id: { $in: exam.questions }
    });

    let totalScore = 0;
    let correctAnswers = 0;

    questions.forEach(question => {
      const userAnswer = answers[question._id.toString()];
      if (userAnswer && userAnswer === question.correctAnswer) {
        correctAnswers++;
      }
    });

    // Calculate overall score (simplified)
    totalScore = (correctAnswers / questions.length) * 9; // IELTS band score

    submission.overallScore = totalScore;
    submission.scores = {
      listening: exam.module === 'listening' ? totalScore : 0,
      reading: exam.module === 'reading' ? totalScore : 0,
      writing: exam.module === 'writing' ? 0 : 0, // Manual grading required
      speaking: exam.module === 'speaking' ? 0 : 0  // Manual grading required
    };

    await submission.save();

    res.json({
      message: 'Exam submitted successfully',
      submission: {
        id: submission._id,
        overallScore: submission.overallScore,
        submittedAt: submission.submittedAt
      }
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Exam not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/exams/:id/result
// @desc    Get exam result
// @access  Private
router.get('/:id/result', auth, async (req, res) => {
  try {
    const submission = await Submission.findOne({
      userId: req.user.id,
      examId: req.params.id,
      status: 'completed'
    }).populate('examId', 'title module instructions');

    if (!submission) {
      return res.status(404).json({ message: 'Exam result not found' });
    }

    // Get questions with correct answers for review
    const questions = await Question.find({
      _id: { $in: submission.examId.questions }
    });

    res.json({
      submission,
      questions,
      review: questions.map(q => ({
        id: q._id,
        question: q.question,
        userAnswer: submission.answers[q._id.toString()],
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        isCorrect: submission.answers[q._id.toString()] === q.correctAnswer
      }))
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Exam not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/exams/modules/:module
// @desc    Get exams by module
// @access  Public
router.get('/modules/:module', async (req, res) => {
  try {
    const { difficulty, page = 1, limit = 10 } = req.query;

    const query = { 
      module: req.params.module,
      isActive: true 
    };
    if (difficulty) query.difficulty = difficulty;

    const exams = await Exam.find(query)
      .select('title description difficulty duration price isFree')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Exam.countDocuments(query);

    res.json({
      exams,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/exams/featured
// @desc    Get featured exams
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const featuredExams = await Exam.find({ 
      isActive: true,
      isFeatured: true 
    })
      .select('title description module difficulty duration price isFree')
      .sort({ createdAt: -1 })
      .limit(6);

    res.json(featuredExams);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/exams/popular
// @desc    Get popular exams based on attempts
// @access  Public
router.get('/popular', async (req, res) => {
  try {
    const popularExams = await Submission.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: '$examId',
          attempts: { $sum: 1 },
          averageScore: { $avg: '$overallScore' }
        }
      },
      { $sort: { attempts: -1 } },
      { $limit: 6 },
      {
        $lookup: {
          from: 'exams',
          localField: '_id',
          foreignField: '_id',
          as: 'exam'
        }
      },
      { $unwind: '$exam' },
      {
        $match: { 'exam.isActive': true }
      },
      {
        $project: {
          _id: '$exam._id',
          title: '$exam.title',
          description: '$exam.description',
          module: '$exam.module',
          difficulty: '$exam.difficulty',
          duration: '$exam.duration',
          price: '$exam.price',
          isFree: '$exam.isFree',
          attempts: 1,
          averageScore: 1
        }
      }
    ]);

    res.json(popularExams);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Admin routes for exam management
// @route   POST /api/exams
// @desc    Create a new exam (Admin only)
// @access  Private/Admin
router.post('/', [
  auth,
  admin,
  [
    body('title', 'Title is required').not().isEmpty(),
    body('description', 'Description is required').not().isEmpty(),
    body('examType', 'Exam type is required').isIn(['academic', 'general']),
    body('difficulty', 'Difficulty is required').isIn(['easy', 'medium', 'hard']),
    body('targetBandLevel', 'Target band level is required').isInt({ min: 1, max: 9 }),
    body('pricing.price', 'Price is required').isFloat({ min: 0 }),
    body('modules', 'Modules configuration is required').isObject()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const {
      title,
      description,
      examType,
      difficulty,
      targetBandLevel,
      modules,
      breaks,
      instructions,
      guidelines,
      pricing,
      availability,
      tags,
      categories,
      skills
    } = req.body;

    // Validate modules structure
    const validModules = ['listening', 'reading', 'writing', 'speaking'];
    for (const moduleName of validModules) {
      if (modules[moduleName] && modules[moduleName].enabled) {
        if (!modules[moduleName].duration || modules[moduleName].duration < 1) {
          return res.status(400).json({ 
            message: `${moduleName} module duration must be at least 1 minute` 
          });
        }
      }
    }

    // Validate breaks if provided
    if (breaks && Array.isArray(breaks)) {
      for (const breakItem of breaks) {
        if (!breakItem.name || !breakItem.duration || breakItem.duration < 1) {
          return res.status(400).json({ 
            message: 'Each break must have a name and duration of at least 1 minute' 
          });
        }
      }
    }

    const exam = new Exam({
      title,
      description,
      examType,
      difficulty,
      targetBandLevel,
      modules: modules || {
        listening: { enabled: true, duration: 30 },
        reading: { enabled: true, duration: 60 },
        writing: { enabled: true, duration: 60 },
        speaking: { enabled: true, duration: 15 }
      },
      breaks: breaks || [],
      instructions: instructions || {
        general: [],
        listening: [],
        reading: [],
        writing: [],
        speaking: []
      },
      guidelines: guidelines || {
        allowedMaterials: [],
        prohibitedItems: [],
        technicalRequirements: [],
        submissionGuidelines: []
      },
      pricing: pricing || {
        price: 0,
        currency: 'USD'
      },
      availability: availability || {
        maxAttempts: 1,
        timeWindow: {
          startTime: '00:00',
          endTime: '23:59',
          timezone: 'UTC'
        }
      },
      tags: tags || [],
      categories: categories || [],
      skills: skills || [],
      createdBy: req.user.id
    });

    await exam.save();

    res.status(201).json({
      message: 'Exam created successfully',
      exam: {
        id: exam._id,
        title: exam.title,
        examType: exam.examType,
        difficulty: exam.difficulty,
        targetBandLevel: exam.targetBandLevel,
        modules: exam.modules,
        breaks: exam.breaks,
        totalDuration: exam.totalDuration,
        pricing: exam.pricing,
        status: exam.status
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/exams/:id
// @desc    Update exam (Admin only)
// @access  Private/Admin
router.put('/:id', [
  auth,
  admin,
  [
    body('title', 'Title is required').not().isEmpty(),
    body('description', 'Description is required').not().isEmpty(),
    body('examType', 'Exam type is required').isIn(['academic', 'general']),
    body('difficulty', 'Difficulty is required').isIn(['easy', 'medium', 'hard']),
    body('targetBandLevel', 'Target band level is required').isInt({ min: 1, max: 9 })
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    const {
      title,
      description,
      examType,
      difficulty,
      targetBandLevel,
      modules,
      breaks,
      instructions,
      guidelines,
      pricing,
      availability,
      tags,
      categories,
      skills,
      status,
      isActive,
      isPublic
    } = req.body;

    // Validate modules structure if provided
    if (modules) {
      const validModules = ['listening', 'reading', 'writing', 'speaking'];
      for (const moduleName of validModules) {
        if (modules[moduleName] && modules[moduleName].enabled) {
          if (!modules[moduleName].duration || modules[moduleName].duration < 1) {
            return res.status(400).json({ 
              message: `${moduleName} module duration must be at least 1 minute` 
            });
          }
        }
      }
    }

    // Validate breaks if provided
    if (breaks && Array.isArray(breaks)) {
      for (const breakItem of breaks) {
        if (!breakItem.name || !breakItem.duration || breakItem.duration < 1) {
          return res.status(400).json({ 
            message: 'Each break must have a name and duration of at least 1 minute' 
          });
        }
      }
    }

    // Update exam fields
    exam.title = title;
    exam.description = description;
    exam.examType = examType;
    exam.difficulty = difficulty;
    exam.targetBandLevel = targetBandLevel;
    
    if (modules) exam.modules = modules;
    if (breaks) exam.breaks = breaks;
    if (instructions) exam.instructions = instructions;
    if (guidelines) exam.guidelines = guidelines;
    if (pricing) exam.pricing = pricing;
    if (availability) exam.availability = availability;
    if (tags) exam.tags = tags;
    if (categories) exam.categories = categories;
    if (skills) exam.skills = skills;
    if (status) exam.status = status;
    if (typeof isActive === 'boolean') exam.isActive = isActive;
    if (typeof isPublic === 'boolean') exam.isPublic = isPublic;
    
    exam.updatedBy = req.user.id;
    exam.updatedAt = Date.now();

    await exam.save();

    res.json({
      message: 'Exam updated successfully',
      exam: {
        id: exam._id,
        title: exam.title,
        examType: exam.examType,
        difficulty: exam.difficulty,
        targetBandLevel: exam.targetBandLevel,
        modules: exam.modules,
        breaks: exam.breaks,
        totalDuration: exam.totalDuration,
        pricing: exam.pricing,
        status: exam.status,
        isActive: exam.isActive,
        updatedAt: exam.updatedAt
      }
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Exam not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/exams/admin/all
// @desc    Get all exams (Admin only)
// @access  Private/Admin
router.get('/admin/all', [auth, admin], async (req, res) => {
  try {
    const { status, examType, difficulty, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (examType) query.examType = examType;
    if (difficulty) query.difficulty = difficulty;

    const exams = await Exam.find(query)
      .select('title description examType difficulty targetBandLevel modules breaks totalDuration pricing status isActive isPublic statistics createdAt')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Exam.countDocuments(query);

    res.json({
      exams,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/exams/admin/:id
// @desc    Get exam details (Admin only)
// @access  Private/Admin
router.get('/admin/:id', [auth, admin], async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email')
      .populate('reviewedBy', 'firstName lastName email');

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    res.json(exam);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Exam not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/exams/admin/:id/publish
// @desc    Publish exam (Admin only)
// @access  Private/Admin
router.post('/admin/:id/publish', [auth, admin], async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Validate exam before publishing
    if (!exam.modules.listening.enabled && !exam.modules.reading.enabled && 
        !exam.modules.writing.enabled && !exam.modules.speaking.enabled) {
      return res.status(400).json({ 
        message: 'At least one module must be enabled to publish the exam' 
      });
    }

    exam.status = 'published';
    exam.reviewedBy = req.user.id;
    exam.reviewDate = new Date();
    await exam.save();

    res.json({
      message: 'Exam published successfully',
      exam: {
        id: exam._id,
        title: exam.title,
        status: exam.status,
        publishedAt: exam.reviewDate
      }
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Exam not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/exams/admin/:id/archive
// @desc    Archive exam (Admin only)
// @access  Private/Admin
router.post('/admin/:id/archive', [auth, admin], async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    exam.status = 'archived';
    exam.isActive = false;
    await exam.save();

    res.json({
      message: 'Exam archived successfully',
      exam: {
        id: exam._id,
        title: exam.title,
        status: exam.status
      }
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Exam not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/exams/:id
// @desc    Delete exam (Admin only)
// @access  Private/Admin
router.delete('/:id', [auth, admin], async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Check if there are any submissions for this exam
    const submissionsCount = await Submission.countDocuments({ examId: req.params.id });
    if (submissionsCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete exam with existing submissions',
        submissionsCount 
      });
    }

    await exam.remove();
    res.json({ message: 'Exam deleted successfully' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Exam not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/exams/admin/statistics
// @desc    Get exam statistics (Admin only)
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

    const stats = await Exam.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          averagePrice: { $avg: '$pricing.price' }
        }
      }
    ]);

    const moduleStats = await Exam.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$examType',
          totalExams: { $sum: 1 },
          avgListeningDuration: { $avg: '$modules.listening.duration' },
          avgReadingDuration: { $avg: '$modules.reading.duration' },
          avgWritingDuration: { $avg: '$modules.writing.duration' },
          avgSpeakingDuration: { $avg: '$modules.speaking.duration' }
        }
      }
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

module.exports = router; 