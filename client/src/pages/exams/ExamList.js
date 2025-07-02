import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { examAPI } from '../../services/api';
import { 
  FiSearch, FiFilter, FiBookOpen, FiClock, FiStar, 
  FiHeadphones, FiEye, FiEdit, FiMic, FiPlay
} from 'react-icons/fi';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const ExamList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedDuration, setSelectedDuration] = useState('all');

  // Fetch exams with filters
  const { data: exams, isLoading, error } = useQuery(
    ['exams', searchTerm, selectedModule, selectedDifficulty, selectedDuration],
    () => examAPI.getExams({
      search: searchTerm,
      module: selectedModule !== 'all' ? selectedModule : undefined,
      difficulty: selectedDifficulty !== 'all' ? selectedDifficulty : undefined,
      duration: selectedDuration !== 'all' ? selectedDuration : undefined,
    }),
    { staleTime: 5 * 60 * 1000 }
  );

  const modules = [
    { value: 'all', label: 'All Modules', icon: FiBookOpen },
    { value: 'listening', label: 'Listening', icon: FiHeadphones },
    { value: 'reading', label: 'Reading', icon: FiEye },
    { value: 'writing', label: 'Writing', icon: FiEdit },
    { value: 'speaking', label: 'Speaking', icon: FiMic },
  ];

  const difficulties = [
    { value: 'all', label: 'All Levels' },
    { value: 'easy', label: 'Easy (5.0-6.0)' },
    { value: 'medium', label: 'Medium (6.0-7.0)' },
    { value: 'hard', label: 'Hard (7.0-9.0)' },
  ];

  const durations = [
    { value: 'all', label: 'All Durations' },
    { value: '30', label: '30 minutes' },
    { value: '60', label: '1 hour' },
    { value: '120', label: '2 hours' },
    { value: '180', label: '3 hours' },
  ];

  const getModuleIcon = (moduleName) => {
    const module = modules.find(m => m.value === moduleName);
    return module?.icon || FiBookOpen;
  };

  const getModuleColor = (moduleName) => {
    const colors = {
      listening: 'blue',
      reading: 'green',
      writing: 'yellow',
      speaking: 'purple'
    };
    return colors[moduleName] || 'gray';
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      easy: 'green',
      medium: 'yellow',
      hard: 'red'
    };
    return colors[difficulty] || 'gray';
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
        <p className="text-gray-500">Failed to load exams. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Practice Tests</h1>
          <p className="mt-2 text-gray-600">
            Choose from our comprehensive collection of IELTS practice tests
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/dashboard"
            className="btn-primary"
          >
            View Dashboard
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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
              {modules.map((module) => (
                <option key={module.value} value={module.value}>
                  {module.label}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty Filter */}
          <div>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="input-field"
            >
              {difficulties.map((difficulty) => (
                <option key={difficulty.value} value={difficulty.value}>
                  {difficulty.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Additional Filters */}
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-sm text-gray-500 flex items-center">
            <FiFilter className="w-4 h-4 mr-1" />
            Duration:
          </span>
          {durations.map((duration) => (
            <button
              key={duration.value}
              onClick={() => setSelectedDuration(duration.value)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${
                selectedDuration === duration.value
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {duration.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          {exams?.length || 0} exam{exams?.length !== 1 ? 's' : ''} found
        </p>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Sort by:</span>
          <select className="text-sm border border-gray-300 rounded px-2 py-1">
            <option value="popular">Most Popular</option>
            <option value="recent">Recently Added</option>
            <option value="rating">Highest Rated</option>
            <option value="duration">Duration</option>
          </select>
        </div>
      </div>

      {/* Exam Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exams?.map((exam) => {
          const ModuleIcon = getModuleIcon(exam.module);
          const moduleColor = getModuleColor(exam.module);
          const difficultyColor = getDifficultyColor(exam.difficulty);

          return (
            <div key={exam._id} className="exam-card group">
              {/* Exam Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className={`w-10 h-10 bg-${moduleColor}-100 rounded-lg flex items-center justify-center`}>
                    <ModuleIcon className={`w-5 h-5 text-${moduleColor}-600`} />
                  </div>
                  <div>
                    <span className={`module-badge module-${exam.module}`}>
                      {exam.module.charAt(0).toUpperCase() + exam.module.slice(1)}
                    </span>
                    <span className={`ml-2 difficulty-${exam.difficulty}`}>
                      {exam.difficulty.charAt(0).toUpperCase() + exam.difficulty.slice(1)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <FiStar className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-sm font-medium text-gray-900">
                    {exam.rating || '4.8'}
                  </span>
                </div>
              </div>

              {/* Exam Content */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-200">
                  {exam.title}
                </h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {exam.description}
                </p>
                
                {/* Exam Stats */}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <FiClock className="w-4 h-4" />
                      <span>{exam.duration} min</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FiBookOpen className="w-4 h-4" />
                      <span>{exam.questionCount || '40'} questions</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">
                      {exam.price === 0 ? 'Free' : `$${exam.price}`}
                    </div>
                    {exam.originalPrice && exam.originalPrice > exam.price && (
                      <div className="text-xs text-gray-400 line-through">
                        ${exam.originalPrice}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Exam Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span>{exam.completedCount || '1.2k'} completed</span>
                  <span>•</span>
                  <span>{exam.successRate || '95'}% success rate</span>
                </div>
                <Link
                  to={`/exams/${exam._id}`}
                  className="btn-primary text-sm px-4 py-2 flex items-center space-x-1"
                >
                  <FiPlay className="w-4 h-4" />
                  <span>Start Test</span>
                </Link>
              </div>

              {/* Featured Badge */}
              {exam.featured && (
                <div className="absolute top-4 right-4">
                  <span className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-medium">
                    Featured
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {exams?.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiBookOpen className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No exams found</h3>
          <p className="text-gray-500 mb-4">
            Try adjusting your search criteria or filters
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedModule('all');
              setSelectedDifficulty('all');
              setSelectedDuration('all');
            }}
            className="btn-primary"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Load More */}
      {exams?.length > 0 && exams.length >= 9 && (
        <div className="text-center">
          <button className="btn-secondary">
            Load More Exams
          </button>
        </div>
      )}
    </div>
  );
};

export default ExamList; 