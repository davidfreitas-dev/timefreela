<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useLoading } from '@/composables/useLoading';
import { useProjectStore } from '@/stores/projectStore';
import { useUserStore } from '@/stores/userStore';
import AppContainer from '@/components/layout/AppContainer.vue';
import AppBreadcrumb from '@/components/ui/AppBreadcrumb.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppInputSearch from '@/components/ui/AppInputSearch.vue';
import AppSelect from '@/components/ui/AppSelect.vue';
import AppBadge from '@/components/ui/AppBadge.vue';
import AppTable from '@/components/ui/AppTable.vue';
import AppDialog from '@/components/ui/AppDialog.vue';
import AppLoader from '@/components/ui/AppLoader.vue';

const search = ref('');

const filterOptions = [
  { label: 'Todos', value: 'all' },
  { label: 'Ativos', value: 'active' },
  { label: 'Inativos', value: 'inactive' },
];

const selectedFilter = ref(filterOptions[0]);

const tableHead = ref([
  'Título', 
  'Descrição', 
  'Cobrança', 
  'Valor', 
  'Estimativa', 
  'Status', 
  'Ações'
]);

const projectStore = useProjectStore();
const userStore = useUserStore();
const { user } = storeToRefs(userStore);
const { isLoading, withLoading } = useLoading();

onMounted(async () => {  
  if (user.value?.id) {
    await withLoading(async () => {
      await projectStore.fetchAll(user.value!.id);
    }, 'Não foi possível carregar os projetos. Tente novamente mais tarde.');
  }
});

const normalizedSearch = computed(() => search.value.trim().toLowerCase());

const filteredProjects = computed(() => {
  if (!projectStore.items?.length) return [];

  return projectStore.items
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
  router.push({ name: 'ProjectDetail', params: { id: projectId } });
};

const dialogRef = ref<InstanceType<typeof AppDialog> | null>(null);

const projectToDelete = ref<string | null>(null);

const handleDeleteProject = (projectId: string) => {
  projectToDelete.value = projectId;
  dialogRef.value?.openModal();
};

const confirmDelete = async () => {
  if (!projectToDelete.value) return;

  await withLoading(async () => {
    await projectStore.remove(projectToDelete.value!);
    projectToDelete.value = null;
  }, 'Erro ao deletar o projeto. Tente novamente.');
};

</script>

<template>
  <AppContainer>
    <div class="header flex justify-between items-center">
      <AppBreadcrumb title="Projetos" description="Gerencie seus projetos aqui." />

      <AppButton class="h-fit" @click="goToCreateProject">
        <AppIcon name="add" class="md:mr-2" />
        <span class="hidden md:block">
          Novo Projeto
        </span>
      </AppButton>
    </div>

    <div class="relative bg-background dark:bg-accent-dark rounded-3xl shadow-md my-8">
      <div class="filters grid grid-cols-1 md:grid-cols-2 gap-4 w-full border-b border-neutral dark:border-neutral-dark p-5">
        <div class="w-full">
          <AppInputSearch
            v-model="search"
            placeholder="Buscar por título"
          />
        </div>

        <div class="w-full">
          <AppSelect
            v-model="selectedFilter"
            :options="filterOptions"
          />
        </div>
      </div>

      <AppLoader
        v-if="isLoading"
        color="primary"
        class="w-4 h-4 mx-auto my-10"
      />

      <div class="rounded-2xl overflow-auto">
        <AppTable
          v-if="!isLoading && filteredProjects.length"
          :headers="tableHead"
          :items="filteredProjects"
        >
          <template #row="{ item: project }">
            <td class="px-6 py-3 w-[20%] max-w-[200px] truncate text-font dark:text-white">
              {{ project.title }}
            </td>

            <td class="px-6 py-3 w-[25%] max-w-[250px] truncate text-font dark:text-white">
              {{ project.description || '-' }}
            </td>

            <td class="px-6 py-3 w-[15%] max-w-[150px] truncate text-font dark:text-white">
              {{ project.billingType === 'hourly' ? 'Por Hora' : 'Valor Fixo' }}
            </td>

            <td class="px-6 py-3 w-[15%] max-w-[150px] truncate text-font dark:text-white font-mono">
              {{ $filters.formatCurrencyBRL(project.billingAmount) }}
            </td>

            <td class="px-6 py-3 w-[15%] max-w-[150px] truncate text-font dark:text-white font-mono">
              {{ $filters.formatDuration(project.estimatedDuration) }}
            </td>

            <td class="px-6 py-3 w-[5%] min-w-[50px]">
              <AppBadge :label="project.active ? 'Ativo' : 'Inativo'" :color="project.active ? 'success' : 'danger'" />
            </td>

            <td class="px-6 py-3 w-[5%] min-w-[50px]">
              <div class="flex item-center gap-3">
                <button
                  class="p-2 h-9 w-9 bg-primary-accent dark:bg-primary-accent-dark text-primary dark:text-primary-dark rounded-full cursor-pointer flex items-center justify-center"
                  @click="goToEditProject(project.id)"
                >
                  <AppIcon name="edit" size="sm" />
                </button>
                <button
                  class="p-2 h-9 w-9 bg-danger-accent dark:bg-danger-accent-dark text-danger dark:text-danger-dark rounded-full cursor-pointer flex items-center justify-center"
                  @click="handleDeleteProject(project.id)"
                >
                  <AppIcon name="delete" size="sm" />
                </button>
              </div>
            </td>
          </template>
        </AppTable>
      </div>

      <div v-if="!isLoading && !filteredProjects.length" class="text-secondary dark:text-secondary-dark text-center my-10">
        Nenhum projeto encontrado.
      </div>
    </div>

    <AppDialog
      ref="dialogRef"
      header="Tem certeza que deseja deletar este projeto?"
      message="Ao confirmar, todas as sessões associadas a este projeto também serão excluídas permanentemente. Esta ação não poderá ser desfeita."
      @confirm-action="confirmDelete"
    />
  </AppContainer>
</template>
