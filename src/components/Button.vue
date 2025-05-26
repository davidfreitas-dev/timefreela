<script setup lang="ts">
import { computed } from 'vue';
import Loader from '@/components/Loader.vue';

defineOptions({ inheritAttrs: false });

type ButtonColor = 'primary' | 'secondary' | 'outline' | 'danger';
type ButtonSize = '' | 'small' | 'full';

const { size = '', color = 'primary', isLoading = false } = defineProps<{
  size?: ButtonSize;
  color?: ButtonColor;
  isLoading?: boolean;
}>();

const baseClasses =
  'flex items-center justify-center text-base font-semibold rounded-lg cursor-pointer transition-colors';

const classes = computed(() => [
  baseClasses,
  'focus:outline-none focus-visible:ring-2',
  {
    'py-3.5 px-4 bg-primary text-white hover:bg-primary-hover focus-visible:ring-primary-focus focus:bg-primary active:bg-primary-pressed disabled:bg-disabled disabled:cursor-not-allowed':
      color === 'primary',
    'dark:bg-primary-dark dark:hover:bg-primary-hover-dark dark:focus-visible:ring-primary-focus-dark dark:focus:bg-primary-dark dark:active:bg-primary-pressed-dark dark:disabled:bg-disabled-dark':
      color === 'primary',

    'py-3.5 px-4 bg-danger text-white hover:bg-danger-hover focus-visible:ring-danger-focus focus:bg-danger active:bg-danger-pressed disabled:bg-disabled disabled:cursor-not-allowed':
      color === 'danger',
    'dark:bg-danger-dark dark:hover:bg-danger-hover-dark dark:focus-visible:ring-danger-focus-dark dark:focus:bg-danger-dark dark:active:bg-danger-pressed-dark dark:disabled:bg-disabled-dark':
      color === 'danger',

    'py-3.5 px-4 bg-transparent text-primary border-2 border-primary focus-visible:ring-primary-active':
      color === 'outline',
    'dark:text-primary-dark dark:border-primary-dark dark:focus-visible:ring-primary-focus-dark':
      color === 'outline',

    'p-2': size === 'small',

    'w-full text-center': size === 'full',
  },
]);
</script>

<template>
  <button
    v-bind="$attrs"
    :class="classes"
    :aria-busy="isLoading"
    :disabled="isLoading"
  >
    <Loader v-if="isLoading" class="w-4 h-4" />
    <slot v-else />
  </button>
</template>
