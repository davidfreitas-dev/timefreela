<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useUserStore } from '@/stores/userStore';
import { useProjectStore } from '@/stores/projectStore';
import { useReportStore } from '@/stores/reportStore';
import { useLoading } from '@/composables/useLoading';
import Container from '@/components/Container.vue';
import Breadcrumb from '@/components/Breadcrumb.vue';
import Chart from '@/components/Chart.vue';

const userStore = useUserStore();
const projectStore = useProjectStore();
const reportStore = useReportStore();

const { user } = storeToRefs(userStore);
const { fetchProjects } = projectStore;
const { fetchReports } = reportStore;

const { withLoading } = useLoading();

onMounted(async () => {    
  await withLoading(async () => {
    await fetchProjects();
    await fetchReports();
  }, 'Não foi possível carregar os dados. Tente novamente mais tarde.');  
});

const sortedMonthly = computed(() => {
  const year = new Date().getFullYear();

  const monthNames = [
    'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
    'jul', 'ago', 'set', 'out', 'nov', 'dez'
  ];

  const allMonths = Array.from({ length: 12 }, (_, i) => {
    const month = (i + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
  });

  const entries = allMonths.map((monthKey, index) => {
    const valueInCents = reportStore.monthlyAmount[monthKey] ?? 0;
    return {
      label: monthNames[index],
      amountInReais: +(valueInCents / 100).toFixed(2),
      amountInCents: valueInCents
    };
  });

  return {
    labels: entries.map(e => e.label),
    data: entries.map(e => e.amountInReais),
    total: entries.reduce((sum, e) => sum + e.amountInCents, 0)
  };
});
</script>

<template>
  <Container>
    <Breadcrumb :title="`Olá, ${user?.name || 'Convidado'}! 👋`" description="É bom te ver de novo." />
  
    <div class="cards flex flex-col md:flex-row items-center w-full gap-5 my-8">
      <div class="card w-full md:w-1/2 rounded-3xl border border-neutral dark:border-neutral-dark p-6">
        <h1 class="card-title text-font dark:text-font-dark text-5xl font-bold mb-3">
          {{ $filters.formatDuration(reportStore.currentMonthTime) }}
        </h1>
        <span class="card-body text-font dark:text-font-dark">
          Horas Trabalhadas no Mês
        </span>
      </div>

      <div class="card w-full md:w-1/2 rounded-3xl border border-neutral dark:border-neutral-dark p-6">
        <h1 class="card-title text-font dark:text-font-dark text-5xl font-bold mb-3">
          {{ $filters.formatCurrencyBRL(reportStore.currentMonthAmount) }}
        </h1>
        <span class="card-body text-font dark:text-font-dark">
          Receita Total no Mês
        </span>
      </div>
    </div>

    <div class="rounded-3xl border border-neutral dark:border-neutral-dark p-7">
      <Chart
        dataset-label="Receitas (R$)"
        :labels="sortedMonthly.labels"
        :data="sortedMonthly.data"
        :total="sortedMonthly.total"
      />
    </div>
  </Container>
</template>
