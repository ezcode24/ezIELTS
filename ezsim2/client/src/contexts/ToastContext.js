import React, { createContext, useContext } from 'react';
import toast from 'react-hot-toast';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const showSuccess = (message, options = {}) => {
    return toast.success(message, {
      duration: 4000,
      position: 'top-right',
      ...options
    });
  };

  const showError = (message, options = {}) => {
    return toast.error(message, {
      duration: 5000,
      position: 'top-right',
      ...options
    });
  };

  const showInfo = (message, options = {}) => {
    return toast(message, {
      duration: 4000,
      position: 'top-right',
      icon: 'ℹ️',
      ...options
    });
  };

  const showWarning = (message, options = {}) => {
    return toast(message, {
      duration: 4000,
      position: 'top-right',
      icon: '⚠️',
      style: {
        background: '#fef3c7',
        color: '#92400e',
        border: '1px solid #f59e0b'
      },
      ...options
    });
  };

  const showLoading = (message, options = {}) => {
    return toast.loading(message, {
      position: 'top-right',
      ...options
    });
  };

  const dismiss = (toastId) => {
    toast.dismiss(toastId);
  };

  const dismissAll = () => {
    toast.dismiss();
  };

  const value = {
    showSuccess,
    showError,
    showInfo,
    showWarning,
    showLoading,
    dismiss,
    dismissAll
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}; 