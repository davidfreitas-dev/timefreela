<script setup lang="ts">
import { computed } from 'vue';

type ColorType = 'primary' | 'success' | 'warning' | 'danger';
type BadgeVariant = 'solid' | 'accent';

const props = withDefaults(defineProps<{
  label: string;
  color: ColorType;
  variant?: BadgeVariant;
}>(), {
  variant: 'accent'
});

const variantClasses = computed(() => {
  if (props.variant === 'solid') {
    return {
      'bg-primary text-white': props.color === 'primary',
      'bg-success text-white': props.color === 'success',
      'bg-warning text-white': props.color === 'warning',
      'bg-danger text-white': props.color === 'danger',
    };
  }

  // Accent
  return {
    'bg-primary-accent text-primary dark:bg-primary-accent-dark dark:text-primary-dark': props.color === 'primary',
    'bg-success-accent text-success dark:bg-success-accent-dark dark:text-success-dark': props.color === 'success',
    'bg-warning-accent text-warning dark:bg-warning-accent-dark dark:text-warning-dark': props.color === 'warning',
    'bg-danger-accent text-danger dark:bg-danger-accent-dark dark:text-danger-dark': props.color === 'danger',
  };
});
</script>

<template>
  <span
    :class="[
      'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium truncate whitespace-nowrap overflow-hidden',
      variantClasses
    ]"
  >
    {{ label }}
  </span>
</template>
