import { createContext, useContext } from 'react';
import toast, { Toaster } from 'react-hot-toast';

const NotificationContext = createContext(null);

const toastConfig = {
  duration: 4000,
  position: 'top-right',
  style: {
    background: '#1C2128',
    color: '#fff',
    border: '1px solid #C89B3C',
  },
  success: {
    iconTheme: {
      primary: '#C89B3C',
      secondary: '#fff',
    },
  },
  error: {
    iconTheme: {
      primary: '#D13639',
      secondary: '#fff',
    },
  },
};

export const NotificationProvider = ({ children }) => {
  const showSuccess = (message) => {
    toast.success(message, toastConfig);
  };

  const showError = (message) => {
    toast.error(message, toastConfig);
  };

  const showInfo = (message) => {
    toast(message, {
      ...toastConfig,
      icon: 'ℹ️',
    });
  };

  const showWarning = (message) => {
    toast(message, {
      ...toastConfig,
      icon: '⚠️',
      style: {
        ...toastConfig.style,
        border: '1px solid #efa02b',
      },
    });
  };

  const showLoading = (message) => {
    return toast.loading(message, toastConfig);
  };

  const dismissToast = (toastId) => {
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
    dismissToast,
    dismissAll,
  };

  return (
    <NotificationContext.Provider value={value}>
      <Toaster />
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};