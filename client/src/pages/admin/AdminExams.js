import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { adminAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { 
  FiSearch, FiFilter, FiBookOpen, FiPlus, FiEdit, FiTrash2, 
  FiEye, FiX, FiSave, FiCalendar, FiClock, FiUsers, FiStar,
  FiHeadphones, FiEye as FiEyeIcon, FiEdit as FiEditIcon, FiMic
} from 'react-icons/fi';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AdminExams = () => {
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedExam, setSelectedExam] = useState(null);
  const [showExamModal, setShowExamModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Fetch exams
  const { data: examsData, isLoading } = useQuery(
    ['admin-exams', searchTerm, selectedModule, selectedStatus],
    () => adminAPI.getExams({
      search: searchTerm,
      module: selectedModule !== 'all' ? selectedModule : undefined,
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
    }),
    { staleTime: 2 * 60 * 1000 }
  );

  // Create exam mutation
  const createExamMutation = useMutation(
    (examData) => adminAPI.createExam(examData),
    {
      onSuccess: () => {
        showSuccess('Exam created successfully!');
        queryClient.invalidateQueries(['admin-exams']);
        setShowExamModal(false);
        setIsCreating(false);
      },
      onError: (error) => {
        showError('Failed to create exam. Please try again.');
      }
    }
  );

  // Update exam mutation
  const updateExamMutation = useMutation(
    (data) => adminAPI.updateExam(data.id, data.examData),
    {
      onSuccess: () => {
        showSuccess('Exam updated successfully!');
        queryClient.invalidateQueries(['admin-exams']);
        setShowExamModal(false);
      },
      onError: (error) => {
        showError('Failed to update exam. Please try again.');
      }
    }
  );

  // Delete exam mutation
  const deleteExamMutation = useMutation(
    (examId) => adminAPI.deleteExam(examId),
    {
      onSuccess: () => {
        showSuccess('Exam deleted successfully!');
        queryClient.invalidateQueries(['admin-exams']);
      },
      onError: (error) => {
        showError('Failed to delete exam. Please try again.');
      }
    }
  );

  // Toggle exam status mutation
  const toggleExamStatusMutation = useMutation(
    (examId) => adminAPI.toggleExamStatus(examId),
    {
      onSuccess: () => {
        showSuccess('Exam status updated successfully!');
        queryClient.invalidateQueries(['admin-exams']);
      },
      onError: (error) => {
        showError('Failed to update exam status. Please try again.');
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
    return icons[module] || FiBookOpen;
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

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-red-100 text-red-800',
      draft: 'bg-yellow-100 text-yellow-800',
      archived: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || colors.draft;
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      easy: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      hard: 'bg-red-100 text-red-800'
    };
    return colors[difficulty] || colors.medium;
  };

  const handleCreateExam = () => {
    setIsCreating(true);
    setSelectedExam(null);
    setShowExamModal(true);
  };

  const handleEditExam = (exam) => {
    setIsCreating(false);
    setSelectedExam(exam);
    setShowExamModal(true);
  };

  const handleSaveExam = (examData) => {
    if (isCreating) {
      createExamMutation.mutate(examData);
    } else {
      updateExamMutation.mutate({
        id: selectedExam._id,
        examData
      });
    }
  };

  const handleDeleteExam = (examId) => {
    if (window.confirm('Are you sure you want to delete this exam? This action cannot be undone.')) {
      deleteExamMutation.mutate(examId);
    }
  };

  const handleToggleStatus = (examId) => {
    toggleExamStatusMutation.mutate(examId);
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
          <h1 className="text-3xl font-bold text-gray-900">Exam Management</h1>
          <p className="mt-2 text-gray-600">
            Create, edit, and manage IELTS practice exams
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button className="btn-secondary flex items-center space-x-2">
            <FiBookOpen className="w-4 h-4" />
            <span>Import Exam</span>
          </button>
          <button
            onClick={handleCreateExam}
            className="btn-primary flex items-center space-x-2"
          >
            <FiPlus className="w-4 h-4" />
            <span>Create Exam</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="dashboard-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Exams</p>
              <p className="text-2xl font-bold text-gray-900">
                {examsData?.stats?.totalExams || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiBookOpen className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Exams</p>
              <p className="text-2xl font-bold text-gray-900">
                {examsData?.stats?.activeExams || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FiEye className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Attempts</p>
              <p className="text-2xl font-bold text-gray-900">
                {examsData?.stats?.totalAttempts || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FiUsers className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Rating</p>
              <p className="text-2xl font-bold text-gray-900">
                {examsData?.stats?.averageRating || 'N/A'}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
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
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Exams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {examsData?.exams?.map((exam) => {
          const ModuleIcon = getModuleIcon(exam.module);
          const moduleColor = getModuleColor(exam.module);
          
          return (
            <div key={exam._id} className="dashboard-card hover:shadow-md transition-shadow duration-200">
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
                    <span className={`ml-2 ${getDifficultyColor(exam.difficulty)}`}>
                      {exam.difficulty.charAt(0).toUpperCase() + exam.difficulty.slice(1)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <FiStar className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-sm font-medium text-gray-900">
                    {exam.rating || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Exam Content */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
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
                      <span>{exam.questionCount || 0} questions</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">
                      {exam.price === 0 ? 'Free' : `$${exam.price}`}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status and Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(exam.status)}`}>
                  {exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}
                </span>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEditExam(exam)}
                    className="p-1 text-blue-600 hover:text-blue-700"
                    title="Edit Exam"
                  >
                    <FiEdit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleToggleStatus(exam._id)}
                    className={`p-1 ${
                      exam.status === 'active' 
                        ? 'text-yellow-600 hover:text-yellow-700' 
                        : 'text-green-600 hover:text-green-700'
                    }`}
                    title={exam.status === 'active' ? 'Deactivate' : 'Activate'}
                  >
                    <FiEye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteExam(exam._id)}
                    className="p-1 text-red-600 hover:text-red-700"
                    title="Delete Exam"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Additional Stats */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{exam.attemptCount || 0} attempts</span>
                  <span>{exam.successRate || 0}% success rate</span>
                  <span>{new Date(exam.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {examsData?.exams?.length === 0 && (
        <div className="text-center py-12">
          <FiBookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No exams found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || selectedModule !== 'all' || selectedStatus !== 'all'
              ? 'Try adjusting your search criteria or filters'
              : 'Create your first exam to get started'
            }
          </p>
          <button
            onClick={handleCreateExam}
            className="btn-primary"
          >
            Create First Exam
          </button>
        </div>
      )}

      {/* Exam Modal */}
      {showExamModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {isCreating ? 'Create New Exam' : 'Edit Exam'}
                  </h3>
                  <button
                    onClick={() => setShowExamModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FiX className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Title</label>
                      <input
                        type="text"
                        defaultValue={selectedExam?.title || ''}
                        className="input-field mt-1"
                        placeholder="Enter exam title"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Module</label>
                      <select
                        defaultValue={selectedExam?.module || 'listening'}
                        className="input-field mt-1"
                      >
                        <option value="listening">Listening</option>
                        <option value="reading">Reading</option>
                        <option value="writing">Writing</option>
                        <option value="speaking">Speaking</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      defaultValue={selectedExam?.description || ''}
                      className="input-field mt-1"
                      rows="3"
                      placeholder="Enter exam description"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
                      <input
                        type="number"
                        defaultValue={selectedExam?.duration || 60}
                        className="input-field mt-1"
                        min="15"
                        max="180"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Difficulty</label>
                      <select
                        defaultValue={selectedExam?.difficulty || 'medium'}
                        className="input-field mt-1"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Price ($)</label>
                      <input
                        type="number"
                        defaultValue={selectedExam?.price || 0}
                        className="input-field mt-1"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <select
                        defaultValue={selectedExam?.status || 'draft'}
                        className="input-field mt-1"
                      >
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Featured</label>
                      <select
                        defaultValue={selectedExam?.featured ? 'true' : 'false'}
                        className="input-field mt-1"
                      >
                        <option value="false">No</option>
                        <option value="true">Yes</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => handleSaveExam(selectedExam)}
                  disabled={createExamMutation.isLoading || updateExamMutation.isLoading}
                  className="btn-primary sm:ml-3 sm:w-auto"
                >
                  {(createExamMutation.isLoading || updateExamMutation.isLoading) ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <FiSave className="w-4 h-4 mr-2" />
                  )}
                  {isCreating ? 'Create Exam' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowExamModal(false)}
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

export default AdminExams; 