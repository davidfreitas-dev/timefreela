import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useProjectStore } from './projectStore';
import { useUserStore } from './userStore';
import { sessionService } from '../services/sessionService';
import { playChime } from '../utils/audio';
import dayjs from '../lib/dayjs';

export type TimerMode = 'continuous' | 'pomodoro';
export type PomodoroPhase = 'focus' | 'shortBreak' | 'longBreak';

export interface PomodoroConfig {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  cyclesBeforeLongBreak: number;
}

export const useTimerStore = defineStore('timer', () => {
  const projectStore = useProjectStore();
  const userStore = useUserStore();
  let intervalId: ReturnType<typeof setInterval> | null = null;
  
  // Timer Mode: Contínuo ou Pomodoro
  const mode = ref<TimerMode>('continuous');

  // Estado geral
  const duration = ref(0);
  const startedAt = ref<number | null>(null);
  const isRunning = ref(false);
  const isPaused = ref(false);
  const projectId = ref<string | null>(null);
  const startTime = ref<Date | null>(null);

  // Configuração e Estado do Pomodoro
  const pomodoroConfig = ref<PomodoroConfig>({
    focusMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    cyclesBeforeLongBreak: 4,
  });

  const pomodoroPhase = ref<PomodoroPhase>('focus');
  const pomodoroCycle = ref(1); // Ciclo atual (1 a 4)
  const pomodoroCompletedCount = ref(0); // Total de blocos de foco concluídos
  const pomodoroRemaining = ref(25 * 60); // Segundos restantes no bloco atual

  const isPomodoro = computed(() => mode.value === 'pomodoro');

  const elapsed = computed(() => duration.value);
  const elapsedFormatted = computed(() => {
    return dayjs.duration(duration.value, 'seconds').format('HH:mm:ss');
  });

  const pomodoroRemainingFormatted = computed(() => {
    const mins = Math.floor(pomodoroRemaining.value / 60);
    const secs = pomodoroRemaining.value % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  });

  const pomodoroCurrentTotalSeconds = computed(() => {
    if (pomodoroPhase.value === 'focus') {
      return pomodoroConfig.value.focusMinutes * 60;
    }
    if (pomodoroPhase.value === 'shortBreak') {
      return pomodoroConfig.value.shortBreakMinutes * 60;
    }
    return pomodoroConfig.value.longBreakMinutes * 60;
  });

  const pomodoroProgress = computed(() => {
    const total = pomodoroCurrentTotalSeconds.value;
    if (!total) return 0;
    const elapsedSecs = total - pomodoroRemaining.value;
    return Math.min(100, Math.max(0, Math.round((elapsedSecs / total) * 100)));
  });

  const handlePomodoroCompletion = async () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    isRunning.value = false;
    isPaused.value = false;

    if (pomodoroPhase.value === 'focus') {
      // 1. Alerta sonoro de foco finalizado
      playChime('focus_end');

      // 2. Registro do tempo no projeto no Firestore
      const focusSeconds = pomodoroConfig.value.focusMinutes * 60;
      if (projectId.value && userStore.user?.id) {
        const project = projectStore.getById(projectId.value);
        try {
          const now = new Date();
          const sessionStart = new Date(now.getTime() - focusSeconds * 1000);
          await sessionService.createSession({
            userId: userStore.user.id,
            projectId: projectId.value,
            projectTitle: project?.title || 'Projeto',
            duration: focusSeconds,
            isManual: false,
            isBilled: false,
            billingType: project?.billingType,
            billingAmount: project?.billingAmount,
            startTime: sessionStart,
            endTime: now,
            date: sessionStart,
          });
        } catch (err) {
          console.error('Erro ao registrar bloco de pomodoro no Firestore:', err);
        }
      }

      // 3. Notificação nativa
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('🍅 Pomodoro Concluído!', {
          body: `Parabéns! Bloco de ${pomodoroConfig.value.focusMinutes} minutos finalizado. Hora de descansar!`,
          icon: '/favicon.ico',
          tag: 'pomodoro-complete',
        });
      }

      pomodoroCompletedCount.value++;

      // 4. Transição para pausa
      if (pomodoroCycle.value >= pomodoroConfig.value.cyclesBeforeLongBreak) {
        pomodoroPhase.value = 'longBreak';
        pomodoroCycle.value = 1;
        pomodoroRemaining.value = pomodoroConfig.value.longBreakMinutes * 60;
      } else {
        pomodoroPhase.value = 'shortBreak';
        pomodoroCycle.value++;
        pomodoroRemaining.value = pomodoroConfig.value.shortBreakMinutes * 60;
      }
    } else {
      // Fim da pausa (curta ou longa)
      playChime('break_end');

      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('🔔 Pausa Finalizada!', {
          body: 'Pronto para o próximo bloco de foco? Vamos produzir!',
          icon: '/favicon.ico',
          tag: 'pomodoro-break-complete',
        });
      }

      pomodoroPhase.value = 'focus';
      pomodoroRemaining.value = pomodoroConfig.value.focusMinutes * 60;
    }
  };

  const startInterval = () => {
    if (intervalId) return;
    intervalId = setInterval(() => {
      if (mode.value === 'continuous') {
        if (startedAt.value) {
          const now = Date.now();
          duration.value = Math.floor((now - startedAt.value) / 1000);
        }
      } else {
        // Modo Pomodoro (contagem regressiva)
        if (pomodoroRemaining.value > 0) {
          pomodoroRemaining.value--;
          if (pomodoroPhase.value === 'focus') {
            duration.value++;
          }
        }
        if (pomodoroRemaining.value <= 0) {
          handlePomodoroCompletion();
        }
      }
    }, 1000);
  };

  const start = (id?: string) => {
    if (isPaused.value && !id) {
      resume();
      return;
    }

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

    // No modo Pomodoro em pausa de descanso, não exige projectId para iniciar a pausa
    if (mode.value === 'continuous' || pomodoroPhase.value === 'focus') {
      if (!projectId.value) return;
    }

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

    // Reset Pomodoro
    pomodoroRemaining.value = pomodoroConfig.value.focusMinutes * 60;
    pomodoroPhase.value = 'focus';
  };

  const stop = () => {
    reset();
  };

  const restore = () => {
    if (isRunning.value && !isPaused.value) {
      startInterval();
    }
  };

  const setTimerMode = (newMode: TimerMode) => {
    if (mode.value === newMode) return;
    pause();
    mode.value = newMode;
    if (newMode === 'pomodoro') {
      pomodoroRemaining.value = pomodoroCurrentTotalSeconds.value;
    }
  };

  const switchPomodoroPhase = (phase: PomodoroPhase) => {
    pause();
    pomodoroPhase.value = phase;
    if (phase === 'focus') {
      pomodoroRemaining.value = pomodoroConfig.value.focusMinutes * 60;
    } else if (phase === 'shortBreak') {
      pomodoroRemaining.value = pomodoroConfig.value.shortBreakMinutes * 60;
    } else {
      pomodoroRemaining.value = pomodoroConfig.value.longBreakMinutes * 60;
    }
  };

  const skipPomodoroPhase = () => {
    pause();
    if (pomodoroPhase.value === 'focus') {
      if (pomodoroCycle.value >= pomodoroConfig.value.cyclesBeforeLongBreak) {
        pomodoroPhase.value = 'longBreak';
        pomodoroCycle.value = 1;
        pomodoroRemaining.value = pomodoroConfig.value.longBreakMinutes * 60;
      } else {
        pomodoroPhase.value = 'shortBreak';
        pomodoroCycle.value++;
        pomodoroRemaining.value = pomodoroConfig.value.shortBreakMinutes * 60;
      }
    } else {
      pomodoroPhase.value = 'focus';
      pomodoroRemaining.value = pomodoroConfig.value.focusMinutes * 60;
    }
  };

  const updatePomodoroConfig = (config: Partial<PomodoroConfig>) => {
    pomodoroConfig.value = { ...pomodoroConfig.value, ...config };
    // Ajusta o tempo restante se não estiver rodando
    if (!isRunning.value) {
      pomodoroRemaining.value = pomodoroCurrentTotalSeconds.value;
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
    mode,
    isPomodoro,
    isRunning,
    isPaused,
    projectId,
    duration,
    elapsed,
    elapsedFormatted,
    startTime,
    startedAt,
    pomodoroConfig,
    pomodoroPhase,
    pomodoroCycle,
    pomodoroCompletedCount,
    pomodoroRemaining,
    pomodoroRemainingFormatted,
    pomodoroCurrentTotalSeconds,
    pomodoroProgress,
    start,
    pause,
    resume,
    reset,
    stop,
    restore,
    save,
    setTimerMode,
    switchPomodoroPhase,
    skipPomodoroPhase,
    updatePomodoroConfig,
  };
}, {
  persist: {
    storage: sessionStorage,
  }
});
