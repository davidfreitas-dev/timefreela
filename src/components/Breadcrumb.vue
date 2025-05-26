<script setup lang="ts">
const { title, description } = defineProps<{
  title: string
  description?: string
}>();
</script>

<template>
  <div class="breadcrumb-wrapper flex justify-between items-start">
    <div class="breadcrumb">
      <h1 class="text-font dark:text-font-dark text-3xl font-bold mb-1">
        {{ title }}
      </h1>
      <p class="text-secondary dark:text-secondary-dark pr-4">
        {{ description }}
      </p>
    </div>
  </div>
</template>
