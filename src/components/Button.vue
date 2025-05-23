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

const baseClasses = 'flex items-center justify-center text-base font-semibold rounded-lg cursor-pointer transition-colors';

const classes = computed(() => [
  baseClasses,
  'focus:outline-none focus-visible:ring-2',
  {
    'py-3.5 px-4 bg-primary text-white hover:bg-primary-hover focus-visible:ring-primary-focus focus:bg-primary active:bg-primary-pressed disabled:bg-disabled disabled:cursor-not-allowed':
      color === 'primary',

    'py-3.5 px-4 bg-danger text-white hover:bg-danger-hover focus-visible:ring-danger-focus focus:bg-danger active:bg-danger-pressed disabled:bg-disabled disabled:cursor-not-allowed':
      color === 'danger',

    'py-3.5 px-4 bg-transparent text-primary border-2 border-primary focus-visible:ring-primary-active':
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
