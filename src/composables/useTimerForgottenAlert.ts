import { watch, ref } from 'vue';
import { useTimerStore } from '@/stores/timerStore';
import { useProjectStore } from '@/stores/projectStore';
import { useToast } from '@/composables/useToast';

export interface AlertThreshold {
  seconds: number;
  label: string;
}

export const ALERT_THRESHOLDS: AlertThreshold[] = [
  { seconds: 14400, label: '4 horas' },
  { seconds: 28800, label: '8 horas' },
  { seconds: 43200, label: '12 horas' },
];

export function useTimerForgottenAlert() {
  const timerStore = useTimerStore();
  const projectStore = useProjectStore();
  const { showToast } = useToast();

  const notifiedThresholds = ref<Set<number>>(new Set());

  const isNotificationSupported = typeof window !== 'undefined' && 'Notification' in window;

  const requestPermission = async (): Promise<NotificationPermission | null> => {
    if (!isNotificationSupported) return null;
    if (Notification.permission === 'default') {
      try {
        return await Notification.requestPermission();
      } catch (err) {
        console.warn('Erro ao solicitar permissão de notificações:', err);
      }
    }
    return Notification.permission;
  };

  const sendBrowserNotification = (thresholdLabel: string, projectTitle: string) => {
    const title = `⏱️ Alerta de Timer (${thresholdLabel})`;
    const body = `Seu timer para o projeto "${projectTitle}" está rodando há mais de ${thresholdLabel}. Deseja continuar ou pausar?`;

    if (isNotificationSupported && Notification.permission === 'granted') {
      try {
        const notification = new Notification(title, {
          body,
          icon: '/favicon.ico',
          tag: `timer-alert-${thresholdLabel}`,
          requireInteraction: true,
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      } catch (err) {
        console.warn('Erro ao disparar notificação web:', err);
      }
    }

    // Always show toast notification inside the app
    showToast('warning', `Atenção: o timer do projeto "${projectTitle}" está rodando há mais de ${thresholdLabel}.`);
  };

  watch(
    () => timerStore.duration,
    (currentDuration) => {
      // Clear notified thresholds when duration resets to 0 or timer is stopped
      if (currentDuration === 0 || !timerStore.isRunning) {
        if (currentDuration === 0) {
          notifiedThresholds.value.clear();
        }
        return;
      }

      if (!timerStore.isRunning || timerStore.isPaused) return;

      for (const threshold of ALERT_THRESHOLDS) {
        if (currentDuration >= threshold.seconds && !notifiedThresholds.value.has(threshold.seconds)) {
          notifiedThresholds.value.add(threshold.seconds);

          const project = timerStore.projectId ? projectStore.getById(timerStore.projectId) : null;
          const projectTitle = project?.title || 'Projeto';

          sendBrowserNotification(threshold.label, projectTitle);
        }
      }
    }
  );

  watch(
    () => timerStore.isRunning,
    (running) => {
      if (running) {
        requestPermission();
      }
    }
  );

  return {
    requestPermission,
    isNotificationSupported,
    notifiedThresholds,
  };
}
