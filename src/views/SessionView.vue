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
  startTime: null as Date | null,
  endTime: null as Date | null,
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
    const sessionDate = new Date(String(session.startTime));
    const startTime = new Date(String(session.startTime));
    const endTime = new Date(String(session.endTime));

    const dateOnly = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate());

    formData.value = {
      projectId: session.projectId ?? '',
      date: dateOnly,
      startTime: startTime,
      endTime: endTime,
      isBilled: session.isBilled ?? false
    };
  }
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

  if (!formData.value.date || !formData.value.startTime || !formData.value.endTime) {
    showToast('error', 'Data, hora de início e hora de término são obrigatórios.');
    return;
  }

  if (!user.value?.id) {
    showToast('error', 'Usuário não autenticado.');
    return;
  }

  const date = new Date(formData.value.date);
  date.setHours(0, 0, 0, 0);
 
  const startTime = new Date(formData.value.startTime);
  startTime.setHours(formData.value.startTime.getHours(), formData.value.startTime.getMinutes(), 0, 0);

  const endTime = new Date(formData.value.endTime);
  endTime.setHours(formData.value.endTime.getHours(), formData.value.endTime.getMinutes(), 0, 0);

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
      <div class="content p-6 md:p-8 bg-background dark:bg-accent-dark shadow-md rounded-xl">
        <form class="flex flex-col gap-4" @submit.prevent="saveSession">
          <AppSelect
            v-model="selectedProject"
            :options="projectOptions"
            label="Projeto"
            :error="v$.projectId.$dirty && v$.projectId.$error ? 'O projeto é obrigatório' : ''"
          />

          <AppInputDate
            v-model="formData.date"
            label="Data"
            mode="date"
            :error="v$.date.$dirty && v$.date.$error ? 'A data é obrigatório' : ''"
          />

          <div class="grid grid-cols-2 gap-4">
            <AppInputDate
              v-model="formData.startTime"
              label="Hora de Início"
              mode="time"
              :error="v$.startTime.$dirty && v$.startTime.$error ? 'O horário de início é obrigatório' : ''"
            />
            <AppInputDate
              v-model="formData.endTime"
              label="Hora de Término"
              mode="time"
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
