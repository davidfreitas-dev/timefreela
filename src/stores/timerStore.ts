import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useProjectStore } from './projectStore';
import { sessionService } from '../services/sessionService';
import dayjs from '../lib/dayjs';

export const useTimerStore = defineStore('timer', () => {
  const projectStore = useProjectStore();
  let intervalId: ReturnType<typeof setInterval> | null = null;
  
  const duration = ref(0);
  const startedAt = ref<number | null>(null);
  const isRunning = ref(false);
  const isPaused = ref(false);
  const projectId = ref<string | null>(null);
  const startTime = ref<Date | null>(null);

  const elapsed = computed(() => duration.value);
  const elapsedFormatted = computed(() => {
    return dayjs.duration(duration.value, 'seconds').format('HH:mm:ss');
  });

  const startInterval = () => {
    if (intervalId) return;
    intervalId = setInterval(() => {
      if (startedAt.value) {
        const now = Date.now();
        duration.value = Math.floor((now - startedAt.value) / 1000);
      }
    }, 1000);
  };

  const start = (id?: string) => {
    if (isRunning.value && !isPaused.value) {
      startInterval();
      return;
    }

    if (id) {
      projectId.value = id;
      duration.value = 0;
      startTime.value = new Date();
      startedAt.value = Date.now();
    }

    if (!projectId.value) return;

    isRunning.value = true;
    isPaused.value = false;
    
    if (startedAt.value === null) {
      startedAt.value = Date.now() - duration.value * 1000;
    }

    startInterval();
  };

  const pause = () => {
    if (!isRunning.value || isPaused.value) return;

    isRunning.value = false;
    isPaused.value = true;

    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  const resume = () => {
    if (!isPaused.value) return;

    isRunning.value = true;
    isPaused.value = false;
    
    // Adjust startedAt based on current duration
    startedAt.value = Date.now() - duration.value * 1000;

    startInterval();
  };

  const reset = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    isRunning.value = false;
    isPaused.value = false;
    duration.value = 0;
    startedAt.value = null;
    projectId.value = null;
    startTime.value = null;
  };

  const stop = () => {
    reset();
  };

  const restore = () => {
    if (isRunning.value && !isPaused.value && startedAt.value) {
      startInterval();
    }
  };

  const save = async (userId: string) => {
    if (!projectId.value || !startTime.value) return;

    const project = projectStore.items.find(p => p.id === projectId.value);

    const sessionData = {
      userId,
      projectId: projectId.value,
      projectTitle: project?.title || 'Projeto não encontrado',
      duration: duration.value,
      isManual: false,
      isBilled: false,
      billingType: project?.billingType,
      billingAmount: project?.billingAmount,
      startTime: startTime.value,
      endTime: new Date(),
      date: startTime.value,
    };

    try {
      await sessionService.createSession(sessionData);
      reset();
    } catch (error) {
      console.error('Erro ao salvar sessão:', error);
      throw error;
    }
  };

  return {
    isRunning,
    isPaused,
    projectId,
    duration,
    elapsed,
    elapsedFormatted,
    startTime,
    startedAt,
    start,
    pause,
    resume,
    reset,
    stop,
    restore,
    save,
  };
}, {
  persist: true
});
