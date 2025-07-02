import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { adminAPI } from '../../services/api';
import { 
  FiUsers, FiBookOpen, FiFileText, FiCalendar, FiMessageSquare,
  FiTrendingUp, FiDollarSign, FiAward, FiBarChart3
} from 'react-icons/fi';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AdminDashboard = () => {
  // Fetch admin stats
  const { data: stats, isLoading } = useQuery(
    ['admin-stats'],
    () => adminAPI.getStats(),
    { staleTime: 5 * 60 * 1000 }
  );

  const quickActions = [
    {
      title: 'Manage Users',
      description: 'View and manage user accounts',
      icon: FiUsers,
      href: '/admin/users',
      color: 'blue'
    },
    {
      title: 'Manage Exams',
      description: 'Create and edit practice tests',
      icon: FiBookOpen,
      href: '/admin/exams',
      color: 'green'
    },
    {
      title: 'Review Submissions',
      description: 'Grade and review exam submissions',
      icon: FiFileText,
      href: '/admin/submissions',
      color: 'yellow'
    },
    {
      title: 'Speaking Bookings',
      description: 'Manage speaking test schedules',
      icon: FiCalendar,
      href: '/admin/speaking-bookings',
      color: 'purple'
    },
    {
      title: 'Support Tickets',
      description: 'Handle user support requests',
      icon: FiMessageSquare,
      href: '/admin/support',
      color: 'red'
    },
    {
      title: 'Analytics',
      description: 'View detailed analytics and reports',
      icon: FiBarChart3,
      href: '/admin/analytics',
      color: 'indigo'
    }
  ];

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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Manage your IELTS simulator platform
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="dashboard-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.totalUsers || '1,234'}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiUsers className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-sm font-medium text-green-600">+12%</span>
            <span className="text-sm text-gray-500 ml-1">from last month</span>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Exams</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.activeExams || '45'}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FiBookOpen className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-sm font-medium text-green-600">+5%</span>
            <span className="text-sm text-gray-500 ml-1">from last month</span>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.pendingReviews || '23'}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <FiFileText className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-sm font-medium text-red-600">+8%</span>
            <span className="text-sm text-gray-500 ml-1">from last month</span>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ${stats?.revenue || '12,345'}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FiDollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-sm font-medium text-green-600">+15%</span>
            <span className="text-sm text-gray-500 ml-1">from last month</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="dashboard-card">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link
                key={index}
                to={action.href}
                className={`block p-4 rounded-lg border border-gray-200 hover:border-${action.color}-300 hover:shadow-md transition-all duration-200`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 bg-${action.color}-100 rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 text-${action.color}-600`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{action.title}</h3>
                    <p className="text-sm text-gray-500">{action.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="dashboard-card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Users</h2>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((user, index) => (
              <div key={index} className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">User {user}</p>
                  <p className="text-xs text-gray-500">user{user}@example.com</p>
                </div>
                <span className="text-xs text-gray-400">2 hours ago</span>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Submissions</h2>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((submission, index) => (
              <div key={index} className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FiFileText className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">IELTS Practice Test {submission}</p>
                  <p className="text-xs text-gray-500">Score: 7.5</p>
                </div>
                <span className="text-xs text-gray-400">1 hour ago</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 