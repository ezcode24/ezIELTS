import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'react-query';
import { examAPI, submissionAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { 
  FiClock, FiChevronLeft, FiChevronRight, FiFlag, FiCheck,
  FiPause, FiPlay, FiVolume2, FiVolumeX, FiEdit3, FiSave
} from 'react-icons/fi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import QuestionRenderer from '../../components/exam/QuestionRenderer';
import Timer from '../../components/exam/Timer';
import NotesPanel from '../../components/exam/NotesPanel';

const ExamInterface = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showError, showSuccess } = useToast();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set());
  const [notes, setNotes] = useState({});
  const [isPaused, setIsPaused] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [examStarted, setExamStarted] = useState(false);
  
  const audioRef = useRef(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  // Fetch exam data
  const { data: exam, isLoading: examLoading, error: examError } = useQuery(
    ['exam', examId],
    () => examAPI.getExam(examId),
    { 
      staleTime: 0,
      onSuccess: (data) => {
        setTimeRemaining(data.duration * 60); // Convert to seconds
      }
    }
  );

  // Fetch questions
  const { data: questions, isLoading: questionsLoading } = useQuery(
    ['exam-questions', examId],
    () => examAPI.getExamQuestions(examId),
    { staleTime: 0 }
  );

  // Submit exam mutation
  const submitMutation = useMutation(
    (submissionData) => submissionAPI.submitExam(submissionData),
    {
      onSuccess: (data) => {
        showSuccess('Exam submitted successfully!');
        navigate(`/dashboard/exam-results/${data._id}`);
      },
      onError: (error) => {
        showError('Failed to submit exam. Please try again.');
      }
    }
  );

  // Timer effect
  useEffect(() => {
    if (!examStarted || !timeRemaining || isPaused) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [examStarted, timeRemaining, isPaused]);

  // Save progress periodically
  useEffect(() => {
    if (!examStarted) return;

    const saveInterval = setInterval(() => {
      saveProgress();
    }, 30000); // Save every 30 seconds

    return () => clearInterval(saveInterval);
  }, [examStarted, answers, notes]);

  // Handle auto-submit when time runs out
  const handleAutoSubmit = () => {
    showError('Time is up! Your exam will be submitted automatically.');
    submitExam();
  };

  // Save progress
  const saveProgress = () => {
    // Save to localStorage as backup
    localStorage.setItem(`exam-progress-${examId}`, JSON.stringify({
      answers,
      notes,
      flaggedQuestions: Array.from(flaggedQuestions),
      currentQuestionIndex,
      timeRemaining
    }));
  };

  // Load progress from localStorage
  const loadProgress = () => {
    const saved = localStorage.getItem(`exam-progress-${examId}`);
    if (saved) {
      const progress = JSON.parse(saved);
      setAnswers(progress.answers || {});
      setNotes(progress.notes || {});
      setFlaggedQuestions(new Set(progress.flaggedQuestions || []));
      setCurrentQuestionIndex(progress.currentQuestionIndex || 0);
      setTimeRemaining(progress.timeRemaining || exam?.duration * 60);
    }
  };

  // Start exam
  const startExam = () => {
    setExamStarted(true);
    loadProgress();
  };

  // Submit exam
  const submitExam = () => {
    const submissionData = {
      examId,
      answers,
      notes,
      timeSpent: (exam?.duration * 60) - timeRemaining,
      completedAt: new Date().toISOString()
    };

    submitMutation.mutate(submissionData);
  };

  // Handle answer change
  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  // Handle note change
  const handleNoteChange = (questionId, note) => {
    setNotes(prev => ({
      ...prev,
      [questionId]: note
    }));
  };

  // Toggle flagged question
  const toggleFlagged = (questionIndex) => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionIndex)) {
        newSet.delete(questionIndex);
      } else {
        newSet.add(questionIndex);
      }
      return newSet;
    });
  };

  // Navigate to question
  const goToQuestion = (index) => {
    if (index >= 0 && index < questions?.length) {
      setCurrentQuestionIndex(index);
    }
  };

  // Handle audio controls
  const toggleAudio = () => {
    if (audioRef.current) {
      if (isAudioPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsAudioPlaying(!isAudioPlaying);
    }
  };

  if (examLoading || questionsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (examError) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load exam. Please try again.</p>
      </div>
    );
  }

  if (!examStarted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-2xl mx-auto p-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {exam.title}
              </h1>
              <p className="text-gray-600 mb-8">{exam.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Exam Details</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>Duration: {exam.duration} minutes</li>
                    <li>Questions: {questions?.length || 0}</li>
                    <li>Module: {exam.module}</li>
                    <li>Difficulty: {exam.difficulty}</li>
                  </ul>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Instructions</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Read each question carefully</li>
                    <li>• You can flag questions for review</li>
                    <li>• Use the timer to manage your time</li>
                    <li>• You can take notes during the exam</li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={startExam}
                  className="btn-primary flex-1"
                >
                  Start Exam
                </button>
                <button
                  onClick={() => navigate('/exams')}
                  className="btn-secondary flex-1"
                >
                  Back to Exams
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions?.[currentQuestionIndex];
  const totalQuestions = questions?.length || 0;
  const answeredCount = Object.keys(answers).length;
  const flaggedCount = flaggedQuestions.size;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/exams')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <FiChevronLeft className="w-5 h-5" />
                <span>Back to Exams</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{exam.title}</h1>
                <p className="text-sm text-gray-500">
                  Question {currentQuestionIndex + 1} of {totalQuestions}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Audio Controls (for Listening module) */}
              {exam.module === 'listening' && currentQuestion?.audioUrl && (
                <button
                  onClick={toggleAudio}
                  className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                >
                  {isAudioPlaying ? (
                    <FiVolumeX className="w-5 h-5" />
                  ) : (
                    <FiVolume2 className="w-5 h-5" />
                  )}
                </button>
              )}

              {/* Timer */}
              <div className="flex items-center space-x-2 bg-red-50 px-3 py-2 rounded-lg">
                <FiClock className="w-5 h-5 text-red-600" />
                <Timer 
                  timeRemaining={timeRemaining}
                  isPaused={isPaused}
                  onPause={() => setIsPaused(!isPaused)}
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={submitExam}
                disabled={submitMutation.isLoading}
                className="btn-primary"
              >
                {submitMutation.isLoading ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : (
                  <FiCheck className="w-4 h-4 mr-2" />
                )}
                Submit Exam
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Question Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-gray-500">
                      Question {currentQuestionIndex + 1}
                    </span>
                    {flaggedQuestions.has(currentQuestionIndex) && (
                      <span className="text-yellow-600">
                        <FiFlag className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleFlagged(currentQuestionIndex)}
                      className={`p-2 rounded-md transition-colors duration-200 ${
                        flaggedQuestions.has(currentQuestionIndex)
                          ? 'text-yellow-600 bg-yellow-50'
                          : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50'
                      }`}
                    >
                      <FiFlag className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowNotes(!showNotes)}
                      className={`p-2 rounded-md transition-colors duration-200 ${
                        showNotes
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                      }`}
                    >
                      <FiEdit3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Audio Player */}
                {exam.module === 'listening' && currentQuestion?.audioUrl && (
                  <div className="mb-4">
                    <audio
                      ref={audioRef}
                      src={currentQuestion.audioUrl}
                      onPlay={() => setIsAudioPlaying(true)}
                      onPause={() => setIsAudioPlaying(false)}
                      onEnded={() => setIsAudioPlaying(false)}
                      controls
                      className="w-full"
                    />
                  </div>
                )}

                {/* Question Content */}
                <QuestionRenderer
                  question={currentQuestion}
                  answer={answers[currentQuestion?._id]}
                  onAnswerChange={(answer) => handleAnswerChange(currentQuestion._id, answer)}
                />
              </div>

              {/* Notes Panel */}
              {showNotes && (
                <NotesPanel
                  note={notes[currentQuestion?._id] || ''}
                  onNoteChange={(note) => handleNoteChange(currentQuestion._id, note)}
                />
              )}

              {/* Navigation */}
              <div className="p-6 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => goToQuestion(currentQuestionIndex - 1)}
                    disabled={currentQuestionIndex === 0}
                    className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiChevronLeft className="w-4 h-4 mr-2" />
                    Previous
                  </button>

                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      {answeredCount} of {totalQuestions} answered
                    </span>
                    {flaggedCount > 0 && (
                      <span className="text-sm text-yellow-600">
                        • {flaggedCount} flagged
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => goToQuestion(currentQuestionIndex + 1)}
                    disabled={currentQuestionIndex === totalQuestions - 1}
                    className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <FiChevronRight className="w-4 h-4 ml-2" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Question Navigator
              </h3>
              
              <div className="grid grid-cols-5 gap-2 mb-4">
                {questions?.map((question, index) => {
                  const isAnswered = answers[question._id];
                  const isFlagged = flaggedQuestions.has(index);
                  const isCurrent = index === currentQuestionIndex;

                  return (
                    <button
                      key={index}
                      onClick={() => goToQuestion(index)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors duration-200 ${
                        isCurrent
                          ? 'bg-blue-600 text-white'
                          : isAnswered
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      } relative`}
                    >
                      {index + 1}
                      {isFlagged && (
                        <FiFlag className="w-3 h-3 absolute -top-1 -right-1 text-yellow-600" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-100 rounded"></div>
                  <span className="text-gray-600">Answered</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gray-100 rounded"></div>
                  <span className="text-gray-600">Unanswered</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-blue-600 rounded"></div>
                  <span className="text-gray-600">Current</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamInterface; 