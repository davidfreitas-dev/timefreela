import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useTimerStore = defineStore('timer', () => {
  let intervalId: ReturnType<typeof setInterval> | null = null;
  
  const duration = ref(0);
  const startTimestamp = ref<number | null>(null);
  const isRunning = ref(false);

  const start = () => {
    if (isRunning.value) return;

    isRunning.value = true;
   
    if (!startTimestamp.value) startTimestamp.value = Date.now() - duration.value * 1000;

    intervalId = setInterval(() => {
      if (startTimestamp.value) {
        const now = Date.now();
        duration.value = Math.floor((now - startTimestamp.value) / 1000);
      }
    }, 1000);
  };

  const pause = () => {
    if (!isRunning.value) return;

    isRunning.value = false;

    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  const reset = () => {
    pause();
    duration.value = 0;
    startTimestamp.value = null;
  };

  return {
    isRunning,
    duration,
    start,
    pause,
    reset,
  };
}, {
  persist: true
});
