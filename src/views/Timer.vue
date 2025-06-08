<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useVuelidate } from '@vuelidate/core';
import { minValue, required } from '@vuelidate/validators';
import { useProjectStore } from '@/stores/projectStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useTimerStore } from '@/stores/timerStore';
import { useLoading } from '@/composables/useLoading';
import { useToast } from '@/composables/useToast';
import { type Option } from '@/types/option';
import Container from '@/components/Container.vue';
import Breadcrumb from '@/components/Breadcrumb.vue';
import Select from '@/components/Select.vue';
import Button from '@/components/Button.vue';
import Dialog from '@/components/Dialog.vue';

const router = useRouter();
const projectStore = useProjectStore();
const sessionStore = useSessionStore();
const timerStore = useTimerStore();

const { start, pause, reset } = timerStore;
const { duration, isRunning } = storeToRefs(timerStore);
const { isLoading, withLoading } = useLoading();
const { showToast } = useToast();

const rules = computed(() => ({
  projectId: { required },
  duration: { required, minValue: minValue(1) },
}));

const session = computed(() => {
  const base = sessionStore.activeSession ?? { projectId: '', duration: 0 };
  return { ...base, duration: duration.value };
});

const v$ = useVuelidate(rules, session);

const selectedProject = computed({
  get: () => {
    return projectOptions.value.find(
      option => option.value === sessionStore.activeSession?.projectId
    ) || { label: 'Selecione uma opção', value: '' };
  },
  set: (option: Option) => {
    if (!sessionStore.activeSession) {
      sessionStore.startSession(String(option.value));
    } else {
      sessionStore.activeSession.projectId = String(option.value);
    }
  }
});

watch(
  () => timerStore.duration,
  (newValue) => {
    if (sessionStore.activeSession) {
      sessionStore.activeSession.duration = newValue;
    }
  }
);

const projectOptions = computed(() => {
  return projectStore.projects
    .filter(project => project.active)
    .map(project => ({
      label: project.title,
      value: String(project.id)
    }));
});

const loadProjects = async () => {
  await projectStore.fetchProjects();
};

const formatTime = (seconds: number) => {
  const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
};

const startSession = () => {
  v$.value.$touch();

  if (!session.value.projectId) {
    showToast('error', 'Selecione um projeto para iniciar a sessão.');
    return;
  }

  sessionStore.startSession(session.value.projectId);
  
  start();
};

const isSessionStarted = computed(() => {
  const s = sessionStore.activeSession;
  return s !== null && !!s.projectId && (s.duration > 0 || isRunning.value);
});

const dialogRef = ref<InstanceType<typeof Dialog> | null>(null);

const handleFinishSession = () => {
  dialogRef.value?.openModal();
};

const handlePauseSession = () => {
  if (isRunning.value) {
    pause();
  } else {
    start();
  }
};

const finishSession = async () => {
  v$.value.$touch();

  if (v$.value.$invalid) {
    showToast('error', 'Preencha os campos obrigatórios.');
    return;
  }

  pause();

  await withLoading(async () => {
    await sessionStore.finishSession();
    router.push({ name: 'Sessions' });
    reset();
  });  
};

onMounted(() => {
  loadProjects();
  if (isRunning.value) {
    start();
  }
});
</script>

<template>
  <Container>
    <div class="header flex justify-between items-center">
      <Breadcrumb title="Timer" description="Gerencie o tempo da sua sessão de trabalho aqui." />
    </div>

    <section class="timer my-8">
      <div class="content p-7 md:p-20 border border-neutral dark:border-neutral-dark rounded-3xl">
        <h2 class="text-font dark:text-font-dark text-center text-4xl sm:text-7xl md:text-8xl font-bold mb-10">
          {{ formatTime(duration) }}
        </h2>

        <form class="flex flex-col gap-5" @submit.prevent="handleFinishSession">
          <Select
            v-model="selectedProject"
            :options="projectOptions"
            label="Projeto"
            :error="v$.projectId.$dirty && v$.projectId.$error ? 'A seleção do projeto é obrigatória' : ''"
          />

          <div class="flex justify-center gap-4 mt-4">
            <template v-if="isSessionStarted">
              <Button
                type="button"
                :is-loading="isLoading"
                @click="handlePauseSession"
              >
                {{ isRunning ? 'Pausar' : 'Continuar' }}
              </Button>

              <Button
                type="button"
                color="outline"
                :is-loading="isLoading"
                @click="handleFinishSession"
              >
                Finalizar
              </Button>
            </template>

            <template v-else>
              <Button
                type="button"
                :is-loading="isLoading"
                @click="startSession"
              >
                Iniciar Sessão
              </Button>
            </template>
          </div>
        </form>
      </div>

      <Dialog
        ref="dialogRef"
        header="Tem certeza que deseja finalizar esta sessão?"
        message="Se confirmada, essa ação não poderá ser desfeita."
        @confirm-action="finishSession"
      />
    </section>
  </Container>
</template>
