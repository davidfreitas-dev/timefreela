<script setup lang="ts">
import AppIcon from './AppIcon.vue';

interface Props {
  title?: string;
  message?: string;
  icon?: string;
}

defineProps<Props>();
</script>

<template>
  <div class="flex flex-col items-center justify-center text-center my-10 px-5">
    <div v-if="icon" class="mb-4 text-secondary/30 dark:text-secondary-dark/30">
      <AppIcon :name="icon" size="lg" />
    </div>
    <h3 v-if="title" class="text-lg font-bold text-font dark:text-font-dark mb-1">
      {{ title }}
    </h3>
    <p class="text-[15px] text-secondary dark:text-secondary-dark max-w-sm">
      {{ message || 'Nenhum dado encontrado.' }}
    </p>
    <div v-if="$slots.action" class="mt-6">
      <slot name="action" />
    </div>
  </div>
</template>
