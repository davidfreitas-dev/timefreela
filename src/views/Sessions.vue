<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, h, type VNode } from 'vue';
import { useRouter } from 'vue-router';
import { useLoading } from '@/composables/useLoading';
import { useSessionStore } from '@/stores/sessionStore';
import { useProjectStore } from '@/stores/projectStore';
import { useTimerStore } from '@/stores/timerStore';
import Container from '@/components/Container.vue';
import Breadcrumb from '@/components/Breadcrumb.vue';
import Icon from '@/components/Icon.vue';
import Button from '@/components/Button.vue';
import InputSearch from '@/components/InputSearch.vue';
import Select from '@/components/Select.vue';
import Checkbox from '@/components/Checkbox.vue';
import Badge from '@/components/Badge.vue';
import Table from '@/components/Table.vue';
import Loader from '@/components/Loader.vue';

const router = useRouter();
const sessionStore = useSessionStore();
const projectStore = useProjectStore();
const timerStore = useTimerStore();

const search = ref('');

const filterOptions = [
  { label: 'Todas', value: 'all' },
  { label: 'Faturadas', value: 'billed' },
  { label: 'Não Faturadas', value: 'unbilled' },
];

const selectedFilter = ref(filterOptions[0]);

const { isLoading, withLoading } = useLoading();

onMounted(() => {
  if (timerStore.isRunning) {
    timerStore.start();
  }
  
  withLoading(
    async () => {
      await Promise.all([
        sessionStore.listenToSessions(),
        projectStore.fetchProjects()
      ]);
    },
    'Não foi possível carregar os dados. Tente novamente mais tarde.'
  );
});

onBeforeUnmount(() => {
  sessionStore.stopListeningSessions();
});

const normalizedSearch = computed(() => search.value.trim().toLowerCase());

const getProjectTitle = (projectId: string) => {
  return projectStore.projects.find(p => p.id === projectId)?.title || 'Projeto não encontrado';
};

const filteredSessions = computed(() => {
  if (!sessionStore.sessions?.length) return [];

  return sessionStore.sessions
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
    await sessionStore.markSessionsAsBilled(selectedSessions.value);
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
      h(Checkbox, {
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
  router.push({ name: 'SessionDetails', params: { id: sessionId } });
};
</script>

<template>
  <Container>
    <div class="header flex justify-between items-center flex-wrap gap-4">
      <Breadcrumb title="Sessões" description="Gerencie suas sessões aqui." />

      <div class="flex gap-2 ml-auto">
        <Button
          v-if="selectedSessions.length"
          color="success"
          @click="markSelectedAsBilled"
        >
          <Icon name="check" class="md:mr-2" />
          <span class="hidden md:block">Faturar Selecionadas</span>
        </Button>

        <!-- Botão de Nova Sessão -->
        <Button class="h-fit" @click="goToCreateSession">
          <Icon name="add" class="md:mr-2" />
          <span class="hidden md:block">Nova Sessão</span>
        </Button>
      </div>
    </div>

    <div class="relative rounded-3xl border border-neutral dark:border-neutral-dark my-8">
      <div class="filters grid grid-cols-1 md:grid-cols-2 gap-4 w-full border-b border-neutral dark:border-neutral-dark p-5">
        <div class="w-full">
          <InputSearch v-model="search" placeholder="Buscar por projeto" />
        </div>

        <div class="w-full">
          <Select v-model="selectedFilter" :options="filterOptions" />
        </div>
      </div>
      
      <Loader
        v-if="isLoading"
        color="primary"
        class="w-4 h-4 mx-auto my-10"
      />

      <div class="rounded-2xl overflow-auto">
        <Table
          v-if="!isLoading && filteredSessions.length"
          :headers="tableHead"
          :items="filteredSessions"
        >
          <template #row="{ item: session }">
            <template v-if="allSelectableSessionIds.length > 0">
              <td class="pl-6 py-4">
                <Checkbox
                  v-if="!session.isBilled"
                  :model-value="isSelected(session.id)"
                  @update:model-value="checked => toggleSelection(session.id, checked)"
                />
              </td>
            </template>

            <td class="px-6 py-4 max-w-[250px] truncate text-font dark:text-white">
              {{ getProjectTitle(session.projectId) }}
            </td>

            <td class="px-6 py-4 whitespace-nowrap text-font dark:text-white">
              {{ $filters.formatDate(session.date) }}
            </td>

            <td class="px-6 py-4 whitespace-nowrap text-font dark:text-white">
              {{ $filters.formatTime(session.startTime) }}
            </td>

            <td class="px-6 py-4 whitespace-nowrap text-font dark:text-white">
              {{ $filters.formatTime(session.endTime) }}
            </td>

            <td class="px-6 py-4 whitespace-nowrap text-font dark:text-white">
              {{ $filters.formatDuration(session.duration) }}
            </td>

            <td class="px-6 py-4">
              <Badge
                :label="session.isBilled ? 'Faturada' : 'Não Faturada'"
                :color="session.isBilled ? 'success' : 'warning'"
              />
            </td>

            <td class="px-6 py-4">
              <button
                class="p-2 h-10 w-10 bg-primary-accent text-primary dark:bg-primary-accent-dark dark:text-primary-dark rounded-lg cursor-pointer"
                @click="goToEditSession(session.id)"
              >
                <Icon name="edit" />
              </button>
            </td>
          </template>
        </Table>
      </div>
      
      <div v-if="!isLoading && !filteredSessions.length" class="text-secondary dark:text-gray-400 text-center my-10">
        Nenhuma sessão registrada.
      </div>
    </div>
  </Container>
</template>
