import { useState, useCallback } from 'react';

export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((options) => {
    const id = Date.now();
    const newToast = {
      id,
      ...options,
    };
    
    setToasts((prev) => [...prev, newToast]);
    
    // Auto remove after duration
    const duration = options.duration || 3000;
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
    
    return id;
  }, []);

  const closeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const closeAll = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toast,
    closeToast,
    closeAll,
    toasts,
  };
};


