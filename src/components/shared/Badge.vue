<script setup lang="ts">
type colorType = 'primary' | 'success' | 'warning' | 'danger';

const { label, color } = defineProps<{
  label: string;
  color: colorType;
}>();

const colorClasses = {
  primary: 'bg-primary-accent text-primary',
  success: 'bg-success-accent text-success',
  warning: 'bg-warning-accent text-warning',
  danger: 'bg-danger-accent text-danger',
};
</script>

<template>
  <span
    :class="[
      'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium truncate whitespace-nowrap overflow-hidden',
      colorClasses[color]
    ]"
  >
    {{ label }}
  </span>
</template>
