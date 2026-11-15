import { watchEffect } from 'vue';
import { useTitle, useFavicon } from '@vueuse/core';
import { useTimerStore } from '@/stores/timerStore';
import { useProjectStore } from '@/stores/projectStore';

const FAVICON_RUNNING = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="%2310B981"/><polygon points="12,10 23,16 12,22" fill="%23FFFFFF"/></svg>`;
const FAVICON_PAUSED = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="%23F59E0B"/><rect x="10.5" y="9" width="4" height="14" rx="2" fill="%23FFFFFF"/><rect x="17.5" y="9" width="4" height="14" rx="2" fill="%23FFFFFF"/></svg>`;
const FAVICON_DEFAULT = '/favicon.ico';

export function useTimerTab() {
  const timerStore = useTimerStore();
  const projectStore = useProjectStore();

  const title = useTitle('TimeFreela');
  const favicon = useFavicon(FAVICON_DEFAULT);

  watchEffect(() => {
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
  });

  return {
    title,
    favicon,
  };
}
