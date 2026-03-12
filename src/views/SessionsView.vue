<script setup lang="ts">
import { ref, computed, watch, onMounted, h, type VNode } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useLoading } from '@/composables/useLoading';
import { useSessionStore } from '@/stores/sessionStore';
import { useProjectStore } from '@/stores/projectStore';
import { useUserStore } from '@/stores/userStore';
import { helpers, required } from '@vuelidate/validators';
import { useVuelidate } from '@vuelidate/core';
import AppContainer from '@/components/layout/AppContainer.vue';
import AppBreadcrumb from '@/components/ui/AppBreadcrumb.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppInputSearch from '@/components/ui/AppInputSearch.vue';
import AppSelect from '@/components/ui/AppSelect.vue';
import AppInputDate from '@/components/ui/AppInputDate.vue';
import AppCheckbox from '@/components/ui/AppCheckbox.vue';
import AppBadge from '@/components/ui/AppBadge.vue';
import AppTable from '@/components/ui/AppTable.vue';
import AppLoader from '@/components/ui/AppLoader.vue';
import AppDialog from '@/components/ui/AppDialog.vue';

const router = useRouter();
const sessionStore = useSessionStore();
const projectStore = useProjectStore();
const userStore = useUserStore();

const { user } = storeToRefs(userStore);

const search = ref('');

const filterOptions = [
  { label: 'Todas', value: 'all' },
  { label: 'Faturadas', value: 'billed' },
  { label: 'Não Faturadas', value: 'unbilled' },
];

const selectedFilter = ref(filterOptions[0]);

const { isLoading, withLoading } = useLoading();

onMounted(async () => {
  if (user.value?.id) {
    await withLoading(
      async () => {
        await Promise.all([
          sessionStore.fetchAll(user.value!.id),
          projectStore.fetchAll(user.value!.id)
        ]);
      },
      'Não foi possível carregar os dados. Tente novamente mais tarde.'
    );
  }
});

const normalizedSearch = computed(() => search.value.trim().toLowerCase());

const getProjectTitle = (projectId: string) => {
  return projectStore.items.find(p => p.id === projectId)?.title || 'Projeto não encontrado';
};

const dateInterval = ref({
  start: null as Date | null,
  end: null as Date | null,
});

const isAfterStart = helpers.withParams(
  { type: 'isAfterStart' },
  (value: Date | null, vm) => {
    if (!value || !vm.start) return true;
    return value >= vm.start;
  }
);

const rules = computed(() => ({
  start: { required },
  end: { required, isAfterStart }
}));

const v$ = useVuelidate(rules, dateInterval);

watch(dateInterval, () => {
  v$.value.$touch();
}, { deep: true });

const filteredSessions = computed(() => {
  if (!sessionStore.items?.length) return [];

  return sessionStore.items
    .filter(session => {
      const status = selectedFilter.value.value;
      if (status === 'billed') return session.isBilled;
      if (status === 'unbilled') return !session.isBilled;
      return true;
    })
    .filter(session => {
      if (!normalizedSearch.value) return true;
      const title = getProjectTitle(session.projectId).toLowerCase();
      return title.includes(normalizedSearch.value);
    })
    .filter(session => {
      const start = dateInterval.value.start;
      const end = dateInterval.value.end;
      if (!start || !end) return true;
      if (!session.date) return false;
      const sessionDate = new Date(session.date);
      return sessionDate >= start && sessionDate <= end;
    });
});

const selectedSessions = ref<string[]>([]);

const allSelectableSessionIds = computed(() =>
  filteredSessions.value
    .filter(s => !s.isBilled)
    .map(s => s.id)
);

const isAllSelected = computed({
  get() {
    return selectedSessions.value.length === allSelectableSessionIds.value.length && allSelectableSessionIds.value.length > 0;
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
    selectedSessions.value = selectedSessions.value.filter(sessionId => sessionId !== id);
  }
};

const markSelectedAsBilled = async () => {
  await withLoading(async () => {
    await sessionStore.markBilled(selectedSessions.value);
    selectedSessions.value = []; // limpa a seleção após faturar
  }, 'Não foi possível faturar as sessões.');
};

const tableHead = computed<(string | VNode)[]>(() => {
  const baseHeaders: (string | VNode)[] = [
    'Projeto',
    'Data',
    'Início',
    'Término',
    'Duração',
    'Status',
    'Ações',
  ];

  const shouldShowCheckboxColumn = allSelectableSessionIds.value.length > 0;

  return shouldShowCheckboxColumn
    ? [
      h(AppCheckbox, {
        modelValue: isAllSelected.value,
        'onUpdate:modelValue': (val: boolean) => (isAllSelected.value = val),
      }),
      ...baseHeaders,
    ]
    : baseHeaders;
});

const goToCreateSession = () => {
  router.push({ name: 'SessionCreate' });
};

const goToEditSession = (sessionId: string) => {
  router.push({ name: 'SessionDetail', params: { id: sessionId } });
};

const dialogRef = ref<InstanceType<typeof AppDialog> | null>(null);

const sessionToDelete = ref<string | null>(null);

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
          v-if="selectedSessions.length"
          color="success"
          @click="markSelectedAsBilled"
        >
          <AppIcon name="check" class="md:mr-2" />
          <span class="hidden md:block">Faturar Selecionadas</span>
        </AppButton>

        <!-- Botão de Nova Sessão -->
        <AppButton class="h-fit" @click="goToCreateSession">
          <AppIcon name="add" class="md:mr-2" />
          <span class="hidden md:block">Nova Sessão</span>
        </AppButton>
      </div>
    </div>

    <div class="relative bg-background dark:bg-accent-dark rounded-3xl shadow-md my-8">
      <div class="filters grid grid-cols-1 md:grid-cols-2 gap-4 w-full border-b border-neutral dark:border-neutral-dark p-5">
        <AppInputDate
          v-model="dateInterval.start"
          placeholder="Data inicial"
          :error="v$.start.$dirty && v$.start.$error ? 'Data inicial é obrigatória.' : ''"
          @blur="v$.start.$touch()"
        />

        <AppInputDate
          v-model="dateInterval.end"
          placeholder="Data final"
          :error="v$.end.$dirty && v$.end.$error
            ? v$.end.$errors.find(e => e.$validator === 'isAfterStart')
              ? 'Data final não pode ser anterior à data inicial.'
              : 'Data final é obrigatória.'
            : ''"
          @blur="v$.end.$touch()"
        />

        <AppInputSearch v-model="search" placeholder="Buscar por projeto" />

        <AppSelect v-model="selectedFilter" :options="filterOptions" />
      </div>
      
      <AppLoader
        v-if="isLoading"
        color="primary"
        class="w-4 h-4 mx-auto my-10"
      />

      <div class="rounded-2xl overflow-auto">
        <AppTable
          v-if="!isLoading && filteredSessions.length"
          :headers="tableHead"
          :items="filteredSessions"
        >
          <template #row="{ item: session }">
            <template v-if="allSelectableSessionIds.length > 0">
              <td class="pl-6 py-3">
                <AppCheckbox
                  v-if="!session.isBilled"
                  :model-value="isSelected(session.id)"
                  @update:model-value="checked => toggleSelection(session.id, checked)"
                />
              </td>
            </template>

            <td class="px-6 py-3 max-w-[250px] truncate text-font dark:text-white">
              {{ getProjectTitle(session.projectId) }}
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

            <td class="px-6 py-3">
              <AppBadge
                :label="session.isBilled ? 'Faturada' : 'Não Faturada'"
                :color="session.isBilled ? 'success' : 'warning'"
              />
            </td>

            <td class="px-6 py-3">
              <div class="flex item-center gap-3">
                <button
                  class="p-2 h-9 w-9 bg-primary-accent dark:bg-primary-accent-dark text-primary dark:text-primary-dark rounded-full cursor-pointer flex items-center justify-center"
                  @click="goToEditSession(session.id)"
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
      
      <div v-if="!isLoading && !filteredSessions.length" class="text-secondary dark:text-gray-400 text-center my-10">
        Nenhuma sessão registrada.
      </div>
    </div>

    <AppDialog
      ref="dialogRef"
      header="Tem certeza que deseja deletar esta sessão?"
      message="Se confirmada essa ação não poderá ser desfeita."
      @confirm-action="deleteSession"
    />
  </AppContainer>
</template>