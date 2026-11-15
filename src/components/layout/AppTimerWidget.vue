<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useTimerStore } from '@/stores/timerStore';
import { useTimerForgottenAlert } from '@/composables/useTimerForgottenAlert';
import AppIcon from '@/components/ui/AppIcon.vue';

const timerStore = useTimerStore();
const { requestPermission } = useTimerForgottenAlert();

const { isRunning, isPaused, duration, isPomodoro, pomodoroPhase, pomodoroRemainingFormatted } = storeToRefs(timerStore);

const formattedContinuous = computed(() => {
  const h = String(Math.floor(duration.value / 3600)).padStart(2, '0');
  const m = String(Math.floor((duration.value % 3600) / 60)).padStart(2, '0');
  const s = String(duration.value % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
});

const displayedTime = computed(() => {
  return isPomodoro.value ? pomodoroRemainingFormatted.value : formattedContinuous.value;
});

const shouldShowWidget = computed(() => {
  if (isPomodoro.value) {
    return isRunning.value || isPaused.value;
  }
  return duration.value > 0 || isRunning.value || isPaused.value;
});

const toggle = () => {
  if (isRunning.value) {
    timerStore.pause();
  } else if (timerStore.isPaused) {
    requestPermission();
    timerStore.resume();
  } else {
    requestPermission();
    timerStore.start();
  }
};
</script>

<template>
  <div
    v-if="shouldShowWidget"
    class="fixed bottom-4 right-4 bg-primary dark:bg-primary-dark shadow-xl rounded-full pl-4 pr-3 py-2.5 text-white flex items-center gap-3 z-50 transition-all"
    :class="{
      'bg-emerald-600 dark:bg-emerald-700': isPomodoro && pomodoroPhase === 'focus',
      'bg-blue-600 dark:bg-blue-700': isPomodoro && pomodoroPhase !== 'focus'
    }"
  >
    <div class="flex items-center gap-2">
      <span v-if="isPomodoro" class="text-xs font-semibold uppercase tracking-wider opacity-90">
        {{ pomodoroPhase === 'focus' ? '🎯 Foco' : '☕ Pausa' }}
      </span>
      <span
        class="text-base sm:text-lg font-bold leading-none font-mono text-left select-none"
        aria-label="Tempo decorrido"
      >
        {{ displayedTime }}
      </span>
    </div>

    <button
      class="flex items-center justify-center w-8 h-8 text-white cursor-pointer rounded-full bg-white/20 hover:bg-white/30 focus:outline-none transition-colors"
      aria-label="Toggle Timer"
      type="button"
      @click="toggle"
    >
      <AppIcon :name="isRunning ? 'pause' : 'play_arrow'" size="sm" />
    </button>
  </div>
</template>
