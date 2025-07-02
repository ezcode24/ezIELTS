import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { adminAPI } from '../../services/api';
import { 
  FiTrendingUp, FiTrendingDown, FiUsers, FiBookOpen, FiDollarSign,
  FiCalendar, FiClock, FiBarChart3, FiPieChart, FiActivity,
  FiHeadphones, FiEye, FiEdit, FiMic, FiDownload, FiRefreshCw
} from 'react-icons/fi';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AdminAnalytics = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedModule, setSelectedModule] = useState('all');

  // Fetch analytics data
  const { data: analyticsData, isLoading, refetch } = useQuery(
    ['admin-analytics', selectedPeriod, selectedModule],
    () => adminAPI.getAnalytics({
      period: selectedPeriod,
      module: selectedModule !== 'all' ? selectedModule : undefined,
    }),
    { staleTime: 5 * 60 * 1000 }
  );

  const getModuleIcon = (module) => {
    const icons = {
      listening: FiHeadphones,
      reading: FiEye,
      writing: FiEdit,
      speaking: FiMic
    };
    return icons[module] || FiBarChart3;
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

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
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
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Comprehensive insights and performance metrics
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={() => refetch()}
            className="btn-secondary flex items-center space-x-2"
          >
            <FiRefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <button className="btn-primary flex items-center space-x-2">
            <FiDownload className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="dashboard-card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time Period</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="input-field"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="1y">Last Year</option>
              <option value="all">All Time</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Module</label>
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
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="dashboard-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(analyticsData?.metrics?.totalUsers || 0)}
              </p>
              <div className="flex items-center mt-2">
                {analyticsData?.metrics?.userGrowth > 0 ? (
                  <FiTrendingUp className="w-4 h-4 text-green-600 mr-1" />
                ) : (
                  <FiTrendingDown className="w-4 h-4 text-red-600 mr-1" />
                )}
                <span className={`text-sm ${
                  analyticsData?.metrics?.userGrowth > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {Math.abs(analyticsData?.metrics?.userGrowth || 0)}%
                </span>
                <span className="text-sm text-gray-500 ml-1">vs last period</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiUsers className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Exams</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(analyticsData?.metrics?.totalExams || 0)}
              </p>
              <div className="flex items-center mt-2">
                {analyticsData?.metrics?.examGrowth > 0 ? (
                  <FiTrendingUp className="w-4 h-4 text-green-600 mr-1" />
                ) : (
                  <FiTrendingDown className="w-4 h-4 text-red-600 mr-1" />
                )}
                <span className={`text-sm ${
                  analyticsData?.metrics?.examGrowth > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {Math.abs(analyticsData?.metrics?.examGrowth || 0)}%
                </span>
                <span className="text-sm text-gray-500 ml-1">vs last period</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FiBookOpen className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(analyticsData?.metrics?.totalRevenue || 0)}
              </p>
              <div className="flex items-center mt-2">
                {analyticsData?.metrics?.revenueGrowth > 0 ? (
                  <FiTrendingUp className="w-4 h-4 text-green-600 mr-1" />
                ) : (
                  <FiTrendingDown className="w-4 h-4 text-red-600 mr-1" />
                )}
                <span className={`text-sm ${
                  analyticsData?.metrics?.revenueGrowth > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {Math.abs(analyticsData?.metrics?.revenueGrowth || 0)}%
                </span>
                <span className="text-sm text-gray-500 ml-1">vs last period</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <FiDollarSign className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Score</p>
              <p className="text-2xl font-bold text-gray-900">
                {analyticsData?.metrics?.averageScore || 'N/A'}
              </p>
              <div className="flex items-center mt-2">
                {analyticsData?.metrics?.scoreGrowth > 0 ? (
                  <FiTrendingUp className="w-4 h-4 text-green-600 mr-1" />
                ) : (
                  <FiTrendingDown className="w-4 h-4 text-red-600 mr-1" />
                )}
                <span className={`text-sm ${
                  analyticsData?.metrics?.scoreGrowth > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {Math.abs(analyticsData?.metrics?.scoreGrowth || 0)}%
                </span>
                <span className="text-sm text-gray-500 ml-1">vs last period</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FiBarChart3 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="dashboard-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth</h3>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <FiBarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Chart will be implemented with Chart.js or Recharts</p>
            </div>
          </div>
        </div>

        {/* Module Performance */}
        <div className="dashboard-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Module Performance</h3>
          <div className="space-y-4">
            {analyticsData?.modulePerformance?.map((module) => {
              const ModuleIcon = getModuleIcon(module.name);
              const moduleColor = getModuleColor(module.name);
              
              return (
                <div key={module.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 bg-${moduleColor}-100 rounded-lg flex items-center justify-center`}>
                      <ModuleIcon className={`w-4 h-4 text-${moduleColor}-600`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {module.name.charAt(0).toUpperCase() + module.name.slice(1)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {module.attempts} attempts
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {module.averageScore}
                    </p>
                    <p className="text-sm text-gray-500">
                      {module.successRate}% success
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Performing Exams */}
        <div className="dashboard-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Exams</h3>
          <div className="space-y-3">
            {analyticsData?.topExams?.map((exam, index) => (
              <div key={exam._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 line-clamp-1">
                      {exam.title}
                    </p>
                    <p className="text-sm text-gray-500">
                      {exam.module} • {exam.attempts} attempts
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    {exam.averageScore}
                  </p>
                  <p className="text-sm text-gray-500">
                    {exam.successRate}% success
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="dashboard-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {analyticsData?.recentActivity?.map((activity) => (
              <div key={activity._id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <FiActivity className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Insights */}
        <div className="dashboard-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Insights</h3>
          <div className="space-y-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900 mb-1">Strongest Area</h4>
              <p className="text-sm text-green-700">
                {analyticsData?.insights?.strongestArea || 'Reading'} module shows the highest success rate
              </p>
            </div>
            
            <div className="p-3 bg-yellow-50 rounded-lg">
              <h4 className="font-medium text-yellow-900 mb-1">Needs Attention</h4>
              <p className="text-sm text-yellow-700">
                {analyticsData?.insights?.weakestArea || 'Writing'} module requires improvement
              </p>
            </div>
            
            <div className="p-3 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-1">Trend</h4>
              <p className="text-sm text-blue-700">
                {analyticsData?.insights?.trend || 'Overall performance is improving'} over time
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="dashboard-card">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <FiClock className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-sm font-medium text-gray-600">Avg Study Time</p>
            <p className="text-2xl font-bold text-gray-900">
              {analyticsData?.metrics?.averageStudyTime || 0}h
            </p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <FiUsers className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-sm font-medium text-gray-600">Active Users</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatNumber(analyticsData?.metrics?.activeUsers || 0)}
            </p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <FiBookOpen className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-sm font-medium text-gray-600">Completed Exams</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatNumber(analyticsData?.metrics?.completedExams || 0)}
            </p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="text-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <FiDollarSign className="w-6 h-6 text-yellow-600" />
            </div>
            <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
            <p className="text-2xl font-bold text-gray-900">
              {(analyticsData?.metrics?.conversionRate || 0).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics; 