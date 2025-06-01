import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useTimerStore = defineStore('timer', () => {
  const isRunning = ref(false);
  const duration = ref(0); // em segundos
  let intervalId: ReturnType<typeof setInterval> | null = null;

  const start = () => {
    if (intervalId) return;
    isRunning.value = true;
    intervalId = setInterval(() => {
      duration.value++;
    }, 1000);
  };

  const pause = () => {
    isRunning.value = false;
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  const reset = () => {
    pause();
    duration.value = 0;
  };

  return {
    isRunning,
    duration,
    start,
    pause,
    reset,
  };
}, {
  persist: true, 
});
