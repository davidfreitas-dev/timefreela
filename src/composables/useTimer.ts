import { ref, computed, onUnmounted, onMounted } from 'vue';
import { useTimerStore } from '../stores/timerStore';
import dayjs from '../lib/dayjs';

export function useTimer() {
  const timerStore = useTimerStore();
  let interval: ReturnType<typeof setInterval> | null = null;

  // Local state to force reactivity for real-time display
  const currentTime = ref(Date.now());

  const isRunning = computed(() => timerStore.isRunning);
  const isPaused = computed(() => timerStore.isPaused);

  const elapsed = computed(() => {
    if (timerStore.isRunning && timerStore.startedAt) {
      return timerStore.elapsed + Math.floor((currentTime.value - timerStore.startedAt) / 1000);
    }
    return timerStore.elapsed;
  });

  const elapsedFormatted = computed(() => {
    return dayjs.duration(elapsed.value, 'seconds').format('HH:mm:ss');
  });

  const startTick = () => {
    if (interval) return;
    interval = setInterval(() => {
      currentTime.value = Date.now();
    }, 1000);
  };

  const stopTick = () => {
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
  };

  const start = (projectId: string) => {
    timerStore.start(projectId);
    startTick();
  };

  const pause = () => {
    timerStore.pause();
    currentTime.value = Date.now();
    stopTick();
  };

  const resume = () => {
    timerStore.resume();
    currentTime.value = Date.now();
    startTick();
  };

  const stop = () => {
    timerStore.stop();
    stopTick();
  };

  onMounted(() => {
    if (timerStore.isRunning) {
      startTick();
    }
  });

  onUnmounted(() => {
    stopTick();
  });

  return {
    start,
    pause,
    resume,
    stop,
    elapsed,
    elapsedFormatted,
    isRunning,
    isPaused,
  };
}
