import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { adminAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { 
  FiSearch, FiFilter, FiHelpCircle, FiPlus, FiEdit, FiTrash2, 
  FiEye, FiX, FiSave, FiCalendar, FiClock, FiStar, FiCopy,
  FiHeadphones, FiEye as FiEyeIcon, FiEdit as FiEditIcon, FiMic,
  FiCheck, FiList, FiType, FiImage
} from 'react-icons/fi';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AdminQuestions = () => {
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Fetch questions
  const { data: questionsData, isLoading } = useQuery(
    ['admin-questions', searchTerm, selectedModule, selectedType, selectedDifficulty],
    () => adminAPI.getQuestions({
      search: searchTerm,
      module: selectedModule !== 'all' ? selectedModule : undefined,
      type: selectedType !== 'all' ? selectedType : undefined,
      difficulty: selectedDifficulty !== 'all' ? selectedDifficulty : undefined,
    }),
    { staleTime: 2 * 60 * 1000 }
  );

  // Create question mutation
  const createQuestionMutation = useMutation(
    (questionData) => adminAPI.createQuestion(questionData),
    {
      onSuccess: () => {
        showSuccess('Question created successfully!');
        queryClient.invalidateQueries(['admin-questions']);
        setShowQuestionModal(false);
        setIsCreating(false);
      },
      onError: (error) => {
        showError('Failed to create question. Please try again.');
      }
    }
  );

  // Update question mutation
  const updateQuestionMutation = useMutation(
    (data) => adminAPI.updateQuestion(data.id, data.questionData),
    {
      onSuccess: () => {
        showSuccess('Question updated successfully!');
        queryClient.invalidateQueries(['admin-questions']);
        setShowQuestionModal(false);
      },
      onError: (error) => {
        showError('Failed to update question. Please try again.');
      }
    }
  );

  // Delete question mutation
  const deleteQuestionMutation = useMutation(
    (questionId) => adminAPI.deleteQuestion(questionId),
    {
      onSuccess: () => {
        showSuccess('Question deleted successfully!');
        queryClient.invalidateQueries(['admin-questions']);
      },
      onError: (error) => {
        showError('Failed to delete question. Please try again.');
      }
    }
  );

  // Duplicate question mutation
  const duplicateQuestionMutation = useMutation(
    (questionId) => adminAPI.duplicateQuestion(questionId),
    {
      onSuccess: () => {
        showSuccess('Question duplicated successfully!');
        queryClient.invalidateQueries(['admin-questions']);
      },
      onError: (error) => {
        showError('Failed to duplicate question. Please try again.');
      }
    }
  );

  const getModuleIcon = (module) => {
    const icons = {
      listening: FiHeadphones,
      reading: FiEyeIcon,
      writing: FiEditIcon,
      speaking: FiMic
    };
    return icons[module] || FiHelpCircle;
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

  const getTypeIcon = (type) => {
    const icons = {
      multiple_choice: FiCheck,
      fill_blank: FiType,
      true_false: FiList,
      matching: FiList,
      short_answer: FiType,
      essay: FiEditIcon,
      speaking: FiMic
    };
    return icons[type] || FiHelpCircle;
  };

  const getTypeColor = (type) => {
    const colors = {
      multiple_choice: 'blue',
      fill_blank: 'green',
      true_false: 'yellow',
      matching: 'purple',
      short_answer: 'orange',
      essay: 'red',
      speaking: 'pink'
    };
    return colors[type] || 'gray';
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      easy: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      hard: 'bg-red-100 text-red-800'
    };
    return colors[difficulty] || colors.medium;
  };

  const getTypeLabel = (type) => {
    const labels = {
      multiple_choice: 'Multiple Choice',
      fill_blank: 'Fill in the Blank',
      true_false: 'True/False',
      matching: 'Matching',
      short_answer: 'Short Answer',
      essay: 'Essay',
      speaking: 'Speaking'
    };
    return labels[type] || type;
  };

  const handleCreateQuestion = () => {
    setIsCreating(true);
    setSelectedQuestion(null);
    setShowQuestionModal(true);
  };

  const handleEditQuestion = (question) => {
    setIsCreating(false);
    setSelectedQuestion(question);
    setShowQuestionModal(true);
  };

  const handleSaveQuestion = (questionData) => {
    if (isCreating) {
      createQuestionMutation.mutate(questionData);
    } else {
      updateQuestionMutation.mutate({
        id: selectedQuestion._id,
        questionData
      });
    }
  };

  const handleDeleteQuestion = (questionId) => {
    if (window.confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
      deleteQuestionMutation.mutate(questionId);
    }
  };

  const handleDuplicateQuestion = (questionId) => {
    duplicateQuestionMutation.mutate(questionId);
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
          <h1 className="text-3xl font-bold text-gray-900">Question Management</h1>
          <p className="mt-2 text-gray-600">
            Create, edit, and manage exam questions
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button className="btn-secondary flex items-center space-x-2">
            <FiHelpCircle className="w-4 h-4" />
            <span>Import Questions</span>
          </button>
          <button
            onClick={handleCreateQuestion}
            className="btn-primary flex items-center space-x-2"
          >
            <FiPlus className="w-4 h-4" />
            <span>Create Question</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="dashboard-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Questions</p>
              <p className="text-2xl font-bold text-gray-900">
                {questionsData?.stats?.totalQuestions || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiHelpCircle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Questions</p>
              <p className="text-2xl font-bold text-gray-900">
                {questionsData?.stats?.activeQuestions || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FiCheck className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Question Types</p>
              <p className="text-2xl font-bold text-gray-900">
                {questionsData?.stats?.questionTypes || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FiList className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Difficulty</p>
              <p className="text-2xl font-bold text-gray-900">
                {questionsData?.stats?.averageDifficulty || 'N/A'}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <FiStar className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="dashboard-card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search questions..."
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

          {/* Type Filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="input-field"
            >
              <option value="all">All Types</option>
              <option value="multiple_choice">Multiple Choice</option>
              <option value="fill_blank">Fill in the Blank</option>
              <option value="true_false">True/False</option>
              <option value="matching">Matching</option>
              <option value="short_answer">Short Answer</option>
              <option value="essay">Essay</option>
              <option value="speaking">Speaking</option>
            </select>
          </div>

          {/* Difficulty Filter */}
          <div>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="input-field"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div className="dashboard-card">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Question</th>
                <th className="table-header-cell">Module</th>
                <th className="table-header-cell">Type</th>
                <th className="table-header-cell">Difficulty</th>
                <th className="table-header-cell">Points</th>
                <th className="table-header-cell">Usage</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {questionsData?.questions?.map((question) => {
                const ModuleIcon = getModuleIcon(question.module);
                const TypeIcon = getTypeIcon(question.type);
                const moduleColor = getModuleColor(question.module);
                const typeColor = getTypeColor(question.type);
                
                return (
                  <tr key={question._id} className="table-row">
                    <td className="table-cell">
                      <div className="max-w-xs">
                        <p className="font-medium text-gray-900 line-clamp-2">
                          {question.text}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          ID: {question._id.slice(-8)}
                        </p>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center space-x-2">
                        <div className={`w-8 h-8 bg-${moduleColor}-100 rounded-lg flex items-center justify-center`}>
                          <ModuleIcon className={`w-4 h-4 text-${moduleColor}-600`} />
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {question.module.charAt(0).toUpperCase() + question.module.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center space-x-2">
                        <div className={`w-8 h-8 bg-${typeColor}-100 rounded-lg flex items-center justify-center`}>
                          <TypeIcon className={`w-4 h-4 text-${typeColor}-600`} />
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {getTypeLabel(question.type)}
                        </span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                        {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className="text-sm font-medium text-gray-900">
                        {question.points || 1} pt{question.points !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="text-sm text-gray-500">
                        <div>{question.usageCount || 0} times</div>
                        <div>{question.successRate || 0}% success</div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditQuestion(question)}
                          className="p-1 text-blue-600 hover:text-blue-700"
                          title="Edit Question"
                        >
                          <FiEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDuplicateQuestion(question._id)}
                          className="p-1 text-green-600 hover:text-green-700"
                          title="Duplicate Question"
                        >
                          <FiCopy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(question._id)}
                          className="p-1 text-red-600 hover:text-red-700"
                          title="Delete Question"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {questionsData?.questions?.length === 0 && (
            <div className="text-center py-8">
              <FiHelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No questions found</h3>
              <p className="text-gray-500">
                {searchTerm || selectedModule !== 'all' || selectedType !== 'all' || selectedDifficulty !== 'all'
                  ? 'Try adjusting your search criteria or filters'
                  : 'Create your first question to get started'
                }
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {questionsData?.pagination && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-700">
              Showing {questionsData.pagination.startIndex + 1} to {questionsData.pagination.endIndex} of {questionsData.pagination.total} results
            </div>
            <div className="flex items-center space-x-2">
              <button className="btn-secondary">
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page 1 of {questionsData.pagination.totalPages}
              </span>
              <button className="btn-secondary">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Question Modal */}
      {showQuestionModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {isCreating ? 'Create New Question' : 'Edit Question'}
                  </h3>
                  <button
                    onClick={() => setShowQuestionModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FiX className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Module</label>
                      <select
                        defaultValue={selectedQuestion?.module || 'listening'}
                        className="input-field mt-1"
                      >
                        <option value="listening">Listening</option>
                        <option value="reading">Reading</option>
                        <option value="writing">Writing</option>
                        <option value="speaking">Speaking</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Question Type</label>
                      <select
                        defaultValue={selectedQuestion?.type || 'multiple_choice'}
                        className="input-field mt-1"
                      >
                        <option value="multiple_choice">Multiple Choice</option>
                        <option value="fill_blank">Fill in the Blank</option>
                        <option value="true_false">True/False</option>
                        <option value="matching">Matching</option>
                        <option value="short_answer">Short Answer</option>
                        <option value="essay">Essay</option>
                        <option value="speaking">Speaking</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Difficulty</label>
                      <select
                        defaultValue={selectedQuestion?.difficulty || 'medium'}
                        className="input-field mt-1"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Question Text</label>
                    <textarea
                      defaultValue={selectedQuestion?.text || ''}
                      className="input-field mt-1"
                      rows="3"
                      placeholder="Enter the question text"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Points</label>
                      <input
                        type="number"
                        defaultValue={selectedQuestion?.points || 1}
                        className="input-field mt-1"
                        min="1"
                        max="10"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Time Limit (seconds)</label>
                      <input
                        type="number"
                        defaultValue={selectedQuestion?.timeLimit || 60}
                        className="input-field mt-1"
                        min="10"
                        max="600"
                      />
                    </div>
                  </div>
                  
                  {/* Options for multiple choice */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Options</label>
                    <div className="space-y-2 mt-1">
                      {['A', 'B', 'C', 'D'].map((option) => (
                        <div key={option} className="flex items-center space-x-2">
                          <span className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center text-sm font-medium">
                            {option}
                          </span>
                          <input
                            type="text"
                            className="input-field flex-1"
                            placeholder={`Option ${option}`}
                          />
                          <input
                            type="radio"
                            name="correctAnswer"
                            value={option}
                            className="w-4 h-4 text-blue-600"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Explanation</label>
                    <textarea
                      defaultValue={selectedQuestion?.explanation || ''}
                      className="input-field mt-1"
                      rows="2"
                      placeholder="Explanation for the correct answer"
                    />
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => handleSaveQuestion(selectedQuestion)}
                  disabled={createQuestionMutation.isLoading || updateQuestionMutation.isLoading}
                  className="btn-primary sm:ml-3 sm:w-auto"
                >
                  {(createQuestionMutation.isLoading || updateQuestionMutation.isLoading) ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <FiSave className="w-4 h-4 mr-2" />
                  )}
                  {isCreating ? 'Create Question' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowQuestionModal(false)}
                  className="btn-secondary sm:mt-0 sm:w-auto"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminQuestions; 