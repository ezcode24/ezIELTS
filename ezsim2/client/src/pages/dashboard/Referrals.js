import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { userAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { 
  FiUsers, FiShare2, FiGift, FiCopy, FiMail, FiCheck, 
  FiCalendar, FiDollarSign, FiTrendingUp, FiAward,
  FiUserPlus, FiStar, FiGift as FiGiftIcon, FiX
} from 'react-icons/fi';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const Referrals = () => {
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');

  // Fetch user's referral data
  const { data: referralData, isLoading } = useQuery(
    ['user-referrals'],
    () => userAPI.getReferrals(),
    { staleTime: 5 * 60 * 1000 }
  );

  // Send invite mutation
  const sendInviteMutation = useMutation(
    (inviteData) => userAPI.sendReferralInvite(inviteData),
    {
      onSuccess: () => {
        showSuccess('Invitation sent successfully!');
        queryClient.invalidateQueries(['user-referrals']);
        setShowInviteModal(false);
        setInviteEmail('');
        setInviteMessage('');
      },
      onError: (error) => {
        showError('Failed to send invitation. Please try again.');
      }
    }
  );

  const handleSendInvite = () => {
    if (!inviteEmail.trim()) {
      showError('Please enter a valid email address.');
      return;
    }

    sendInviteMutation.mutate({
      email: inviteEmail,
      message: inviteMessage
    });
  };

  const handleCopyReferralLink = () => {
    navigator.clipboard.writeText(referralData?.referralLink || '');
    showSuccess('Referral link copied to clipboard!');
  };

  const handleCopyReferralCode = () => {
    navigator.clipboard.writeText(referralData?.referralCode || '');
    showSuccess('Referral code copied to clipboard!');
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
          <h1 className="text-3xl font-bold text-gray-900">Referral Program</h1>
          <p className="mt-2 text-gray-600">
            Invite friends and earn rewards for every successful referral
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setShowInviteModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <FiShare2 className="w-4 h-4" />
            <span>Invite Friends</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="dashboard-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Referrals</p>
              <p className="text-2xl font-bold text-gray-900">
                {referralData?.stats?.totalReferrals || 0}
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
              <p className="text-sm font-medium text-gray-600">Successful</p>
              <p className="text-2xl font-bold text-gray-900">
                {referralData?.stats?.successfulReferrals || 0}
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
              <p className="text-sm font-medium text-gray-600">Total Earnings</p>
              <p className="text-2xl font-bold text-gray-900">
                ${referralData?.stats?.totalEarnings || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <FiDollarSign className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {referralData?.stats?.pendingReferrals || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FiClock className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Referral Link & Code */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="dashboard-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Referral Link</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={referralData?.referralLink || ''}
                readOnly
                className="input-field flex-1"
              />
              <button
                onClick={handleCopyReferralLink}
                className="btn-secondary flex items-center space-x-2"
              >
                <FiCopy className="w-4 h-4" />
                <span>Copy</span>
              </button>
            </div>
            <p className="text-sm text-gray-600">
              Share this link with your friends to earn rewards when they sign up and make their first purchase.
            </p>
          </div>
        </div>

        <div className="dashboard-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Referral Code</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                <span className="text-lg font-mono font-bold text-gray-900">
                  {referralData?.referralCode || 'REF123'}
                </span>
              </div>
              <button
                onClick={handleCopyReferralCode}
                className="btn-secondary flex items-center space-x-2"
              >
                <FiCopy className="w-4 h-4" />
                <span>Copy</span>
              </button>
            </div>
            <p className="text-sm text-gray-600">
              Friends can also use this code during registration to credit your account.
            </p>
          </div>
        </div>
      </div>

      {/* Rewards Program */}
      <div className="dashboard-card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Rewards Program</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-3">
              <FiUserPlus className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Sign Up Bonus</h4>
            <p className="text-sm text-gray-600 mb-2">When your friend signs up</p>
            <p className="text-lg font-bold text-blue-600">$5 Credit</p>
          </div>

          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-3">
              <FiGift className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">First Purchase</h4>
            <p className="text-sm text-gray-600 mb-2">When they buy their first exam</p>
            <p className="text-lg font-bold text-green-600">$10 Credit</p>
          </div>

          <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mx-auto mb-3">
              <FiAward className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Premium Upgrade</h4>
            <p className="text-sm text-gray-600 mb-2">When they upgrade to premium</p>
            <p className="text-lg font-bold text-purple-600">$25 Credit</p>
          </div>
        </div>
      </div>

      {/* Referral History */}
      <div className="dashboard-card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Referral History</h3>
        
        {referralData?.referrals?.length > 0 ? (
          <div className="space-y-4">
            {referralData.referrals.map((referral) => (
              <div key={referral._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <FiUsers className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {referral.referredUserEmail}
                    </h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center space-x-1">
                        <FiCalendar className="w-4 h-4" />
                        <span>{new Date(referral.referredAt).toLocaleDateString()}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <FiTrendingUp className="w-4 h-4" />
                        <span>{referral.status}</span>
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center space-x-2">
                    {referral.status === 'completed' && (
                      <div className="flex items-center space-x-1 text-green-600">
                        <FiCheck className="w-4 h-4" />
                        <span className="font-medium">${referral.earnings}</span>
                      </div>
                    )}
                    {referral.status === 'pending' && (
                      <div className="flex items-center space-x-1 text-yellow-600">
                        <FiClock className="w-4 h-4" />
                        <span className="text-sm">Pending</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FiUsers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No referrals yet</h3>
            <p className="text-gray-500 mb-4">
              Start inviting friends to earn rewards and credits
            </p>
            <button
              onClick={() => setShowInviteModal(true)}
              className="btn-primary"
            >
              Invite Your First Friend
            </button>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Invite Friends</h3>
                  <button
                    onClick={() => setShowInviteModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FiX className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Friend's Email *
                    </label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="input-field"
                      placeholder="Enter your friend's email address"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Personal Message (Optional)
                    </label>
                    <textarea
                      value={inviteMessage}
                      onChange={(e) => setInviteMessage(e.target.value)}
                      className="input-field"
                      rows="3"
                      placeholder="Add a personal message to your invitation..."
                    />
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">What your friend gets:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• 20% discount on their first exam</li>
                      <li>• Free access to practice materials</li>
                      <li>• Premium features for 7 days</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleSendInvite}
                  disabled={sendInviteMutation.isLoading}
                  className="btn-primary sm:ml-3 sm:w-auto"
                >
                  {sendInviteMutation.isLoading ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <FiMail className="w-4 h-4 mr-2" />
                  )}
                  Send Invitation
                </button>
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
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

export default Referrals; 