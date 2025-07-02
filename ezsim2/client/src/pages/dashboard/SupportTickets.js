import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { userAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { 
  FiMessageSquare, FiPlus, FiEye, FiEdit, FiTrash2, 
  FiCheck, FiX, FiCalendar, FiClock, FiUser, FiMail,
  FiCheckCircle, FiXCircle, FiAlertCircle, FiClock as FiClockIcon
} from 'react-icons/fi';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const SupportTickets = () => {
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('general');
  const [priority, setPriority] = useState('medium');
  const [replyMessage, setReplyMessage] = useState('');

  // Fetch user's support tickets
  const { data: ticketsData, isLoading } = useQuery(
    ['user-support-tickets'],
    () => userAPI.getSupportTickets(),
    { staleTime: 2 * 60 * 1000 }
  );

  // Create ticket mutation
  const createTicketMutation = useMutation(
    (ticketData) => userAPI.createSupportTicket(ticketData),
    {
      onSuccess: () => {
        showSuccess('Support ticket created successfully!');
        queryClient.invalidateQueries(['user-support-tickets']);
        setShowTicketModal(false);
        resetForm();
      },
      onError: (error) => {
        showError('Failed to create support ticket. Please try again.');
      }
    }
  );

  // Reply to ticket mutation
  const replyToTicketMutation = useMutation(
    (data) => userAPI.replyToTicket(data.id, data.reply),
    {
      onSuccess: () => {
        showSuccess('Reply sent successfully!');
        queryClient.invalidateQueries(['user-support-tickets']);
        setShowReplyModal(false);
        setReplyMessage('');
      },
      onError: (error) => {
        showError('Failed to send reply. Please try again.');
      }
    }
  );

  // Close ticket mutation
  const closeTicketMutation = useMutation(
    (ticketId) => userAPI.closeTicket(ticketId),
    {
      onSuccess: () => {
        showSuccess('Ticket closed successfully!');
        queryClient.invalidateQueries(['user-support-tickets']);
      },
      onError: (error) => {
        showError('Failed to close ticket. Please try again.');
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

  const getStatusIcon = (status) => {
    const icons = {
      open: FiAlertCircle,
      in_progress: FiClockIcon,
      resolved: FiCheckCircle,
      closed: FiXCircle
    };
    return icons[status] || FiAlertCircle;
  };

  const resetForm = () => {
    setSubject('');
    setMessage('');
    setCategory('general');
    setPriority('medium');
  };

  const handleCreateTicket = () => {
    if (!subject.trim() || !message.trim()) {
      showError('Please fill in all required fields.');
      return;
    }

    createTicketMutation.mutate({
      subject,
      message,
      category,
      priority
    });
  };

  const handleViewTicket = (ticket) => {
    setSelectedTicket(ticket);
    setShowReplyModal(true);
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

  const handleCloseTicket = (ticketId) => {
    if (window.confirm('Are you sure you want to close this ticket?')) {
      closeTicketMutation.mutate(ticketId);
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
          <h1 className="text-3xl font-bold text-gray-900">Support Tickets</h1>
          <p className="mt-2 text-gray-600">
            Get help and support for your IELTS preparation journey
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setShowTicketModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <FiPlus className="w-4 h-4" />
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
              <p className="text-sm font-medium text-gray-600">Open</p>
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
              <p className="text-sm font-medium text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-gray-900">
                {ticketsData?.stats?.resolvedTickets || 0}
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
              <p className="text-sm font-medium text-gray-600">Avg Response</p>
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

      {/* Tickets List */}
      <div className="dashboard-card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Tickets</h3>
        
        {ticketsData?.tickets?.length > 0 ? (
          <div className="space-y-4">
            {ticketsData.tickets.map((ticket) => {
              const StatusIcon = getStatusIcon(ticket.status);
              
              return (
                <div key={ticket._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FiMessageSquare className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            #{ticket.ticketNumber} - {ticket.subject}
                          </h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className="flex items-center space-x-1">
                              <FiCalendar className="w-4 h-4" />
                              <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <FiUser className="w-4 h-4" />
                              <span>{ticket.category}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {ticket.message}
                      </p>
                      
                      {ticket.replies && ticket.replies.length > 0 && (
                        <div className="mt-2 text-sm text-gray-500">
                          {ticket.replies.length} reply{ticket.replies.length !== 1 ? 'ies' : ''}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className="flex items-center space-x-2 mb-1">
                          <StatusIcon className="w-4 h-4" />
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                            {ticket.status.replace('_', ' ').charAt(0).toUpperCase() + ticket.status.slice(1).replace('_', ' ')}
                          </span>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewTicket(ticket)}
                          className="p-1 text-blue-600 hover:text-blue-700"
                          title="View Ticket"
                        >
                          <FiEye className="w-4 h-4" />
                        </button>
                        {ticket.status !== 'closed' && (
                          <button
                            onClick={() => handleCloseTicket(ticket._id)}
                            className="p-1 text-gray-600 hover:text-gray-700"
                            title="Close Ticket"
                          >
                            <FiX className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <FiMessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets yet</h3>
            <p className="text-gray-500 mb-4">
              Create your first support ticket if you need help with anything
            </p>
            <button
              onClick={() => setShowTicketModal(true)}
              className="btn-primary"
            >
              Create First Ticket
            </button>
          </div>
        )}
      </div>

      {/* Create Ticket Modal */}
      {showTicketModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Create Support Ticket</h3>
                  <button
                    onClick={() => setShowTicketModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FiX className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject *
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="input-field"
                      placeholder="Brief description of your issue"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="input-field"
                    >
                      <option value="general">General</option>
                      <option value="technical">Technical</option>
                      <option value="billing">Billing</option>
                      <option value="exam">Exam Related</option>
                      <option value="speaking">Speaking Test</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="input-field"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message *
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="input-field"
                      rows="4"
                      placeholder="Describe your issue in detail..."
                    />
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleCreateTicket}
                  disabled={createTicketMutation.isLoading}
                  className="btn-primary sm:ml-3 sm:w-auto"
                >
                  {createTicketMutation.isLoading ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <FiCheck className="w-4 h-4 mr-2" />
                  )}
                  Create Ticket
                </button>
                <button
                  type="button"
                  onClick={() => setShowTicketModal(false)}
                  className="btn-secondary sm:mt-0 sm:w-auto"
                >
                  Cancel
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
                    Ticket #{selectedTicket.ticketNumber}
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
                    <h4 className="font-medium text-gray-900 mb-2">Original Message</h4>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-700">{selectedTicket.message}</p>
                    </div>
                  </div>
                  
                  {selectedTicket.replies && selectedTicket.replies.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Conversation</h4>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {selectedTicket.replies.map((reply, index) => (
                          <div key={index} className="bg-gray-50 p-3 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-900">
                                {reply.isAdmin ? 'Support Team' : 'You'}
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
                  
                  {selectedTicket.status !== 'closed' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Add Reply
                      </label>
                      <textarea
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        className="input-field"
                        rows="4"
                        placeholder="Type your reply..."
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                {selectedTicket.status !== 'closed' && (
                  <button
                    type="button"
                    onClick={handleSendReply}
                    disabled={replyToTicketMutation.isLoading}
                    className="btn-primary sm:ml-3 sm:w-auto"
                  >
                    {replyToTicketMutation.isLoading ? (
                      <LoadingSpinner size="sm" className="mr-2" />
                    ) : (
                      <FiCheck className="w-4 h-4 mr-2" />
                    )}
                    Send Reply
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowReplyModal(false)}
                  className="btn-secondary sm:mt-0 sm:w-auto"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportTickets; 