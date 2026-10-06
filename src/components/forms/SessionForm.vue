<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useVuelidate } from '@vuelidate/core';
import { required } from '@vuelidate/validators';

import type { Session, Project, Option } from '@/types';

import AppInputDate from '@/components/ui/AppInputDate.vue';
import AppListbox from '@/components/ui/AppListbox.vue';
import AppCheckbox from '@/components/ui/AppCheckbox.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppIcon from '@/components/ui/AppIcon.vue';

export type SessionPayload = Omit<Session, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'projectTitle'>;

const props = defineProps<{
  initialData?: Session | null;
  projects: Project[];
  isLoading?: boolean;
}>();

const emit = defineEmits<{
  (e: 'save', payload: SessionPayload): void;
  (e: 'cancel'): void;
}>();

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

const projectOptions = computed(() => {
  return props.projects
    .filter(project => project.active)
    .map(project => ({
      label: project.title,
      value: String(project.id)
    }));
});

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

const initForm = () => {
  if (props.initialData && props.initialData.startTime && props.initialData.endTime) {
    const startTime = new Date(props.initialData.startTime);
    const endTime = new Date(props.initialData.endTime);
    const sessionDate = new Date(props.initialData.date || props.initialData.startTime);

    const dateOnly = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate());

    formData.value = {
      projectId: props.initialData.projectId ?? '',
      date: dateOnly,
      startTime: startTime,
      endTime: endTime,
      isBilled: props.initialData.isBilled ?? false
    };
  } else {
    formData.value = {
      projectId: '',
      date: null,
      startTime: null,
      endTime: null,
      isBilled: false
    };
  }
  v$.value.$reset();
};

watch(() => props.initialData, initForm, { immediate: true });

const calculateDurationInSeconds = (start: Date, end: Date): number => {
  return Math.floor((end.getTime() - start.getTime()) / 1000);
};

const errorMessage = ref('');

const submitForm = () => {
  v$.value.$touch();

  if (v$.value.$invalid) {
    errorMessage.value = 'Preencha os campos obrigatórios.';
    return;
  }

  if (!formData.value.date || !formData.value.startTime || !formData.value.endTime) {
    errorMessage.value = 'Data, hora de início e hora de término são obrigatórios.';
    return;
  }

  const baseDate = new Date(formData.value.date);
  
  const startTime = new Date(baseDate);
  startTime.setHours(formData.value.startTime.getHours(), formData.value.startTime.getMinutes(), 0, 0);

  const endTime = new Date(baseDate);
  endTime.setHours(formData.value.endTime.getHours(), formData.value.endTime.getMinutes(), 0, 0);

  const date = new Date(baseDate);
  date.setHours(0, 0, 0, 0);

  if (startTime >= endTime) {
    errorMessage.value = 'A hora de início deve ser menor que a hora de término.';
    return;
  }

  errorMessage.value = '';

  const payload: SessionPayload = {
    projectId: formData.value.projectId,
    duration: calculateDurationInSeconds(startTime, endTime),
    isManual: true,
    isBilled: formData.value.isBilled,
    startTime: startTime,
    endTime: endTime,
    date: date
  };

  emit('save', payload);
};
</script>

<template>
  <form class="flex flex-col gap-4" @submit.prevent="submitForm">
    <div v-if="errorMessage" class="p-3 bg-danger-accent dark:bg-danger-accent-dark text-danger dark:text-danger-dark rounded-md text-sm">
      {{ errorMessage }}
    </div>

    <AppListbox
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
      class="mt-2"
    />

    <div class="flex justify-end items-center gap-3 mt-3">
      <AppButton
        type="button"
        color="outline"
        class="w-full md:w-fit"
        @click="emit('cancel')"
      >
        Cancelar
      </AppButton>
      <AppButton
        type="submit"
        class="w-full md:w-fit"
        :is-loading="isLoading"
      >
        <AppIcon name="check" /> 
        <span>Confirmar</span>
      </AppButton>
    </div>
  </form>
</template>
