<script setup lang="ts">
import AppIcon from './AppIcon.vue';

interface Props {
  message?: string;
  icon?: string;
}

defineProps<Props>();
</script>

<template>
  <div class="flex flex-col items-center justify-center text-center my-10 px-5">
    <div v-if="icon" class="mb-3 text-secondary/30 dark:text-secondary-dark/30">
      <AppIcon :name="icon" size="lg" />
    </div>
    <p class="text-secondary dark:text-secondary-dark">
      {{ message || 'Nenhum dado encontrado.' }}
    </p>
  </div>
</template>
