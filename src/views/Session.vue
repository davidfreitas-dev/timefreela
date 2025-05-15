<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useVuelidate } from '@vuelidate/core';
import { required } from '@vuelidate/validators';
import { useProjectStore } from '@/stores/projectStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useLoading } from '@/composables/useLoading';
import { useToast } from '@/composables/useToast';
import { type Option } from '@/types/option';
import Container from '@/components/shared/Container.vue';
import Breadcrumb from '@/components/shared/Breadcrumb.vue';
import Input from '@/components/shared/Input.vue';
import InputDate from '@/components/shared/InputDate.vue';
import Select from '@/components/shared/Select.vue';
import Checkbox from '@/components/shared/Checkbox.vue';
import Button from '@/components/shared/Button.vue';
import Dialog from '@/components/shared/Dialog.vue';

const route = useRoute();
const router = useRouter();
const projectStore = useProjectStore();
const sessionStore = useSessionStore();
const { isLoading, withLoading } = useLoading();
const { showToast } = useToast();

const sessionId = computed(() => route.params.id as string | undefined);
const isEditMode = computed(() => Boolean(sessionId.value));
const formData = ref({
  projectId: '' as string,
  date: '',
  startTime: '',
  endTime: '',
  isBilled: false
});

const rules = computed(() => ({
  projectId: { required },
  date: { required },
  startTime: { required },
  endTime: { required }
}));

const v$ = useVuelidate(rules, formData);

const selectedProject = computed({
  get: () => {
    return projectOptions.value.find(option => option.value === formData.value.projectId) || {
      label: 'Selecione uma opção',
      value: ''
    };
  },
  set: (option: Option) => {
    formData.value.projectId = String(option.value);
  }
});

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

const loadSessionData = async () => {
  if (!sessionId.value) return;

  const session = await sessionStore.getSessionById(sessionId.value);

  if (session && session.startTime && session.endTime) {
    const start = new Date(session.startTime);
    const end = new Date(session.endTime);

    const toTimeString = (date: Date): string =>
      date.toTimeString().slice(0, 5); // "HH:MM"

    const toDateString = (date: Date): string => {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };

    formData.value = {
      projectId: session.projectId ?? '',
      date: toDateString(start),
      startTime: toTimeString(start),
      endTime: toTimeString(end),
      isBilled: session.isBilled ?? false
    };
  }

};

const buildDateTime = (dateStr: string, timeStr: string): Date => {
  const [day, month, year] = dateStr.split('/').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute);
};

const calculateDurationInSeconds = (start: Date, end: Date): number => {
  return Math.floor((end.getTime() - start.getTime()) / 1000);
};

const saveSession = async () => {
  v$.value.$touch();

  if (v$.value.$invalid) {
    showToast('error', 'Preencha os campos obrigatórios.');
    return;
  }

  const date = buildDateTime(formData.value.date, '00:00');
  const startTime = buildDateTime(formData.value.date, formData.value.startTime);  
  const endTime = buildDateTime(formData.value.date, formData.value.endTime);

  if (startTime >= endTime) {
    showToast('error', 'A hora de início deve ser menor que a hora de término.');
    return;
  }

  const session = {
    projectId: formData.value.projectId,
    duration: calculateDurationInSeconds(startTime, endTime),
    isManual: true,
    isBilled: formData.value.isBilled,
    startTime,
    endTime,
    date
  };

  await withLoading(async () => {
    if (isEditMode.value && sessionId.value) {
      await sessionStore.updateSession(sessionId.value, session);
      showToast('success', 'Sessão atualizada com sucesso.');
    } else {
      await sessionStore.addSession(session);
      showToast('success', 'Sessão cadastrada com sucesso.');
    }

    setTimeout(() => router.push({ name: 'Sessions' }), 2500);
  });
};

const deleteSession = async () => {
  if (!sessionId.value) return;

  await withLoading(async () => {
    await sessionStore.deleteSession(sessionId.value!);
    showToast('success', 'Sessão deletada com sucesso.');
    router.push({ name: 'Sessions' });
  });
};

const dialogRef = ref<InstanceType<typeof Dialog> | null>(null);

const handleDeleteSession = () => {
  dialogRef.value?.openModal();
};

onMounted(() => {
  loadProjects();
  loadSessionData();
});
</script>

<template>
  <Container>
    <div class="header flex justify-between items-center">
      <Breadcrumb 
        :title="isEditMode ? 'Editar Sessão' : 'Cadastro de Sessão'"
        :description="isEditMode ? 'Edite os dados do sessão aqui.' : 'Cadastre um nova sessão aqui.'"
      />
    </div>

    <section class="project my-7">
      <div class="content p-7 border border-neutral rounded-xl">
        <form class="flex flex-col gap-5" @submit.prevent="saveSession">
          <Select
            v-model="selectedProject"
            :options="projectOptions"
            label="Projeto"
            :error="v$.projectId.$dirty && v$.projectId.$error ? 'O projeto é obrigatório' : ''"
          />

          <InputDate
            v-model="formData.date"
            label="Data"
            :error="v$.date.$dirty && v$.date.$error ? 'Obrigatório' : ''"
          />

          <div class="grid grid-cols-2 gap-4">
            <Input
              v-model="formData.startTime"
              label="Hora de Início"
              placeholder="13:00"
              type="time"
              :error="v$.startTime.$dirty && v$.startTime.$error ? 'Obrigatório' : ''"
            />
            <Input
              v-model="formData.endTime"
              label="Hora de Término"
              placeholder="15:00"
              type="time"
              :error="v$.endTime.$dirty && v$.endTime.$error ? 'Obrigatório' : ''"
            />
          </div>

          <Checkbox
            v-model="formData.isBilled"
            :value="!formData.isBilled"
            label="Sessão faturada"
          />

          <div class="flex justify-end items-center gap-3">
            <Button
              v-if="isEditMode"
              type="button"
              class="w-fit"
              color="danger"
              :is-loading="isLoading"
              @click="handleDeleteSession"
            >
              Deletar Sessão
            </Button>

            <Button class="w-fit" :is-loading="isLoading">
              {{ isEditMode ? 'Atualizar Sessão' : 'Cadastrar Sessão' }}
            </Button>
          </div>
        </form>
      </div>
    </section>

    <Dialog
      ref="dialogRef"
      header="Tem certeza que deseja deletar esta sessão?"
      message="Se confirmada essa ação não poderá ser desfeita."
      @confirm-action="deleteSession"
    />
  </Container>
</template>
