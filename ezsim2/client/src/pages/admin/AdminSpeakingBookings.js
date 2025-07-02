import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { adminAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { 
  FiSearch, FiFilter, FiMic, FiEye, FiEdit, FiTrash2, 
  FiCheck, FiX, FiSave, FiCalendar, FiClock, FiUser, FiMail,
  FiPhone, FiMapPin, FiCheckCircle, FiXCircle, FiAlertCircle
} from 'react-icons/fi';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AdminSpeakingBookings = () => {
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Fetch speaking bookings
  const { data: bookingsData, isLoading } = useQuery(
    ['admin-speaking-bookings', searchTerm, selectedStatus, selectedDate],
    () => adminAPI.getSpeakingBookings({
      search: searchTerm,
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
      date: selectedDate || undefined,
    }),
    { staleTime: 2 * 60 * 1000 }
  );

  // Update booking status mutation
  const updateBookingStatusMutation = useMutation(
    (data) => adminAPI.updateBookingStatus(data.id, data.status),
    {
      onSuccess: () => {
        showSuccess('Booking status updated successfully!');
        queryClient.invalidateQueries(['admin-speaking-bookings']);
      },
      onError: (error) => {
        showError('Failed to update booking status. Please try again.');
      }
    }
  );

  // Delete booking mutation
  const deleteBookingMutation = useMutation(
    (bookingId) => adminAPI.deleteBooking(bookingId),
    {
      onSuccess: () => {
        showSuccess('Booking deleted successfully!');
        queryClient.invalidateQueries(['admin-speaking-bookings']);
      },
      onError: (error) => {
        showError('Failed to delete booking. Please try again.');
      }
    }
  );

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
      rescheduled: 'bg-purple-100 text-purple-800'
    };
    return colors[status] || colors.pending;
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: FiClock,
      confirmed: FiCheckCircle,
      completed: FiCheck,
      cancelled: FiXCircle,
      rescheduled: FiAlertCircle
    };
    return icons[status] || FiClock;
  };

  const handleViewBooking = (booking) => {
    setSelectedBooking(booking);
    setShowBookingModal(true);
  };

  const handleUpdateStatus = (bookingId, status) => {
    updateBookingStatusMutation.mutate({ id: bookingId, status });
  };

  const handleDeleteBooking = (bookingId) => {
    if (window.confirm('Are you sure you want to delete this booking? This action cannot be undone.')) {
      deleteBookingMutation.mutate(bookingId);
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
          <h1 className="text-3xl font-bold text-gray-900">Speaking Bookings</h1>
          <p className="mt-2 text-gray-600">
            Manage speaking test bookings and schedules
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button className="btn-secondary flex items-center space-x-2">
            <FiCalendar className="w-4 h-4" />
            <span>Export Schedule</span>
          </button>
          <button className="btn-primary flex items-center space-x-2">
            <FiMic className="w-4 h-4" />
            <span>Add Booking</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="dashboard-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900">
                {bookingsData?.stats?.totalBookings || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiMic className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Bookings</p>
              <p className="text-2xl font-bold text-gray-900">
                {bookingsData?.stats?.todayBookings || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FiCalendar className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {bookingsData?.stats?.pendingBookings || 0}
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
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {bookingsData?.stats?.completedBookings || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FiCheck className="w-6 h-6 text-purple-600" />
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
                placeholder="Search bookings..."
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
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="rescheduled">Rescheduled</option>
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input-field"
            />
          </div>
        </div>
      </div>

      {/* Bookings List */}
      <div className="dashboard-card">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Student</th>
                <th className="table-header-cell">Date & Time</th>
                <th className="table-header-cell">Duration</th>
                <th className="table-header-cell">Status</th>
                <th className="table-header-cell">Examiner</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {bookingsData?.bookings?.map((booking) => {
                const StatusIcon = getStatusIcon(booking.status);
                
                return (
                  <tr key={booking._id} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <FiUser className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {booking.studentName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {booking.studentEmail}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="text-sm text-gray-900">
                        {new Date(booking.scheduledDate).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(booking.scheduledDate).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="text-sm font-medium text-gray-900">
                        {booking.duration} minutes
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center space-x-2">
                        <StatusIcon className="w-4 h-4" />
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="text-sm text-gray-900">
                        {booking.examinerName || 'Not assigned'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {booking.examinerEmail || ''}
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewBooking(booking)}
                          className="p-1 text-blue-600 hover:text-blue-700"
                          title="View Booking"
                        >
                          <FiEye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteBooking(booking._id)}
                          className="p-1 text-red-600 hover:text-red-700"
                          title="Delete Booking"
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

          {bookingsData?.bookings?.length === 0 && (
            <div className="text-center py-8">
              <FiMic className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
              <p className="text-gray-500">
                {searchTerm || selectedStatus !== 'all' || selectedDate
                  ? 'Try adjusting your search criteria or filters'
                  : 'No speaking test bookings have been made yet'
                }
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {bookingsData?.pagination && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-700">
              Showing {bookingsData.pagination.startIndex + 1} to {bookingsData.pagination.endIndex} of {bookingsData.pagination.total} results
            </div>
            <div className="flex items-center space-x-2">
              <button className="btn-secondary">
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page 1 of {bookingsData.pagination.totalPages}
              </span>
              <button className="btn-secondary">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      {showBookingModal && selectedBooking && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Booking #{selectedBooking.bookingNumber}
                  </h3>
                  <button
                    onClick={() => setShowBookingModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FiX className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Student Information</h4>
                      <p className="text-sm text-gray-600">Name: {selectedBooking.studentName}</p>
                      <p className="text-sm text-gray-600">Email: {selectedBooking.studentEmail}</p>
                      <p className="text-sm text-gray-600">Phone: {selectedBooking.studentPhone || 'N/A'}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Booking Details</h4>
                      <p className="text-sm text-gray-600">Date: {new Date(selectedBooking.scheduledDate).toLocaleDateString()}</p>
                      <p className="text-sm text-gray-600">Time: {new Date(selectedBooking.scheduledDate).toLocaleTimeString()}</p>
                      <p className="text-sm text-gray-600">Duration: {selectedBooking.duration} minutes</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-700">
                        {selectedBooking.notes || 'No notes provided'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <h4 className="font-medium text-gray-900">Update Status:</h4>
                    <select
                      defaultValue={selectedBooking.status}
                      onChange={(e) => handleUpdateStatus(selectedBooking._id, e.target.value)}
                      className="input-field"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="rescheduled">Rescheduled</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
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

export default AdminSpeakingBookings; 