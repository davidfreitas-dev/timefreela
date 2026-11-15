<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useProjectStore } from '@/stores/projectStore';
import { useTimerStore, type PomodoroPhase, type TimerMode } from '@/stores/timerStore';
import { useUserStore } from '@/stores/userStore';
import { useLoading } from '@/composables/useLoading';
import { useToast } from '@/composables/useToast';
import { useTimerForgottenAlert } from '@/composables/useTimerForgottenAlert';
import { type Option } from '@/types';
import AppContainer from '@/components/layout/AppContainer.vue';
import AppBreadcrumb from '@/components/ui/AppBreadcrumb.vue';
import AppCombobox from '@/components/ui/AppCombobox.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import AppDialog from '@/components/ui/AppDialog.vue';
import AppModal from '@/components/ui/AppModal.vue';
import AppInput from '@/components/ui/AppInput.vue';

const router = useRouter();
const projectStore = useProjectStore();
const timerStore = useTimerStore();
const userStore = useUserStore();

const { user } = storeToRefs(userStore);
const {
  mode,
  isPomodoro,
  isRunning,
  isPaused,
  projectId,
  elapsedFormatted,
  pomodoroPhase,
  pomodoroCycle,
  pomodoroCompletedCount,
  pomodoroRemainingFormatted,
  pomodoroConfig,
  pomodoroProgress,
} = storeToRefs(timerStore);

const { isLoading, withLoading } = useLoading();
const { showToast } = useToast();
const { requestPermission } = useTimerForgottenAlert();

const configModalRef = ref<InstanceType<typeof AppModal> | null>(null);
const dialogRef = ref<InstanceType<typeof AppDialog> | null>(null);

const tempConfig = ref({
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  cyclesBeforeLongBreak: 4,
});

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

const handleSelectMode = (newMode: TimerMode) => {
  timerStore.setTimerMode(newMode);
};

const handleSelectPhase = (phase: PomodoroPhase) => {
  timerStore.switchPomodoroPhase(phase);
};

const startTimer = () => {
  if (mode.value === 'continuous' || pomodoroPhase.value === 'focus') {
    if (!projectId.value) {
      showToast('error', 'Selecione um projeto para iniciar o timer.');
      return;
    }
  }
  requestPermission();
  timerStore.start(projectId.value || undefined);
};

const handlePauseResume = () => {
  if (isRunning.value) {
    timerStore.pause();
  } else {
    requestPermission();
    timerStore.resume();
  }
};

const handleSkipPomodoro = () => {
  timerStore.skipPomodoroPhase();
  showToast('info', 'Fase pulada com sucesso.');
};

const openConfigModal = () => {
  tempConfig.value = { ...pomodoroConfig.value };
  configModalRef.value?.openModal();
};

const savePomodoroConfig = () => {
  const focus = Math.max(1, Math.min(120, Number(tempConfig.value.focusMinutes) || 25));
  const shortBreak = Math.max(1, Math.min(30, Number(tempConfig.value.shortBreakMinutes) || 5));
  const longBreak = Math.max(1, Math.min(60, Number(tempConfig.value.longBreakMinutes) || 15));
  const cycles = Math.max(1, Math.min(12, Number(tempConfig.value.cyclesBeforeLongBreak) || 4));

  timerStore.updatePomodoroConfig({
    focusMinutes: focus,
    shortBreakMinutes: shortBreak,
    longBreakMinutes: longBreak,
    cyclesBeforeLongBreak: cycles,
  });

  configModalRef.value?.closeModal();
  showToast('success', 'Configurações do Pomodoro salvas.');
};

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
      <AppBreadcrumb title="Timer" description="Gerencie o tempo da sua sessão com cronômetro contínuo ou ciclos de Pomodoro." />
    </div>

    <section class="timer my-8">
      <div class="content p-8 md:p-14 bg-background dark:bg-accent-dark shadow-md rounded-3xl relative">
        <!-- Switch de Modo: Contínuo vs Pomodoro -->
        <div class="flex justify-center mb-8">
          <div class="inline-flex p-1 rounded-2xl bg-neutral dark:bg-neutral-dark border border-neutral dark:border-neutral-dark">
            <button
              type="button"
              class="px-5 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center gap-2"
              :class="!isPomodoro
                ? 'bg-primary dark:bg-primary-dark text-white shadow-sm'
                : 'text-secondary dark:text-secondary-dark hover:text-font dark:hover:text-white'"
              @click="handleSelectMode('continuous')"
            >
              <AppIcon name="schedule" size="sm" />
              <span>Contínuo</span>
            </button>
            <button
              type="button"
              class="px-5 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center gap-2"
              :class="isPomodoro
                ? 'bg-primary dark:bg-primary-dark text-white shadow-sm'
                : 'text-secondary dark:text-secondary-dark hover:text-font dark:hover:text-white'"
              @click="handleSelectMode('pomodoro')"
            >
              <span>🍅</span>
              <span>Pomodoro</span>
            </button>
          </div>
        </div>

        <!-- POMODORO: Seleção de Fase e Ciclos -->
        <div v-if="isPomodoro" class="flex flex-col items-center gap-4 mb-6">
          <div class="inline-flex gap-2 p-1 rounded-xl bg-neutral/60 dark:bg-neutral-dark/60">
            <button
              type="button"
              class="px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              :class="pomodoroPhase === 'focus'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-secondary dark:text-secondary-dark hover:text-font dark:hover:text-white'"
              @click="handleSelectPhase('focus')"
            >
              🎯 Foco ({{ pomodoroConfig.focusMinutes }}m)
            </button>
            <button
              type="button"
              class="px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              :class="pomodoroPhase === 'shortBreak'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-secondary dark:text-secondary-dark hover:text-font dark:hover:text-white'"
              @click="handleSelectPhase('shortBreak')"
            >
              ☕ Pausa Curta ({{ pomodoroConfig.shortBreakMinutes }}m)
            </button>
            <button
              type="button"
              class="px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              :class="pomodoroPhase === 'longBreak'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-secondary dark:text-secondary-dark hover:text-font dark:hover:text-white'"
              @click="handleSelectPhase('longBreak')"
            >
              🌴 Pausa Longa ({{ pomodoroConfig.longBreakMinutes }}m)
            </button>
          </div>

          <!-- Indicador de Ciclos -->
          <div class="flex items-center gap-3 text-xs text-secondary dark:text-secondary-dark">
            <span>Ciclo {{ pomodoroCycle }} de {{ pomodoroConfig.cyclesBeforeLongBreak }}</span>
            <div class="flex items-center gap-1.5">
              <span
                v-for="i in pomodoroConfig.cyclesBeforeLongBreak"
                :key="i"
                class="w-2.5 h-2.5 rounded-full transition-colors"
                :class="i < pomodoroCycle
                  ? 'bg-emerald-500'
                  : i === pomodoroCycle && isRunning && pomodoroPhase === 'focus'
                    ? 'bg-emerald-500 animate-pulse'
                    : 'bg-neutral dark:bg-neutral-dark'"
              />
            </div>
            <span v-if="pomodoroCompletedCount > 0" class="ml-2 font-medium text-emerald-600 dark:text-emerald-400">
              • {{ pomodoroCompletedCount }} {{ pomodoroCompletedCount === 1 ? 'bloco salvo' : 'blocos salvos' }}
            </span>
          </div>
        </div>

        <!-- DISPLAY DO TEMPO -->
        <div class="text-center my-6">
          <h2
            class="text-font dark:text-font-dark text-6xl sm:text-7xl md:text-8xl font-semibold font-mono tracking-tight"
            :class="{
              'text-emerald-600 dark:text-emerald-400': isPomodoro && pomodoroPhase === 'focus' && isRunning,
              'text-blue-600 dark:text-blue-400': isPomodoro && pomodoroPhase !== 'focus' && isRunning,
            }"
          >
            {{ isPomodoro ? pomodoroRemainingFormatted : elapsedFormatted }}
          </h2>

          <!-- Barra de Progresso no modo Pomodoro -->
          <div v-if="isPomodoro" class="w-full max-w-md mx-auto mt-6 bg-neutral dark:bg-neutral-dark h-2 rounded-full overflow-hidden">
            <div
              class="h-full transition-all duration-1000 ease-linear rounded-full"
              :class="pomodoroPhase === 'focus' ? 'bg-emerald-500' : 'bg-blue-500'"
              :style="{ width: `${pomodoroProgress}%` }"
            />
          </div>
        </div>

        <!-- SELEÇÃO DE PROJETO E CONTROLES -->
        <div class="flex flex-col gap-5 max-w-xl mx-auto mt-8">
          <div v-if="!isPomodoro || pomodoroPhase === 'focus'">
            <AppCombobox
              v-model="selectedProject"
              :options="projectOptions"
              label="Projeto"
              :disabled="isRunning || isPaused"
            />
          </div>
          <div v-else class="text-center text-sm text-secondary dark:text-secondary-dark italic py-2">
            Momento de pausa e descanso! O tempo de descanso não será faturado.
          </div>

          <!-- BOTÕES DE CONTROLE -->
          <div class="flex justify-center items-center gap-3 flex-wrap mt-4">
            <template v-if="isRunning || isPaused">
              <AppButton
                type="button"
                :is-loading="isLoading"
                @click="handlePauseResume"
              >
                <AppIcon :name="isRunning ? 'pause' : 'play_arrow'" /> 
                <span>{{ isRunning ? 'Pausar' : 'Continuar' }}</span>
              </AppButton>

              <AppButton
                v-if="isPomodoro"
                type="button"
                color="secondary"
                @click="handleSkipPomodoro"
              >
                <AppIcon name="chevron_right" /> 
                <span>Pular Fase</span>
              </AppButton>

              <AppButton
                v-if="!isPomodoro"
                type="button"
                color="outline"
                :is-loading="isLoading"
                @click="handleFinish"
              >
                <AppIcon name="stop" /> 
                <span>Finalizar</span>
              </AppButton>
            </template>

            <template v-else>
              <AppButton
                type="button"
                :is-loading="isLoading"
                @click="startTimer"
              >
                <AppIcon name="play_arrow" /> 
                <span>{{ isPomodoro ? (pomodoroPhase === 'focus' ? 'Iniciar Foco' : 'Iniciar Pausa') : 'Iniciar Timer' }}</span>
              </AppButton>

              <button
                v-if="isPomodoro"
                type="button"
                title="Configurações do Pomodoro"
                class="p-2.5 h-10 w-10 bg-neutral dark:bg-neutral-dark text-secondary dark:text-secondary-dark hover:text-font dark:hover:text-white rounded-full cursor-pointer flex items-center justify-center transition-colors"
                @click="openConfigModal"
              >
                <AppIcon name="settings" size="sm" />
              </button>
            </template>
          </div>
        </div>
      </div>

      <!-- Modal de Configuração do Pomodoro -->
      <AppModal
        ref="configModalRef"
        title="Configurações do Pomodoro"
      >
        <div class="space-y-4">
          <p class="text-sm text-secondary dark:text-secondary-dark">
            Personalize a duração dos blocos de foco e pausas para se adequar ao seu ritmo de trabalho:
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AppInput
              v-model="tempConfig.focusMinutes"
              label="Tempo de Foco (minutos)"
              type="number"
              min="1"
              max="120"
            />
            <AppInput
              v-model="tempConfig.shortBreakMinutes"
              label="Pausa Curta (minutos)"
              type="number"
              min="1"
              max="30"
            />
            <AppInput
              v-model="tempConfig.longBreakMinutes"
              label="Pausa Longa (minutos)"
              type="number"
              min="1"
              max="60"
            />
            <AppInput
              v-model="tempConfig.cyclesBeforeLongBreak"
              label="Ciclos até Pausa Longa"
              type="number"
              min="1"
              max="12"
            />
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t border-neutral dark:border-neutral-dark">
            <AppButton color="secondary" @click="configModalRef?.closeModal()">
              Cancelar
            </AppButton>
            <AppButton @click="savePomodoroConfig">
              Salvar Configuração
            </AppButton>
          </div>
        </div>
      </AppModal>

      <AppDialog
        ref="dialogRef"
        header="Tem certeza que deseja finalizar esta sessão?"
        message="Se confirmada, a sessão será salva no seu histórico."
        @confirm-action="finishTimer"
      />
    </section>
  </AppContainer>
</template>
