import { watchEffect } from 'vue';
import { useTitle, useFavicon } from '@vueuse/core';
import { useTimerStore } from '@/stores/timerStore';
import { useProjectStore } from '@/stores/projectStore';

const FAVICON_RUNNING = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="%2310B981"/><polygon points="12,10 23,16 12,22" fill="%23FFFFFF"/></svg>`;
const FAVICON_PAUSED = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="%23F59E0B"/><rect x="10.5" y="9" width="4" height="14" rx="2" fill="%23FFFFFF"/><rect x="17.5" y="9" width="4" height="14" rx="2" fill="%23FFFFFF"/></svg>`;
const FAVICON_BREAK = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="%233B82F6"/><path d="M9 13h12v6a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5v-6zm12 2h2a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-2v-5z" fill="%23FFFFFF"/></svg>`;
const FAVICON_DEFAULT = '/favicon.ico';

export function useTimerTab() {
  const timerStore = useTimerStore();
  const projectStore = useProjectStore();

  const title = useTitle('TimeFreela');
  const favicon = useFavicon(FAVICON_DEFAULT);

  watchEffect(() => {
    if (timerStore.isPomodoro) {
      const isBreak = timerStore.pomodoroPhase !== 'focus';
      const project = timerStore.projectId ? projectStore.getById(timerStore.projectId) : null;
      const label = isBreak
        ? (timerStore.pomodoroPhase === 'shortBreak' ? 'Pausa Curta' : 'Pausa Longa')
        : (project?.title || 'Foco');

      const icon = isBreak ? '☕' : '🎯';

      if (timerStore.isRunning) {
        title.value = `${icon} ${timerStore.pomodoroRemainingFormatted} - ${label} | TimeFreela`;
        favicon.value = isBreak ? FAVICON_BREAK : FAVICON_RUNNING;
      } else if (timerStore.isPaused) {
        title.value = `⏸️ ${timerStore.pomodoroRemainingFormatted} - ${label} | TimeFreela`;
        favicon.value = FAVICON_PAUSED;
      } else {
        title.value = `${icon} ${timerStore.pomodoroRemainingFormatted} - ${label} | TimeFreela`;
        favicon.value = FAVICON_DEFAULT;
      }
    } else {
      // Modo Cronômetro Contínuo
      if (timerStore.isRunning) {
        const project = timerStore.projectId ? projectStore.getById(timerStore.projectId) : null;
        const projectTitle = project?.title || 'Timer';
        title.value = `⏱️ ${timerStore.elapsedFormatted} - ${projectTitle} | TimeFreela`;
        favicon.value = FAVICON_RUNNING;
      } else if (timerStore.isPaused) {
        const project = timerStore.projectId ? projectStore.getById(timerStore.projectId) : null;
        const projectTitle = project?.title || 'Timer';
        title.value = `⏸️ ${timerStore.elapsedFormatted} - ${projectTitle} | TimeFreela`;
        favicon.value = FAVICON_PAUSED;
      } else {
        title.value = 'TimeFreela';
        favicon.value = FAVICON_DEFAULT;
      }
    }
  });

  return {
    title,
    favicon,
  };
}
