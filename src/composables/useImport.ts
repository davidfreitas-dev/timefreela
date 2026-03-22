import { useLoading } from '@/composables/useLoading';
import { useToast } from '@/composables/useToast';
import { useProjectStore } from '@/stores/projectStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useUserStore } from '@/stores/userStore';
import type { Project, Session } from '@/types';

export interface BackupData {
  version: string;
  projects: Project[];
  sessions: Session[];
}

export function useImport() {
  const { isLoading, withLoading } = useLoading();
  const { showToast } = useToast();
  const projectStore = useProjectStore();
  const sessionStore = useSessionStore();
  const userStore = useUserStore();

  const processBackupFile = async (file: File): Promise<BackupData> => {
    isLoading.value = true;
    try {
      const content = await file.text();
      const data = JSON.parse(content);

      if (!data.version || !Array.isArray(data.projects) || !Array.isArray(data.sessions)) {
        throw new Error('Arquivo de backup inválido ou corrompido.');
      }

      return data as BackupData;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Ocorreu um erro ao processar o arquivo.';
      showToast('error', message);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  const restoreBackup = async (backupData: BackupData) => {
    await withLoading(async () => {
      try {
        const userId = userStore.user?.id;
        if (!userId) {
          throw new Error('Usuário não autenticado.');
        }

        await projectStore.restoreProjects(userId, backupData.projects);
        await sessionStore.restoreSessions(userId, backupData.sessions, backupData.projects);

        showToast('success', 'Backup restaurado com sucesso! A página será recarregada.');

        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Ocorreu um erro ao restaurar o backup.';
        showToast('error', message);
      }
    });
  };

  return {
    isImporting: isLoading,
    processBackupFile,
    restoreBackup,
  };
}
