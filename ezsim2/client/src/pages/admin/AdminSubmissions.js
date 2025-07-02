import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { adminAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { 
  FiSearch, FiFilter, FiFileText, FiEye, FiEdit, FiTrash2, 
  FiCheck, FiX, FiSave, FiCalendar, FiClock, FiStar, FiDownload,
  FiHeadphones, FiEye as FiEyeIcon, FiEdit as FiEditIcon, FiMic,
  FiUser, FiAward, FiTrendingUp, FiBarChart3
} from 'react-icons/fi';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AdminSubmissions = () => {
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [showGradingModal, setShowGradingModal] = useState(false);

  // Fetch submissions
  const { data: submissionsData, isLoading } = useQuery(
    ['admin-submissions', searchTerm, selectedModule, selectedStatus],
    () => adminAPI.getSubmissions({
      search: searchTerm,
      module: selectedModule !== 'all' ? selectedModule : undefined,
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
    }),
    { staleTime: 2 * 60 * 1000 }
  );

  // Grade submission mutation
  const gradeSubmissionMutation = useMutation(
    (data) => adminAPI.gradeSubmission(data.id, data.gradeData),
    {
      onSuccess: () => {
        showSuccess('Submission graded successfully!');
        queryClient.invalidateQueries(['admin-submissions']);
        setShowGradingModal(false);
      },
      onError: (error) => {
        showError('Failed to grade submission. Please try again.');
      }
    }
  );

  // Delete submission mutation
  const deleteSubmissionMutation = useMutation(
    (submissionId) => adminAPI.deleteSubmission(submissionId),
    {
      onSuccess: () => {
        showSuccess('Submission deleted successfully!');
        queryClient.invalidateQueries(['admin-submissions']);
      },
      onError: (error) => {
        showError('Failed to delete submission. Please try again.');
      }
    }
  );

  // Export submissions mutation
  const exportSubmissionsMutation = useMutation(
    (filters) => adminAPI.exportSubmissions(filters),
    {
      onSuccess: (data) => {
        showSuccess('Submissions exported successfully!');
        // Handle file download
        const blob = new Blob([data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'submissions.csv';
        a.click();
      },
      onError: (error) => {
        showError('Failed to export submissions. Please try again.');
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
    return icons[module] || FiFileText;
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
      submitted: 'bg-blue-100 text-blue-800',
      graded: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800'
    };
    return colors[status] || colors.pending;
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

  const handleViewSubmission = (submission) => {
    setSelectedSubmission(submission);
    setShowSubmissionModal(true);
  };

  const handleGradeSubmission = (submission) => {
    setSelectedSubmission(submission);
    setShowGradingModal(true);
  };

  const handleSaveGrade = (gradeData) => {
    gradeSubmissionMutation.mutate({
      id: selectedSubmission._id,
      gradeData
    });
  };

  const handleDeleteSubmission = (submissionId) => {
    if (window.confirm('Are you sure you want to delete this submission? This action cannot be undone.')) {
      deleteSubmissionMutation.mutate(submissionId);
    }
  };

  const handleExportSubmissions = () => {
    exportSubmissionsMutation.mutate({
      search: searchTerm,
      module: selectedModule !== 'all' ? selectedModule : undefined,
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
    });
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
          <h1 className="text-3xl font-bold text-gray-900">Submission Management</h1>
          <p className="mt-2 text-gray-600">
            Review, grade, and manage exam submissions
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={handleExportSubmissions}
            disabled={exportSubmissionsMutation.isLoading}
            className="btn-secondary flex items-center space-x-2"
          >
            {exportSubmissionsMutation.isLoading ? (
              <LoadingSpinner size="sm" className="w-4 h-4" />
            ) : (
              <FiDownload className="w-4 h-4" />
            )}
            <span>Export</span>
          </button>
          <button className="btn-primary flex items-center space-x-2">
            <FiBarChart3 className="w-4 h-4" />
            <span>Analytics</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="dashboard-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Submissions</p>
              <p className="text-2xl font-bold text-gray-900">
                {submissionsData?.stats?.totalSubmissions || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiFileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Grading</p>
              <p className="text-2xl font-bold text-gray-900">
                {submissionsData?.stats?.pendingGrading || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <FiClock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Score</p>
              <p className="text-2xl font-bold text-gray-900">
                {submissionsData?.stats?.averageScore || 'N/A'}
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
              <p className="text-sm font-medium text-gray-600">Today's Submissions</p>
              <p className="text-2xl font-bold text-gray-900">
                {submissionsData?.stats?.todaySubmissions || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FiCalendar className="w-6 h-6 text-purple-600" />
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
                placeholder="Search submissions..."
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
              <option value="submitted">Submitted</option>
              <option value="graded">Graded</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Submissions List */}
      <div className="dashboard-card">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Student</th>
                <th className="table-header-cell">Exam</th>
                <th className="table-header-cell">Module</th>
                <th className="table-header-cell">Status</th>
                <th className="table-header-cell">Score</th>
                <th className="table-header-cell">Submitted</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {submissionsData?.submissions?.map((submission) => {
                const ModuleIcon = getModuleIcon(submission.module);
                const moduleColor = getModuleColor(submission.module);
                
                return (
                  <tr key={submission._id} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <FiUser className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {submission.studentName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {submission.studentEmail}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="max-w-xs">
                        <p className="font-medium text-gray-900">
                          {submission.examTitle}
                        </p>
                        <p className="text-sm text-gray-500">
                          ID: {submission.examId?.slice(-8)}
                        </p>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center space-x-2">
                        <div className={`w-8 h-8 bg-${moduleColor}-100 rounded-lg flex items-center justify-center`}>
                          <ModuleIcon className={`w-4 h-4 text-${moduleColor}-600`} />
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {submission.module.charAt(0).toUpperCase() + submission.module.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                        {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                      </span>
                    </td>
                    <td className="table-cell">
                      {submission.score ? (
                        <div>
                          <p className={`text-lg font-bold ${getScoreColor(submission.score)}`}>
                            {submission.score}
                          </p>
                          <p className="text-xs text-gray-500">
                            {getScoreLevel(submission.score)}
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Not graded</span>
                      )}
                    </td>
                    <td className="table-cell">
                      <div className="text-sm text-gray-900">
                        {new Date(submission.submittedAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(submission.submittedAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewSubmission(submission)}
                          className="p-1 text-blue-600 hover:text-blue-700"
                          title="View Submission"
                        >
                          <FiEye className="w-4 h-4" />
                        </button>
                        {submission.status === 'submitted' && (
                          <button
                            onClick={() => handleGradeSubmission(submission)}
                            className="p-1 text-green-600 hover:text-green-700"
                            title="Grade Submission"
                          >
                            <FiEdit className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteSubmission(submission._id)}
                          className="p-1 text-red-600 hover:text-red-700"
                          title="Delete Submission"
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

          {submissionsData?.submissions?.length === 0 && (
            <div className="text-center py-8">
              <FiFileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions found</h3>
              <p className="text-gray-500">
                {searchTerm || selectedModule !== 'all' || selectedStatus !== 'all'
                  ? 'Try adjusting your search criteria or filters'
                  : 'No submissions have been made yet'
                }
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {submissionsData?.pagination && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-700">
              Showing {submissionsData.pagination.startIndex + 1} to {submissionsData.pagination.endIndex} of {submissionsData.pagination.total} results
            </div>
            <div className="flex items-center space-x-2">
              <button className="btn-secondary">
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page 1 of {submissionsData.pagination.totalPages}
              </span>
              <button className="btn-secondary">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Submission Details Modal */}
      {showSubmissionModal && selectedSubmission && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Submission Details</h3>
                  <button
                    onClick={() => setShowSubmissionModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FiX className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Student Information</h4>
                      <p className="text-sm text-gray-600">Name: {selectedSubmission.studentName}</p>
                      <p className="text-sm text-gray-600">Email: {selectedSubmission.studentEmail}</p>
                      <p className="text-sm text-gray-600">ID: {selectedSubmission.studentId}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Exam Information</h4>
                      <p className="text-sm text-gray-600">Title: {selectedSubmission.examTitle}</p>
                      <p className="text-sm text-gray-600">Module: {selectedSubmission.module}</p>
                      <p className="text-sm text-gray-600">Duration: {selectedSubmission.duration} minutes</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Answers</h4>
                    <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
                      {selectedSubmission.answers?.map((answer, index) => (
                        <div key={index} className="mb-3 p-3 bg-white rounded border">
                          <p className="text-sm font-medium text-gray-900 mb-1">
                            Question {index + 1}
                          </p>
                          <p className="text-sm text-gray-600">
                            Answer: {answer.answer || 'No answer provided'}
                          </p>
                          {answer.correct !== undefined && (
                            <p className={`text-xs mt-1 ${
                              answer.correct ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {answer.correct ? 'Correct' : 'Incorrect'}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {selectedSubmission.score && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Grading</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Overall Score</p>
                          <p className={`text-2xl font-bold ${getScoreColor(selectedSubmission.score)}`}>
                            {selectedSubmission.score}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Correct Answers</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {selectedSubmission.correctAnswers}/{selectedSubmission.totalQuestions}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Time Spent</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {Math.floor(selectedSubmission.timeSpent / 60)}m {selectedSubmission.timeSpent % 60}s
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                {selectedSubmission.status === 'submitted' && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowSubmissionModal(false);
                      handleGradeSubmission(selectedSubmission);
                    }}
                    className="btn-primary sm:ml-3 sm:w-auto"
                  >
                    <FiEdit className="w-4 h-4 mr-2" />
                    Grade Submission
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowSubmissionModal(false)}
                  className="btn-secondary sm:mt-0 sm:w-auto"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grading Modal */}
      {showGradingModal && selectedSubmission && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Grade Submission</h3>
                  <button
                    onClick={() => setShowGradingModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FiX className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Overall Score</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="9"
                      defaultValue={selectedSubmission.score || ''}
                      className="input-field mt-1"
                      placeholder="Enter score (0-9)"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Feedback</label>
                    <textarea
                      defaultValue={selectedSubmission.feedback || ''}
                      className="input-field mt-1"
                      rows="4"
                      placeholder="Provide detailed feedback..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Comments</label>
                    <textarea
                      defaultValue={selectedSubmission.comments || ''}
                      className="input-field mt-1"
                      rows="2"
                      placeholder="Additional comments..."
                    />
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => handleSaveGrade(selectedSubmission)}
                  disabled={gradeSubmissionMutation.isLoading}
                  className="btn-primary sm:ml-3 sm:w-auto"
                >
                  {gradeSubmissionMutation.isLoading ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <FiSave className="w-4 h-4 mr-2" />
                  )}
                  Save Grade
                </button>
                <button
                  type="button"
                  onClick={() => setShowGradingModal(false)}
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

export default AdminSubmissions; 