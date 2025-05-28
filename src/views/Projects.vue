<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useLoading } from '@/composables/useLoading';
import { useProjectStore } from '@/stores/projectStore';
import Container from '@/components/Container.vue';
import Breadcrumb from '@/components/Breadcrumb.vue';
import Icon from '@/components/Icon.vue';
import Button from '@/components/Button.vue';
import InputSearch from '@/components/InputSearch.vue';
import Select from '@/components/Select.vue';
import Badge from '@/components/Badge.vue';
import Table from '@/components/Table.vue';
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

const projectStore = useProjectStore();

const { isLoading, withLoading } = useLoading();

onMounted(async () => {  
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

    <div class="rounded-3xl overflow-hidden border border-neutral dark:border-neutral-dark my-8">
      <div class="filters flex flex-col md:flex-row gap-4 w-full p-5">
        <div class="w-full md:w-1/2">
          <InputSearch
            v-model="search"
            placeholder="Buscar por título"
          />
        </div>

        <div class="w-full md:w-1/2">
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
            <button
              class="p-2 h-10 w-10 bg-primary-accent dark:bg-primary-accent-dark text-primary dark:text-primary-dark rounded-lg cursor-pointer"
              @click="goToEditProject(project.id)"
            >
              <Icon name="edit" />
            </button>
          </td>
        </template>
      </Table>

      <div v-if="!isLoading && !filteredProjects.length" class="text-secondary dark:text-secondary-dark text-center mb-10">
        Nenhum projeto encontrado.
      </div>
    </div>
  </Container>
</template>
