<script setup lang="ts">
import { ref, computed, onMounted, h, watch, type VNode } from 'vue';
import { storeToRefs } from 'pinia';
import { useLoading } from '@/composables/useLoading';
import { useToast } from '@/composables/useToast';
import { useSessionStore } from '@/stores/sessionStore';
import { useProjectStore } from '@/stores/projectStore';
import { useReportStore } from '@/stores/reportStore';
import { useUserStore } from '@/stores/userStore';

import type { Session } from '@/types';

import AppContainer from '@/components/layout/AppContainer.vue';
import AppBreadcrumb from '@/components/ui/AppBreadcrumb.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppInputSearch from '@/components/ui/AppInputSearch.vue';
import AppListbox from '@/components/ui/AppListbox.vue';
import AppInputDate from '@/components/ui/AppInputDate.vue';
import AppCheckbox from '@/components/ui/AppCheckbox.vue';
import AppBadge from '@/components/ui/AppBadge.vue';
import AppTable from '@/components/ui/AppTable.vue';
import AppDotsLoader from '@/components/ui/AppDotsLoader.vue';
import AppDialog from '@/components/ui/AppDialog.vue';
import AppEmptyState from '@/components/ui/AppEmptyState.vue';
import AppModal from '@/components/ui/AppModal.vue';
import AppPagination from '@/components/ui/AppPagination.vue';
import AppChip from '@/components/ui/AppChip.vue';
import SessionForm, { type SessionPayload } from '@/components/forms/SessionForm.vue';

const sessionStore = useSessionStore();
const projectStore = useProjectStore();
const reportStore = useReportStore();
const userStore = useUserStore();

const { user } = storeToRefs(userStore);
const { items: sessions } = storeToRefs(sessionStore);
const { showToast } = useToast();

const getSessionAmount = (session: Session): number => {
  const project = projectStore.items.find(p => p.id === session.projectId);
  return reportStore.calculateSessionAmount({
    ...session,
    billingType: session.billingType || project?.billingType,
    billingAmount: session.billingAmount !== undefined ? session.billingAmount : project?.billingAmount,
  });
};

const search = ref('');

const filterOptions = [
  { label: 'Todas', value: 'all' },
  { label: 'Faturadas', value: 'billed' },
  { label: 'Não Faturadas', value: 'unbilled' },
];

const selectedFilter = ref(filterOptions[0]);
const { isLoading, withLoading } = useLoading();

const today = new Date();
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(today.getDate() - 30);

const dateInterval = ref<Date[] | null>([thirtyDaysAgo, today]);

const currentPage = ref(1);
const itemsPerPage = ref(15);

const modalRef = ref<InstanceType<typeof AppModal> | null>(null);
const dialogRef = ref<InstanceType<typeof AppDialog> | null>(null);

const editingSessionId = ref<string | null>(null);
const selectedSession = ref<Session | null>(null);
const isFormLoading = ref(false);
const sessionToDelete = ref<string | null>(null);

const fetchSessions = async () => {
  if (!user.value?.id) return;

  const [start, end] = dateInterval.value ?? [];
  await sessionStore.fetchAll(user.value.id, undefined, start, end);
};

onMounted(async () => {
  if (user.value?.id) {
    await withLoading(
      async () => {
        await Promise.all([
          fetchSessions(),
          projectStore.fetchAll(user.value!.id),
        ]);
      },
      'Não foi possível carregar os dados. Tente novamente mais tarde.'
    );
  }
});

// Refetch sessions when date interval changes to filter on server-side
watch(dateInterval, () => {
  currentPage.value = 1;
  fetchSessions();
});

watch([search, selectedFilter], () => {
  currentPage.value = 1;
});

const normalizedSearch = computed(() => search.value.trim().toLowerCase());

const getProjectTitle = (session: Session) =>
  session.projectTitle || projectStore.items.find((p) => p.id === session.projectId)?.title || 'Projeto não encontrado';

const filteredSessions = computed(() => {
  if (!sessions.value?.length) return [];

  return sessions.value
    .filter(session => {
      const status = selectedFilter.value.value;
      if (status === 'billed') return session.isBilled;
      if (status === 'unbilled') return !session.isBilled;
      return true;
    })
    .filter(session => {
      if (!normalizedSearch.value) return true;
      const title = getProjectTitle(session);
      return title.toLowerCase().includes(normalizedSearch.value);
    });
});

const paginatedSessions = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredSessions.value.slice(start, end);
});

const selectedSessions = ref<string[]>([]);

const allSelectableSessionIds = computed(() =>
  filteredSessions.value.map(s => s.id)
);

const isAllSelected = computed({
  get() {
    return (
      selectedSessions.value.length === allSelectableSessionIds.value.length &&
      allSelectableSessionIds.value.length > 0
    );
  },
  set(checked: boolean) {
    selectedSessions.value = checked ? [...allSelectableSessionIds.value] : [];
  },
});

const isSelected = (id: string) => selectedSessions.value.includes(id);

const toggleSelection = (id: string, value: boolean) => {
  if (value) {
    selectedSessions.value.push(id);
  } else {
    selectedSessions.value = selectedSessions.value.filter(s => s !== id);
  }
};

const hasUnbilledSelected = computed(() =>
  selectedSessions.value.some(id => {
    const s = filteredSessions.value.find(item => item.id === id);
    return s && !s.isBilled;
  })
);

const hasBilledSelected = computed(() =>
  selectedSessions.value.some(id => {
    const s = filteredSessions.value.find(item => item.id === id);
    return s && s.isBilled;
  })
);

const markSelectedAsBilled = async () => {
  await withLoading(async () => {
    await sessionStore.setBillingStatus(selectedSessions.value, true);
    showToast('success', `${selectedSessions.value.length} sessão(ões) faturada(s).`);
    selectedSessions.value = [];
  }, 'Não foi possível faturar as sessões.');
};

const markSelectedAsUnbilled = async () => {
  await withLoading(async () => {
    await sessionStore.setBillingStatus(selectedSessions.value, false);
    showToast('success', `${selectedSessions.value.length} sessão(ões) desmarcada(s) como faturada(s).`);
    selectedSessions.value = [];
  }, 'Não foi possível desmarcar faturamento.');
};

const toggleSessionBilled = async (session: Session) => {
  await withLoading(async () => {
    await sessionStore.setBillingStatus([session.id], !session.isBilled);
    showToast('success', session.isBilled ? 'Sessão desmarcada como faturada.' : 'Sessão faturada com sucesso.');
  }, 'Erro ao atualizar faturamento.');
};

type PresetType = 'today' | 'last30' | 'thisMonth' | 'lastMonth' | 'thisYear';

const presetOptions: { label: string; value: PresetType }[] = [
  { label: 'Hoje', value: 'today' },
  { label: 'Últimos 30 dias', value: 'last30' },
  { label: 'Este Mês', value: 'thisMonth' },
  { label: 'Mês Anterior', value: 'lastMonth' },
  { label: 'Este Ano', value: 'thisYear' },
];

const activePreset = ref<PresetType | null>('last30');

const setPresetRange = (preset: PresetType) => {
  activePreset.value = preset;
  const now = new Date();
  if (preset === 'today') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    dateInterval.value = [start, end];
  } else if (preset === 'last30') {
    const start = new Date();
    start.setDate(now.getDate() - 30);
    dateInterval.value = [start, now];
  } else if (preset === 'thisMonth') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    dateInterval.value = [start, end];
  } else if (preset === 'lastMonth') {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    dateInterval.value = [start, end];
  } else if (preset === 'thisYear') {
    const start = new Date(now.getFullYear(), 0, 1);
    const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
    dateInterval.value = [start, end];
  }
};

const tableHead = computed<(string | VNode)[]>(() => {
  const baseHeaders: (string | VNode)[] = [
    'Projeto', 'Data', 'Início', 'Término', 'Duração', 'Valor', 'Status', 'Ações',
  ];

  return allSelectableSessionIds.value.length > 0
    ? [
      h(AppCheckbox, {
        modelValue: isAllSelected.value,
        'onUpdate:modelValue': (val: boolean) => (isAllSelected.value = val),
      }),
      ...baseHeaders,
    ]
    : baseHeaders;
});

const openCreateModal = () => {
  editingSessionId.value = null;
  selectedSession.value = null;
  modalRef.value?.openModal();
};

const openEditModal = async (sessionId: string) => {
  editingSessionId.value = sessionId;
  isFormLoading.value = true;
  modalRef.value?.openModal();
  
  try {
    const session = await sessionStore.fetchOne(sessionId);
    selectedSession.value = session;
  } catch (error) {
    showToast('error', 'Erro ao carregar os dados da sessão.');
    modalRef.value?.closeModal();
  } finally {
    isFormLoading.value = false;
  }
};

const handleSaveSession = async (payload: SessionPayload) => {
  if (!user.value?.id) {
    showToast('error', 'Usuário não autenticado');
    return;
  }

  isFormLoading.value = true;
  try {
    const data = { ...payload, userId: user.value.id };
    
    if (editingSessionId.value) {
      await sessionStore.update(editingSessionId.value, data);
      showToast('success', 'Sessão atualizada com sucesso.');
    } else {
      await sessionStore.create(data);
      showToast('success', 'Sessão cadastrada com sucesso.');
    }
    
    modalRef.value?.closeModal();
    await fetchSessions();
  } catch (error) {
    showToast('error', 'Erro ao salvar a sessão. Tente novamente.');
  } finally {
    isFormLoading.value = false;
  }
};

const handleDeleteSession = (sessionId: string) => {
  sessionToDelete.value = sessionId;
  dialogRef.value?.openModal();
};

const deleteSession = async () => {
  if (!sessionToDelete.value) return;
  await withLoading(async () => {
    await sessionStore.remove(sessionToDelete.value!);
    sessionToDelete.value = null;
  }, 'Não foi possível deletar a sessão.');
};
</script>

<template>
  <AppContainer>
    <div class="header flex justify-between items-center flex-wrap gap-4">
      <AppBreadcrumb title="Sessões" description="Gerencie suas sessões aqui." />

      <div class="flex gap-2 ml-auto">
        <AppButton
          v-if="selectedSessions.length && hasUnbilledSelected"
          color="success"
          @click="markSelectedAsBilled"
        >
          <AppIcon name="check" />
          <span class="hidden md:block">Faturar Selecionadas</span>
        </AppButton>

        <AppButton
          v-if="selectedSessions.length && hasBilledSelected"
          color="outline"
          @click="markSelectedAsUnbilled"
        >
          <AppIcon name="close" />
          <span class="hidden md:block">Desmarcar Faturamento</span>
        </AppButton>

        <AppButton @click="openCreateModal">
          <AppIcon name="add" />
          <span class="hidden md:block">Nova Sessão</span>
        </AppButton>
      </div>
    </div>

    <div class="relative bg-background dark:bg-accent-dark rounded-3xl shadow-md my-8">
      <div class="px-8 pt-6 flex flex-wrap items-center gap-2">
        <span class="text-xs font-semibold text-secondary dark:text-secondary-dark mr-1">Atalhos:</span>
        <AppChip
          v-for="preset in presetOptions"
          :key="preset.value"
          :label="preset.label"
          :variant="activePreset === preset.value ? 'solid' : 'accent'"
          :color="activePreset === preset.value ? 'primary' : 'secondary'"
          size="sm"
          @click="setPresetRange(preset.value)"
        />
      </div>

      <div class="filters grid grid-cols-1 md:grid-cols-3 gap-4 w-full border-b border-neutral dark:border-neutral-dark px-8 pt-4 pb-6">
        <AppInputSearch v-model="search" label="Buscar Projeto" placeholder="Pesquisar por projeto" />

        <AppInputDate
          v-model="dateInterval"
          label="Período"
          mode="range"
          placeholder="Selecione um período"
        />

        <AppListbox v-model="selectedFilter" label="Status" :options="filterOptions" />
      </div>

      <AppDotsLoader
        v-if="isLoading"
        color="primary"
        class="w-4 h-4 mx-auto my-10"
      />

      <div class="rounded-2xl overflow-auto">
        <AppTable
          v-if="!isLoading && paginatedSessions.length"
          :headers="tableHead"
          :items="paginatedSessions"
        >
          <template #row="{ item: session }">
            <template v-if="allSelectableSessionIds.length > 0">
              <td class="pl-6 py-3">
                <AppCheckbox
                  :model-value="isSelected(session.id)"
                  @update:model-value="checked => toggleSelection(session.id, checked)"
                />
              </td>
            </template>

            <td class="px-6 py-3 max-w-62.5 truncate text-font dark:text-white">
              {{ getProjectTitle(session) }}
            </td>
            <td class="px-6 py-3 whitespace-nowrap text-font dark:text-white">
              {{ $filters.formatDate(session.date) }}
            </td>
            <td class="px-6 py-3 whitespace-nowrap text-font dark:text-white font-mono">
              {{ $filters.formatTime(session.startTime) }}
            </td>
            <td class="px-6 py-3 whitespace-nowrap text-font dark:text-white font-mono">
              {{ $filters.formatTime(session.endTime) }}
            </td>
            <td class="px-6 py-3 whitespace-nowrap text-font dark:text-white font-mono">
              {{ $filters.formatDuration(session.duration) }}
            </td>
            <td class="px-6 py-3 whitespace-nowrap text-font dark:text-white font-mono font-medium">
              {{ $filters.formatCurrencyBRL(getSessionAmount(session)) }}
            </td>
            <td class="px-6 py-3">
              <button
                type="button"
                :title="session.isBilled ? 'Clique para desmarcar faturamento' : 'Clique para marcar como faturada'"
                class="cursor-pointer focus:outline-none"
                @click="toggleSessionBilled(session)"
              >
                <AppBadge
                  :label="session.isBilled ? 'Faturada' : 'Não Faturada'"
                  :color="session.isBilled ? 'success' : 'warning'"
                />
              </button>
            </td>
            <td class="px-6 py-3">
              <div class="flex items-center gap-3">
                <button
                  class="p-2 h-9 w-9 bg-neutral dark:bg-neutral-dark text-secondary dark:text-secondary-dark hover:text-font dark:hover:text-font-dark rounded-full cursor-pointer flex items-center justify-center"
                  @click="openEditModal(session.id)"
                >
                  <AppIcon name="edit" size="sm" />
                </button>
                <button
                  class="p-2 h-9 w-9 bg-danger-accent dark:bg-danger-accent-dark text-danger dark:text-danger-dark rounded-full cursor-pointer flex items-center justify-center"
                  @click="handleDeleteSession(session.id)"
                >
                  <AppIcon name="delete" size="sm" />
                </button>
              </div>
            </td>
          </template>
        </AppTable>
      </div>

      <div v-if="!isLoading && !filteredSessions.length" class="pb-8">
        <AppEmptyState
          icon="inbox"
          title="Nenhuma sessão por aqui"
          message="Não encontramos nenhum registro de tempo de acordo com os filtros selecionados. Que tal iniciar um novo?"
        />
      </div>

      <div v-if="filteredSessions.length > itemsPerPage" class="pb-8 pt-4">
        <AppPagination
          v-model:current-page="currentPage"
          :total-items="filteredSessions.length"
          :items-per-page="itemsPerPage"
        />
      </div>
    </div>

    <AppModal
      ref="modalRef"
      :title="editingSessionId ? 'Editar Sessão' : 'Nova Sessão'"
    >
      <SessionForm
        :initial-data="selectedSession"
        :projects="projectStore.items"
        :is-loading="isFormLoading"
        @save="handleSaveSession"
        @cancel="modalRef?.closeModal()"
      />
    </AppModal>

    <AppDialog
      ref="dialogRef"
      header="Tem certeza que deseja deletar esta sessão?"
      message="Se confirmada essa ação não poderá ser desfeita."
      @confirm-action="deleteSession"
    />
  </AppContainer>
</template>

