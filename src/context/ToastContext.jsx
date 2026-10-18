'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  FaCircleCheck,
  FaCircleXmark,
  FaTriangleExclamation,
  FaCircleInfo,
  FaXmark,
} from 'react-icons/fa6';
import './Toast.scss';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(({ title, message, type = 'info', duration = 5000 }) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newToast = {
      id,
      title,
      message,
      type, // 'success' | 'error' | 'warning' | 'info'
      duration,
    };

    setToasts((prev) => [newToast, ...prev].slice(0, 5)); // Keep max 5 visible toasts

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, [removeToast]);

  const success = useCallback((message, title = '') => {
    return addToast({ message, title, type: 'success' });
  }, [addToast]);

  const error = useCallback((message, title = '') => {
    return addToast({ message, title, type: 'error', duration: 7000 });
  }, [addToast]);

  const warning = useCallback((message, title = '') => {
    return addToast({ message, title, type: 'warning', duration: 6000 });
  }, [addToast]);

  const info = useCallback((message, title = '') => {
    return addToast({ message, title, type: 'info' });
  }, [addToast]);

  const getToastIcon = (type) => {
    switch (type) {
      case 'success':
        return <FaCircleCheck className="toast-icon success" />;
      case 'error':
        return <FaCircleXmark className="toast-icon error" />;
      case 'warning':
        return <FaTriangleExclamation className="toast-icon warning" />;
      case 'info':
      default:
        return <FaCircleInfo className="toast-icon info" />;
    }
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast, success, error, warning, info }}>
      {children}
      <div className="trendline-toast-viewport" aria-live="polite">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`trendline-toast-item toast-${toast.type}`}
            role="alert"
          >
            <div className="toast-icon-wrapper">{getToastIcon(toast.type)}</div>
            <div className="toast-content-wrapper">
              {toast.title && <h5 className="toast-title">{toast.title}</h5>}
              <p className="toast-message">{toast.message}</p>
            </div>
            <button
              type="button"
              className="toast-close-btn"
              onClick={() => removeToast(toast.id)}
              aria-label="Close notification"
            >
              <FaXmark />
            </button>
            <div
              className="toast-progress-bar"
              style={{ animationDuration: `${toast.duration}ms` }}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Graceful fallback if invoked outside ToastProvider
    return {
      success: (msg) => console.log('[Toast Success]:', msg),
      error: (msg) => console.error('[Toast Error]:', msg),
      warning: (msg) => console.warn('[Toast Warning]:', msg),
      info: (msg) => console.info('[Toast Info]:', msg),
      addToast: () => {},
      removeToast: () => {},
    };
  }
  return context;
}
