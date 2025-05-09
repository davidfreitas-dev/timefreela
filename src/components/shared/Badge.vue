<script setup lang="ts">
type colorType = 'primary' | 'success' | 'warning' | 'danger';

const { label, color } = defineProps<{
  label: string;
  color: colorType;
}>();
</script>

<template>
  <span
    :class="[
      'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium truncate whitespace-nowrap overflow-hidden',
      `bg-${color}-accent`,
      `text-${color}`
    ]"
  >
    {{ label }}
  </span>
</template>
