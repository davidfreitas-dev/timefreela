<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useVuelidate } from '@vuelidate/core';
import { required, minLength } from '@vuelidate/validators';
import { useProjectStore } from '@/stores/projectStore';
import { useLoading } from '@/composables/useLoading';
import { useToast } from '@/composables/useToast';
import { type Project } from '@/types/project';
import Container from '@/components/shared/Container.vue';
import Breadcrumb from '@/components/shared/Breadcrumb.vue';
import Input from '@/components/shared/Input.vue';
import InputCurrency from '@/components/shared/InputCurrency.vue';
import Select from '@/components/shared/Select.vue';
import Button from '@/components/shared/Button.vue';
import Dialog from '@/components/shared/Dialog.vue';

type StatusOption = {
  label: string;
  value: number;
};

const route = useRoute();
const router = useRouter();
const { showToast } = useToast();
const { isLoading, withLoading } = useLoading();

const statusOptions: StatusOption[] = [
  { label: 'Ativo', value: 1 },
  { label: 'Inativo', value: 0 }
];

const projectStore = useProjectStore();
const projectId = computed(() => route.params.id as string | undefined);
const isEditMode = computed(() => Boolean(projectId.value));
const formData = ref({
  title: '',
  description: '',
  tags: '',
  hourlyRate: '',
  active: null as number | null
});

const selectedStatus = computed<StatusOption | null>({
  get: () => statusOptions.find(opt => opt.value === formData.value.active) ?? null,
  set: (option) => {
    formData.value.active = option?.value ?? null;
  }
});

const rules = computed(() => ({
  title: { required, minLength: minLength(3) },
  description: { required },
  hourlyRate: { required },
  active: { required }
}));

const v$ = useVuelidate(rules, formData);

const parseTags = (tagString: string) => tagString.split(',').map(tag => tag.trim()).filter(Boolean);

const formatTags = (tags: string[] = []) => tags.join(', ');

const loadProjectData = async () => {
  if (!projectId.value) return;

  const project = await projectStore.getProjectById(projectId.value);

  if (project) {
    formData.value = {
      title: project.title ?? '',
      description: project.description ?? '',
      tags: formatTags(project.tags ?? []),
      hourlyRate: String(project.hourlyRate ?? 0),
      active: project.active ? Number(project.active) : null
    };
  }
};

const saveProject = async () => {
  v$.value.$touch();
    
  if (v$.value.$invalid) {
    showToast('error', 'Preencha os campos corretamente');
    return;
  }

  const data: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'userId'> = {
    title: formData.value.title,
    description: formData.value.description,
    tags: parseTags(formData.value.tags),
    hourlyRate: Number(formData.value.hourlyRate) || 0,
    active: formData.value.active ? Number(formData.value.active) : null
  };

  await withLoading(async () => {
    if (isEditMode.value && projectId.value) {
      await projectStore.updateProject(projectId.value, data);
      showToast('success', 'Projeto atualizado com sucesso.');
    } else {
      await projectStore.addProject(data);
      showToast('success', 'Projeto cadastrado com sucesso.');
    }

    setTimeout(() => router.push({ name: 'Projects' }), 2500);
  });
};

const deleteProject = async () => {
  if (!projectId.value) return;

  await withLoading(async () => {
    await projectStore.deleteProject(projectId.value!);
    showToast('success', 'Projeto deletado com sucesso.');
    router.push({ name: 'Projects' });
  });
};

const dialogRef = ref<InstanceType<typeof Dialog> | null>(null);

const handleDeleteProject = () => {
  dialogRef.value?.openModal();
};

onMounted(loadProjectData);
</script>

<template>
  <Container>
    <div class="header flex justify-between items-center">
      <Breadcrumb 
        :title="isEditMode ? 'Editar Projeto' : 'Cadastro de Projeto'"
        :description="isEditMode ? 'Edite os dados do projeto aqui.' : 'Cadastre um novo projeto aqui.'"
      />
    </div>

    <section class="project my-7">
      <div class="content p-7 border border-neutral rounded-xl">
        <form class="flex flex-col gap-5" @submit.prevent="saveProject">
          <Input
            v-model="formData.title"
            type="text"
            label="Título do Projeto"
            placeholder="Ex: Redesign do site"
            :error="v$.title.$dirty && v$.title.$error ? 'O título é obrigatório e deve ter ao menos 3 caracteres' : ''"
            @blur="v$.title.$touch"
          />

          <Input
            v-model="formData.description"
            type="text"
            label="Descrição"
            placeholder="Descrição do projeto"
            :error="v$.description.$dirty && v$.description.$error ? 'A descrição é obrigatória' : ''"
            @blur="v$.description.$touch"
          />

          <Input
            v-model="formData.tags"
            type="text"
            label="Tags (separadas por vírgula)"
            placeholder="design, frontend, site"
          />

          <InputCurrency
            v-model="formData.hourlyRate"
            label="Valor por hora"
            placeholder="Ex: R$ 80,00"
            :error="v$.hourlyRate.$dirty && v$.hourlyRate.$error ? 'Informe o valor por hora' : ''"
            @blur="v$.hourlyRate.$touch"
          />

          <Select
            v-model="selectedStatus"
            :options="statusOptions"
            label="Status"
            :error="v$.active.$dirty && v$.active.$error ? 'O status do projeto é obrigatório' : ''"
          />

          <div class="flex justify-end items-center gap-3">
            <Button
              v-if="isEditMode"
              type="button"
              class="w-fit"
              color="danger"
              :is-loading="isLoading"
              @click="handleDeleteProject"
            >
              Deletar Projeto
            </Button>

            <Button
              type="submit"
              class="w-fit"
              :is-loading="isLoading"
            >
              {{ isEditMode ? 'Atualizar Projeto' : 'Cadastrar Projeto' }}
            </Button>
          </div>
        </form>
      </div>
    </section>

    <Dialog
      ref="dialogRef"
      header="Tem certeza que deseja deletar este projeto?"
      message="Se confirmada essa ação não poderá ser desfeita."
      @confirm-action="deleteProject"
    />
  </Container>
</template>
