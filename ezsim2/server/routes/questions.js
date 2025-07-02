const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const Question = require('../models/Question');

// @route   GET /api/questions
// @desc    Get all questions (Admin only)
// @access  Private/Admin
router.get('/', [auth, admin], async (req, res) => {
  try {
    const { module, type, difficulty, page = 1, limit = 20 } = req.query;

    const query = {};
    if (module) query.module = module;
    if (type) query.type = type;
    if (difficulty) query.difficulty = difficulty;

    const questions = await Question.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Question.countDocuments(query);

    res.json({
      questions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/questions/:id
// @desc    Get question by ID (Admin only)
// @access  Private/Admin
router.get('/:id', [auth, admin], async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    res.json(question);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Question not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/questions
// @desc    Create a new question (Admin only)
// @access  Private/Admin
router.post('/', [
  auth,
  admin,
  [
    body('question', 'Question text is required').not().isEmpty(),
    body('type', 'Question type is required').isIn([
      'multiple_choice',
      'true_false',
      'fill_blank',
      'matching',
      'short_answer',
      'essay',
      'audio_question',
      'image_question'
    ]),
    body('module', 'Module is required').isIn(['listening', 'reading', 'writing', 'speaking']),
    body('difficulty', 'Difficulty is required').isIn(['beginner', 'intermediate', 'advanced']),
    body('correctAnswer', 'Correct answer is required').not().isEmpty()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const {
      question,
      type,
      module,
      difficulty,
      options,
      correctAnswer,
      explanation,
      audioFile,
      imageFile,
      passage,
      wordLimit,
      points,
      tags
    } = req.body;

    const newQuestion = new Question({
      question,
      type,
      module,
      difficulty,
      options,
      correctAnswer,
      explanation,
      audioFile,
      imageFile,
      passage,
      wordLimit,
      points: points || 1,
      tags: tags || [],
      createdBy: req.user.id
    });

    const savedQuestion = await newQuestion.save();
    res.json(savedQuestion);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/questions/:id
// @desc    Update question (Admin only)
// @access  Private/Admin
router.put('/:id', [
  auth,
  admin,
  [
    body('question', 'Question text is required').not().isEmpty(),
    body('type', 'Question type is required').isIn([
      'multiple_choice',
      'true_false',
      'fill_blank',
      'matching',
      'short_answer',
      'essay',
      'audio_question',
      'image_question'
    ]),
    body('module', 'Module is required').isIn(['listening', 'reading', 'writing', 'speaking']),
    body('difficulty', 'Difficulty is required').isIn(['beginner', 'intermediate', 'advanced']),
    body('correctAnswer', 'Correct answer is required').not().isEmpty()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const {
      question: questionText,
      type,
      module,
      difficulty,
      options,
      correctAnswer,
      explanation,
      audioFile,
      imageFile,
      passage,
      wordLimit,
      points,
      tags,
      isActive
    } = req.body;

    question.question = questionText;
    question.type = type;
    question.module = module;
    question.difficulty = difficulty;
    question.options = options;
    question.correctAnswer = correctAnswer;
    question.explanation = explanation;
    question.audioFile = audioFile;
    question.imageFile = imageFile;
    question.passage = passage;
    question.wordLimit = wordLimit;
    question.points = points || question.points;
    question.tags = tags || question.tags;
    question.isActive = isActive !== undefined ? isActive : question.isActive;
    question.updatedAt = Date.now();

    await question.save();
    res.json(question);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Question not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/questions/:id
// @desc    Delete question (Admin only)
// @access  Private/Admin
router.delete('/:id', [auth, admin], async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Check if question is used in any exams
    const Exam = require('../models/Exam');
    const examsUsingQuestion = await Exam.find({
      questions: req.params.id
    });

    if (examsUsingQuestion.length > 0) {
      return res.status(400).json({
        message: 'Cannot delete question that is used in exams',
        examsCount: examsUsingQuestion.length
      });
    }

    await question.remove();
    res.json({ message: 'Question deleted successfully' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Question not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/questions/types
// @desc    Get question types
// @access  Public
router.get('/types', async (req, res) => {
  try {
    const types = [
      {
        value: 'multiple_choice',
        label: 'Multiple Choice',
        description: 'Choose the correct answer from multiple options'
      },
      {
        value: 'true_false',
        label: 'True/False',
        description: 'Determine if a statement is true or false'
      },
      {
        value: 'fill_blank',
        label: 'Fill in the Blank',
        description: 'Complete the sentence with the correct word or phrase'
      },
      {
        value: 'matching',
        label: 'Matching',
        description: 'Match items from two columns'
      },
      {
        value: 'short_answer',
        label: 'Short Answer',
        description: 'Provide a brief answer to the question'
      },
      {
        value: 'essay',
        label: 'Essay',
        description: 'Write a detailed response to the question'
      },
      {
        value: 'audio_question',
        label: 'Audio Question',
        description: 'Question based on audio content'
      },
      {
        value: 'image_question',
        label: 'Image Question',
        description: 'Question based on image content'
      }
    ];

    res.json(types);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/questions/modules/:module
// @desc    Get questions by module (Admin only)
// @access  Private/Admin
router.get('/modules/:module', [auth, admin], async (req, res) => {
  try {
    const { type, difficulty, page = 1, limit = 20 } = req.query;

    const query = { module: req.params.module };
    if (type) query.type = type;
    if (difficulty) query.difficulty = difficulty;

    const questions = await Question.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Question.countDocuments(query);

    res.json({
      questions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/questions/bulk
// @desc    Create multiple questions (Admin only)
// @access  Private/Admin
router.post('/bulk', [
  auth,
  admin,
  [
    body('questions', 'Questions array is required').isArray({ min: 1 })
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { questions } = req.body;
    const createdQuestions = [];
    const errors = [];

    for (let i = 0; i < questions.length; i++) {
      try {
        const questionData = questions[i];
        
        // Validate required fields
        if (!questionData.question || !questionData.type || !questionData.module || 
            !questionData.difficulty || !questionData.correctAnswer) {
          errors.push({
            index: i,
            error: 'Missing required fields'
          });
          continue;
        }

        const newQuestion = new Question({
          ...questionData,
          createdBy: req.user.id
        });

        const savedQuestion = await newQuestion.save();
        createdQuestions.push(savedQuestion);
      } catch (err) {
        errors.push({
          index: i,
          error: err.message
        });
      }
    }

    res.json({
      created: createdQuestions.length,
      errors: errors.length,
      createdQuestions,
      errors
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/questions/statistics
// @desc    Get question statistics (Admin only)
// @access  Private/Admin
router.get('/statistics', [auth, admin], async (req, res) => {
  try {
    const stats = await Question.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          byModule: {
            $push: {
              module: '$module',
              type: '$type',
              difficulty: '$difficulty'
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          total: 1,
          byModule: 1
        }
      }
    ]);

    // Process statistics
    const moduleStats = {};
    const typeStats = {};
    const difficultyStats = {};

    if (stats.length > 0) {
      stats[0].byModule.forEach(item => {
        // Module statistics
        moduleStats[item.module] = (moduleStats[item.module] || 0) + 1;
        
        // Type statistics
        typeStats[item.type] = (typeStats[item.type] || 0) + 1;
        
        // Difficulty statistics
        difficultyStats[item.difficulty] = (difficultyStats[item.difficulty] || 0) + 1;
      });
    }

    res.json({
      total: stats.length > 0 ? stats[0].total : 0,
      byModule: moduleStats,
      byType: typeStats,
      byDifficulty: difficultyStats
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/questions/:id/duplicate
// @desc    Duplicate a question (Admin only)
// @access  Private/Admin
router.post('/:id/duplicate', [auth, admin], async (req, res) => {
  try {
    const originalQuestion = await Question.findById(req.params.id);
    if (!originalQuestion) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const duplicatedQuestion = new Question({
      ...originalQuestion.toObject(),
      _id: undefined,
      question: `${originalQuestion.question} (Copy)`,
      createdBy: req.user.id,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    const savedQuestion = await duplicatedQuestion.save();
    res.json(savedQuestion);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Question not found' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router; 