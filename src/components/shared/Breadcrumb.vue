<script setup lang="ts">
const { title, description } = defineProps<{
  title: string
  description?: string
}>();
</script>

<template>
  <div class="breadcrumb-wrapper flex justify-between items-start">
    <div class="breadcrumb">
      <h1 class="text-3xl font-bold mb-1">
        {{ title }}
      </h1>
      <p class="text-secondary pr-4">
        {{ description }}
      </p>
    </div>
  </div>
</template>
