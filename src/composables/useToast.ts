import { ref, type Ref } from 'vue';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastData {
  type: ToastType;
  message: string;
}

interface ToastComponent {
  showToast: () => void;
}

const toast: Ref<ToastComponent | null> = ref(null);

const toastData: Ref<ToastData> = ref({
  message: '',
  type: 'error',
});

const showToast = (type: ToastType, message: string): void => {
  toastData.value.type = type;
  toastData.value.message = message;
  toast.value?.showToast();
};

export function useToast() {
  return {
    toast,
    toastData,
    showToast,
  };
}
