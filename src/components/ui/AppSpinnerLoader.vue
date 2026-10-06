<script setup lang="ts">
import { computed } from 'vue';

type LoaderSize = 'sm' | 'md' | 'lg';
type LoaderColor = 'primary' | 'secondary' | 'white' | 'success' | 'danger' | 'warning';

const {
  size = 'md',
  color = 'primary',
  text = 'Carregando...',
} = defineProps<{
  size?: LoaderSize;
  color?: LoaderColor;
  text?: string;
}>();

// Size classes for the spinner SVG
const spinnerSizeClasses = computed(() => {
  if (size === 'sm') return 'w-4 h-4';
  if (size === 'lg') return 'w-8 h-8';
  return 'w-6 h-6';
});

// Color classes for the spinner SVG
const spinnerColorClasses = computed(() => {
  if (color === 'primary') return 'text-primary dark:text-primary-dark';
  if (color === 'secondary') return 'text-secondary dark:text-secondary-dark';
  if (color === 'white') return 'text-white';
  if (color === 'success') return 'text-success dark:text-success-dark';
  if (color === 'danger') return 'text-danger dark:text-danger-dark';
  if (color === 'warning') return 'text-warning dark:text-warning-dark';
  return 'text-primary dark:text-primary-dark';
});

// Text styling classes based on size and color
const textClasses = computed(() => {
  return [
    'font-medium tracking-wide transition-colors duration-200',
    {
      'text-xs': size === 'sm',
      'text-sm': size === 'md',
      'text-base': size === 'lg',
    },
    color === 'white' ? 'text-white/90' : 'text-font dark:text-font-dark'
  ];
});
</script>

<template>
  <div
    class="flex items-center gap-3"
    aria-live="polite"
    aria-busy="true"
  >
    <svg
      :class="['animate-spin shrink-0', spinnerSizeClasses, spinnerColorClasses]"
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        class="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="3"
      />
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
    <span v-if="text || $slots.default" :class="textClasses">
      <slot>{{ text }}</slot>
    </span>
  </div>
</template>
