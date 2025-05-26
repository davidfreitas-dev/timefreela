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
    <img
      v-if="showImage && isExpanded"
      :src="logoPath"
      alt="TimeFreela logo"
      class="h-11"
      @error="handleImageError"
    >
    <template v-else>
      <h3 v-if="isExpanded" class="text-font dark:text-white text-2xl font-extrabold">
        Time<span class="text-primary dark:text-primary ml-0.5">Freela</span>
      </h3>
      <h3 v-else class="text-font dark:text-white text-2xl font-extrabold">
        T<span class="text-primary dark:text-primary">F</span>
      </h3>
    </template>
  </div>
</template>
