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
  <div class="logo mb-4">
    <div class="flex items-center">
      <img
        v-if="showImage"
        :src="logoPath"
        alt="TimeFreela logo"
        class="h-8"
        @error="handleImageError"
      >
      <h3 v-if="isExpanded" class="text-font dark:text-font-dark text-2xl font-extrabold">
        Time<span class="text-primary ml-0.5">Freela</span>
      </h3>
    </div>
  </div>
</template>
