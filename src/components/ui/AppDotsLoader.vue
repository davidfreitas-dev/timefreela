<script setup lang="ts">
import { computed } from 'vue';

type DotColor = 'white' | 'primary';

const { color = 'white' } = defineProps<{
  color?: DotColor;
}>();

const bgColor = computed(() => {
  return color === 'primary' ? 'bg-primary dark:bg-primary-dark' : 'bg-white';
});
</script>

<template>
  <div class="flex justify-center items-center w-26 h-6">
    <span :class="['w-2.5 h-2.5 mx-[0.75] rounded-full inline-block animate-dot-delay-1', bgColor]" />
    <span :class="['w-2.5 h-2.5 mx-[0.75] rounded-full inline-block animate-dot-delay-2', bgColor]" />
    <span :class="['w-2.5 h-2.5 mx-[0.75] rounded-full inline-block animate-dot-delay-3', bgColor]" />
  </div>
</template>

<style scoped>
@keyframes sk-bouncedelay {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1.0);
  }
}
.animate-dot-delay-1 {
  animation: sk-bouncedelay 1.3s infinite ease-in-out both;
  animation-delay: -0.32s;
}
.animate-dot-delay-2 {
  animation: sk-bouncedelay 1.3s infinite ease-in-out both;
  animation-delay: -0.16s;
}
.animate-dot-delay-3 {
  animation: sk-bouncedelay 1.3s infinite ease-in-out both;
}
</style>