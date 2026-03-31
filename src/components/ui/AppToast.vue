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

const toastTitle = computed(() => {
  switch (props.toastData.type) {
  case 'success':
    return 'Sucesso';
  case 'error':
    return 'Erro';
  case 'warning':
    return 'Atenção';
  case 'info':
  default:
    return 'Informação';
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
      'fixed z-50 top-5 right-6 flex items-start p-4 mb-4 w-full max-w-sm rounded-lg shadow-lg border-l-6 animate__animated',
      animationClass,
      {
        'bg-success-accent border-success text-font': toastData.type === 'success',
        'bg-danger-accent border-danger text-font': toastData.type === 'error',
        'bg-warning-accent border-warning text-font': toastData.type === 'warning',
        'bg-primary-accent border-primary text-font': toastData.type === 'info',
        'dark:bg-success-accent-dark dark:border-success-dark dark:text-font-dark': toastData.type === 'success',
        'dark:bg-danger-accent-dark dark:border-danger-dark dark:text-font-dark': toastData.type === 'error',
        'dark:bg-warning-accent-dark dark:border-warning-dark dark:text-font-dark': toastData.type === 'warning',
        'dark:bg-primary-accent-dark dark:border-primary-dark dark:text-font-dark': toastData.type === 'info'
      }
    ]"
    @animationend="handleAnimationEnd"
  >
    <div
      class="inline-flex flex-shrink-0 justify-center items-center w-8 h-8 rounded-full"
      :class="{
        'bg-success text-white': props.toastData.type === 'success',
        'bg-danger text-white': props.toastData.type === 'error',
        'bg-warning text-white': props.toastData.type === 'warning',
        'bg-primary text-white': props.toastData.type === 'info',
      }"
    >
      <AppIcon :name="toastIcon" size="sm" />
    </div>

    <div class="ml-3 flex-1">
      <div class="text-sm font-bold mb-1">
        {{ toastTitle }}
      </div>
      <div class="text-xs font-normal opacity-90">
        {{ props.toastData.message }}
      </div>
    </div>

    <button
      type="button"
      class="ml-auto -mx-1.5 -my-1.5 p-1.5 inline-flex h-8 w-8 text-secondary transition-colors cursor-pointer"
      @click="isShowing = false"
    >
      <span class="sr-only">Fechar</span>
      <AppIcon name="close" size="sm" />
    </button>
  </div>
</template>

