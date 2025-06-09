<script setup lang="ts">
import { onMounted, computed, watch, ref } from 'vue';
import { debounce } from 'vue-debounce';
import { storeToRefs } from 'pinia';
import { helpers, required } from '@vuelidate/validators';
import { useVuelidate } from '@vuelidate/core';
import { useLoading } from '@/composables/useLoading';
import { useProjectStore } from '@/stores/projectStore';
import { useReportStore } from '@/stores/reportStore';
import { useTimerStore } from '@/stores/timerStore';
import Container from '@/components/Container.vue';
import Breadcrumb from '@/components/Breadcrumb.vue';
import InputSearch from '@/components/InputSearch.vue';
import Select from '@/components/Select.vue';
import InputDate from '@/components/InputDate.vue';
import Table from '@/components/Table.vue';
import Loader from '@/components/Loader.vue';

const projectStore = useProjectStore();
const reportStore = useReportStore();
const timerStore = useTimerStore();

const { fetchProjects } = projectStore;
const { fetchReports } = reportStore;
const { start } = timerStore;
const { reports } = storeToRefs(reportStore);
const { isRunning } = storeToRefs(timerStore);

const dateInterval = ref({
  start: null as Date | null,
  end: null as Date | null,
});

const isAfterStart = helpers.withParams(
  { type: 'isAfterStart' },
  (value: Date | null, vm) => {
    if (!value || !vm.start) return true; // se não tiver valor, não invalida (required cuida disso)
    return value >= vm.start;
  }
);

const rules = computed(() => ({
  start: { required },
  end: { required, isAfterStart }
}));

const v$ = useVuelidate(rules, dateInterval);

const search = ref('');

const filterOptions: { label: string; value: 'all' | 'billed' | 'unbilled' }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Faturados', value: 'billed' },
  { label: 'Não Faturados', value: 'unbilled' },
];

const selectedFilter = ref<{ label: string; value: 'all' | 'billed' | 'unbilled' }>(filterOptions[0]);

const loadReports = async () => {
  const startDate = dateInterval.value.start ?? undefined;
  const endDate = dateInterval.value.end ?? undefined;
  await fetchReports(startDate, endDate, selectedFilter.value.value);
};

const debouncedLoadReports = debounce(loadReports, '500ms');

watch(dateInterval, () => {
  v$.value.$touch();
  if (!v$.value.$invalid) {
    debouncedLoadReports();
  }
}, { deep: true });

watch(() => selectedFilter.value.value, async () => {
  await loadReports();
});

const { isLoading, withLoading } = useLoading();

onMounted(async () => {  
  if (isRunning.value) {
    start();
  }
    
  await withLoading(async () => {
    await fetchProjects();
    await fetchReports();
  }, 'Não foi possível carregar os projetos. Tente novamente mais tarde.');  
});

const revenueByProject = computed(() => {
  if (!reports.value?.length) return [];

  const grouped: Record<string, {
    projectId: string;
    projectTitle: string;
    totalSeconds: number;
    totalAmount: number;
  }> = {};

  for (const day of reports.value) {
    for (const session of day.sessions) {
      const { projectId, duration, hourlyRate, projectTitle } = session;
      if (!grouped[projectId]) {
        grouped[projectId] = {
          projectId,
          projectTitle,
          totalSeconds: 0,
          totalAmount: 0,
        };
      }
      grouped[projectId].totalSeconds += duration;
      grouped[projectId].totalAmount += (duration / 3600) * hourlyRate;
    }
  }

  return Object.values(grouped);
});

const filteredRevenue = computed(() => {
  if (!search.value.trim()) return revenueByProject.value;
  return revenueByProject.value.filter(item =>
    item.projectTitle.toLowerCase().includes(search.value.toLowerCase())
  );
});

const tableHeaders = ['Projeto', 'Horas', 'Receita'];
</script>

<template>
  <Container>
    <Breadcrumb title="Relatórios" description="Gerencie os relatórios aqui." />

    <div class="cards flex flex-col md:flex-row items-center w-full gap-5 my-8">
      <div class="card w-full md:w-1/2 rounded-3xl border border-neutral dark:border-neutral-700 p-6">
        <span class="card-body text-secondary dark:text-secondary-dark">
          Horas Trabalhadas
        </span>
        <h1 class="card-title text-font dark:text-white text-5xl font-bold mt-3">
          {{ $filters.formatDuration(reportStore.totalTime) }}
        </h1>
      </div>

      <div class="card w-full md:w-1/2 rounded-3xl border border-neutral dark:border-neutral-700 p-6">
        <span class="card-body text-secondary dark:text-secondary-dark">
          Receita Total
        </span>
        <h1 class="card-title text-font dark:text-white text-5xl font-bold mt-3">
          {{ $filters.formatCurrencyBRL(reportStore.totalAmount) }}
        </h1>
      </div>
    </div>

    <section class="earning">
      <h1 class="section-title text-font dark:text-white text-2xl font-semibold mb-3">
        Faturamento por Projeto
      </h1>
      <div class="relative rounded-3xl border border-neutral dark:border-neutral-dark">
        <div class="filters grid grid-cols-1 md:grid-cols-2 gap-4 w-full px-5 pt-5 border-b border-neutral dark:border-neutral-dark pb-5">
          <div class="w-full">
            <InputDate
              v-model="dateInterval.start"
              placeholder="Data inicial"
              :error="v$.start.$dirty && v$.start.$error ? 'Data inicial é obrigatória.' : ''"
              @blur="v$.start.$touch()"
            />
          </div>

          <div class="w-full">
            <InputDate
              v-model="dateInterval.end"
              placeholder="Data final"
              :error="v$.end.$dirty && v$.end.$error
                ? v$.end.$errors.find(e => e.$validator === 'isAfterStart')
                  ? 'Data final não pode ser anterior à data inicial.'
                  : 'Data final é obrigatória.'
                : ''"
              @blur="v$.end.$touch()"
            />
          </div>

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
            v-if="!isLoading && filteredRevenue?.length"
            :headers="tableHeaders"
            :items="filteredRevenue"
          >
            <template #row="{ item }">
              <td class="px-6 py-4 w-[60%] max-w-[600px] truncate text-font dark:text-white">
                {{ item.projectTitle }}
              </td>

              <td class="px-6 py-4 w-[20%] min-w-[200px] whitespace-nowrap text-font dark:text-white">
                {{ $filters.formatDuration(item.totalSeconds) }}
              </td>

              <td class="px-6 py-4 w-[20%] min-w-[200px] whitespace-nowrap text-font dark:text-white">
                {{ $filters.formatCurrencyBRL(item.totalAmount) }}
              </td>
            </template>
          </Table>
        </div>
        
        <div v-if="!isLoading && !filteredRevenue?.length" class="text-secondary dark:text-gray-400 text-center mb-10">
          Nenhum projeto encontrado.
        </div>
      </div>
    </section>
  </Container>
</template>
