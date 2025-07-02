import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from 'react-query';
import { adminAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { 
  FiSettings, FiSave, FiMail, FiCreditCard, FiShield, 
  FiGlobe, FiDatabase, FiBell, FiKey, FiUsers, FiBookOpen,
  FiDollarSign, FiCalendar, FiClock, FiCheck, FiX
} from 'react-icons/fi';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AdminSettings = () => {
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState('general');
  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm();

  // Fetch settings
  const { data: settingsData, isLoading } = useQuery(
    ['admin-settings'],
    () => adminAPI.getSettings(),
    { staleTime: 10 * 60 * 1000 }
  );

  // Update settings mutation
  const updateSettingsMutation = useMutation(
    (data) => adminAPI.updateSettings(data),
    {
      onSuccess: () => {
        showSuccess('Settings updated successfully!');
        setIsEditing(false);
      },
      onError: (error) => {
        showError('Failed to update settings. Please try again.');
      }
    }
  );

  // Test email mutation
  const testEmailMutation = useMutation(
    (emailData) => adminAPI.testEmail(emailData),
    {
      onSuccess: () => {
        showSuccess('Test email sent successfully!');
      },
      onError: (error) => {
        showError('Failed to send test email. Please try again.');
      }
    }
  );

  const onSubmit = (data) => {
    updateSettingsMutation.mutate(data);
  };

  const handleTestEmail = () => {
    testEmailMutation.mutate({
      to: 'admin@example.com',
      subject: 'Test Email from IELTS Platform',
      message: 'This is a test email to verify email configuration.'
    });
  };

  const tabs = [
    { id: 'general', label: 'General', icon: FiSettings },
    { id: 'email', label: 'Email', icon: FiMail },
    { id: 'payment', label: 'Payment', icon: FiCreditCard },
    { id: 'security', label: 'Security', icon: FiShield },
    { id: 'exam', label: 'Exam Settings', icon: FiBookOpen },
    { id: 'notifications', label: 'Notifications', icon: FiBell }
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
          <p className="mt-2 text-gray-600">
            Configure platform settings and preferences
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="btn-secondary flex items-center space-x-2"
          >
            {isEditing ? (
              <>
                <FiX className="w-4 h-4" />
                <span>Cancel</span>
              </>
            ) : (
              <>
                <FiSettings className="w-4 h-4" />
                <span>Edit Settings</span>
              </>
            )}
          </button>
          {isEditing && (
            <button
              onClick={handleSubmit(onSubmit)}
              disabled={updateSettingsMutation.isLoading}
              className="btn-primary flex items-center space-x-2"
            >
              {updateSettingsMutation.isLoading ? (
                <LoadingSpinner size="sm" className="w-4 h-4" />
              ) : (
                <FiSave className="w-4 h-4" />
              )}
              <span>Save Changes</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <TabIcon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="dashboard-card">
        {/* General Settings */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">General Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Platform Name
                </label>
                <input
                  type="text"
                  defaultValue={settingsData?.general?.platformName || 'IELTS Practice Platform'}
                  disabled={!isEditing}
                  className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Platform URL
                </label>
                <input
                  type="url"
                  defaultValue={settingsData?.general?.platformUrl || 'https://ielts-practice.com'}
                  disabled={!isEditing}
                  className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Email
                </label>
                <input
                  type="email"
                  defaultValue={settingsData?.general?.contactEmail || 'support@ielts-practice.com'}
                  disabled={!isEditing}
                  className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timezone
                </label>
                <select
                  defaultValue={settingsData?.general?.timezone || 'UTC'}
                  disabled={!isEditing}
                  className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="Europe/London">London</option>
                  <option value="Europe/Paris">Paris</option>
                  <option value="Asia/Tokyo">Tokyo</option>
                  <option value="Asia/Shanghai">Shanghai</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Platform Description
              </label>
              <textarea
                defaultValue={settingsData?.general?.description || 'Comprehensive IELTS practice platform'}
                disabled={!isEditing}
                rows="3"
                className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
              />
            </div>
          </div>
        )}

        {/* Email Settings */}
        {activeTab === 'email' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Email Configuration</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMTP Host
                </label>
                <input
                  type="text"
                  defaultValue={settingsData?.email?.smtpHost || 'smtp.gmail.com'}
                  disabled={!isEditing}
                  className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMTP Port
                </label>
                <input
                  type="number"
                  defaultValue={settingsData?.email?.smtpPort || 587}
                  disabled={!isEditing}
                  className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Username
                </label>
                <input
                  type="email"
                  defaultValue={settingsData?.email?.username || 'noreply@ielts-practice.com'}
                  disabled={!isEditing}
                  className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Password
                </label>
                <input
                  type="password"
                  defaultValue="••••••••"
                  disabled={!isEditing}
                  className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={handleTestEmail}
                disabled={testEmailMutation.isLoading || !isEditing}
                className="btn-secondary flex items-center space-x-2"
              >
                {testEmailMutation.isLoading ? (
                  <LoadingSpinner size="sm" className="w-4 h-4" />
                ) : (
                  <FiMail className="w-4 h-4" />
                )}
                <span>Test Email</span>
              </button>
              <span className="text-sm text-gray-500">
                Send a test email to verify configuration
              </span>
            </div>
          </div>
        )}

        {/* Payment Settings */}
        {activeTab === 'payment' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Payment Configuration</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  defaultValue={settingsData?.payment?.currency || 'USD'}
                  disabled={!isEditing}
                  className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                  <option value="AUD">AUD - Australian Dollar</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  defaultValue={settingsData?.payment?.taxRate || 0}
                  disabled={!isEditing}
                  className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stripe Public Key
                </label>
                <input
                  type="text"
                  defaultValue={settingsData?.payment?.stripePublicKey || 'pk_test_...'}
                  disabled={!isEditing}
                  className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stripe Secret Key
                </label>
                <input
                  type="password"
                  defaultValue="sk_test_..."
                  disabled={!isEditing}
                  className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Payment Methods</h4>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    defaultChecked={settingsData?.payment?.methods?.creditCard}
                    disabled={!isEditing}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Credit Card</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    defaultChecked={settingsData?.payment?.methods?.paypal}
                    disabled={!isEditing}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">PayPal</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    defaultChecked={settingsData?.payment?.methods?.bankTransfer}
                    disabled={!isEditing}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Bank Transfer</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Security Settings */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Security Configuration</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Timeout (minutes)
                </label>
                <input
                  type="number"
                  defaultValue={settingsData?.security?.sessionTimeout || 30}
                  disabled={!isEditing}
                  className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Login Attempts
                </label>
                <input
                  type="number"
                  defaultValue={settingsData?.security?.maxLoginAttempts || 5}
                  disabled={!isEditing}
                  className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password Min Length
                </label>
                <input
                  type="number"
                  defaultValue={settingsData?.security?.passwordMinLength || 8}
                  disabled={!isEditing}
                  className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lockout Duration (minutes)
                </label>
                <input
                  type="number"
                  defaultValue={settingsData?.security?.lockoutDuration || 15}
                  disabled={!isEditing}
                  className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Security Features</h4>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    defaultChecked={settingsData?.security?.features?.twoFactor}
                    disabled={!isEditing}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Two-Factor Authentication</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    defaultChecked={settingsData?.security?.features?.emailVerification}
                    disabled={!isEditing}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Email Verification</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    defaultChecked={settingsData?.security?.features?.captcha}
                    disabled={!isEditing}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">CAPTCHA Protection</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Exam Settings */}
        {activeTab === 'exam' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Exam Configuration</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Exam Duration (minutes)
                </label>
                <input
                  type="number"
                  defaultValue={settingsData?.exam?.defaultDuration || 60}
                  disabled={!isEditing}
                  className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Questions per Exam
                </label>
                <input
                  type="number"
                  defaultValue={settingsData?.exam?.maxQuestions || 40}
                  disabled={!isEditing}
                  className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Auto-save Interval (seconds)
                </label>
                <input
                  type="number"
                  defaultValue={settingsData?.exam?.autoSaveInterval || 30}
                  disabled={!isEditing}
                  className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Result Display Delay (seconds)
                </label>
                <input
                  type="number"
                  defaultValue={settingsData?.exam?.resultDelay || 5}
                  disabled={!isEditing}
                  className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Exam Features</h4>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    defaultChecked={settingsData?.exam?.features?.autoSubmit}
                    disabled={!isEditing}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Auto-submit on time expiry</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    defaultChecked={settingsData?.exam?.features?.allowReview}
                    disabled={!isEditing}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Allow answer review</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    defaultChecked={settingsData?.exam?.features?.showTimer}
                    disabled={!isEditing}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Show countdown timer</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    defaultChecked={settingsData?.exam?.features?.allowNotes}
                    disabled={!isEditing}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Allow note-taking</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Notification Settings */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Notification Configuration</h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Email Notifications</h4>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      defaultChecked={settingsData?.notifications?.email?.examResults}
                      disabled={!isEditing}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Exam results</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      defaultChecked={settingsData?.notifications?.email?.speakingBookings}
                      disabled={!isEditing}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Speaking test bookings</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      defaultChecked={settingsData?.notifications?.email?.paymentConfirmations}
                      disabled={!isEditing}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Payment confirmations</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      defaultChecked={settingsData?.notifications?.email?.systemUpdates}
                      disabled={!isEditing}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">System updates</span>
                  </label>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-4">Push Notifications</h4>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      defaultChecked={settingsData?.notifications?.push?.examReminders}
                      disabled={!isEditing}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Exam reminders</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      defaultChecked={settingsData?.notifications?.push?.newExams}
                      disabled={!isEditing}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">New exam releases</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      defaultChecked={settingsData?.notifications?.push?.achievements}
                      disabled={!isEditing}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Achievement notifications</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSettings; 