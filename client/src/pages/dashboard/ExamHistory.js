import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { userAPI } from '../../services/api';
import { 
  FiSearch, FiFilter, FiCalendar, FiClock, FiTrendingUp, 
  FiEye, FiDownload, FiBarChart3, FiAward, FiHeadphones, 
  FiEye as FiEyeIcon, FiEdit, FiMic
} from 'react-icons/fi';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const ExamHistory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [dateRange, setDateRange] = useState('all');

  // Fetch exam history
  const { data: examHistory, isLoading } = useQuery(
    ['exam-history', searchTerm, selectedModule, selectedStatus, dateRange],
    () => userAPI.getExamHistory({
      search: searchTerm,
      module: selectedModule !== 'all' ? selectedModule : undefined,
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
      dateRange: dateRange !== 'all' ? dateRange : undefined,
    }),
    { staleTime: 5 * 60 * 1000 }
  );

  const getModuleIcon = (module) => {
    const icons = {
      listening: FiHeadphones,
      reading: FiEyeIcon,
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

  const getStatusColor = (status) => {
    const colors = {
      completed: 'bg-green-100 text-green-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      abandoned: 'bg-red-100 text-red-800',
      pending: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || colors.pending;
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Exam History</h1>
          <p className="mt-2 text-gray-600">
            View your past exam attempts and performance analytics
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button className="btn-secondary flex items-center space-x-2">
            <FiDownload className="w-4 h-4" />
            <span>Export</span>
          </button>
          <Link to="/exams" className="btn-primary">
            Take New Test
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="dashboard-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Exams</p>
              <p className="text-2xl font-bold text-gray-900">
                {examHistory?.stats?.totalExams || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiBarChart3 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Score</p>
              <p className="text-2xl font-bold text-gray-900">
                {examHistory?.stats?.averageScore || 'N/A'}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FiTrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Study Hours</p>
              <p className="text-2xl font-bold text-gray-900">
                {examHistory?.stats?.totalHours || 0}h
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FiClock className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Best Score</p>
              <p className="text-2xl font-bold text-gray-900">
                {examHistory?.stats?.bestScore || 'N/A'}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <FiAward className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="dashboard-card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search exams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>

          {/* Module Filter */}
          <div>
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="input-field"
            >
              <option value="all">All Modules</option>
              <option value="listening">Listening</option>
              <option value="reading">Reading</option>
              <option value="writing">Writing</option>
              <option value="speaking">Speaking</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input-field"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="in_progress">In Progress</option>
              <option value="abandoned">Abandoned</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-sm text-gray-500 flex items-center">
            <FiCalendar className="w-4 h-4 mr-1" />
            Date Range:
          </span>
          {[
            { value: 'all', label: 'All Time' },
            { value: '7d', label: 'Last 7 Days' },
            { value: '30d', label: 'Last 30 Days' },
            { value: '90d', label: 'Last 90 Days' },
            { value: '1y', label: 'Last Year' }
          ].map((range) => (
            <button
              key={range.value}
              onClick={() => setDateRange(range.value)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${
                dateRange === range.value
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          {examHistory?.exams?.length || 0} exam{examHistory?.exams?.length !== 1 ? 's' : ''} found
        </p>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Sort by:</span>
          <select className="text-sm border border-gray-300 rounded px-2 py-1">
            <option value="date">Date</option>
            <option value="score">Score</option>
            <option value="duration">Duration</option>
            <option value="module">Module</option>
          </select>
        </div>
      </div>

      {/* Exam History List */}
      <div className="space-y-4">
        {examHistory?.exams?.map((exam) => {
          const ModuleIcon = getModuleIcon(exam.module);
          const moduleColor = getModuleColor(exam.module);
          
          return (
            <div key={exam._id} className="dashboard-card hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 bg-${moduleColor}-100 rounded-lg flex items-center justify-center`}>
                    <ModuleIcon className={`w-6 h-6 text-${moduleColor}-600`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{exam.title}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                      <span className={`module-badge module-${exam.module}`}>
                        {exam.module.charAt(0).toUpperCase() + exam.module.slice(1)}
                      </span>
                      <span className="flex items-center">
                        <FiCalendar className="w-4 h-4 mr-1" />
                        {new Date(exam.completedAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center">
                        <FiClock className="w-4 h-4 mr-1" />
                        {formatDuration(exam.duration)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {/* Score */}
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${getScoreColor(exam.score)}`}>
                      {exam.score}
                    </p>
                    <p className="text-sm text-gray-500">{getScoreLevel(exam.score)}</p>
                  </div>

                  {/* Status */}
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(exam.status)}`}>
                      {exam.status.replace('_', ' ').charAt(0).toUpperCase() + exam.status.slice(1).replace('_', ' ')}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/dashboard/exam-results/${exam._id}`}
                      className="btn-primary text-sm px-3 py-1"
                    >
                      <FiEye className="w-4 h-4 mr-1" />
                      View Results
                    </Link>
                    <button className="btn-secondary text-sm px-3 py-1">
                      <FiDownload className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{Math.round((exam.correctAnswers / exam.totalQuestions) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(exam.correctAnswers / exam.totalQuestions) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{exam.correctAnswers} correct</span>
                  <span>{exam.totalQuestions} total</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {examHistory?.exams?.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiBarChart3 className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No exam history found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || selectedModule !== 'all' || selectedStatus !== 'all' || dateRange !== 'all'
              ? 'Try adjusting your search criteria or filters'
              : 'Start by taking your first practice test to see your history here'
            }
          </p>
          <Link to="/exams" className="btn-primary">
            Take Your First Test
          </Link>
        </div>
      )}

      {/* Load More */}
      {examHistory?.exams?.length > 0 && examHistory.exams.length >= 10 && (
        <div className="text-center">
          <button className="btn-secondary">
            Load More Results
          </button>
        </div>
      )}
    </div>
  );
};

export default ExamHistory; 