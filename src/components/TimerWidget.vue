<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useTimerStore } from '@/stores/timerStore';
import Icon from '@/components/Icon.vue';

const timerStore = useTimerStore();

const { isRunning, duration } = storeToRefs(timerStore);

const formattedDuration = computed(() => {
  const h = String(Math.floor(duration.value / 3600)).padStart(2, '0');
  const m = String(Math.floor((duration.value % 3600) / 60)).padStart(2, '0');
  const s = String(duration.value % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
});

const toggle = () => {
  if (isRunning.value) {
    timerStore.pause();
  } else {
    timerStore.start();
  }
};
</script>

<template>
  <div
    v-if="duration > 0"
    class="fixed bottom-4 right-4 bg-primary dark:bg-primary-dark shadow-lg rounded-full px-5 py-3 w-40 text-white flex items-center justify-between z-50"
  >
    <span
      class="text-lg font-bold leading-none font-mono w-24 text-left select-none ml-1"
      aria-label="Tempo decorrido"
    >
      {{ formattedDuration }}
    </span>
    <button
      class="flex items-center justify-center w-8 h-8 text-white cursor-pointer rounded focus:outline-none focus:ring-2 focus:ring-primary-pressed"
      aria-label="Toggle Timer"
      type="button"
      @click="toggle"
    >
      <Icon :name="isRunning ? 'pause' : 'play_arrow'" />
    </button>
  </div>
</template>

