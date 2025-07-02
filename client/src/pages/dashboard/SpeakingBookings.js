import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { userAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { 
  FiCalendar, FiClock, FiMic, FiPlus, FiEdit, FiTrash2, 
  FiCheck, FiX, FiUser, FiMail, FiPhone, FiMapPin,
  FiCheckCircle, FiXCircle, FiAlertCircle, FiClock as FiClockIcon
} from 'react-icons/fi';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const SpeakingBookings = () => {
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedDuration, setSelectedDuration] = useState(15);
  const [notes, setNotes] = useState('');

  // Fetch user's speaking bookings
  const { data: bookingsData, isLoading } = useQuery(
    ['user-speaking-bookings'],
    () => userAPI.getSpeakingBookings(),
    { staleTime: 2 * 60 * 1000 }
  );

  // Create booking mutation
  const createBookingMutation = useMutation(
    (bookingData) => userAPI.createSpeakingBooking(bookingData),
    {
      onSuccess: () => {
        showSuccess('Speaking test booked successfully!');
        queryClient.invalidateQueries(['user-speaking-bookings']);
        setShowBookingModal(false);
        resetForm();
      },
      onError: (error) => {
        showError('Failed to book speaking test. Please try again.');
      }
    }
  );

  // Cancel booking mutation
  const cancelBookingMutation = useMutation(
    (bookingId) => userAPI.cancelSpeakingBooking(bookingId),
    {
      onSuccess: () => {
        showSuccess('Booking cancelled successfully!');
        queryClient.invalidateQueries(['user-speaking-bookings']);
      },
      onError: (error) => {
        showError('Failed to cancel booking. Please try again.');
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
      pending: FiClockIcon,
      confirmed: FiCheckCircle,
      completed: FiCheck,
      cancelled: FiXCircle,
      rescheduled: FiAlertCircle
    };
    return icons[status] || FiClockIcon;
  };

  const resetForm = () => {
    setSelectedDate('');
    setSelectedTime('');
    setSelectedDuration(15);
    setNotes('');
  };

  const handleCreateBooking = () => {
    if (!selectedDate || !selectedTime) {
      showError('Please select a date and time for your speaking test.');
      return;
    }

    const scheduledDate = new Date(`${selectedDate}T${selectedTime}`);
    
    createBookingMutation.mutate({
      scheduledDate: scheduledDate.toISOString(),
      duration: selectedDuration,
      notes
    });
  };

  const handleCancelBooking = (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this speaking test booking?')) {
      cancelBookingMutation.mutate(bookingId);
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
          <h1 className="text-3xl font-bold text-gray-900">Speaking Test Bookings</h1>
          <p className="mt-2 text-gray-600">
            Schedule and manage your IELTS speaking test appointments
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setShowBookingModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <FiPlus className="w-4 h-4" />
            <span>Book Speaking Test</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              <p className="text-sm font-medium text-gray-600">Upcoming</p>
              <p className="text-2xl font-bold text-gray-900">
                {bookingsData?.stats?.upcomingBookings || 0}
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

      {/* Bookings List */}
      <div className="dashboard-card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Bookings</h3>
        
        {bookingsData?.bookings?.length > 0 ? (
          <div className="space-y-4">
            {bookingsData.bookings.map((booking) => {
              const StatusIcon = getStatusIcon(booking.status);
              const isUpcoming = new Date(booking.scheduledDate) > new Date();
              
              return (
                <div key={booking._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FiMic className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            Speaking Test #{booking.bookingNumber}
                          </h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className="flex items-center space-x-1">
                              <FiCalendar className="w-4 h-4" />
                              <span>{new Date(booking.scheduledDate).toLocaleDateString()}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <FiClock className="w-4 h-4" />
                              <span>{new Date(booking.scheduledDate).toLocaleTimeString()}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <FiClock className="w-4 h-4" />
                              <span>{booking.duration} minutes</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {booking.notes && (
                        <p className="text-sm text-gray-600 mt-2">
                          <strong>Notes:</strong> {booking.notes}
                        </p>
                      )}
                      
                      {booking.examinerName && (
                        <div className="mt-2 text-sm text-gray-600">
                          <strong>Examiner:</strong> {booking.examinerName}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className="flex items-center space-x-2">
                          <StatusIcon className="w-4 h-4" />
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </span>
                        </div>
                        {isUpcoming && booking.status === 'confirmed' && (
                          <p className="text-xs text-green-600 mt-1">Ready to join</p>
                        )}
                      </div>
                      
                      {isUpcoming && booking.status !== 'cancelled' && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleCancelBooking(booking._id)}
                            className="p-1 text-red-600 hover:text-red-700"
                            title="Cancel Booking"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {booking.status === 'confirmed' && isUpcoming && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <button className="btn-primary w-full">
                        Join Speaking Test
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <FiMic className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
            <p className="text-gray-500 mb-4">
              Book your first speaking test to get started with your IELTS preparation
            </p>
            <button
              onClick={() => setShowBookingModal(true)}
              className="btn-primary"
            >
              Book Your First Test
            </button>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Book Speaking Test</h3>
                  <button
                    onClick={() => setShowBookingModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FiX className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Date
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="input-field"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Time
                    </label>
                    <select
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className="input-field"
                    >
                      <option value="">Select a time</option>
                      <option value="09:00">9:00 AM</option>
                      <option value="10:00">10:00 AM</option>
                      <option value="11:00">11:00 AM</option>
                      <option value="12:00">12:00 PM</option>
                      <option value="13:00">1:00 PM</option>
                      <option value="14:00">2:00 PM</option>
                      <option value="15:00">3:00 PM</option>
                      <option value="16:00">4:00 PM</option>
                      <option value="17:00">5:00 PM</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Test Duration
                    </label>
                    <select
                      value={selectedDuration}
                      onChange={(e) => setSelectedDuration(parseInt(e.target.value))}
                      className="input-field"
                    >
                      <option value={15}>15 minutes</option>
                      <option value={20}>20 minutes</option>
                      <option value={30}>30 minutes</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Notes (Optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="input-field"
                      rows="3"
                      placeholder="Any special requirements or notes..."
                    />
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleCreateBooking}
                  disabled={createBookingMutation.isLoading}
                  className="btn-primary sm:ml-3 sm:w-auto"
                >
                  {createBookingMutation.isLoading ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <FiCheck className="w-4 h-4 mr-2" />
                  )}
                  Book Test
                </button>
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
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

export default SpeakingBookings; 