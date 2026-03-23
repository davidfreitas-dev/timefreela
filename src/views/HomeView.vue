<script setup lang="ts">
import { onMounted, computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { debounce } from 'vue-debounce';
import { useUserStore } from '@/stores/userStore';
import { useProjectStore } from '@/stores/projectStore';
import { useReportStore } from '@/stores/reportStore';
import { useTimerStore } from '@/stores/timerStore';
import { useLoading } from '@/composables/useLoading';
import { useExport } from '@/composables/useExport';
import AppContainer from '@/components/layout/AppContainer.vue';
import AppBreadcrumb from '@/components/ui/AppBreadcrumb.vue';
import AppBarChart from '@/components/ui/AppBarChart.vue';
import AppStatCard from '@/components/ui/AppStatCard.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import AppInputSearch from '@/components/ui/AppInputSearch.vue';
import AppInputDate from '@/components/ui/AppInputDate.vue';
import AppSelect from '@/components/ui/AppSelect.vue';
import AppTable from '@/components/ui/AppTable.vue';
import AppLoader from '@/components/ui/AppLoader.vue';
import type { Option } from '@/types';

const userStore = useUserStore();
const projectStore = useProjectStore();
const reportStore = useReportStore();
const timerStore = useTimerStore();
const { exportPdf, exportCsv, isExporting } = useExport();

const { user } = storeToRefs(userStore);
const { isRunning } = storeToRefs(timerStore);
const { start } = timerStore;
const { groups } = storeToRefs(reportStore);

const { withLoading, isLoading } = useLoading();

// Chart-specific logic from original HomeView
const availableYears = ref<Option[]>([]);
const selectedYear = ref<Option | null>(null);

// Table-specific logic from ReportsView
const search = ref('');
const dateInterval = ref<Date[] | null>(null);
const filterOptions: { label: string; value: 'all' | 'billed' | 'unbilled' }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Faturados', value: 'billed' },
  { label: 'Não Faturados', value: 'unbilled' },
];
const selectedFilter = ref<{ label: string; value: 'all' | 'billed' | 'unbilled' }>(filterOptions[0]);

// Unified data loading
const loadReports = async () => {
  const [start, end] = dateInterval.value ?? [];
  await reportStore.fetchReports(start ?? undefined, end ?? undefined, selectedFilter.value.value);
};
const debouncedLoadReports = debounce(loadReports, '500ms');

onMounted(async () => {
  if (isRunning.value) {
    start();
  }
  
  if (user.value?.id) {
    await withLoading(async () => {
      await projectStore.fetchAll(user.value!.id);
      
      const now = new Date();
      const currentYear = now.getFullYear();
      
      // Set initial state for filters
      const firstDayOfYear = new Date(currentYear, 0, 1);
      const lastDayOfYear = new Date(currentYear, 11, 31, 23, 59, 59);
      dateInterval.value = [firstDayOfYear, lastDayOfYear];
      
      // Load initial data
      await loadReports();

      // Setup chart year selector
      const years = await reportStore.getYearsWithData();
      availableYears.value = years.map(year => ({
        label: year.toString(),
        value: year.toString()
      }));

      const currentYearStr = currentYear.toString();
      selectedYear.value = availableYears.value.find(y => y.value === currentYearStr) || 
                          availableYears.value[0] || 
                          { label: currentYearStr, value: currentYearStr };
                          
    }, 'Não foi possível carregar os dados. Tente novamente mais tarde.');  
  }
});

// When chart year changes, update the main date filter and reload
watch(selectedYear, (newYear) => {
  if (newYear) {
    const year = parseInt(newYear.value as string);
    // Do not trigger reload if the year is already selected
    if (dateInterval.value?.[0].getFullYear() === year) return;

    dateInterval.value = [new Date(year, 0, 1), new Date(year, 11, 31, 23, 59, 59)];
    // The watcher on dateInterval will trigger the reload
  }
});

// When table filters change, reload
watch(dateInterval, () => {
  const [start, end] = dateInterval.value ?? [];
  if ((!start && !end) || (start && end)) {
    debouncedLoadReports();
  }
}, { deep: true });
watch(() => selectedFilter.value.value, () => loadReports());


// Chart computed logic (UNTouched from original HomeView)
const sortedMonthly = computed(() => {
  const year = dateInterval.value ? dateInterval.value[0].getFullYear() : new Date().getFullYear();
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const allMonths = Array.from({ length: 12 }, (_, i) => `${year}-${(i + 1).toString().padStart(2, '0')}`);

  const entries = allMonths.map((monthKey, index) => {
    const data = reportStore.monthlySummary[monthKey] ?? { totalEarnings: 0, totalTime: 0 };
    const earnings = data.totalEarnings / 100;
    const hours = data.totalTime / 3600;
    return { label: monthNames[index], amount: earnings, hours: hours };
  });

  const totalEarnings = entries.reduce((sum, e) => sum + e.amount, 0);
  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);
  const filledMonths = entries.filter(e => e.amount > 0 || e.hours > 0).length || 1;
  const avgEarnings = totalEarnings / filledMonths;
  const avgHours = totalHours / filledMonths;
  const avgHourPart = Math.floor(avgHours);
  const avgMinutePart = Math.round((avgHours - avgHourPart) * 60); 
  const formattedAvgTime = `${avgHourPart}h ${avgMinutePart}min`;
  const formattedAvgRevenue = `R$ ${avgEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return {
    chartLabels: entries.map(e => e.label),
    datasets: [
      { label: 'Horas Trabalhadas', data: entries.map(e => parseFloat(e.hours.toFixed(2))), yAxisID: 'yHours' },
      { label: 'Receitas (R$)', data: entries.map(e => parseFloat(e.amount.toFixed(2))), yAxisID: 'yRevenue' }
    ],
    metrics: [{ label: 'Média Mensal Horas/Receitas', value: `${formattedAvgTime} / ${formattedAvgRevenue}` }]
  };
});


// Table computed logic (from ReportsView)
const revenueByProject = computed(() => {
  if (!groups.value?.length) return [];
  return groups.value.map(group => ({
    projectId: group.project.id,
    projectTitle: group.project.title,
    billingType: group.project.billingType,
    totalSeconds: group.subtotalSeconds,
    totalAmount: group.subtotalValue,
  }));
});

const filteredRevenue = computed(() => {
  if (!search.value.trim()) return revenueByProject.value;
  return revenueByProject.value.filter(item =>
    item.projectTitle.toLowerCase().includes(search.value.toLowerCase())
  );
});

const tableHeaders = ['Projeto', 'Tipo', 'Horas', 'Receita'];

</script>

<template>
  <AppContainer>
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <AppBreadcrumb :title="`Olá, ${user?.name || 'Convidado'}! 👋`" description="É bom te ver de novo." />
      
      <div class="flex items-center gap-2">
        <AppButton
          variant="outline"
          :loading="isExporting"
          class="rounded-xl"
          @click="exportCsv"
        >
          <template #left>
            <AppIcon name="TableCellsIcon" class="w-5 h-5" />
          </template>
          Exportar CSV
        </AppButton>
        <AppButton
          variant="outline"
          :loading="isExporting"
          class="rounded-xl"
          @click="exportPdf"
        >
          <template #left>
            <AppIcon name="DocumentArrowDownIcon" class="w-5 h-5" />
          </template>
          Exportar PDF
        </AppButton>
      </div>
    </div>
  
    <div class="card-grid grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 my-7">
      <AppStatCard label="Horas Trabalhadas" :value="$filters.formatDuration(reportStore.currentMonthStats.totalSeconds)" />
      <AppStatCard label="Faturamento Estimado" :value="$filters.formatCurrencyBRL(reportStore.currentMonthStats.estimated)" />
      <AppStatCard label="Receita Faturada" :value="$filters.formatCurrencyBRL(reportStore.currentMonthStats.billed)" />
      <AppStatCard label="Receita Pendente" :value="$filters.formatCurrencyBRL(reportStore.currentMonthStats.toReceive)" />
    </div>

    <div class="rounded-3xl bg-background dark:bg-accent-dark shadow-md p-7 mb-8">
      <AppBarChart
        v-model="selectedYear"
        :datasets="sortedMonthly.datasets"
        :chart-labels="sortedMonthly.chartLabels"
        :metrics="sortedMonthly.metrics"
        :years="availableYears"
      />
    </div>

    <section class="earning">
      <div class="relative rounded-3xl bg-background dark:bg-accent-dark shadow-md pb-2">
        <h1 class="section-title text-lg font-bold text-secondary dark:text-secondary-dark px-5 pt-5">
          Faturamento
        </h1>
        <div class="filters grid grid-cols-1 md:grid-cols-3 gap-4 w-full border-b border-neutral dark:border-neutral-dark p-5">
          <AppInputSearch v-model="search" placeholder="Pesquisar projeto" />
          <AppInputDate
            v-model="dateInterval"
            mode="range"
            placeholder="Selecione um período"
          />
          <AppSelect v-model="selectedFilter" :options="filterOptions" />
        </div>

        <AppLoader
          v-if="isLoading"
          color="primary"
          class="w-4 h-4 mx-auto my-10"
        />

        <div v-else-if="filteredRevenue.length" class="rounded-2xl overflow-auto">
          <AppTable :headers="tableHeaders" :items="filteredRevenue">
            <template #row="{ item }">
              <td class="px-6 py-3 w-[50%] max-w-[500px] truncate text-font dark:text-white">
                {{ item.projectTitle }}
              </td>
              <td class="px-6 py-3 w-[15%] min-w-[150px] whitespace-nowrap text-font dark:text-white">
                {{ item.billingType === 'hourly' ? 'Por Hora' : 'Valor Fixo' }}
              </td>
              <td class="px-6 py-3 w-[15%] min-w-[150px] whitespace-nowrap text-font dark:text-white font-mono">
                {{ $filters.formatDuration(item.totalSeconds) }}
              </td>
              <td class="px-6 py-3 w-[20%] min-w-[150px] whitespace-nowrap text-font dark:text-white font-mono">
                {{ $filters.formatCurrencyBRL(item.totalAmount) }}
              </td>
            </template>
          </AppTable>
        </div>

        <div v-else class="text-secondary dark:text-gray-400 text-center my-10">
          Nenhum dado encontrado para os filtros selecionados.
        </div>
      </div>
    </section>
  </AppContainer>
</template>
