import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from 'react-query';
import { userAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { 
  FiDollarSign, FiPlus, FiMinus, FiCreditCard, FiDownload, 
  FiFilter, FiSearch, FiCalendar, FiArrowUpRight, FiArrowDownLeft,
  FiEye, FiEyeOff, FiShield, FiCheck, FiX
} from 'react-icons/fi';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const Wallet = () => {
  const { showSuccess, showError } = useToast();
  const [showBalance, setShowBalance] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm();

  // Fetch wallet data
  const { data: walletData, isLoading, refetch } = useQuery(
    ['wallet'],
    () => userAPI.getWallet(),
    { staleTime: 1 * 60 * 1000 }
  );

  // Fetch transactions
  const { data: transactions, isLoading: transactionsLoading } = useQuery(
    ['transactions', selectedFilter, searchTerm],
    () => userAPI.getTransactions({ type: selectedFilter, search: searchTerm }),
    { staleTime: 2 * 60 * 1000 }
  );

  // Top-up mutation
  const topUpMutation = useMutation(
    (data) => userAPI.topUpWallet(data),
    {
      onSuccess: () => {
        showSuccess('Wallet topped up successfully!');
        refetch();
        reset();
      },
      onError: (error) => {
        showError('Failed to top up wallet. Please try again.');
      }
    }
  );

  // Withdraw mutation
  const withdrawMutation = useMutation(
    (data) => userAPI.withdrawFromWallet(data),
    {
      onSuccess: () => {
        showSuccess('Withdrawal request submitted successfully!');
        refetch();
        reset();
      },
      onError: (error) => {
        showError('Failed to submit withdrawal request. Please try again.');
      }
    }
  );

  const onSubmitTopUp = (data) => {
    topUpMutation.mutate(data);
  };

  const onSubmitWithdraw = (data) => {
    if (data.amount > walletData?.balance) {
      showError('Insufficient balance for withdrawal.');
      return;
    }
    withdrawMutation.mutate(data);
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'topup':
        return <FiArrowDownLeft className="w-5 h-5 text-green-600" />;
      case 'withdrawal':
        return <FiArrowUpRight className="w-5 h-5 text-red-600" />;
      case 'exam':
        return <FiMinus className="w-5 h-5 text-blue-600" />;
      case 'refund':
        return <FiArrowDownLeft className="w-5 h-5 text-green-600" />;
      case 'referral':
        return <FiPlus className="w-5 h-5 text-purple-600" />;
      default:
        return <FiDollarSign className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'topup':
      case 'refund':
      case 'referral':
        return 'text-green-600';
      case 'withdrawal':
      case 'exam':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTransactionStatus = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      completed: { color: 'bg-green-100 text-green-800', text: 'Completed' },
      failed: { color: 'bg-red-100 text-red-800', text: 'Failed' },
      cancelled: { color: 'bg-gray-100 text-gray-800', text: 'Cancelled' }
    };
    return statusConfig[status] || statusConfig.pending;
  };

  const topUpOptions = [
    { value: 10, label: '$10', bonus: 0 },
    { value: 25, label: '$25', bonus: 2 },
    { value: 50, label: '$50', bonus: 5 },
    { value: 100, label: '$100', bonus: 15 },
    { value: 200, label: '$200', bonus: 40 }
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
          <h1 className="text-3xl font-bold text-gray-900">Wallet</h1>
          <p className="mt-2 text-gray-600">
            Manage your account balance and transactions
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={() => setShowBalance(!showBalance)}
            className="btn-secondary flex items-center space-x-2"
          >
            {showBalance ? (
              <>
                <FiEyeOff className="w-4 h-4" />
                <span>Hide Balance</span>
              </>
            ) : (
              <>
                <FiEye className="w-4 h-4" />
                <span>Show Balance</span>
              </>
            )}
          </button>
          <button className="btn-secondary flex items-center space-x-2">
            <FiDownload className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Current Balance */}
        <div className="dashboard-card bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Current Balance</h3>
            <FiDollarSign className="w-8 h-8 text-blue-200" />
          </div>
          <div className="text-3xl font-bold mb-2">
            {showBalance ? `$${walletData?.balance?.toFixed(2) || '0.00'}` : '****'}
          </div>
          <p className="text-blue-100 text-sm">
            Available for exams and withdrawals
          </p>
        </div>

        {/* Total Deposited */}
        <div className="dashboard-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Total Deposited</h3>
            <FiArrowDownLeft className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-2">
            ${walletData?.totalDeposited?.toFixed(2) || '0.00'}
          </div>
          <p className="text-gray-500 text-sm">
            All-time deposits
          </p>
        </div>

        {/* Total Spent */}
        <div className="dashboard-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Total Spent</h3>
            <FiArrowUpRight className="w-6 h-6 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-2">
            ${walletData?.totalSpent?.toFixed(2) || '0.00'}
          </div>
          <p className="text-gray-500 text-sm">
            On exams and withdrawals
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Up */}
        <div className="dashboard-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FiPlus className="w-5 h-5 mr-2 text-green-600" />
            Top Up Wallet
          </h3>
          
          <form onSubmit={handleSubmit(onSubmitTopUp)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Amount
              </label>
              <div className="grid grid-cols-2 gap-3">
                {topUpOptions.map((option) => (
                  <label
                    key={option.value}
                    className="relative cursor-pointer"
                  >
                    <input
                      type="radio"
                      {...register('amount', { required: 'Please select an amount' })}
                      value={option.value}
                      className="sr-only"
                    />
                    <div className="border-2 border-gray-200 rounded-lg p-3 text-center hover:border-blue-500 transition-colors duration-200 peer-checked:border-blue-500 peer-checked:bg-blue-50">
                      <div className="font-semibold text-gray-900">{option.label}</div>
                      {option.bonus > 0 && (
                        <div className="text-xs text-green-600">+${option.bonus} bonus</div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <select
                {...register('paymentMethod', { required: 'Please select a payment method' })}
                className="input-field"
              >
                <option value="">Select payment method</option>
                <option value="credit_card">Credit Card</option>
                <option value="debit_card">Debit Card</option>
                <option value="paypal">PayPal</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
              {errors.paymentMethod && (
                <p className="mt-1 text-sm text-red-600">{errors.paymentMethod.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={topUpMutation.isLoading}
              className="w-full btn-primary"
            >
              {topUpMutation.isLoading ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <FiPlus className="w-4 h-4 mr-2" />
              )}
              Top Up Wallet
            </button>
          </form>
        </div>

        {/* Withdraw */}
        <div className="dashboard-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FiMinus className="w-5 h-5 mr-2 text-red-600" />
            Withdraw Funds
          </h3>
          
          <form onSubmit={handleSubmit(onSubmitWithdraw)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Withdrawal Amount
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiDollarSign className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="10"
                  max={walletData?.balance}
                  {...register('amount', {
                    required: 'Amount is required',
                    min: { value: 10, message: 'Minimum withdrawal is $10' },
                    max: { value: walletData?.balance, message: 'Insufficient balance' }
                  })}
                  className="input-field pl-10"
                  placeholder="Enter amount"
                />
              </div>
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Withdrawal Method
              </label>
              <select
                {...register('withdrawalMethod', { required: 'Please select a withdrawal method' })}
                className="input-field"
              >
                <option value="">Select withdrawal method</option>
                <option value="bank_account">Bank Account</option>
                <option value="paypal">PayPal</option>
                <option value="credit_card">Credit Card</option>
              </select>
              {errors.withdrawalMethod && (
                <p className="mt-1 text-sm text-red-600">{errors.withdrawalMethod.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Details
              </label>
              <textarea
                {...register('accountDetails', { required: 'Account details are required' })}
                className="input-field"
                rows="3"
                placeholder="Enter your account details (account number, routing number, etc.)"
              />
              {errors.accountDetails && (
                <p className="mt-1 text-sm text-red-600">{errors.accountDetails.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={withdrawMutation.isLoading}
              className="w-full btn-secondary"
            >
              {withdrawMutation.isLoading ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <FiArrowUpRight className="w-4 h-4 mr-2" />
              )}
              Request Withdrawal
            </button>
          </form>
        </div>
      </div>

      {/* Transaction History */}
      <div className="dashboard-card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10 w-64"
              />
            </div>
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">All Transactions</option>
              <option value="topup">Top-ups</option>
              <option value="withdrawal">Withdrawals</option>
              <option value="exam">Exam Purchases</option>
              <option value="refund">Refunds</option>
              <option value="referral">Referral Bonuses</option>
            </select>
          </div>
        </div>

        {transactionsLoading ? (
          <div className="flex items-center justify-center h-32">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Transaction</th>
                  <th className="table-header-cell">Type</th>
                  <th className="table-header-cell">Amount</th>
                  <th className="table-header-cell">Status</th>
                  <th className="table-header-cell">Date</th>
                  <th className="table-header-cell">Reference</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {transactions?.map((transaction) => {
                  const statusConfig = getTransactionStatus(transaction.status);
                  return (
                    <tr key={transaction._id} className="table-row">
                      <td className="table-cell">
                        <div className="flex items-center space-x-3">
                          {getTransactionIcon(transaction.type)}
                          <div>
                            <p className="font-medium text-gray-900">
                              {transaction.description}
                            </p>
                            <p className="text-sm text-gray-500">
                              {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          transaction.type === 'topup' || transaction.type === 'refund' || transaction.type === 'referral'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className={`font-medium ${getTransactionColor(transaction.type)}`}>
                          {transaction.type === 'topup' || transaction.type === 'refund' || transaction.type === 'referral' ? '+' : '-'}
                          ${transaction.amount.toFixed(2)}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                          {statusConfig.text}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center space-x-2">
                          <FiCalendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">
                            {new Date(transaction.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className="text-sm text-gray-500 font-mono">
                          {transaction.referenceId}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {transactions?.length === 0 && (
              <div className="text-center py-8">
                <FiDollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
                <p className="text-gray-500">
                  {searchTerm || selectedFilter !== 'all' 
                    ? 'Try adjusting your search criteria'
                    : 'Start by topping up your wallet to see transactions here'
                  }
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Security Notice */}
      <div className="dashboard-card bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3">
          <FiShield className="w-6 h-6 text-blue-600 mt-1" />
          <div>
            <h4 className="text-lg font-semibold text-blue-900 mb-2">Security & Privacy</h4>
            <p className="text-blue-800 text-sm">
              Your financial information is encrypted and secure. We use industry-standard 
              security measures to protect your data. All transactions are processed through 
              secure payment gateways.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wallet; 