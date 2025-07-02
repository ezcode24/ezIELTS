import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/auth/me'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  changePassword: (passwordData) => api.put('/auth/change-password', passwordData),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
  verifyEmail: (token) => api.post(`/auth/verify-email/${token}`),
  resendVerification: () => api.post('/auth/resend-verification'),
  refreshToken: () => api.post('/auth/refresh-token'),
};

// User API
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (profileData) => api.put('/users/profile', profileData),
  getWallet: () => api.get('/users/wallet'),
  getTransactions: (params) => api.get('/users/transactions', { params }),
  getReferrals: () => api.get('/users/referrals'),
  getReferralStats: () => api.get('/users/referral-stats'),
  generateReferralCode: () => api.post('/users/referral-code'),
};

// Exam API
export const examAPI = {
  getExams: (params) => api.get('/exams', { params }),
  getExam: (id) => api.get(`/exams/${id}`),
  getExamModules: (module) => api.get(`/exams/modules/${module}`),
  getFeaturedExams: () => api.get('/exams/featured'),
  getPopularExams: () => api.get('/exams/popular'),
  startExam: (id) => api.post(`/exams/${id}/start`),
  getExamQuestions: (id) => api.get(`/exams/${id}/questions`),
  submitExam: (id, answers) => api.post(`/exams/${id}/submit`, { answers }),
  getExamResult: (id) => api.get(`/exams/${id}/result`),
};

// Question API
export const questionAPI = {
  getQuestions: (params) => api.get('/questions', { params }),
  getQuestion: (id) => api.get(`/questions/${id}`),
  createQuestion: (questionData) => api.post('/questions', questionData),
  updateQuestion: (id, questionData) => api.put(`/questions/${id}`, questionData),
  deleteQuestion: (id) => api.delete(`/questions/${id}`),
  bulkCreateQuestions: (questions) => api.post('/questions/bulk', { questions }),
  importQuestions: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/questions/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Submission API
export const submissionAPI = {
  getSubmissions: (params) => api.get('/submissions', { params }),
  getSubmission: (id) => api.get(`/submissions/${id}`),
  getSubmissionResult: (id) => api.get(`/submissions/${id}/result`),
  getSubmissionAnalytics: (id) => api.get(`/submissions/${id}/analytics`),
  exportSubmission: (id, format) => api.get(`/submissions/${id}/export`, { 
    params: { format },
    responseType: 'blob'
  }),
};

// Speaking API
export const speakingAPI = {
  bookSpeakingTest: (bookingData) => api.post('/speaking/book', bookingData),
  getBookings: (params) => api.get('/speaking/bookings', { params }),
  getBooking: (id) => api.get(`/speaking/bookings/${id}`),
  rescheduleBooking: (id, rescheduleData) => api.put(`/speaking/bookings/${id}/reschedule`, rescheduleData),
  cancelBooking: (id, reason) => api.post(`/speaking/bookings/${id}/cancel`, { reason }),
  getAvailableSlots: (params) => api.get('/speaking/available-slots', { params }),
  addToGoogleCalendar: (id) => api.post(`/speaking/google-calendar/${id}`),
};

// Payment API
export const paymentAPI = {
  createPayment: (paymentData) => api.post('/payments/create', paymentData),
  processPayment: (paymentId, paymentData) => api.post(`/payments/${paymentId}/process`, paymentData),
  getPaymentHistory: (params) => api.get('/payments/history', { params }),
  getPayment: (id) => api.get(`/payments/${id}`),
  refundPayment: (id, reason) => api.post(`/payments/${id}/refund`, { reason }),
  getPaymentMethods: () => api.get('/payments/methods'),
  addPaymentMethod: (methodData) => api.post('/payments/methods', methodData),
  removePaymentMethod: (id) => api.delete(`/payments/methods/${id}`),
};

// Support API
export const supportAPI = {
  createTicket: (ticketData) => api.post('/support/tickets', ticketData),
  getTickets: (params) => api.get('/support/tickets', { params }),
  getTicket: (id) => api.get(`/support/tickets/${id}`),
  updateTicket: (id, updateData) => api.put(`/support/tickets/${id}`, updateData),
  closeTicket: (id) => api.post(`/support/tickets/${id}/close`),
  addTicketReply: (id, replyData) => api.post(`/support/tickets/${id}/replies`, replyData),
  getTicketReplies: (id) => api.get(`/support/tickets/${id}/replies`),
  uploadAttachment: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/support/tickets/${id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Admin API
export const adminAPI = {
  // User Management
  getUsers: (params) => api.get('/admin/users', { params }),
  getUser: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, userData) => api.put(`/admin/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  banUser: (id, reason) => api.post(`/admin/users/${id}/ban`, { reason }),
  unbanUser: (id) => api.post(`/admin/users/${id}/unban`),
  getUserStats: () => api.get('/admin/users/stats'),

  // Exam Management
  createExam: (examData) => api.post('/admin/exams', examData),
  updateExam: (id, examData) => api.put(`/admin/exams/${id}`, examData),
  deleteExam: (id) => api.delete(`/admin/exams/${id}`),
  publishExam: (id) => api.post(`/admin/exams/${id}/publish`),
  archiveExam: (id) => api.post(`/admin/exams/${id}/archive`),
  getExamStats: () => api.get('/admin/exams/statistics'),

  // Question Management
  getQuestions: (params) => api.get('/admin/questions', { params }),
  getQuestion: (id) => api.get(`/admin/questions/${id}`),
  createQuestion: (questionData) => api.post('/admin/questions', questionData),
  updateQuestion: (id, questionData) => api.put(`/admin/questions/${id}`, questionData),
  deleteQuestion: (id) => api.delete(`/admin/questions/${id}`),
  bulkCreateQuestions: (questions) => api.post('/admin/questions/bulk', { questions }),
  importQuestions: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/admin/questions/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Submission Management
  getSubmissions: (params) => api.get('/admin/submissions', { params }),
  getSubmission: (id) => api.get(`/admin/submissions/${id}`),
  gradeSubmission: (id, grades) => api.post(`/admin/submissions/${id}/grade`, grades),
  getSubmissionStats: () => api.get('/admin/submissions/statistics'),

  // Speaking Management
  getSpeakingBookings: (params) => api.get('/admin/speaking/bookings', { params }),
  getSpeakingBooking: (id) => api.get(`/admin/speaking/bookings/${id}`),
  assignExaminer: (id, examinerId) => api.put(`/admin/speaking/bookings/${id}/assign-examiner`, { examinerId }),
  updateMeetingDetails: (id, meetingData) => api.put(`/admin/speaking/bookings/${id}/update-meeting`, meetingData),
  gradeSpeakingTest: (id, results) => api.post(`/admin/speaking/bookings/${id}/grade`, results),
  getSpeakingStats: () => api.get('/admin/speaking/statistics'),

  // Support Management
  getSupportTickets: (params) => api.get('/admin/support/tickets', { params }),
  getSupportTicket: (id) => api.get(`/admin/support/tickets/${id}`),
  updateSupportTicket: (id, updateData) => api.put(`/admin/support/tickets/${id}`, updateData),
  assignTicket: (id, agentId) => api.post(`/admin/support/tickets/${id}/assign`, { agentId }),
  addTicketReply: (id, replyData) => api.post(`/admin/support/tickets/${id}/replies`, replyData),
  getSupportStats: () => api.get('/admin/support/statistics'),

  // Analytics
  getDashboardStats: () => api.get('/admin/analytics/dashboard'),
  getRevenueStats: (params) => api.get('/admin/analytics/revenue', { params }),
  getExamAnalytics: (params) => api.get('/admin/analytics/exams', { params }),
  getUserAnalytics: (params) => api.get('/admin/analytics/users', { params }),
  getPerformanceStats: (params) => api.get('/admin/analytics/performance', { params }),
  exportAnalytics: (type, params) => api.get(`/admin/analytics/export/${type}`, { 
    params,
    responseType: 'blob'
  }),
};

// File Upload API
export const uploadAPI = {
  uploadFile: (file, type) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    return api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteFile: (fileId) => api.delete(`/upload/${fileId}`),
};

// Health Check
export const healthAPI = {
  checkHealth: () => api.get('/health'),
};

export default api; 