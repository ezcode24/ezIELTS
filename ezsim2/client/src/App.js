import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ExamProvider } from './contexts/ExamContext';
import { ToastProvider } from './contexts/ToastContext';
import PrivateRoute from './components/auth/PrivateRoute';
import AdminRoute from './components/auth/AdminRoute';
import LoadingSpinner from './components/common/LoadingSpinner';

// Layouts
import Layout from './components/layout/Layout';
import DashboardLayout from './components/layout/DashboardLayout';
import AdminLayout from './components/layout/AdminLayout';

// Public Pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import ExamList from './pages/exams/ExamList';
import ExamDetails from './pages/exams/ExamDetails';
import Pricing from './pages/Pricing';
import About from './pages/About';
import Contact from './pages/Contact';

// User Pages
import Dashboard from './pages/dashboard/Dashboard';
import Profile from './pages/dashboard/Profile';
import Wallet from './pages/dashboard/Wallet';
import ExamHistory from './pages/dashboard/ExamHistory';
import ExamResults from './pages/dashboard/ExamResults';
import SpeakingBookings from './pages/dashboard/SpeakingBookings';
import SupportTickets from './pages/dashboard/SupportTickets';
import Referrals from './pages/dashboard/Referrals';

// Exam Pages
import ExamInterface from './pages/exams/ExamInterface';
import ExamInstructions from './pages/exam/ExamInstructions';
import SpeakingTest from './pages/exam/SpeakingTest';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminExams from './pages/admin/AdminExams';
import AdminQuestions from './pages/admin/AdminQuestions';
import AdminSubmissions from './pages/admin/AdminSubmissions';
import AdminSpeakingBookings from './pages/admin/AdminSpeakingBookings';
import AdminSupport from './pages/admin/AdminSupport';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminSettings from './pages/admin/AdminSettings';

// Error Pages
import NotFound from './pages/errors/NotFound';
import Unauthorized from './pages/errors/Unauthorized';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ExamProvider>
          <ToastProvider>
            <Router>
              <div className="App">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Layout />}>
                    <Route index element={<Home />} />
                    <Route path="login" element={<Login />} />
                    <Route path="register" element={<Register />} />
                    <Route path="forgot-password" element={<ForgotPassword />} />
                    <Route path="reset-password/:token" element={<ResetPassword />} />
                    <Route path="exams" element={<ExamList />} />
                    <Route path="exams/:id" element={<ExamDetails />} />
                    <Route path="pricing" element={<Pricing />} />
                    <Route path="about" element={<About />} />
                    <Route path="contact" element={<Contact />} />
                  </Route>

                  {/* Protected Dashboard Routes */}
                  <Route
                    path="/dashboard"
                    element={
                      <PrivateRoute>
                        <DashboardLayout />
                      </PrivateRoute>
                    }
                  >
                    <Route index element={<Dashboard />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="wallet" element={<Wallet />} />
                    <Route path="exam-history" element={<ExamHistory />} />
                    <Route path="exam-results/:submissionId" element={<ExamResults />} />
                    <Route path="speaking-bookings" element={<SpeakingBookings />} />
                    <Route path="support" element={<SupportTickets />} />
                    <Route path="referrals" element={<Referrals />} />
                  </Route>

                  {/* Protected Exam Routes */}
                  <Route
                    path="/exams/:examId"
                    element={
                      <PrivateRoute>
                        <ExamInterface />
                      </PrivateRoute>
                    }
                  />

                  {/* Admin Routes */}
                  <Route
                    path="/admin"
                    element={
                      <AdminRoute>
                        <AdminLayout />
                      </AdminRoute>
                    }
                  >
                    <Route index element={<AdminDashboard />} />
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="exams" element={<AdminExams />} />
                    <Route path="questions" element={<AdminQuestions />} />
                    <Route path="submissions" element={<AdminSubmissions />} />
                    <Route path="speaking-bookings" element={<AdminSpeakingBookings />} />
                    <Route path="support" element={<AdminSupport />} />
                    <Route path="analytics" element={<AdminAnalytics />} />
                    <Route path="settings" element={<AdminSettings />} />
                  </Route>

                  {/* Error Routes */}
                  <Route path="/unauthorized" element={<Unauthorized />} />
                  <Route path="/404" element={<NotFound />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>

                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: '#363636',
                      color: '#fff',
                    },
                    success: {
                      duration: 3000,
                      iconTheme: {
                        primary: '#10B981',
                        secondary: '#fff',
                      },
                    },
                    error: {
                      duration: 5000,
                      iconTheme: {
                        primary: '#EF4444',
                        secondary: '#fff',
                      },
                    },
                  }}
                />
              </div>
            </Router>
          </ToastProvider>
        </ExamProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App; 