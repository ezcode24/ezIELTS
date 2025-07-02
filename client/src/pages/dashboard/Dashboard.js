import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { useAuth } from '../../contexts/AuthContext';
import { userAPI, examAPI } from '../../services/api';
import { 
  FiBookOpen, FiClock, FiTrendingUp, FiAward, FiCalendar, 
  FiHeadphones, FiEye, FiEdit, FiMic, FiArrowRight, FiPlus
} from 'react-icons/fi';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const Dashboard = () => {
  const { user } = useAuth();

  // Fetch user stats and recent activity
  const { data: walletData, isLoading: walletLoading } = useQuery(
    ['wallet'],
    () => userAPI.getWallet(),
    { staleTime: 5 * 60 * 1000 }
  );

  const { data: recentExams, isLoading: examsLoading } = useQuery(
    ['recent-exams'],
    () => examAPI.getExams({ limit: 5, featured: true }),
    { staleTime: 5 * 60 * 1000 }
  );

  const { data: examHistory, isLoading: historyLoading } = useQuery(
    ['exam-history'],
    () => userAPI.getTransactions({ type: 'exam', limit: 5 }),
    { staleTime: 5 * 60 * 1000 }
  );

  // Mock data for demonstration
  const stats = [
    {
      title: 'Total Exams Taken',
      value: '12',
      change: '+3',
      changeType: 'positive',
      icon: FiBookOpen,
      color: 'blue'
    },
    {
      title: 'Average Score',
      value: '7.2',
      change: '+0.5',
      changeType: 'positive',
      icon: FiTrendingUp,
      color: 'green'
    },
    {
      title: 'Study Hours',
      value: '48',
      change: '+12',
      changeType: 'positive',
      icon: FiClock,
      color: 'purple'
    },
    {
      title: 'Wallet Balance',
      value: `$${walletData?.balance || '0.00'}`,
      change: '+$25.00',
      changeType: 'positive',
      icon: FiAward,
      color: 'yellow'
    }
  ];

  const moduleProgress = [
    { name: 'Listening', score: 8.5, color: 'blue', icon: FiHeadphones },
    { name: 'Reading', score: 7.8, color: 'green', icon: FiEye },
    { name: 'Writing', score: 7.2, color: 'yellow', icon: FiEdit },
    { name: 'Speaking', score: 8.0, color: 'purple', icon: FiMic }
  ];

  const quickActions = [
    {
      title: 'Take Practice Test',
      description: 'Start a new IELTS practice test',
      icon: FiPlus,
      href: '/exams',
      color: 'blue'
    },
    {
      title: 'Book Speaking Test',
      description: 'Schedule a speaking test with an examiner',
      icon: FiCalendar,
      href: '/dashboard/speaking-bookings',
      color: 'purple'
    },
    {
      title: 'View Progress',
      description: 'Check your detailed performance analytics',
      icon: FiTrendingUp,
      href: '/dashboard/exam-history',
      color: 'green'
    }
  ];

  if (walletLoading || examsLoading || historyLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Welcome back, {user?.name?.split(' ')[0] || 'Student'}! 👋
            </h1>
            <p className="text-blue-100">
              Ready to continue your IELTS preparation journey?
            </p>
          </div>
          <div className="hidden md:block">
            <div className="text-right">
              <p className="text-sm text-blue-200">Current Level</p>
              <p className="text-2xl font-bold">Band 7.0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="dashboard-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className={`text-sm font-medium ${
                  stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </span>
                <span className="text-sm text-gray-500 ml-1">from last month</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Module Progress */}
        <div className="lg:col-span-2">
          <div className="dashboard-card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Module Progress</h2>
              <Link
                to="/dashboard/exam-history"
                className="text-sm text-blue-600 hover:text-blue-500 font-medium"
              >
                View Details
              </Link>
            </div>
            <div className="space-y-4">
              {moduleProgress.map((module, index) => {
                const Icon = module.icon;
                return (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 bg-${module.color}-100 rounded-lg flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 text-${module.color}-600`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{module.name}</p>
                        <p className="text-sm text-gray-500">Target: 7.0</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">{module.score}</p>
                      <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className={`bg-${module.color}-600 h-2 rounded-full`}
                          style={{ width: `${(module.score / 9) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <div className="dashboard-card">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h2>
            <div className="space-y-4">
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
                      <FiArrowRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Exams */}
        <div className="dashboard-card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Recent Exams</h2>
            <Link
              to="/exams"
              className="text-sm text-blue-600 hover:text-blue-500 font-medium"
            >
              View All
            </Link>
          </div>
          <div className="space-y-4">
            {recentExams?.slice(0, 3).map((exam, index) => (
              <div key={index} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FiBookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{exam.title}</h3>
                  <p className="text-sm text-gray-500">{exam.duration} minutes</p>
                </div>
                <Link
                  to={`/exams/${exam._id}`}
                  className="btn-primary text-sm px-3 py-1"
                >
                  Start
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Results */}
        <div className="dashboard-card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Recent Results</h2>
            <Link
              to="/dashboard/exam-history"
              className="text-sm text-blue-600 hover:text-blue-500 font-medium"
            >
              View All
            </Link>
          </div>
          <div className="space-y-4">
            {examHistory?.slice(0, 3).map((result, index) => (
              <div key={index} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <FiAward className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{result.examTitle || 'IELTS Practice Test'}</h3>
                  <p className="text-sm text-gray-500">
                    Score: {result.score || '7.5'} • {new Date(result.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-gray-900">
                    {result.score || '7.5'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Study Tips */}
      <div className="dashboard-card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Study Tip</h2>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">
            <strong>Listening Tip:</strong> Practice active listening by taking notes while listening to audio. 
            Focus on key words and phrases that might appear in questions. This will help improve your 
            comprehension and note-taking skills for the actual exam.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 