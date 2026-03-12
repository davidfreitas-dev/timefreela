<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useVuelidate } from '@vuelidate/core';
import { required, minLength } from '@vuelidate/validators';
import { useProjectStore } from '@/stores/projectStore';
import { useUserStore } from '@/stores/userStore';
import { useLoading } from '@/composables/useLoading';
import { useToast } from '@/composables/useToast';
import { type Project } from '@/types';
import { BillingType } from '@/constants/billing';
import AppContainer from '@/components/layout/AppContainer.vue';
import AppBreadcrumb from '@/components/ui/AppBreadcrumb.vue';
import AppInput from '@/components/ui/AppInput.vue';
import AppInputCurrency from '@/components/ui/AppInputCurrency.vue';
import AppTextarea from '@/components/ui/AppTextarea.vue';
import AppSelect from '@/components/ui/AppSelect.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppIcon from '@/components/ui/AppIcon.vue';

type StatusOption = {
  label: string;
  value: boolean;
};

type BillingTypeOption = {
  label: string;
  value: BillingType;
};

const route = useRoute();
const router = useRouter();
const { showToast } = useToast();
const { isLoading, withLoading } = useLoading();

const projectStore = useProjectStore();
const userStore = useUserStore();
const { user } = storeToRefs(userStore);

const projectId = computed(() => route.params.id as string | undefined);
const isEditMode = computed(() => Boolean(projectId.value));
const formData = ref({
  title: '',
  description: '',
  tags: '',
  billingType: null as BillingType | null,
  billingAmount: 0,
  estimatedDurationHours: '',
  active: null as boolean | null
});

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

const rules = computed(() => ({
  title: { required, minLength: minLength(3) },
  description: { required },
  billingType: { required },
  active: { required }
}));

const v$ = useVuelidate(rules, formData);

const parseTags = (tagString: string) => tagString.split(',').map(tag => tag.trim()).filter(Boolean);

const formatTags = (tags: string[] = []) => tags.join(', ');

const loadProjectData = async () => {
  if (!projectId.value) {
    formData.value.active = true;
    formData.value.billingType = BillingType.HOURLY;
    return;
  }

  await withLoading(async () => {
    const project = await projectStore.fetchOne(projectId.value!);

    if (project) {
      formData.value = {
        title: project.title ?? '',
        description: project.description ?? '',
        tags: formatTags(project.tags ?? []),
        billingType: project.billingType ?? BillingType.HOURLY,
        billingAmount: project.billingAmount ?? 0,
        estimatedDurationHours: project.estimatedDuration ? String(project.estimatedDuration / 3600) : '',
        active: project.active ?? true
      };
    }
  }, 'Erro ao carregar os dados do projeto.');
};

const saveProject = async () => {
  v$.value.$touch();
    
  if (v$.value.$invalid) {
    showToast('error', 'Preencha os campos corretamente');
    return;
  }

  if (!user.value?.id) {
    showToast('error', 'Usuário não autenticado');
    return;
  }

  const data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'> = {
    userId: user.value.id,
    title: formData.value.title,
    description: formData.value.description || '',
    tags: parseTags(formData.value.tags),
    billingType: formData.value.billingType ?? BillingType.HOURLY,
    billingAmount: Number(formData.value.billingAmount) || 0,
    active: formData.value.active ?? true
  };

  if (formData.value.estimatedDurationHours) {
    data.estimatedDuration = Number(formData.value.estimatedDurationHours) * 3600;
  }

  await withLoading(async () => {
    if (isEditMode.value && projectId.value) {
      await projectStore.update(projectId.value, data);
      showToast('success', 'Projeto atualizado com sucesso.');
    } else {
      await projectStore.create(data);
      showToast('success', 'Projeto cadastrado com sucesso.');
    }

    setTimeout(() => router.push({ name: 'Projects' }), 1500);
  });
};

onMounted(() => {
  loadProjectData();
});
</script>

<template>
  <AppContainer>
    <div class="header flex justify-between items-center">
      <AppBreadcrumb 
        :title="isEditMode ? 'Editar Projeto' : 'Cadastro de Projeto'"
        :description="isEditMode ? 'Edite os dados do projeto aqui.' : 'Cadastre um novo projeto aqui.'"
      />
    </div>

    <section class="project my-7">
      <div class="content p-7 border border-neutral dark:border-neutral-dark rounded-xl">
        <form class="flex flex-col gap-5" @submit.prevent="saveProject">
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

          <AppSelect
            v-model="selectedBillingType"
            :options="billingTypeOptions"
            label="Tipo de cobrança"
            :error="v$.billingType.$dirty && v$.billingType.$error ? 'O tipo de cobrança é obrigatório' : ''"
            @blur="v$.billingType.$touch"
          />

          <AppInputCurrency
            v-model="formData.billingAmount"
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

          <AppSelect
            v-model="selectedStatus"
            :options="statusOptions"
            label="Status"
            :error="v$.active.$dirty && v$.active.$error ? 'O status do projeto é obrigatório' : ''"
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
