import { toast, type ToastOptions } from 'vue3-toastify';
import { useDark } from '@vueuse/core';

export function useToast() {
  const isDark = useDark();

  const defaultOverrides: Partial<Record<string, ToastOptions>> = {
    success: { autoClose: 3000, theme: 'colored' },
    error:   { autoClose: 8000, closeOnClick: false },
    warning: { autoClose: 6000 },
    info:    { autoClose: 4000 },
  };

  const getOptions = (type: string, options?: ToastOptions): ToastOptions => ({
    theme: isDark.value ? 'dark' : 'light',
    ...defaultOverrides[type],
    ...options,
  });

  const success = (message: string, options?: ToastOptions) => {
    toast.success(message, getOptions('success', options));
  };

  const error = (message: string, options?: ToastOptions) => {
    toast.error(message, getOptions('error', options));
  };

  const info = (message: string, options?: ToastOptions) => {
    toast.info(message, getOptions('info', options));
  };

  const warning = (message: string, options?: ToastOptions) => {
    toast.warning(message, getOptions('warning', options));
  };

  const promise = <T>(
    promiseFn: Promise<T>,
    messages: { pending: string; success: string; error: string },
    opts?: ToastOptions
  ) => toast.promise(promiseFn, messages, { theme: isDark.value ? 'dark' : 'light', ...opts });

  type ToastType = 'success' | 'error' | 'info' | 'warning';

  const showToast = (type: ToastType, message: string, options?: ToastOptions) => {
    switch (type) {
    case 'success':
      success(message, options);
      break;
    case 'error':
      error(message, options);
      break;
    case 'info':
      info(message, options);
      break;
    case 'warning':
      warning(message, options);
      break;
    }
  };

  return {
    success,
    error,
    info,
    warning,
    promise,
    toast, // Expose raw toast for custom usage
    showToast, // Fallback for backward compatibility
  };
}
