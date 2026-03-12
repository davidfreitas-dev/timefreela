<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useVuelidate } from '@vuelidate/core';
import { required } from '@vuelidate/validators';
import { useProjectStore } from '@/stores/projectStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useUserStore } from '@/stores/userStore';
import { useLoading } from '@/composables/useLoading';
import { useToast } from '@/composables/useToast';
import { type Option } from '@/types';
import AppContainer from '@/components/layout/AppContainer.vue';
import AppBreadcrumb from '@/components/ui/AppBreadcrumb.vue';
import AppInput from '@/components/ui/AppInput.vue';
import AppInputDate from '@/components/ui/AppInputDate.vue';
import AppSelect from '@/components/ui/AppSelect.vue';
import AppCheckbox from '@/components/ui/AppCheckbox.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppIcon from '@/components/ui/AppIcon.vue';

const route = useRoute();
const router = useRouter();
const projectStore = useProjectStore();
const sessionStore = useSessionStore();
const userStore = useUserStore();
const { user } = storeToRefs(userStore);

const { isLoading, withLoading } = useLoading();
const { showToast } = useToast();

const sessionId = computed(() => route.params.id as string | undefined);
const isEditMode = computed(() => Boolean(sessionId.value));
const formData = ref({
  projectId: '' as string,
  date: null as Date | null,
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

const loadSessionData = async () => {
  if (!sessionId.value) return;

  const session = await sessionStore.fetchOne(sessionId.value);

  if (session && session.startTime && session.endTime) {
    const start = new Date(String(session.startTime));
    const end = new Date(String(session.endTime));

    const toTimeString = (date: Date): string => {
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    };

    formData.value = {
      projectId: session.projectId ?? '',
      date: start,
      startTime: toTimeString(start),
      endTime: toTimeString(end),
      isBilled: session.isBilled ?? false
    };
  }
};

const buildDateTimeFromDate = (date: Date, timeStr: string): Date => {
  const [hour, minute] = timeStr.split(':').map(Number);
  const dt = new Date(date);
  dt.setHours(hour, minute, 0, 0);
  return dt;
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

  if (!formData.value.date) {
    showToast('error', 'Data inválida.');
    return;
  }

  if (!user.value?.id) {
    showToast('error', 'Usuário não autenticado.');
    return;
  }

  const date = new Date(formData.value.date);
  date.setHours(0, 0, 0, 0); 

  const startTime = buildDateTimeFromDate(date, formData.value.startTime);
  const endTime = buildDateTimeFromDate(date, formData.value.endTime);

  if (startTime >= endTime) {
    showToast('error', 'A hora de início deve ser menor que a hora de término.');
    return;
  }

  const session = {
    userId: user.value.id,
    projectId: formData.value.projectId,
    duration: calculateDurationInSeconds(startTime, endTime),
    isManual: true,
    isBilled: formData.value.isBilled,
    startTime: startTime,
    endTime: endTime,
    date: date
  };

  await withLoading(async () => {
    if (isEditMode.value && sessionId.value) {
      await sessionStore.update(sessionId.value, session);
      showToast('success', 'Sessão atualizada com sucesso.');
    } else {
      await sessionStore.create(session);
      showToast('success', 'Sessão cadastrada com sucesso.');
    }

    setTimeout(() => router.push({ name: 'Sessions' }), 1500);
  });
};

onMounted(() => {
  loadProjects();
  loadSessionData();
});
</script>

<template>
  <AppContainer>
    <div class="header flex justify-between items-center">
      <AppBreadcrumb 
        :title="isEditMode ? 'Editar Sessão' : 'Cadastro de Sessão'"
        :description="isEditMode ? 'Edite os dados do sessão aqui.' : 'Cadastre um nova sessão aqui.'"
      />
    </div>

    <section class="project my-7">
      <div class="content p-7 border border-neutral dark:border-neutral-dark rounded-xl">
        <form class="flex flex-col gap-5" @submit.prevent="saveSession">
          <AppSelect
            v-model="selectedProject"
            :options="projectOptions"
            label="Projeto"
            :error="v$.projectId.$dirty && v$.projectId.$error ? 'O projeto é obrigatório' : ''"
          />

          <AppInputDate
            v-model="formData.date"
            label="Data"
            :error="v$.date.$dirty && v$.date.$error ? 'A data é obrigatório' : ''"
          />

          <div class="grid grid-cols-2 gap-4">
            <AppInput
              v-model="formData.startTime"
              label="Hora de Início"
              placeholder="13:00"
              type="time"
              :error="v$.startTime.$dirty && v$.startTime.$error ? 'O horário de início é obrigatório' : ''"
            />
            <AppInput
              v-model="formData.endTime"
              label="Hora de Término"
              placeholder="15:00"
              type="time"
              :error="v$.endTime.$dirty && v$.endTime.$error ? 'O horário de término é obrigatório' : ''"
            />
          </div>

          <AppCheckbox
            v-model="formData.isBilled"
            label="Sessão faturada"
          />

          <div class="flex justify-end items-center gap-3">
            <AppButton
              type="submit"
              class="w-full md:w-fit"
              :is-loading="isLoading"
            >
              <AppIcon name="check" /> 
              <span class="ml-2">Confirmar</span>
            </AppButton>
          </div>
        </form>
      </div>
    </section>
  </AppContainer>
</template>
