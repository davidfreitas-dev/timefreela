<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useLoading } from '@/composables/useLoading';
import { useToast } from '@/composables/useToast';
import { useProjectStore } from '@/stores/projectStore';
import { useUserStore } from '@/stores/userStore';
import { sessionService } from '@/services/sessionService';
import { useProjectMetrics } from '@/composables/useProjectMetrics';

import type { Project, Session } from '@/types';

import AppContainer from '@/components/layout/AppContainer.vue';
import AppBreadcrumb from '@/components/ui/AppBreadcrumb.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppInputSearch from '@/components/ui/AppInputSearch.vue';
import AppListbox from '@/components/ui/AppListbox.vue';
import AppBadge from '@/components/ui/AppBadge.vue';
import AppTable from '@/components/ui/AppTable.vue';
import AppDialog from '@/components/ui/AppDialog.vue';
import AppDotsLoader from '@/components/ui/AppDotsLoader.vue';
import AppEmptyState from '@/components/ui/AppEmptyState.vue';
import AppModal from '@/components/ui/AppModal.vue';
import AppStatCard from '@/components/ui/AppStatCard.vue';
import ProjectForm, { type ProjectPayload } from '@/components/forms/ProjectForm.vue';

const search = ref('');

const filterOptions = [
  { label: 'Todos', value: 'all' },
  { label: 'Ativos', value: 'active' },
  { label: 'Inativos', value: 'inactive' },
];

const selectedFilter = ref(filterOptions[0]);

const tableHead = ref([
  { label: 'Projeto', class: 'min-w-56' },
  { label: 'Cobrança', class: 'w-28 min-w-28' },
  { label: 'Valor', class: 'w-32 min-w-32' },
  { label: 'Estimativa', class: 'w-28 min-w-28' },
  { label: 'Horas Gastas', class: 'w-36 min-w-36' },
  { label: 'Taxa Real / h', class: 'w-44 min-w-44' },
  { label: 'Status', class: 'w-24 min-w-24' },
  { label: 'Ações', class: 'w-44 min-w-44' }
]);

const projectStore = useProjectStore();
const userStore = useUserStore();
const { user } = storeToRefs(userStore);
const { isLoading, withLoading } = useLoading();
const { showToast } = useToast();

const sessions = ref<Session[]>([]);
const { getStats, summary } = useProjectMetrics(() => projectStore.items, sessions);

const modalRef = ref<InstanceType<typeof AppModal> | null>(null);
const detailsModalRef = ref<InstanceType<typeof AppModal> | null>(null);
const dialogRef = ref<InstanceType<typeof AppDialog> | null>(null);

const editingProjectId = ref<string | null>(null);
const selectedProject = ref<Project | null>(null);
const detailsProject = ref<Project | null>(null);
const isFormLoading = ref(false);
const projectToDelete = ref<string | null>(null);

const fetchProjects = async () => {
  if (user.value?.id) {
    await projectStore.fetchAll(user.value.id);
    sessions.value = await sessionService.getRawSessionsByUser(user.value.id);
  }
};

onMounted(async () => {  
  await withLoading(fetchProjects, 'Não foi possível carregar os projetos. Tente novamente mais tarde.');
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

const openCreateModal = () => {
  editingProjectId.value = null;
  selectedProject.value = null;
  modalRef.value?.openModal();
};

const openEditModal = async (projectId: string) => {
  editingProjectId.value = projectId;
  isFormLoading.value = true;
  modalRef.value?.openModal();
  
  try {
    selectedProject.value = await projectStore.fetchOne(projectId);
  } catch (error) {
    showToast('error', 'Erro ao carregar os dados do projeto.');
    modalRef.value?.closeModal();
  } finally {
    isFormLoading.value = false;
  }
};

const openDetailsModal = (project: Project) => {
  detailsProject.value = project;
  detailsModalRef.value?.openModal();
};

const handleSaveProject = async (payload: ProjectPayload) => {
  if (!user.value?.id) {
    showToast('error', 'Usuário não autenticado');
    return;
  }

  isFormLoading.value = true;
  try {
    const data = { ...payload, userId: user.value.id };
    
    if (editingProjectId.value) {
      await projectStore.update(editingProjectId.value, data);
      showToast('success', 'Projeto atualizado com sucesso.');
    } else {
      await projectStore.create(data);
      showToast('success', 'Projeto cadastrado com sucesso.');
    }
    
    modalRef.value?.closeModal();
    await fetchProjects();
  } catch (error) {
    showToast('error', 'Erro ao salvar o projeto. Tente novamente.');
  } finally {
    isFormLoading.value = false;
  }
};

const handleDeleteProject = (projectId: string) => {
  projectToDelete.value = projectId;
  dialogRef.value?.openModal();
};

const handleToggleActive = async (project: Project) => {
  await withLoading(async () => {
    await projectStore.toggleActive(project.id, !project.active);
    showToast('success', project.active ? 'Projeto inativado com sucesso.' : 'Projeto reativado com sucesso.');
  }, 'Erro ao alterar status do projeto.');
};

const confirmDelete = async () => {
  if (!projectToDelete.value) return;

  await withLoading(async () => {
    await projectStore.remove(projectToDelete.value!);
    projectToDelete.value = null;
    showToast('success', 'Projeto excluído com sucesso.');
  }, 'Erro ao deletar o projeto. Tente novamente.');
};

</script>

<template>
  <AppContainer>
    <div class="header flex justify-between items-center">
      <AppBreadcrumb title="Projetos" description="Gerencie seus projetos e acompanhe a taxa horária real de cada um." />

      <AppButton @click="openCreateModal">
        <AppIcon name="add" />
        <span class="hidden md:block">
          Novo Projeto
        </span>
      </AppButton>
    </div>

    <!-- Quick Stats Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 my-6">
      <AppStatCard label="Total de Projetos" :value="summary.totalProjects" />
      <AppStatCard label="Projetos Ativos" :value="summary.activeProjectsCount" />
      <AppStatCard label="Projetos de Valor Fixo" :value="summary.fixedProjectsCount" />
      <AppStatCard
        label="Taxa Real Média (Fixo)"
        :value="summary.averageRealHourlyRateFixed ? `${$filters.formatCurrencyBRL(summary.averageRealHourlyRateFixed)}/h` : '-'"
      />
    </div>

    <div class="relative bg-background dark:bg-accent-dark rounded-3xl shadow-md my-8">
      <div class="filters grid grid-cols-1 md:grid-cols-2 gap-4 w-full border-b border-neutral dark:border-neutral-dark px-8 pt-8 pb-6">
        <div class="w-full">
          <AppInputSearch
            v-model="search"
            label="Buscar Projeto"
            placeholder="Buscar por título"
          />
        </div>

        <div class="w-full">
          <AppListbox
            v-model="selectedFilter"
            label="Status"
            :options="filterOptions"
          />
        </div>
      </div>

      <AppDotsLoader
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
            <!-- 1. Projeto (Título e Descrição) -->
            <td class="px-6 py-3 min-w-56">
              <div class="font-medium text-font dark:text-white truncate" :title="project.title">
                {{ project.title }}
              </div>
              <div
                v-if="project.description"
                class="text-xs text-secondary dark:text-secondary-dark truncate mt-0.5"
                :title="project.description"
              >
                {{ project.description }}
              </div>
            </td>

            <!-- 2. Cobrança -->
            <td class="px-6 py-3 w-28 min-w-28 whitespace-nowrap text-font dark:text-white">
              <span
                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                :class="project.billingType === 'fixed'
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300'
                  : 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'"
              >
                {{ project.billingType === 'hourly' ? 'Por Hora' : 'Valor Fixo' }}
              </span>
            </td>

            <!-- 3. Valor -->
            <td class="px-6 py-3 w-32 min-w-32 whitespace-nowrap text-font dark:text-white font-mono">
              <div class="font-medium">
                {{ $filters.formatCurrencyBRL(project.billingAmount) }}
              </div>
              <span class="text-xs text-secondary dark:text-secondary-dark font-sans">
                {{ project.billingType === 'hourly' ? '/ hora' : 'total fixo' }}
              </span>
            </td>

            <!-- 4. Estimativa -->
            <td class="px-6 py-3 w-28 min-w-28 whitespace-nowrap text-font dark:text-white font-mono">
              {{ project.estimatedDuration ? $filters.formatDuration(project.estimatedDuration) : '-' }}
            </td>

            <!-- 5. Horas Gastas -->
            <td class="px-6 py-3 w-36 min-w-36 whitespace-nowrap text-font dark:text-white font-mono">
              <div class="font-medium">
                {{ getStats(project.id).totalSeconds > 0 ? $filters.formatDuration(getStats(project.id).totalSeconds) : '0h' }}
              </div>
              <span v-if="getStats(project.id).sessionCount > 0" class="text-xs text-secondary dark:text-secondary-dark font-sans">
                {{ getStats(project.id).sessionCount }} {{ getStats(project.id).sessionCount === 1 ? 'sessão' : 'sessões' }}
              </span>
            </td>

            <!-- 6. Taxa Real / h -->
            <td class="px-6 py-3 w-44 min-w-44 whitespace-nowrap font-mono">
              <template v-if="project.billingType === 'fixed'">
                <div v-if="getStats(project.id).realHourlyRate" class="flex items-center gap-1.5 flex-wrap">
                  <span class="text-font dark:text-white font-semibold">
                    {{ $filters.formatCurrencyBRL(getStats(project.id).realHourlyRate!) }}/h
                  </span>
                  <span
                    v-if="getStats(project.id).profitabilityVariance !== null"
                    class="text-xs px-1.5 py-0.5 rounded font-sans font-medium"
                    :class="{
                      'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300': getStats(project.id).profitabilityStatus === 'lucrative',
                      'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300': getStats(project.id).profitabilityStatus === 'deficit',
                      'bg-neutral text-secondary dark:bg-neutral-dark dark:text-secondary-dark': getStats(project.id).profitabilityStatus === 'on-track'
                    }"
                    :title="getStats(project.id).profitabilityStatus === 'lucrative' ? 'Taxa real acima da estimativa planejada' : 'Taxa real abaixo da estimativa planejada'"
                  >
                    {{ getStats(project.id).profitabilityVariance! > 0 ? '+' : '' }}{{ Math.round(getStats(project.id).profitabilityVariance!) }}%
                  </span>
                </div>
                <span v-else class="text-secondary dark:text-secondary-dark text-xs font-sans">
                  - (0h registradas)
                </span>
              </template>
              <template v-else>
                <span class="text-font dark:text-white font-medium">
                  {{ $filters.formatCurrencyBRL(project.billingAmount) }}/h
                </span>
              </template>
            </td>

            <!-- 7. Status -->
            <td class="px-6 py-3 w-24 min-w-24 whitespace-nowrap">
              <AppBadge :label="project.active ? 'Ativo' : 'Inativo'" :color="project.active ? 'success' : 'danger'" />
            </td>

            <!-- 8. Ações -->
            <td class="px-6 py-3 w-44 min-w-44 whitespace-nowrap">
              <div class="flex items-center gap-2">
                <button
                  title="Ver detalhes e métricas do projeto"
                  class="p-2 h-8 w-8 bg-neutral dark:bg-neutral-dark text-secondary dark:text-secondary-dark hover:text-font dark:hover:text-font-dark rounded-full cursor-pointer flex items-center justify-center transition-colors"
                  @click="openDetailsModal(project)"
                >
                  <AppIcon name="visibility" size="sm" />
                </button>
                <button
                  :title="project.active ? 'Inativar/Arquivar projeto' : 'Reativar projeto'"
                  class="p-2 h-8 w-8 bg-neutral dark:bg-neutral-dark text-secondary dark:text-secondary-dark hover:text-font dark:hover:text-font-dark rounded-full cursor-pointer flex items-center justify-center transition-colors"
                  @click="handleToggleActive(project)"
                >
                  <AppIcon :name="project.active ? 'archive' : 'unarchive'" size="sm" />
                </button>
                <button
                  title="Editar projeto"
                  class="p-2 h-8 w-8 bg-neutral dark:bg-neutral-dark text-secondary dark:text-secondary-dark hover:text-font dark:hover:text-font-dark rounded-full cursor-pointer flex items-center justify-center transition-colors"
                  @click="openEditModal(project.id)"
                >
                  <AppIcon name="edit" size="sm" />
                </button>
                <button
                  title="Excluir projeto"
                  class="p-2 h-8 w-8 bg-danger-accent dark:bg-danger-accent-dark text-danger dark:text-danger-dark rounded-full cursor-pointer flex items-center justify-center transition-colors"
                  @click="handleDeleteProject(project.id)"
                >
                  <AppIcon name="delete" size="sm" />
                </button>
              </div>
            </td>
          </template>
        </AppTable>
      </div>

      <div v-if="!isLoading && !filteredProjects.length" class="py-12 px-4">
        <AppEmptyState
          icon="folder"
          title="Nenhum projeto encontrado"
          message="Nenhum projeto corresponde à busca ou aos filtros selecionados."
        />
      </div>
    </div>

    <!-- Modal de Edição / Criação -->
    <AppModal
      ref="modalRef"
      :title="editingProjectId ? 'Editar Projeto' : 'Novo Projeto'"
    >
      <ProjectForm
        :initial-data="selectedProject"
        :is-loading="isFormLoading"
        @save="handleSaveProject"
        @cancel="modalRef?.closeModal()"
      />
    </AppModal>

    <!-- Modal de Detalhes e Rentabilidade -->
    <AppModal
      ref="detailsModalRef"
      title="Detalhes do Projeto"
    >
      <div v-if="detailsProject" class="space-y-6">
        <div>
          <div class="flex items-center gap-3">
            <h3 class="text-xl font-bold text-font dark:text-white">
              {{ detailsProject.title }}
            </h3>
            <AppBadge
              :label="detailsProject.active ? 'Ativo' : 'Inativo'"
              :color="detailsProject.active ? 'success' : 'danger'"
            />
            <span
              class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
              :class="detailsProject.billingType === 'fixed'
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300'
                : 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'"
            >
              {{ detailsProject.billingType === 'hourly' ? 'Por Hora' : 'Valor Fixo' }}
            </span>
          </div>

          <p v-if="detailsProject.description" class="text-sm text-secondary dark:text-secondary-dark mt-2">
            {{ detailsProject.description }}
          </p>

          <div v-if="detailsProject.tags?.length" class="flex flex-wrap gap-1.5 mt-3">
            <span
              v-for="tag in detailsProject.tags"
              :key="tag"
              class="text-xs bg-neutral dark:bg-neutral-dark text-secondary dark:text-secondary-dark px-2 py-0.5 rounded-full"
            >
              #{{ tag }}
            </span>
          </div>
        </div>

        <!-- Grade de Métricas -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="p-4 rounded-2xl bg-neutral/50 dark:bg-neutral-dark/50 border border-neutral dark:border-neutral-dark">
            <span class="text-xs text-secondary dark:text-secondary-dark font-medium block">
              {{ detailsProject.billingType === 'hourly' ? 'Taxa Contratada' : 'Valor Fixo Total' }}
            </span>
            <span class="text-xl font-bold font-mono text-font dark:text-white mt-1 block">
              {{ $filters.formatCurrencyBRL(detailsProject.billingAmount) }}
              <span class="text-xs font-normal text-secondary dark:text-secondary-dark">
                {{ detailsProject.billingType === 'hourly' ? '/ hora' : '' }}
              </span>
            </span>
          </div>

          <div class="p-4 rounded-2xl bg-neutral/50 dark:bg-neutral-dark/50 border border-neutral dark:border-neutral-dark">
            <span class="text-xs text-secondary dark:text-secondary-dark font-medium block">
              Horas Efetivamente Trabalhadas
            </span>
            <span class="text-xl font-bold font-mono text-font dark:text-white mt-1 block">
              {{ $filters.formatDuration(getStats(detailsProject.id).totalSeconds) }}
            </span>
            <span class="text-xs text-secondary dark:text-secondary-dark">
              {{ getStats(detailsProject.id).sessionCount }} sessões registradas
            </span>
          </div>

          <div class="p-4 rounded-2xl bg-neutral/50 dark:bg-neutral-dark/50 border border-neutral dark:border-neutral-dark">
            <span class="text-xs text-secondary dark:text-secondary-dark font-medium block">
              Taxa Horária Real Alcançada
            </span>
            <span class="text-xl font-bold font-mono text-font dark:text-white mt-1 block">
              {{ getStats(detailsProject.id).realHourlyRate ? `${$filters.formatCurrencyBRL(getStats(detailsProject.id).realHourlyRate!)}/h` : 'Sem horas' }}
            </span>
            <span class="text-xs text-secondary dark:text-secondary-dark">
              {{ detailsProject.billingType === 'fixed' ? 'Valor Fixo ÷ Horas Trabalhadas' : 'Mesma da taxa horária' }}
            </span>
          </div>

          <div class="p-4 rounded-2xl bg-neutral/50 dark:bg-neutral-dark/50 border border-neutral dark:border-neutral-dark">
            <span class="text-xs text-secondary dark:text-secondary-dark font-medium block">
              Estimativa & Taxa Planejada
            </span>
            <span class="text-xl font-bold font-mono text-font dark:text-white mt-1 block">
              {{ detailsProject.estimatedDuration ? $filters.formatDuration(detailsProject.estimatedDuration) : 'Não definida' }}
            </span>
            <span v-if="getStats(detailsProject.id).plannedHourlyRate" class="text-xs text-secondary dark:text-secondary-dark">
              Meta planejada: {{ $filters.formatCurrencyBRL(getStats(detailsProject.id).plannedHourlyRate!) }}/h
            </span>
          </div>
        </div>

        <!-- Banner Explicativo de Rentabilidade -->
        <div
          v-if="detailsProject.billingType === 'fixed'"
          class="p-4 rounded-2xl text-sm"
          :class="{
            'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200': getStats(detailsProject.id).profitabilityStatus === 'lucrative',
            'bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200': getStats(detailsProject.id).profitabilityStatus === 'deficit',
            'bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200': getStats(detailsProject.id).profitabilityStatus === 'on-track',
            'bg-neutral/40 dark:bg-neutral-dark/40 border border-neutral dark:border-neutral-dark text-secondary dark:text-secondary-dark': getStats(detailsProject.id).profitabilityStatus === 'neutral'
          }"
        >
          <div v-if="getStats(detailsProject.id).profitabilityStatus === 'lucrative'" class="flex items-start gap-2.5">
            <AppIcon name="check" class="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong>Alta Rentabilidade:</strong> Você concluiu o projeto em menos tempo que o estimado! Sua remuneração real foi de <strong>{{ $filters.formatCurrencyBRL(getStats(detailsProject.id).realHourlyRate!) }}/h</strong>, o que representa um ganho de <strong>+{{ Math.round(getStats(detailsProject.id).profitabilityVariance!) }}%</strong> por hora em relação ao previsto.
            </div>
          </div>

          <div v-else-if="getStats(detailsProject.id).profitabilityStatus === 'deficit'" class="flex items-start gap-2.5">
            <AppIcon name="warning" class="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong>Atenção ao Tempo:</strong> Foram necessárias mais horas que o planejado. A taxa horária real caiu para <strong>{{ $filters.formatCurrencyBRL(getStats(detailsProject.id).realHourlyRate!) }}/h</strong> (<strong>{{ Math.round(getStats(detailsProject.id).profitabilityVariance!) }}%</strong> do planejado). Avalie revisar as estimativas para projetos semelhantes.
            </div>
          </div>

          <div v-else-if="getStats(detailsProject.id).profitabilityStatus === 'on-track'" class="flex items-start gap-2.5">
            <AppIcon name="check" class="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <strong>Dentro da Meta:</strong> A taxa horária real está equilibrada com a estimativa original de tempo do projeto.
            </div>
          </div>

          <div v-else class="flex items-start gap-2.5">
            <AppIcon name="info" class="text-secondary shrink-0 mt-0.5" />
            <div>
              {{ getStats(detailsProject.id).totalSeconds === 0 ? 'Nenhuma sessão de trabalho registrada para este projeto ainda.' : 'Defina uma estimativa de duração para calcular comparativos de lucratividade por hora.' }}
            </div>
          </div>
        </div>

        <div class="flex justify-end pt-2">
          <AppButton color="secondary" @click="detailsModalRef?.closeModal()">
            Fechar
          </AppButton>
        </div>
      </div>
    </AppModal>

    <!-- Dialog de Exclusão -->
    <AppDialog
      ref="dialogRef"
      header="Tem certeza que deseja deletar este projeto?"
      message="Ao confirmar, o projeto será excluído. O histórico de sessões e receitas já contabilizadas será preservado nos seus relatórios para fins contábeis."
      @confirm-action="confirmDelete"
    />
  </AppContainer>
</template>
