'use client';

import { useState, useCallback } from 'react';

export type ToastType = 'success' | 'error';

interface Toast {
  message: string;
  type: ToastType;
}

export function useToast() {
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 5000);
  }, []);

  return { toast, showToast };
} 