<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useProjectStore } from '@/stores/projectStore';
import { useTimerStore } from '@/stores/timerStore';
import { useUserStore } from '@/stores/userStore';
import { useLoading } from '@/composables/useLoading';
import { useToast } from '@/composables/useToast';
import { type Option } from '@/types';
import AppContainer from '@/components/layout/AppContainer.vue';
import AppBreadcrumb from '@/components/ui/AppBreadcrumb.vue';
import AppSelect from '@/components/ui/AppSelect.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import AppDialog from '@/components/ui/AppDialog.vue';

const router = useRouter();
const projectStore = useProjectStore();
const timerStore = useTimerStore();
const userStore = useUserStore();

const { user } = storeToRefs(userStore);
const { isRunning, isPaused, projectId, elapsedFormatted } = storeToRefs(timerStore);
const { isLoading, withLoading } = useLoading();
const { showToast } = useToast();

const selectedProject = computed({
  get: () => {
    return projectOptions.value.find(
      option => option.value === projectId.value
    ) || { label: 'Selecione um projeto', value: '' };
  },
  set: (option: Option) => {
    projectId.value = String(option.value);
  }
});

const projectOptions = computed(() => {
  return projectStore.items
    .filter(project => project.active)
    .map(project => ({
      label: project.title,
      value: String(project.id)
    }));
});

const loadProjects = async () => {
  if (user.value?.id) {
    await projectStore.fetchAll(user.value.id);
  }
};

const startTimer = () => {
  if (!projectId.value) {
    showToast('error', 'Selecione um projeto para iniciar o timer.');
    return;
  }
  timerStore.start(projectId.value);
};

const handlePauseResume = () => {
  if (isRunning.value) {
    timerStore.pause();
  } else {
    timerStore.resume();
  }
};

const dialogRef = ref<InstanceType<typeof AppDialog> | null>(null);

const handleFinish = () => {
  dialogRef.value?.openModal();
};

const finishTimer = async () => {
  if (!user.value?.id) {
    showToast('error', 'Usuário não autenticado.');
    return;
  }

  await withLoading(async () => {
    await timerStore.save(user.value!.id);
    showToast('success', 'Sessão salva com sucesso.');
    router.push({ name: 'Sessions' });
  });  
};

onMounted(() => {
  loadProjects();
  timerStore.restore();
});
</script>

<template>
  <AppContainer>
    <div class="header flex justify-between items-center">
      <AppBreadcrumb title="Timer" description="Gerencie o tempo da sua sessão de trabalho aqui." />
    </div>

    <section class="timer my-8">
      <div class="content p-7 md:p-20 bg-background dark:bg-accent-dark shadow-md rounded-3xl">
        <h2 class="text-font dark:text-font-dark text-center text-4xl sm:text-7xl md:text-8xl font-bold mb-10">
          {{ elapsedFormatted }}
        </h2>

        <div class="flex flex-col gap-5">
          <AppSelect
            v-model="selectedProject"
            :options="projectOptions"
            label="Projeto"
            :disabled="isRunning || isPaused"
          />

          <div class="flex justify-center gap-4 mt-4">
            <template v-if="isRunning || isPaused">
              <AppButton
                type="button"
                :is-loading="isLoading"
                @click="handlePauseResume"
              >
                <AppIcon :name="isRunning ? 'pause' : 'play_arrow'" /> 
                <span class="ml-2">{{ isRunning ? 'Pausar' : 'Continuar' }}</span>
              </AppButton>

              <AppButton
                type="button"
                color="outline"
                :is-loading="isLoading"
                @click="handleFinish"
              >
                <AppIcon name="stop" /> 
                <span class="ml-2">Finalizar</span>
              </AppButton>
            </template>

            <template v-else>
              <AppButton
                type="button"
                :is-loading="isLoading"
                @click="startTimer"
              >
                <AppIcon name="play_arrow" /> 
                <span class="ml-2">Iniciar Timer</span>
              </AppButton>
            </template>
          </div>
        </div>
      </div>

      <AppDialog
        ref="dialogRef"
        header="Tem certeza que deseja finalizar esta sessão?"
        message="Se confirmada, a sessão será salva no seu histórico."
        @confirm-action="finishTimer"
      />
    </section>
  </AppContainer>
</template>
