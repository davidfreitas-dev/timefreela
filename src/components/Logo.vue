<script setup lang="ts">
import { ref } from 'vue';

defineProps<{ isExpanded: boolean }>();

const logoPath = new URL('@/assets/logo.png', import.meta.url).href;
const showImage = ref(true);

const handleImageError = () => {
  showImage.value = false;
};
</script>

<template>
  <div class="logo">
    <div :class="['flex items-center', { 'justify-center': !isExpanded }]">
      <img
        v-if="showImage"
        :src="logoPath"
        alt="Time Freela logo"
        class="h-6"
        @error="handleImageError"
      >
      <h3 v-if="isExpanded" class="text-font dark:text-font-dark text-xl font-extrabold ml-1">
        Time<span class="text-primary ml-0.5">Freela</span>
      </h3>
    </div>
  </div>
</template>
