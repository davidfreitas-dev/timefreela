<script setup lang="ts">
import { onMounted, computed, watch, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useProjectStore } from '@/stores/projectStore';
import { useReportStore } from '@/stores/reportStore';
import Container from '@/components/shared/Container.vue';
import Breadcrumb from '@/components/shared/Breadcrumb.vue';
import InputSearch from '@/components/shared/InputSearch.vue';
import Select from '@/components/shared/Select.vue';
import Table from '@/components/shared/Table.vue';

const projectStore = useProjectStore();
const reportStore = useReportStore();

const { fetchProjects } = projectStore;
const { fetchReports } = reportStore;
const { reports } = storeToRefs(reportStore);

onMounted(async () => {    
  await fetchProjects();
  await fetchReports();
});

const revenueByProject = computed(() => {
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

const search = ref('');

const filterOptions: { label: string; value: 'all' | 'billed' | 'unbilled' }[] = [
  { label: 'Todas', value: 'all' },
  { label: 'Faturadas', value: 'billed' },
  { label: 'Não Faturadas', value: 'unbilled' },
];

const selectedFilter = ref<{ label: string; value: 'all' | 'billed' | 'unbilled' }>(filterOptions[0]);

watch(
  () => selectedFilter.value.value,
  async (filterValue) => {
    await fetchReports(undefined, undefined, filterValue);
  }
);

const filteredRevenue = computed(() => {
  if (!search.value.trim()) return revenueByProject.value;
  return revenueByProject.value.filter(item =>
    item.projectTitle.toLowerCase().includes(search.value.toLowerCase())
  );
});

const tableHeaders = ['Projeto', 'Tempo Total', 'Receita'];
</script>

<template>
  <Container>
    <Breadcrumb title="Relatórios" description="Gerencie os relatórios aqui." />

    <div class="cards flex flex-col md:flex-row items-center w-full gap-5 my-8">
      <div class="card w-full md:w-1/2 rounded-3xl border border-neutral p-6">
        <h1 class="card-title text-font text-5xl font-semibold mb-3">
          {{ $filters.formatDuration(reportStore.totalTime) }}
        </h1>
        <span class="card-body">
          Horas Trabalhadas
        </span>
      </div>

      <div class="card w-full md:w-1/2 rounded-3xl border border-neutral p-6">
        <h1 class="card-title text-font text-5xl font-semibold mb-3">
          {{ $filters.formatCurrencyBRL(reportStore.totalAmount) }}
        </h1>
        <span>
          Total Faturado
        </span>
      </div>
    </div>

    <section class="earning">
      <h1 class="section-title text-font text-2xl font-semibold mb-3">
        Faturamento por Projeto
      </h1>
      <div class="rounded-3xl border border-neutral">
        <div class="filters flex flex-col md:flex-row gap-4 w-full p-5">
          <div class="w-full md:w-1/2">
            <InputSearch
              v-model="search"
              placeholder="Buscar por projeto"
            />
          </div>

          <div class="w-full md:w-1/2">
            <Select
              v-model="selectedFilter"
              :options="filterOptions"
            />
          </div>
        </div>

        <Table
          v-if="filteredRevenue.length"
          :headers="tableHeaders"
          :items="filteredRevenue"
        >
          <template #row="{ item }">
            <td class="px-6 py-4 w-[60%] max-w-[600px] truncate">
              {{ item.projectTitle }}
            </td>

            <td class="px-6 py-4 w-[20%] min-w-[200px] whitespace-nowrap">
              {{ $filters.formatDuration(item.totalSeconds) }}
            </td>

            <td class="px-6 py-4 w-[20%] min-w-[200px] whitespace-nowrap">
              {{ $filters.formatCurrencyBRL(item.totalAmount) }}
            </td>
          </template>
        </Table>

        <div v-else class="text-gray-500 text-center my-10">
          Nenhum projeto encontrado.
        </div>
      </div>
    </section>
  </Container>
</template>
