<script setup lang="ts">
import { computed } from 'vue';
import AppDotsLoader from '@/components/ui/AppDotsLoader.vue';

defineOptions({ inheritAttrs: false });

type ButtonVariant = 'fill' | 'outline' | 'link' | 'rounded' | 'ghost';
type ButtonSize = 'large' | 'medium' | 'small' | 'full';
type ButtonColor = 'primary' | 'secondary' | 'danger' | 'success' | 'outline';

const { size = 'medium', variant = 'fill', color = 'primary', isLoading = false, disabled = false, iconOnly = false, circle = false } = defineProps<{
 size?: ButtonSize;
 variant?: ButtonVariant;
 color?: ButtonColor;
 isLoading?: boolean;
 disabled?: boolean;
 iconOnly?: boolean;
 circle?: boolean;
}>();

const baseClasses =
 'inline-flex items-center justify-center gap-2 font-semibold transition-all focus:outline-none focus-visible:ring-2 active:scale-95 duration-200 ease-in cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100';

const classes = computed(() => {
  const actualVariant = color === 'outline' ? 'outline' : variant;
  const actualColor = color === 'outline' ? 'primary' : color;

  return [
    baseClasses,
    {
      // Sizes
      'h-[52px] text-[15px]': size === 'large',
      'h-[44px] text-[14px]': size === 'medium',
      'h-[36px] text-[13px]': size === 'small',
      'w-full text-center h-[52px] text-[15px]': size === 'full',

      // Widths/Paddings for standard vs iconOnly
      'w-[52px] px-0': size === 'large' && iconOnly,
      'px-6': size === 'large' && !iconOnly,
      'w-[44px] px-0': size === 'medium' && iconOnly,
      'px-5': size === 'medium' && !iconOnly,
      'w-[36px] px-0': size === 'small' && iconOnly,
      'px-4': size === 'small' && !iconOnly,

      // Border Radius
      'rounded-full': actualVariant === 'rounded' || circle,
      'rounded-2xl': actualVariant !== 'rounded' && !circle && (size === 'large' || size === 'full'),
      'rounded-xl': actualVariant !== 'rounded' && !circle && size === 'medium',
      'rounded-lg': actualVariant !== 'rounded' && !circle && size === 'small',

      // Primary Variants
      'bg-primary text-white hover:bg-primary-hover disabled:hover:bg-primary':
        (actualVariant === 'fill' || actualVariant === 'rounded') && actualColor === 'primary',
      'bg-transparent text-primary border border-primary hover:bg-primary/10 dark:hover:bg-primary-dark/10 disabled:hover:bg-transparent':
        actualVariant === 'outline' && actualColor === 'primary',
      'bg-transparent text-primary hover:text-primary-hover disabled:hover:text-primary':
        actualVariant === 'link' && actualColor === 'primary',
      'bg-transparent text-primary hover:bg-primary/10 dark:hover:bg-primary-dark/10 disabled:hover:bg-transparent':
        actualVariant === 'ghost' && actualColor === 'primary',

      // Secondary Variants
      'bg-disabled/30 dark:bg-disabled-dark/40 text-font dark:text-font-dark hover:bg-disabled/40 dark:hover:bg-disabled-dark/50 disabled:hover:bg-disabled/30 dark:disabled:hover:bg-disabled-dark/40':
        (actualVariant === 'fill' || actualVariant === 'rounded') && actualColor === 'secondary',
      'bg-transparent text-secondary dark:text-secondary-dark border border-secondary dark:border-secondary-dark hover:bg-secondary/10 dark:hover:bg-secondary-dark/10 disabled:hover:bg-transparent':
        actualVariant === 'outline' && actualColor === 'secondary',
      'bg-transparent text-secondary dark:text-secondary-dark hover:text-font dark:hover:text-font-dark disabled:hover:text-secondary dark:disabled:hover:text-secondary-dark':
        actualVariant === 'link' && actualColor === 'secondary',
      'bg-transparent text-secondary dark:text-secondary-dark hover:bg-secondary/10 dark:hover:bg-secondary-dark/10 disabled:hover:bg-transparent':
        actualVariant === 'ghost' && actualColor === 'secondary',

      // Success Variants
      'bg-success text-white hover:bg-success-hover disabled:hover:bg-success':
        (actualVariant === 'fill' || actualVariant === 'rounded') && actualColor === 'success',
      'bg-transparent text-success border border-success hover:bg-success/10 dark:hover:bg-success-dark/10 disabled:hover:bg-transparent':
        actualVariant === 'outline' && actualColor === 'success',
      'bg-transparent text-success hover:text-success-hover disabled:hover:text-success':
        actualVariant === 'link' && actualColor === 'success',
      'bg-transparent text-success hover:bg-success/10 dark:hover:bg-success-dark/10 disabled:hover:bg-transparent':
        actualVariant === 'ghost' && actualColor === 'success',

      // Danger Variants
      'bg-danger text-white hover:bg-danger-hover disabled:hover:bg-danger':
        (actualVariant === 'fill' || actualVariant === 'rounded') && actualColor === 'danger',
      'bg-transparent text-danger border border-danger hover:bg-danger/10 dark:hover:bg-danger-dark/10 disabled:hover:bg-transparent':
        actualVariant === 'outline' && actualColor === 'danger',
      'bg-transparent text-danger hover:text-danger-hover disabled:hover:text-danger':
        actualVariant === 'link' && actualColor === 'danger',
      'bg-transparent text-danger hover:bg-danger/10 dark:hover:bg-danger-dark/10 disabled:hover:bg-transparent':
        actualVariant === 'ghost' && actualColor === 'danger',
    },
  ];
});
</script>

<template>
  <button
    v-bind="$attrs"
    :class=" classes"
    :aria-busy="isLoading"
    :disabled="isLoading || disabled"
  >
    <AppDotsLoader
      v-if="isLoading"
      :color="(color === 'outline' ? 'outline' : variant) === 'outline' || (color === 'outline' ? 'outline' : variant) === 'link' ? ((color === 'outline' ? 'primary' : color) === 'primary' ? 'primary' : 'white') : 'white'"
    />
    <template v-else>
      <slot v-if="$slots['left-icon']" name="left-icon" />
      <slot />
      <slot v-if="$slots['right-icon']" name="right-icon" />
    </template>
  </button>
</template>
