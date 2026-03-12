<script setup lang="ts">
import { onMounted, computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useUserStore } from '@/stores/userStore';
import { useProjectStore } from '@/stores/projectStore';
import { useReportStore } from '@/stores/reportStore';
import { useTimerStore } from '@/stores/timerStore';
import { useLoading } from '@/composables/useLoading';
import AppContainer from '@/components/layout/AppContainer.vue';
import AppBreadcrumb from '@/components/ui/AppBreadcrumb.vue';
import AppBarChart from '@/components/ui/AppBarChart.vue';
import type { Option } from '@/types';

const userStore = useUserStore();
const projectStore = useProjectStore();
const reportStore = useReportStore();
const timerStore = useTimerStore();

const { user } = storeToRefs(userStore);
const { isRunning } = storeToRefs(timerStore);
const { start } = timerStore;

const { withLoading } = useLoading();

const availableYears = ref<Option[]>([]);
const selectedYear = ref<Option | null>(null);

onMounted(async () => {
  if (isRunning.value) {
    start();
  }
  
  if (user.value?.id) {
    await withLoading(async () => {
      await projectStore.fetchAll(user.value!.id);
      await reportStore.fetchReports();

      const years = await reportStore.getYearsWithData();
      availableYears.value = years.map(year => ({
        label: year.toString(),
        value: year.toString()
      }));

      const currentYear = new Date().getFullYear().toString();
      selectedYear.value = availableYears.value.find(y => y.value === currentYear) || 
                          availableYears.value[0] || 
                          { label: currentYear, value: currentYear };
    }, 'Não foi possível carregar os dados. Tente novamente mais tarde.');  
  }
});

const sortedMonthly = computed(() => {
  const year = selectedYear.value ? parseInt(selectedYear.value.value as string) : new Date().getFullYear();

  const monthNames = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];

  const allMonths = Array.from({ length: 12 }, (_, i) => {
    const month = (i + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
  });

  const entries = allMonths.map((monthKey, index) => {
    const data = reportStore.monthlySummary[monthKey] ?? { totalEarnings: 0, totalTime: 0 };

    // earnings em reais (centavos → reais)
    const earnings = data.totalEarnings / 100;

    // horas decimais (segundos → horas)
    const hours = data.totalTime / 3600;

    return {
      label: monthNames[index],
      amount: earnings,
      hours: hours
    };
  });

  const totalEarnings = entries.reduce((sum, e) => sum + e.amount, 0);
  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);
  const filledMonths = entries.filter(e => e.amount > 0 || e.hours > 0).length || 1;

  const avgEarnings = totalEarnings / filledMonths;
  const avgHours = totalHours / filledMonths;

  const avgHourPart = Math.floor(avgHours);
  const avgMinutePart = Math.round((avgHours - avgHourPart) * 60);
  const formattedAvgTime = `${avgHourPart}h ${avgMinutePart}min`;
  const formattedAvgRevenue = `R$ ${avgEarnings.toLocaleString('pt-BR', { 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2 
  })}`;

  return {
    chartLabels: entries.map(e => e.label),
    datasets: [
      {
        label: 'Horas Trabalhadas',
        data: entries.map(e => parseFloat(e.hours.toFixed(2))),
        yAxisID: 'yHours'
      },
      {
        label: 'Receitas (R$)',
        data: entries.map(e => parseFloat(e.amount.toFixed(2))),
        yAxisID: 'yRevenue'
      }
    ],
    metrics: [
      {
        label: 'Média Mensal Horas/Receitas',
        value: `${formattedAvgTime} / ${formattedAvgRevenue}`
      }
    ]
  };
});
</script>

<template>
  <AppContainer>
    <AppBreadcrumb :title="`Olá, ${user?.name || 'Convidado'}! 👋`" description="É bom te ver de novo." />
  
    <div class="card-grid grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 my-7">
      <div class="card w-full rounded-3xl bg-background dark:bg-accent-dark shadow-md p-6">
        <span class="card-body text-secondary dark:text-secondary-dark text-sm">
          Horas Trabalhadas
        </span>
        <h1 class="card-title text-font dark:text-font-dark text-4xl font-bold font-mono mt-1">
          {{ $filters.formatDuration(reportStore.currentMonthStats.totalSeconds) }}
        </h1>
      </div>

      <div class="card w-full rounded-3xl bg-background dark:bg-accent-dark shadow-md p-6">
        <span class="card-body text-secondary dark:text-secondary-dark text-sm">
          Faturamento Estimado
        </span>
        <h1 class="card-title text-font dark:text-font-dark text-4xl font-bold font-mono mt-1">
          {{ $filters.formatCurrencyBRL(reportStore.currentMonthStats.estimated) }}
        </h1>
      </div>

      <div class="card w-full rounded-3xl bg-background dark:bg-accent-dark shadow-md p-6">
        <span class="card-body text-secondary dark:text-secondary-dark text-sm">
          Receita Faturada
        </span>
        <h1 class="card-title text-font dark:text-font-dark text-4xl font-bold font-mono mt-1">
          {{ $filters.formatCurrencyBRL(reportStore.currentMonthStats.billed) }}
        </h1>
      </div>

      <div class="card w-full rounded-3xl bg-background dark:bg-accent-dark shadow-md p-6">
        <span class="card-body text-secondary dark:text-secondary-dark text-sm">
          Receita Pendente
        </span>
        <h1 class="card-title text-font dark:text-font-dark text-4xl font-bold font-mono mt-1">
          {{ $filters.formatCurrencyBRL(reportStore.currentMonthStats.toReceive) }}
        </h1>
      </div>
    </div>

    <div class="rounded-3xl bg-background dark:bg-accent-dark shadow-md p-7">
      <AppBarChart
        v-model="selectedYear"
        :datasets="sortedMonthly.datasets"
        :chart-labels="sortedMonthly.chartLabels"
        :metrics="sortedMonthly.metrics"
        :years="availableYears"
      />
    </div>
  </AppContainer>
</template>