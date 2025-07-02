import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { submissionAPI } from '../../services/api';
import { 
  FiCheck, FiX, FiClock, FiTrendingUp, FiDownload, FiShare,
  FiHeadphones, FiEye, FiEdit, FiMic, FiAward, FiBarChart3
} from 'react-icons/fi';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const ExamResults = () => {
  const { submissionId } = useParams();

  const { data: submission, isLoading, error } = useQuery(
    ['exam-results', submissionId],
    () => submissionAPI.getSubmission(submissionId),
    { staleTime: 0 }
  );

  const getModuleIcon = (module) => {
    const icons = {
      listening: FiHeadphones,
      reading: FiEye,
      writing: FiEdit,
      speaking: FiMic
    };
    return icons[module] || FiBarChart3;
  };

  const getModuleColor = (module) => {
    const colors = {
      listening: 'blue',
      reading: 'green',
      writing: 'yellow',
      speaking: 'purple'
    };
    return colors[module] || 'gray';
  };

  const getScoreColor = (score) => {
    if (score >= 8.0) return 'text-green-600';
    if (score >= 7.0) return 'text-blue-600';
    if (score >= 6.0) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLevel = (score) => {
    if (score >= 8.0) return 'Excellent';
    if (score >= 7.0) return 'Good';
    if (score >= 6.0) return 'Satisfactory';
    return 'Needs Improvement';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load exam results. Please try again.</p>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Exam results not found.</p>
      </div>
    );
  }

  const overallScore = submission.overallScore || 7.5;
  const timeSpent = submission.timeSpent || 0;
  const totalQuestions = submission.totalQuestions || 0;
  const correctAnswers = submission.correctAnswers || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Exam Results</h1>
          <p className="mt-2 text-gray-600">
            {submission.examTitle || 'IELTS Practice Test'}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button className="btn-secondary flex items-center space-x-2">
            <FiDownload className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
          <button className="btn-secondary flex items-center space-x-2">
            <FiShare className="w-4 h-4" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Overall Score Card */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <FiAward className="w-12 h-12 text-yellow-300" />
          </div>
          <h2 className="text-4xl font-bold mb-2">{overallScore}</h2>
          <p className="text-xl text-blue-100 mb-4">{getScoreLevel(overallScore)}</p>
          <div className="flex justify-center space-x-8 text-blue-100">
            <div className="text-center">
              <p className="text-sm">Time Spent</p>
              <p className="font-semibold">{Math.floor(timeSpent / 60)}m {timeSpent % 60}s</p>
            </div>
            <div className="text-center">
              <p className="text-sm">Accuracy</p>
              <p className="font-semibold">{Math.round((correctAnswers / totalQuestions) * 100)}%</p>
            </div>
            <div className="text-center">
              <p className="text-sm">Questions</p>
              <p className="font-semibold">{totalQuestions}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Module Scores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {submission.moduleScores?.map((moduleScore, index) => {
          const ModuleIcon = getModuleIcon(moduleScore.module);
          const moduleColor = getModuleColor(moduleScore.module);
          
          return (
            <div key={index} className="dashboard-card">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-${moduleColor}-100 rounded-lg flex items-center justify-center`}>
                  <ModuleIcon className={`w-6 h-6 text-${moduleColor}-600`} />
                </div>
                <span className={`text-sm font-medium text-${moduleColor}-600`}>
                  {moduleScore.module.charAt(0).toUpperCase() + moduleScore.module.slice(1)}
                </span>
              </div>
              <div className="text-center">
                <p className={`text-3xl font-bold ${getScoreColor(moduleScore.score)}`}>
                  {moduleScore.score}
                </p>
                <p className="text-sm text-gray-500 mt-1">{getScoreLevel(moduleScore.score)}</p>
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`bg-${moduleColor}-600 h-2 rounded-full transition-all duration-300`}
                      style={{ width: `${(moduleScore.score / 9) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Question Analysis */}
        <div className="dashboard-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Question Analysis</h3>
          <div className="space-y-4">
            {submission.questionAnalysis?.map((question, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-900">Q{index + 1}</span>
                  <div className="flex items-center space-x-1">
                    {question.correct ? (
                      <FiCheck className="w-4 h-4 text-green-600" />
                    ) : (
                      <FiX className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-900">{question.points} pts</p>
                  <p className="text-xs text-gray-500">{question.timeSpent}s</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Insights */}
        <div className="dashboard-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Insights</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <FiTrendingUp className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-900">Strongest Area</span>
              </div>
              <span className="text-sm text-blue-600 font-medium">
                {submission.insights?.strongestArea || 'Reading'}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <FiTrendingUp className="w-5 h-5 text-yellow-600" />
                <span className="text-sm font-medium text-gray-900">Needs Improvement</span>
              </div>
              <span className="text-sm text-yellow-600 font-medium">
                {submission.insights?.weakestArea || 'Writing'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <FiClock className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-900">Time Management</span>
              </div>
              <span className="text-sm text-green-600 font-medium">
                {submission.insights?.timeManagement || 'Good'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback and Recommendations */}
      <div className="dashboard-card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Feedback & Recommendations</h3>
        <div className="space-y-4">
          {submission.feedback?.map((feedback, index) => (
            <div key={index} className="border-l-4 border-blue-200 pl-4">
              <h4 className="font-medium text-gray-900 mb-2">{feedback.module} Module</h4>
              <p className="text-gray-600 mb-2">{feedback.comment}</p>
              <div className="flex flex-wrap gap-2">
                {feedback.recommendations?.map((rec, recIndex) => (
                  <span key={recIndex} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                    {rec}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Link to="/exams" className="btn-primary flex-1 text-center">
          Take Another Test
        </Link>
        <Link to="/dashboard/exam-history" className="btn-secondary flex-1 text-center">
          View All Results
        </Link>
        <Link to="/dashboard" className="btn-secondary flex-1 text-center">
          Back to Dashboard
        </Link>
      </div>

      {/* Study Plan Suggestion */}
      {overallScore < 7.0 && (
        <div className="dashboard-card bg-yellow-50 border-yellow-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommended Study Plan</h3>
          <p className="text-gray-700 mb-4">
            Based on your performance, we recommend focusing on the following areas:
          </p>
          <div className="space-y-2">
            {submission.studyPlan?.map((plan, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-gray-700">{plan}</span>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Link to="/exams" className="btn-primary">
              Start Practice Tests
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamResults; 