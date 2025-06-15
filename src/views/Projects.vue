<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useLoading } from '@/composables/useLoading';
import { useProjectStore } from '@/stores/projectStore';
import { useTimerStore } from '@/stores/timerStore';
import Container from '@/components/Container.vue';
import Breadcrumb from '@/components/Breadcrumb.vue';
import Icon from '@/components/Icon.vue';
import Button from '@/components/Button.vue';
import InputSearch from '@/components/InputSearch.vue';
import Select from '@/components/Select.vue';
import Badge from '@/components/Badge.vue';
import Table from '@/components/Table.vue';
import Dialog from '@/components/Dialog.vue';
import Loader from '@/components/Loader.vue';

const search = ref('');

const filterOptions = [
  { label: 'Todos', value: 'all' },
  { label: 'Ativos', value: 'active' },
  { label: 'Inativos', value: 'inactive' },
];

const selectedFilter = ref(filterOptions[0]);

const tableHead = ref([
  'Criado em', 
  'Título', 
  'Descrição', 
  'Valor/Hora', 
  'Status', 
  'Ações'
]);

const timerStore = useTimerStore();
const projectStore = useProjectStore();
const { isLoading, withLoading } = useLoading();

onMounted(async () => {  
  if (timerStore.isRunning) {
    timerStore.start();
  }

  await withLoading(async () => {
    await projectStore.fetchProjects();
  }, 'Não foi possível carregar os projetos. Tente novamente mais tarde.');
});

onBeforeUnmount(() => {
  projectStore.stopListeningProjects();
});

const normalizedSearch = computed(() => search.value.trim().toLowerCase());

const filteredProjects = computed(() => {
  if (!projectStore.projects?.length) return [];

  return projectStore.projects
    .filter(project => {
      const status = selectedFilter.value.value;
      if (status === 'active') return project.active;
      if (status === 'inactive') return !project.active;
      return true;
    })
    .filter(project => {
      if (!normalizedSearch.value) return true;
      return project.title.toLowerCase().includes(normalizedSearch.value);
    });
});

const router = useRouter();

const goToCreateProject = () => {
  router.push({ name: 'ProjectCreate' });
};

const goToEditProject = (projectId: string) => {
  router.push({ name: 'ProjectDetails', params: { id: projectId } });
};

const dialogRef = ref<InstanceType<typeof Dialog> | null>(null);

const projectToDelete = ref<string | null>(null);

const handleDeleteProject = (projectId: string) => {
  projectToDelete.value = projectId;
  dialogRef.value?.openModal();
};

const confirmDelete = async () => {
  if (!projectToDelete.value) return;

  await withLoading(async () => {
    await projectStore.deleteProject(projectToDelete.value!);
    projectToDelete.value = null;
  }, 'Erro ao deletar o projeto. Tente novamente.');
};

</script>

<template>
  <Container>
    <div class="header flex justify-between items-center">
      <Breadcrumb title="Projetos" description="Gerencie seus projetos aqui." />

      <Button class="h-fit" @click="goToCreateProject">
        <Icon name="add" class="md:mr-2" />
        <span class="hidden md:block">
          Novo Projeto
        </span>
      </Button>
    </div>

    <div class="relative rounded-3xl border border-neutral dark:border-neutral-dark my-8">
      <div class="filters grid grid-cols-1 md:grid-cols-2 gap-4 w-full border-b border-neutral dark:border-neutral-dark p-5">
        <div class="w-full">
          <InputSearch
            v-model="search"
            placeholder="Buscar por título"
          />
        </div>

        <div class="w-full">
          <Select
            v-model="selectedFilter"
            :options="filterOptions"
          />
        </div>
      </div>

      <Loader
        v-if="isLoading"
        color="primary"
        class="w-4 h-4 mx-auto my-10"
      />

      <div class="rounded-2xl overflow-auto">
        <Table
          v-if="!isLoading && filteredProjects.length"
          :headers="tableHead"
          :items="filteredProjects"
        >
          <template #row="{ item: project }">
            <td class="px-6 py-4 w-[20%] max-w-[200px] truncate">
              {{ $filters.formatDate(project.createdAt) }}
            </td>

            <td class="px-6 py-4 w-[20%] max-w-[200px] truncate">
              {{ project.title }}
            </td>

            <td class="px-6 py-4 w-[30%] max-w-[300px] truncate">
              {{ project.description || '-' }}
            </td>

            <td class="px-6 py-4 w-[20%] max-w-[200px] truncate">
              {{ $filters.formatCurrencyBRL(project.hourlyRate) }}
            </td>

            <td class="px-6 py-4 w-[5%] min-w-[50px]">
              <Badge :label="project.active ? 'Ativo' : 'Inativo'" :color="project.active ? 'success' : 'danger'" />
            </td>

            <td class="px-6 py-4 w-[5%] min-w-[50px]">
              <div class="flex item-center gap-3">
                <button
                  class="p-2 h-10 w-10 bg-primary-accent dark:bg-primary-accent-dark text-primary dark:text-primary-dark rounded-full cursor-pointer"
                  @click="goToEditProject(project.id)"
                >
                  <Icon name="edit" />
                </button>
                <button
                  class="p-2 h-10 w-10 bg-danger-accent dark:bg-danger-accent-dark text-danger dark:text-danger-dark rounded-full cursor-pointer"
                  @click="handleDeleteProject(project.id)"
                >
                  <Icon name="delete" />
                </button>
              </div>
            </td>
          </template>
        </Table>
      </div>

      <div v-if="!isLoading && !filteredProjects.length" class="text-secondary dark:text-secondary-dark text-center my-10">
        Nenhum projeto encontrado.
      </div>
    </div>

    <Dialog
      ref="dialogRef"
      header="Tem certeza que deseja deletar este projeto?"
      message="Se confirmada essa ação não poderá ser desfeita."
      @confirm-action="confirmDelete"
    />
  </Container>
</template>
