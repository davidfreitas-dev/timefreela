<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useLoading } from '@/composables/useLoading';
import { useSessionStore } from '@/stores/sessionStore';
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

const router = useRouter();
const sessionStore = useSessionStore();
const projectStore = useProjectStore();

const search = ref('');

const filterOptions = [
  { label: 'Todas', value: 'all' },
  { label: 'Faturadas', value: 'billed' },
  { label: 'Não Faturadas', value: 'unbilled' },
];

const selectedFilter = ref(filterOptions[0]);

const { isLoading, withLoading } = useLoading();

onMounted(() => {
  withLoading(
    async () => {
      await Promise.all([
        sessionStore.fetchSessions(),
        projectStore.fetchProjects()
      ]);
    },
    'Não foi possível carregar os dados. Tente novamente mais tarde.'
  );
});

onBeforeUnmount(() => {
  sessionStore.stopListeningSessions();
});

const tableHead = ref([
  'Projeto',
  'Data',
  'Início',
  'Término',
  'Duração',
  'Status',
  'Ações'
]);

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

const goToCreateSession = () => {
  router.push({ name: 'SessionCreate' });
};

const goToEditSession = (sessionId: string) => {
  router.push({ name: 'SessionDetails', params: { id: sessionId } });
};
</script>

<template>
  <Container>
    <div class="header flex justify-between items-center">
      <Breadcrumb title="Sessões" description="Gerencie suas sessões aqui." />

      <Button class="h-fit" @click="goToCreateSession">
        <Icon name="add" class="md:mr-2" />
        <span class="hidden md:block">Nova Sessão</span>
      </Button>
    </div>

    <div class="rounded-3xl overflow-hidden border border-neutral dark:border-neutral-700 my-8">
      <div class="filters flex flex-col md:flex-row gap-4 w-full p-5">
        <div class="w-full md:w-1/2">
          <InputSearch v-model="search" placeholder="Buscar por projeto" />
        </div>

        <div class="w-full md:w-1/2">
          <Select v-model="selectedFilter" :options="filterOptions" />
        </div>
      </div>

      <Loader
        v-if="isLoading"
        color="primary"
        class="w-4 h-4 mx-auto my-10"
      />

      <Table
        v-if="!isLoading && filteredSessions.length"
        :headers="tableHead"
        :items="filteredSessions"
      >
        <template #row="{ item: session }">
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

      <div v-if="!isLoading && !filteredSessions.length" class="text-secondary dark:text-gray-400 text-center mb-10">
        Nenhuma sessão registrada.
      </div>
    </div>
  </Container>
</template>
