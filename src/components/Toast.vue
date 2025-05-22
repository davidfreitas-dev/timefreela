<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { TransitionRoot } from '@headlessui/vue';
import type { ToastData } from '@/types/toast';

const { toastData } = defineProps<{
  toastData: ToastData;
}>();

const isShowing = ref(false);

const showToast = () => {
  isShowing.value = true;
};

watch(isShowing, (newIsShowing) => {
  if (newIsShowing) {
    setTimeout(() => {
      isShowing.value = false;
    }, 2500);
  }
});

const toastIcon = computed(() => {
  switch (toastData.type) {
  case 'success':
    return 'check';
  case 'error':
    return 'close';
  case 'warning':
    return 'warning';
  case 'info':
  default:
    return 'info';
  }
});

defineExpose({ showToast });
</script>

<template>
  <TransitionRoot
    :show="isShowing"
    enter="transition-opacity duration-75"
    enter-from="opacity-0"
    enter-to="opacity-100"
    leave="transition-opacity duration-150"
    leave-from="opacity-100"
    leave-to="opacity-0"
  >
    <div
      id="toast"
      role="alert"
      class="fixed z-50 top-10 left-1/2 -translate-x-1/2 flex items-center p-4 mb-4 w-full max-w-xs text-gray-700 bg-white rounded-lg shadow-md"
    >
      <div
        class="inline-flex flex-shrink-0 justify-center items-center w-9 h-9 bg-opacity-10 rounded-lg"
        :class="{
          'text-success-hover bg-success-accent': toastData.type === 'success',
          'text-danger-hover bg-danger-accent': toastData.type === 'error',
          'text-warning-hover bg-warning-accent': toastData.type === 'info'
        }"
      >
        <span class="material-icons-outlined">
          {{ toastIcon }}
        </span>
        <span class="sr-only">Icon</span>
      </div>

      <div class="ml-3 text-sm font-normal">
        {{ toastData.message }}
      </div>
    </div>
  </TransitionRoot>
</template>
