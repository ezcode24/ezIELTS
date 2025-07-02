import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { adminAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { 
  FiSearch, FiFilter, FiUsers, FiMail, FiCalendar, FiEye, 
  FiEdit, FiTrash2, FiShield, FiCheck, FiX, FiMoreVertical,
  FiDownload, FiUserPlus, FiLock, FiUnlock
} from 'react-icons/fi';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AdminUsers = () => {
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedPage, setSelectedPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);

  // Fetch users
  const { data: usersData, isLoading } = useQuery(
    ['admin-users', searchTerm, selectedStatus, selectedRole, selectedPage],
    () => adminAPI.getUsers({
      search: searchTerm,
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
      role: selectedRole !== 'all' ? selectedRole : undefined,
      page: selectedPage,
      limit: 20
    }),
    { staleTime: 2 * 60 * 1000 }
  );

  // Update user mutation
  const updateUserMutation = useMutation(
    (data) => adminAPI.updateUser(data.id, data.userData),
    {
      onSuccess: () => {
        showSuccess('User updated successfully!');
        queryClient.invalidateQueries(['admin-users']);
        setShowUserModal(false);
      },
      onError: (error) => {
        showError('Failed to update user. Please try again.');
      }
    }
  );

  // Delete user mutation
  const deleteUserMutation = useMutation(
    (userId) => adminAPI.deleteUser(userId),
    {
      onSuccess: () => {
        showSuccess('User deleted successfully!');
        queryClient.invalidateQueries(['admin-users']);
      },
      onError: (error) => {
        showError('Failed to delete user. Please try again.');
      }
    }
  );

  // Toggle user status mutation
  const toggleUserStatusMutation = useMutation(
    (userId) => adminAPI.toggleUserStatus(userId),
    {
      onSuccess: () => {
        showSuccess('User status updated successfully!');
        queryClient.invalidateQueries(['admin-users']);
      },
      onError: (error) => {
        showError('Failed to update user status. Please try again.');
      }
    }
  );

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-red-100 text-red-800',
      suspended: 'bg-yellow-100 text-yellow-800',
      pending: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || colors.pending;
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-800',
      user: 'bg-blue-100 text-blue-800',
      moderator: 'bg-orange-100 text-orange-800'
    };
    return colors[role] || colors.user;
  };

  const handleUpdateUser = (userData) => {
    updateUserMutation.mutate({
      id: selectedUser._id,
      userData
    });
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleToggleStatus = (userId) => {
    toggleUserStatusMutation.mutate(userId);
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
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="mt-2 text-gray-600">
            Manage user accounts, permissions, and access
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button className="btn-secondary flex items-center space-x-2">
            <FiDownload className="w-4 h-4" />
            <span>Export Users</span>
          </button>
          <button className="btn-primary flex items-center space-x-2">
            <FiUserPlus className="w-4 h-4" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="dashboard-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {usersData?.stats?.totalUsers || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiUsers className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {usersData?.stats?.activeUsers || 0}
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
              <p className="text-sm font-medium text-gray-600">New This Month</p>
              <p className="text-2xl font-bold text-gray-900">
                {usersData?.stats?.newThisMonth || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FiUserPlus className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Premium Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {usersData?.stats?.premiumUsers || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <FiShield className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="dashboard-card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search users by name, email..."
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
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="input-field"
            >
              <option value="all">All Roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="moderator">Moderator</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="dashboard-card">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">User</th>
                <th className="table-header-cell">Email</th>
                <th className="table-header-cell">Role</th>
                <th className="table-header-cell">Status</th>
                <th className="table-header-cell">Joined</th>
                <th className="table-header-cell">Last Active</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {usersData?.users?.map((user) => (
                <tr key={user._id} className="table-row">
                  <td className="table-cell">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-sm text-gray-500">ID: {user._id.slice(-8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center space-x-2">
                      <FiMail className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">{user.email}</span>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                      {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center space-x-2">
                      <FiCalendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className="text-sm text-gray-500">
                      {user.lastActive ? new Date(user.lastActive).toLocaleDateString() : 'Never'}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowUserModal(true);
                        }}
                        className="p-1 text-blue-600 hover:text-blue-700"
                        title="View Details"
                      >
                        <FiEye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(user._id)}
                        className={`p-1 ${
                          user.status === 'active' 
                            ? 'text-red-600 hover:text-red-700' 
                            : 'text-green-600 hover:text-green-700'
                        }`}
                        title={user.status === 'active' ? 'Suspend User' : 'Activate User'}
                      >
                        {user.status === 'active' ? (
                          <FiLock className="w-4 h-4" />
                        ) : (
                          <FiUnlock className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user._id)}
                        className="p-1 text-red-600 hover:text-red-700"
                        title="Delete User"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {usersData?.users?.length === 0 && (
            <div className="text-center py-8">
              <FiUsers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-500">
                {searchTerm || selectedStatus !== 'all' || selectedRole !== 'all'
                  ? 'Try adjusting your search criteria or filters'
                  : 'No users have registered yet'
                }
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {usersData?.pagination && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-700">
              Showing {usersData.pagination.startIndex + 1} to {usersData.pagination.endIndex} of {usersData.pagination.total} results
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSelectedPage(selectedPage - 1)}
                disabled={selectedPage === 1}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {selectedPage} of {usersData.pagination.totalPages}
              </span>
              <button
                onClick={() => setSelectedPage(selectedPage + 1)}
                disabled={selectedPage === usersData.pagination.totalPages}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">User Details</h3>
                  <button
                    onClick={() => setShowUserModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FiX className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      defaultValue={`${selectedUser.firstName} ${selectedUser.lastName}`}
                      className="input-field mt-1"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      defaultValue={selectedUser.email}
                      className="input-field mt-1"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <select
                      defaultValue={selectedUser.role}
                      className="input-field mt-1"
                    >
                      <option value="user">User</option>
                      <option value="moderator">Moderator</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      defaultValue={selectedUser.status}
                      className="input-field mt-1"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => handleUpdateUser(selectedUser)}
                  disabled={updateUserMutation.isLoading}
                  className="btn-primary sm:ml-3 sm:w-auto"
                >
                  {updateUserMutation.isLoading ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <FiSave className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
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

export default AdminUsers; 