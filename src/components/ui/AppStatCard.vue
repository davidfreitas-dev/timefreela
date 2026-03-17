<script setup lang="ts">
import AppCard from './AppCard.vue';

defineProps<{
  label: string;
  value: string | number;
}>();
</script>

<template>
  <AppCard>
    <span class="text-secondary dark:text-secondary-dark text-sm">
      {{ label }}
    </span>
    <h1 class="text-font dark:text-font-dark text-4xl font-bold font-mono mt-1 truncate">
      {{ value }}
    </h1>
  </AppCard>
</template>
