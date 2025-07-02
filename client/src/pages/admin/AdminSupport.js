import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { adminAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { 
  FiSearch, FiFilter, FiMessageSquare, FiEye, FiEdit, FiTrash2, 
  FiCheck, FiX, FiSave, FiCalendar, FiClock, FiStar, FiUser,
  FiMail, FiPhone, FiTag, FiAlertCircle, FiCheckCircle, FiClock as FiClockIcon
} from 'react-icons/fi';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AdminSupport = () => {
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');

  // Fetch support tickets
  const { data: ticketsData, isLoading } = useQuery(
    ['admin-support', searchTerm, selectedStatus, selectedPriority],
    () => adminAPI.getSupportTickets({
      search: searchTerm,
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
      priority: selectedPriority !== 'all' ? selectedPriority : undefined,
    }),
    { staleTime: 2 * 60 * 1000 }
  );

  // Update ticket status mutation
  const updateTicketStatusMutation = useMutation(
    (data) => adminAPI.updateTicketStatus(data.id, data.status),
    {
      onSuccess: () => {
        showSuccess('Ticket status updated successfully!');
        queryClient.invalidateQueries(['admin-support']);
      },
      onError: (error) => {
        showError('Failed to update ticket status. Please try again.');
      }
    }
  );

  // Reply to ticket mutation
  const replyToTicketMutation = useMutation(
    (data) => adminAPI.replyToTicket(data.id, data.reply),
    {
      onSuccess: () => {
        showSuccess('Reply sent successfully!');
        queryClient.invalidateQueries(['admin-support']);
        setShowReplyModal(false);
        setReplyMessage('');
      },
      onError: (error) => {
        showError('Failed to send reply. Please try again.');
      }
    }
  );

  // Delete ticket mutation
  const deleteTicketMutation = useMutation(
    (ticketId) => adminAPI.deleteTicket(ticketId),
    {
      onSuccess: () => {
        showSuccess('Ticket deleted successfully!');
        queryClient.invalidateQueries(['admin-support']);
      },
      onError: (error) => {
        showError('Failed to delete ticket. Please try again.');
      }
    }
  );

  const getStatusColor = (status) => {
    const colors = {
      open: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || colors.open;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800',
      urgent: 'bg-purple-100 text-purple-800'
    };
    return colors[priority] || colors.medium;
  };

  const getPriorityIcon = (priority) => {
    const icons = {
      low: FiCheckCircle,
      medium: FiClockIcon,
      high: FiAlertCircle,
      urgent: FiAlertCircle
    };
    return icons[priority] || FiClockIcon;
  };

  const handleViewTicket = (ticket) => {
    setSelectedTicket(ticket);
    setShowTicketModal(true);
  };

  const handleReplyToTicket = (ticket) => {
    setSelectedTicket(ticket);
    setShowReplyModal(true);
  };

  const handleUpdateStatus = (ticketId, status) => {
    updateTicketStatusMutation.mutate({ id: ticketId, status });
  };

  const handleSendReply = () => {
    if (!replyMessage.trim()) {
      showError('Please enter a reply message.');
      return;
    }
    replyToTicketMutation.mutate({
      id: selectedTicket._id,
      reply: replyMessage
    });
  };

  const handleDeleteTicket = (ticketId) => {
    if (window.confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) {
      deleteTicketMutation.mutate(ticketId);
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Support Management</h1>
          <p className="mt-2 text-gray-600">
            Manage customer support tickets and inquiries
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button className="btn-secondary flex items-center space-x-2">
            <FiMessageSquare className="w-4 h-4" />
            <span>Export Tickets</span>
          </button>
          <button className="btn-primary flex items-center space-x-2">
            <FiMessageSquare className="w-4 h-4" />
            <span>Create Ticket</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="dashboard-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tickets</p>
              <p className="text-2xl font-bold text-gray-900">
                {ticketsData?.stats?.totalTickets || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiMessageSquare className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Open Tickets</p>
              <p className="text-2xl font-bold text-gray-900">
                {ticketsData?.stats?.openTickets || 0}
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
              <p className="text-sm font-medium text-gray-600">Resolved Today</p>
              <p className="text-2xl font-bold text-gray-900">
                {ticketsData?.stats?.resolvedToday || 0}
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
              <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
              <p className="text-2xl font-bold text-gray-900">
                {ticketsData?.stats?.avgResponseTime || 'N/A'}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FiClock className="w-6 h-6 text-purple-600" />
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
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input-field"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="input-field"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="dashboard-card">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Ticket</th>
                <th className="table-header-cell">User</th>
                <th className="table-header-cell">Status</th>
                <th className="table-header-cell">Priority</th>
                <th className="table-header-cell">Created</th>
                <th className="table-header-cell">Last Updated</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {ticketsData?.tickets?.map((ticket) => {
                const PriorityIcon = getPriorityIcon(ticket.priority);
                
                return (
                  <tr key={ticket._id} className="table-row">
                    <td className="table-cell">
                      <div className="max-w-xs">
                        <p className="font-medium text-gray-900 line-clamp-1">
                          #{ticket.ticketNumber} - {ticket.subject}
                        </p>
                        <p className="text-sm text-gray-500 line-clamp-1">
                          {ticket.message}
                        </p>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <FiUser className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {ticket.userName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {ticket.userEmail}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                        {ticket.status.replace('_', ' ').charAt(0).toUpperCase() + ticket.status.slice(1).replace('_', ' ')}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center space-x-2">
                        <PriorityIcon className={`w-4 h-4 ${
                          ticket.priority === 'urgent' ? 'text-purple-600' :
                          ticket.priority === 'high' ? 'text-red-600' :
                          ticket.priority === 'medium' ? 'text-yellow-600' : 'text-green-600'
                        }`} />
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="text-sm text-gray-900">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(ticket.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="text-sm text-gray-900">
                        {new Date(ticket.updatedAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(ticket.updatedAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewTicket(ticket)}
                          className="p-1 text-blue-600 hover:text-blue-700"
                          title="View Ticket"
                        >
                          <FiEye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleReplyToTicket(ticket)}
                          className="p-1 text-green-600 hover:text-green-700"
                          title="Reply to Ticket"
                        >
                          <FiEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTicket(ticket._id)}
                          className="p-1 text-red-600 hover:text-red-700"
                          title="Delete Ticket"
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

          {ticketsData?.tickets?.length === 0 && (
            <div className="text-center py-8">
              <FiMessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
              <p className="text-gray-500">
                {searchTerm || selectedStatus !== 'all' || selectedPriority !== 'all'
                  ? 'Try adjusting your search criteria or filters'
                  : 'No support tickets have been created yet'
                }
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {ticketsData?.pagination && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-700">
              Showing {ticketsData.pagination.startIndex + 1} to {ticketsData.pagination.endIndex} of {ticketsData.pagination.total} results
            </div>
            <div className="flex items-center space-x-2">
              <button className="btn-secondary">
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page 1 of {ticketsData.pagination.totalPages}
              </span>
              <button className="btn-secondary">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Ticket Details Modal */}
      {showTicketModal && selectedTicket && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Ticket #{selectedTicket.ticketNumber}
                  </h3>
                  <button
                    onClick={() => setShowTicketModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FiX className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Ticket Information</h4>
                      <p className="text-sm text-gray-600">Subject: {selectedTicket.subject}</p>
                      <p className="text-sm text-gray-600">Category: {selectedTicket.category}</p>
                      <p className="text-sm text-gray-600">Status: {selectedTicket.status}</p>
                      <p className="text-sm text-gray-600">Priority: {selectedTicket.priority}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">User Information</h4>
                      <p className="text-sm text-gray-600">Name: {selectedTicket.userName}</p>
                      <p className="text-sm text-gray-600">Email: {selectedTicket.userEmail}</p>
                      <p className="text-sm text-gray-600">Phone: {selectedTicket.userPhone || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Message</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-700">{selectedTicket.message}</p>
                    </div>
                  </div>
                  
                  {selectedTicket.replies && selectedTicket.replies.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Replies</h4>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {selectedTicket.replies.map((reply, index) => (
                          <div key={index} className="bg-gray-50 p-3 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-900">
                                {reply.isAdmin ? 'Admin' : selectedTicket.userName}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(reply.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">{reply.message}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-4">
                    <h4 className="font-medium text-gray-900">Update Status:</h4>
                    <select
                      defaultValue={selectedTicket.status}
                      onChange={(e) => handleUpdateStatus(selectedTicket._id, e.target.value)}
                      className="input-field"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => {
                    setShowTicketModal(false);
                    handleReplyToTicket(selectedTicket);
                  }}
                  className="btn-primary sm:ml-3 sm:w-auto"
                >
                  <FiEdit className="w-4 h-4 mr-2" />
                  Reply to Ticket
                </button>
                <button
                  type="button"
                  onClick={() => setShowTicketModal(false)}
                  className="btn-secondary sm:mt-0 sm:w-auto"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reply Modal */}
      {showReplyModal && selectedTicket && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Reply to Ticket #{selectedTicket.ticketNumber}
                  </h3>
                  <button
                    onClick={() => setShowReplyModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FiX className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reply Message
                    </label>
                    <textarea
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      className="input-field"
                      rows="6"
                      placeholder="Enter your reply..."
                    />
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleSendReply}
                  disabled={replyToTicketMutation.isLoading}
                  className="btn-primary sm:ml-3 sm:w-auto"
                >
                  {replyToTicketMutation.isLoading ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <FiSave className="w-4 h-4 mr-2" />
                  )}
                  Send Reply
                </button>
                <button
                  type="button"
                  onClick={() => setShowReplyModal(false)}
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

export default AdminSupport; 