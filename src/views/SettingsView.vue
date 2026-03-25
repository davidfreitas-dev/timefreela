<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useDark } from '@vueuse/core';
import { useTimerStore } from '@/stores/timerStore';
import { useReportStore } from '@/stores/reportStore';
import { useLoading } from '@/composables/useLoading';
import { useToast } from '@/composables/useToast';
import { useImport } from '@/composables/useImport';
import type { BackupData } from '@/composables/useImport';
import AppContainer from '@/components/layout/AppContainer.vue';
import AppBreadcrumb from '@/components/ui/AppBreadcrumb.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppSwitch from '@/components/ui/AppSwitch.vue';
import AppDialog from '@/components/ui/AppDialog.vue';

const timerStore = useTimerStore();
const reportStore = useReportStore();
const { showToast } = useToast();
const { isImporting, processBackupFile, restoreBackup } = useImport();

onMounted(() => {
  if (timerStore.isRunning) {
    timerStore.start();
  }
});

const { isLoading: isExporting, withLoading: withExporting } = useLoading();

const handleBackup = async () => {
  await withExporting(async () => {
    await reportStore.downloadJsonBackup();
    showToast('success', 'Backup exportado com sucesso.');
  });
};

const isDark = useDark({
  selector: 'html', // Aplica a classe .dark na <html>
  attribute: 'class',
  valueDark: 'dark',
  valueLight: '',
});

// --- Import Logic ---
const importDialogRef = ref<InstanceType<typeof AppDialog> | null>(null);
const backupData = ref<BackupData | null>(null);
const dialogMessage = ref('');

const triggerFileInput = () => {
  const fileInput = document.getElementById('backup-file-input');
  fileInput?.click();
};

const onFileSelected = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  try {
    const data = await processBackupFile(file);
    backupData.value = data;

    const projectCount = data.projects.length;
    const sessionCount = data.sessions.length;

    dialogMessage.value = `Você está prestes a substituir todos os dados atuais. Esta ação não pode ser desfeita. O backup contém ${projectCount} projeto(s) e ${sessionCount} sessão(ões). Deseja continuar?`;
    importDialogRef.value?.openModal();

  } catch {
    // Error is already handled by the toast in the composable
  } finally {
    target.value = ''; // Reset file input
  }
};

const onRestoreConfirmed = async () => {
  if (!backupData.value) return;
  await restoreBackup(backupData.value);
};
</script>

<template>
  <AppContainer>
    <div class="header flex justify-between items-center">
      <AppBreadcrumb title="Configurações" description="Gerencie suas configurações aqui." />
    </div>

    <section class="backup my-7">
      <div class="p-6 md:p-8 bg-background dark:bg-accent-dark shadow-md rounded-3xl">
        <h1 class="section-title text-lg font-bold text-secondary dark:text-secondary-dark mb-4">
          Backup e Restauração de Dados
        </h1>
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-neutral dark:border-neutral-dark pb-6">
          <p class="text-secondary dark:text-secondary-dark text-sm max-w-md">
            Exporte todos os seus projetos e sessões em um único arquivo JSON.
          </p>
          <AppButton
            color="outline"
            :is-loading="isExporting"
            @click="handleBackup"
          >
            Exportar Backup (JSON)
          </AppButton>
        </div>
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-6">
          <div class="max-w-md">
            <p class="text-secondary dark:text-secondary-dark text-sm">
              Restaure seus dados a partir de um arquivo de backup.
            </p>
            <p class="text-xs text-danger dark:text-danger-dark mt-1">
              Atenção: Esta ação substituirá todos os seus dados atuais.
            </p>
          </div>
          <AppButton
            color="danger"
            :is-loading="isImporting"
            @click="triggerFileInput"
          >
            Restaurar Backup (JSON)
          </AppButton>
          <input
            id="backup-file-input"
            type="file"
            class="hidden"
            accept="application/json"
            @change="onFileSelected"
          >
        </div>
      </div>
    </section>

    <section class="system my-7">
      <div class="p-6 md:p-8 bg-background dark:bg-accent-dark shadow-md rounded-3xl">
        <h1 class="section-title text-lg font-bold text-secondary dark:text-secondary-dark mb-4">
          Sistema
        </h1>
        <div class="flex justify-between items-center">
          <p class="text-secondary dark:text-secondary-dark text-sm max-w-md">
            Modo escuro
          </p>
          <AppSwitch v-model="isDark" />
        </div>
      </div>
    </section>

    <AppDialog
      ref="importDialogRef"
      header="Confirmar Restauração"
      :message="dialogMessage"
      @confirm-action="onRestoreConfirmed"
    />
  </AppContainer>
</template>
