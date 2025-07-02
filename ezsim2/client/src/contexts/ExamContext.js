import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ExamContext = createContext();

const initialState = {
  currentExam: null,
  currentSubmission: null,
  questions: [],
  currentQuestionIndex: 0,
  answers: {},
  flaggedQuestions: new Set(),
  notes: {},
  timeRemaining: 0,
  examStatus: 'not_started', // not_started, in_progress, paused, completed
  currentModule: null,
  moduleProgress: {
    listening: 0,
    reading: 0,
    writing: 0,
    speaking: 0
  },
  breakTime: {
    isActive: false,
    remainingTime: 0,
    type: null
  },
  examSettings: {
    showTimer: true,
    showProgress: true,
    showNavigation: true,
    allowFlagging: true,
    allowNotes: true,
    autoSave: true
  }
};

const examReducer = (state, action) => {
  switch (action.type) {
    case 'START_EXAM':
      return {
        ...state,
        currentExam: action.payload.exam,
        currentSubmission: action.payload.submission,
        questions: action.payload.questions,
        timeRemaining: action.payload.duration * 60, // Convert to seconds
        examStatus: 'in_progress',
        currentModule: action.payload.exam.modules[0]?.name || null,
        answers: {},
        flaggedQuestions: new Set(),
        notes: {}
      };
    
    case 'SET_CURRENT_QUESTION':
      return {
        ...state,
        currentQuestionIndex: action.payload
      };
    
    case 'SAVE_ANSWER':
      return {
        ...state,
        answers: {
          ...state.answers,
          [action.payload.questionId]: action.payload.answer
        }
      };
    
    case 'TOGGLE_FLAG':
      const newFlaggedQuestions = new Set(state.flaggedQuestions);
      if (newFlaggedQuestions.has(action.payload)) {
        newFlaggedQuestions.delete(action.payload);
      } else {
        newFlaggedQuestions.add(action.payload);
      }
      return {
        ...state,
        flaggedQuestions: newFlaggedQuestions
      };
    
    case 'SAVE_NOTE':
      return {
        ...state,
        notes: {
          ...state.notes,
          [action.payload.questionId]: action.payload.note
        }
      };
    
    case 'UPDATE_TIME':
      return {
        ...state,
        timeRemaining: action.payload
      };
    
    case 'PAUSE_EXAM':
      return {
        ...state,
        examStatus: 'paused'
      };
    
    case 'RESUME_EXAM':
      return {
        ...state,
        examStatus: 'in_progress'
      };
    
    case 'COMPLETE_EXAM':
      return {
        ...state,
        examStatus: 'completed'
      };
    
    case 'SWITCH_MODULE':
      return {
        ...state,
        currentModule: action.payload,
        currentQuestionIndex: 0
      };
    
    case 'UPDATE_MODULE_PROGRESS':
      return {
        ...state,
        moduleProgress: {
          ...state.moduleProgress,
          [action.payload.module]: action.payload.progress
        }
      };
    
    case 'START_BREAK':
      return {
        ...state,
        breakTime: {
          isActive: true,
          remainingTime: action.payload.duration * 60,
          type: action.payload.type
        },
        examStatus: 'paused'
      };
    
    case 'UPDATE_BREAK_TIME':
      return {
        ...state,
        breakTime: {
          ...state.breakTime,
          remainingTime: action.payload
        }
      };
    
    case 'END_BREAK':
      return {
        ...state,
        breakTime: {
          isActive: false,
          remainingTime: 0,
          type: null
        },
        examStatus: 'in_progress'
      };
    
    case 'UPDATE_EXAM_SETTINGS':
      return {
        ...state,
        examSettings: {
          ...state.examSettings,
          ...action.payload
        }
      };
    
    case 'RESET_EXAM':
      return initialState;
    
    default:
      return state;
  }
};

export const ExamProvider = ({ children }) => {
  const [state, dispatch] = useReducer(examReducer, initialState);
  const navigate = useNavigate();

  // Auto-save answers
  useEffect(() => {
    if (state.examStatus === 'in_progress' && state.examSettings.autoSave) {
      const interval = setInterval(() => {
        // Auto-save logic would go here
        console.log('Auto-saving exam progress...');
      }, 30000); // Save every 30 seconds

      return () => clearInterval(interval);
    }
  }, [state.examStatus, state.examSettings.autoSave]);

  // Timer countdown
  useEffect(() => {
    if (state.examStatus === 'in_progress' && state.timeRemaining > 0) {
      const timer = setInterval(() => {
        dispatch({ type: 'UPDATE_TIME', payload: state.timeRemaining - 1 });
        
        if (state.timeRemaining <= 1) {
          // Time's up - auto-submit exam
          dispatch({ type: 'COMPLETE_EXAM' });
          navigate(`/exam/${state.currentExam?.id}/results`);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [state.examStatus, state.timeRemaining, state.currentExam, navigate]);

  // Break timer
  useEffect(() => {
    if (state.breakTime.isActive && state.breakTime.remainingTime > 0) {
      const timer = setInterval(() => {
        dispatch({ 
          type: 'UPDATE_BREAK_TIME', 
          payload: state.breakTime.remainingTime - 1 
        });
        
        if (state.breakTime.remainingTime <= 1) {
          dispatch({ type: 'END_BREAK' });
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [state.breakTime.isActive, state.breakTime.remainingTime]);

  const startExam = (exam, submission, questions) => {
    dispatch({
      type: 'START_EXAM',
      payload: { exam, submission, questions, duration: exam.duration }
    });
  };

  const setCurrentQuestion = (index) => {
    dispatch({ type: 'SET_CURRENT_QUESTION', payload: index });
  };

  const saveAnswer = (questionId, answer) => {
    dispatch({ type: 'SAVE_ANSWER', payload: { questionId, answer } });
  };

  const toggleFlag = (questionId) => {
    dispatch({ type: 'TOGGLE_FLAG', payload: questionId });
  };

  const saveNote = (questionId, note) => {
    dispatch({ type: 'SAVE_NOTE', payload: { questionId, note } });
  };

  const pauseExam = () => {
    dispatch({ type: 'PAUSE_EXAM' });
  };

  const resumeExam = () => {
    dispatch({ type: 'RESUME_EXAM' });
  };

  const completeExam = () => {
    dispatch({ type: 'COMPLETE_EXAM' });
  };

  const switchModule = (moduleName) => {
    dispatch({ type: 'SWITCH_MODULE', payload: moduleName });
  };

  const updateModuleProgress = (module, progress) => {
    dispatch({ type: 'UPDATE_MODULE_PROGRESS', payload: { module, progress } });
  };

  const startBreak = (duration, type) => {
    dispatch({ type: 'START_BREAK', payload: { duration, type } });
  };

  const endBreak = () => {
    dispatch({ type: 'END_BREAK' });
  };

  const updateExamSettings = (settings) => {
    dispatch({ type: 'UPDATE_EXAM_SETTINGS', payload: settings });
  };

  const resetExam = () => {
    dispatch({ type: 'RESET_EXAM' });
  };

  const getCurrentQuestion = () => {
    return state.questions[state.currentQuestionIndex] || null;
  };

  const getQuestionAnswer = (questionId) => {
    return state.answers[questionId] || null;
  };

  const isQuestionFlagged = (questionId) => {
    return state.flaggedQuestions.has(questionId);
  };

  const getQuestionNote = (questionId) => {
    return state.notes[questionId] || '';
  };

  const getProgressPercentage = () => {
    if (state.questions.length === 0) return 0;
    const answeredQuestions = Object.keys(state.answers).length;
    return Math.round((answeredQuestions / state.questions.length) * 100);
  };

  const getModuleProgress = (module) => {
    return state.moduleProgress[module] || 0;
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const value = {
    ...state,
    startExam,
    setCurrentQuestion,
    saveAnswer,
    toggleFlag,
    saveNote,
    pauseExam,
    resumeExam,
    completeExam,
    switchModule,
    updateModuleProgress,
    startBreak,
    endBreak,
    updateExamSettings,
    resetExam,
    getCurrentQuestion,
    getQuestionAnswer,
    isQuestionFlagged,
    getQuestionNote,
    getProgressPercentage,
    getModuleProgress,
    formatTime
  };

  return (
    <ExamContext.Provider value={value}>
      {children}
    </ExamContext.Provider>
  );
};

export const useExam = () => {
  const context = useContext(ExamContext);
  if (!context) {
    throw new Error('useExam must be used within an ExamProvider');
  }
  return context;
}; 