<script setup lang="ts">
import { ref, computed } from 'vue';
import type { ToastData } from '@/composables/useToast';
import AppIcon from '@/components/ui/AppIcon.vue';
import 'animate.css';

const props = defineProps<{
  toastData: ToastData;
}>();

const isShowing = ref(false);
const animationClass = ref('');
const timeoutId = ref<ReturnType<typeof setTimeout> | null>(null);

const showToast = () => {
  if (timeoutId.value) {
    clearTimeout(timeoutId.value);
  }

  animationClass.value = 'animate__bounceInRight';
  isShowing.value = true;

  timeoutId.value = setTimeout(() => {
    animationClass.value = 'animate__bounceOutRight';
    timeoutId.value = null;
  }, 3000);
};

const handleAnimationEnd = () => {
  if (animationClass.value === 'animate__bounceOutRight') {
    isShowing.value = false;
    animationClass.value = '';
  }
};

const toastIcon = computed(() => {
  switch (props.toastData.type) {
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
  <div
    v-if="isShowing"
    id="toast"
    role="alert"
    :class="[
      'fixed z-50 top-5 right-6 flex items-center p-4 mb-4 w-full max-w-xs text-white rounded-lg shadow-md animate__animated',
      animationClass,
      {
        'bg-success dark:bg-success-dark': toastData.type === 'success',
        'bg-danger dark:bg-danger-dark': toastData.type === 'error',
        'bg-warning dark:bg-warning-dark': toastData.type === 'info'
      }
    ]"
    @animationend="handleAnimationEnd"
  >
    <div
      class="inline-flex flex-shrink-0 justify-center items-center w-9 h-9 rounded-lg"
      :class="{
        'bg-success-hover dark:bg-success-hover-dark': props.toastData.type === 'success',
        'bg-danger-hover dark:bg-danger-hover-dark': props.toastData.type === 'error',
        'bg-warning-hover dark:bg-warning-hover-dark': props.toastData.type === 'warning',
        'bg-primary-hover dark:bg-primary-hover-dark': props.toastData.type === 'info'
      }"
    >
      <AppIcon :name="toastIcon" class="text-white" />
      <span class="sr-only">Icon</span>
    </div>

    <div class="ml-3 text-sm font-normal">
      {{ props.toastData.message }}
    </div>
  </div>
</template>

