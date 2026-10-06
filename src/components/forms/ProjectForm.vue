<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useVuelidate } from '@vuelidate/core';
import { required, minLength } from '@vuelidate/validators';

import type { Project } from '@/types';
import { BillingType } from '@/constants/billing';

import AppInput from '@/components/ui/AppInput.vue';
import AppTextarea from '@/components/ui/AppTextarea.vue';
import AppListbox from '@/components/ui/AppListbox.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppIcon from '@/components/ui/AppIcon.vue';

export type ProjectPayload = Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'userId'>;

type StatusOption = {
  label: string;
  value: boolean;
};

type BillingTypeOption = {
  label: string;
  value: BillingType;
};

const props = defineProps<{
  initialData?: Project | null;
  isLoading?: boolean;
}>();

const emit = defineEmits<{
  (e: 'save', payload: ProjectPayload): void;
  (e: 'cancel'): void;
}>();

const formData = ref({
  title: '',
  description: '',
  tags: '',
  billingType: BillingType.HOURLY as BillingType | null,
  billingAmount: 0 as number | string,
  estimatedDurationHours: '',
  active: true as boolean | null
});

const rules = computed(() => ({
  title: { required, minLength: minLength(3) },
  description: { required },
  billingType: { required },
  active: { required }
}));

const v$ = useVuelidate(rules, formData);

const billingTypeOptions: BillingTypeOption[] = [
  { label: 'Valor por hora', value: BillingType.HOURLY },
  { label: 'Valor fixo', value: BillingType.FIXED }
];

const selectedBillingType = computed<BillingTypeOption | null>({
  get: () => billingTypeOptions.find(opt => opt.value === formData.value.billingType) ?? null,
  set: (option) => {
    formData.value.billingType = option?.value ?? null;
  }
});

const statusOptions: StatusOption[] = [
  { label: 'Ativo', value: true },
  { label: 'Inativo', value: false }
];

const selectedStatus = computed<StatusOption | null>({
  get: () => statusOptions.find(opt => opt.value === formData.value.active) ?? null,
  set: (option) => {
    formData.value.active = option?.value ?? null;
  }
});

const formatTags = (tags: string[] = []) => tags.join(', ');
const parseTags = (tagString: string) => tagString.split(',').map(tag => tag.trim()).filter(Boolean);

const initForm = () => {
  if (props.initialData) {
    formData.value = {
      title: props.initialData.title ?? '',
      description: props.initialData.description ?? '',
      tags: formatTags(props.initialData.tags ?? []),
      billingType: props.initialData.billingType ?? BillingType.HOURLY,
      billingAmount: props.initialData.billingAmount ?? 0,
      estimatedDurationHours: props.initialData.estimatedDuration ? String(props.initialData.estimatedDuration / 3600) : '',
      active: props.initialData.active ?? true
    };
  } else {
    formData.value = {
      title: '',
      description: '',
      tags: '',
      billingType: BillingType.HOURLY,
      billingAmount: 0,
      estimatedDurationHours: '',
      active: true
    };
  }
  v$.value.$reset();
};

watch(() => props.initialData, initForm, { immediate: true });

const submitForm = () => {
  v$.value.$touch();
  
  if (v$.value.$invalid) {
    return;
  }

  const payload: ProjectPayload = {
    title: formData.value.title,
    description: formData.value.description || '',
    tags: parseTags(formData.value.tags),
    billingType: formData.value.billingType ?? BillingType.HOURLY,
    billingAmount: Number(formData.value.billingAmount) || 0,
    active: formData.value.active ?? true
  };

  if (formData.value.estimatedDurationHours) {
    payload.estimatedDuration = Number(formData.value.estimatedDurationHours) * 3600;
  }

  emit('save', payload);
};
</script>

<template>
  <form class="flex flex-col gap-4" @submit.prevent="submitForm">
    <AppInput
      v-model="formData.title"
      type="text"
      label="Título do Projeto"
      placeholder="Ex: Redesign do site"
      :error="v$.title.$dirty && v$.title.$error ? 'O título é obrigatório e deve ter ao menos 3 caracteres' : ''"
      @blur="v$.title.$touch"
    />

    <AppTextarea
      v-model="formData.description"
      label="Descrição"
      placeholder="Descrição do que deve ser feito"
      :error="v$.description.$dirty && v$.description.$error ? 'A descrição é obrigatória' : ''"
      @blur="v$.description.$touch"
    />

    <AppInput
      v-model="formData.tags"
      type="text"
      label="Tags (separadas por vírgula)"
      placeholder="design, frontend, site"
    />

    <AppListbox
      v-model="selectedBillingType"
      :options="billingTypeOptions"
      label="Tipo de cobrança"
      :error="v$.billingType.$dirty && v$.billingType.$error ? 'O tipo de cobrança é obrigatório' : ''"
      @blur="v$.billingType.$touch"
    />

    <AppInput
      v-model="formData.billingAmount"
      mask-type="currency"
      label="Valor"
    />

    <AppInput
      v-if="formData.billingType === 'fixed'"
      v-model="formData.estimatedDurationHours"
      type="number"
      label="Tempo estimado (em horas)"
      placeholder="Ex: 50"
      min="0"
    />

    <AppListbox
      v-model="selectedStatus"
      :options="statusOptions"
      label="Status"
      :error="v$.active.$dirty && v$.active.$error ? 'O status do projeto é obrigatório' : ''"
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
