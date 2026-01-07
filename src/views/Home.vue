<script setup lang="ts">
import { onMounted, computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useUserStore } from '@/stores/userStore';
import { useProjectStore } from '@/stores/projectStore';
import { useReportStore } from '@/stores/reportStore';
import { useTimerStore } from '@/stores/timerStore';
import { useLoading } from '@/composables/useLoading';
import Container from '@/components/Container.vue';
import Breadcrumb from '@/components/Breadcrumb.vue';
import BarChart from '@/components/BarChart.vue';
import type { Option } from '@/types/option';

const userStore = useUserStore();
const projectStore = useProjectStore();
const reportStore = useReportStore();
const timerStore = useTimerStore();

const { user } = storeToRefs(userStore);
const { isRunning } = storeToRefs(timerStore);
const { fetchProjects } = projectStore;
const { fetchReports, getYearsWithData } = reportStore;
const { start } = timerStore;

const { withLoading } = useLoading();

const selectedYear = ref<Option | null>(null);
const years = ref<Option[]>([]);

const fetchChartData = async () => {
  if (selectedYear.value) {
    const year = Number(selectedYear.value.value);
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    await fetchReports(startDate, endDate);
  }
};

onMounted(async () => {
  if (isRunning.value) {
    start();
  }
  
  await withLoading(async () => {
    await fetchProjects();
    
    const availableYears = await getYearsWithData();
    years.value = availableYears.map(y => ({ value: y.toString(), label: y.toString() }));
    
    const currentYear = new Date().getFullYear().toString();
    if (availableYears.includes(Number(currentYear))) {
      selectedYear.value = { value: currentYear, label: currentYear };
    } else if (years.value.length > 0) {
      selectedYear.value = years.value[0];
    }
    
    await fetchChartData();
  }, 'Não foi possível carregar os dados. Tente novamente mais tarde.');  
});

watch(selectedYear, fetchChartData);

const sortedMonthly = computed(() => {
  const year = selectedYear.value ? Number(selectedYear.value.value) : new Date().getFullYear();

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
  <Container>
    <Breadcrumb :title="`Olá, ${user?.name || 'Convidado'}! 👋`" description="É bom te ver de novo." />
  
    <div class="card-grid grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 my-7">
      <div class="card w-full rounded-3xl border border-neutral dark:border-neutral-dark p-6">
        <span class="card-body text-secondary dark:text-secondary-dark text-sm">
          Horas Trabalhadas no Mês
        </span>
        <h1 class="card-title text-font dark:text-font-dark text-4xl font-bold mt-1">
          {{ $filters.formatDuration(reportStore.currentMonthStats.totalSeconds) }}
        </h1>
      </div>

      <div class="card w-full rounded-3xl border border-neutral dark:border-neutral-dark p-6">
        <span class="card-body text-secondary dark:text-secondary-dark text-sm">
          Receita Total no Mês
        </span>
        <h1 class="card-title text-font dark:text-font-dark text-4xl font-bold mt-1">
          {{ $filters.formatCurrencyBRL(reportStore.currentMonthStats.estimated) }}
        </h1>
      </div>

      <div class="card w-full rounded-3xl border border-neutral dark:border-neutral-dark p-6">
        <span class="card-body text-secondary dark:text-secondary-dark text-sm">
          Receita Faturada no Mês
        </span>
        <h1 class="card-title text-font dark:text-font-dark text-4xl font-bold mt-1">
          {{ $filters.formatCurrencyBRL(reportStore.currentMonthStats.billed) }}
        </h1>
      </div>

      <div class="card w-full rounded-3xl border border-neutral dark:border-neutral-dark p-6">
        <span class="card-body text-secondary dark:text-secondary-dark text-sm">
          Receita a Receber no Mês
        </span>
        <h1 class="card-title text-font dark:text-font-dark text-4xl font-bold mt-1">
          {{ $filters.formatCurrencyBRL(reportStore.currentMonthStats.toReceive) }}
        </h1>
      </div>
    </div>

    <div class="rounded-3xl border border-neutral dark:border-neutral-dark p-7">
      <BarChart
        v-model="selectedYear"
        :datasets="sortedMonthly.datasets"
        :chart-labels="sortedMonthly.chartLabels"
        :metrics="sortedMonthly.metrics"
        :years="years"
      />
    </div>
  </Container>
</template>
