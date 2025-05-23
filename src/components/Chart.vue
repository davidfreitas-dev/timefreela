<script setup lang="ts">
import { computed } from 'vue';
import { Bar } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from 'chart.js';
import type { ChartOptions, ChartData } from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const props = defineProps<{
  labels: string[];
  data: number[];
  datasetLabel?: string;
  backgroundColor?: string;
  options?: ChartOptions<'bar'>;
  total?: number;
}>();

const chartData = computed<ChartData<'bar'>>(() => ({
  labels: props.labels,
  datasets: [
    {
      label: props.datasetLabel ?? 'Dataset',
      backgroundColor: props.backgroundColor ?? '#038de7',
      data: props.data
    }
  ]
}));

const chartOptions = computed<ChartOptions<'bar'>>(() => ({
  responsive: true,
  ...props.options
}));
</script>

<template>
  <div class="wrapper">
    <div class="mb-3">
      <div class="font-normal text-secondary mb-1">
        Média Receita Mensal
      </div>

      <h2 class="text-font text-4xl font-bold">
        {{ $filters.formatCurrencyBRL(props.total ?? 0) }}
      </h2>
    </div>

    <Bar
      id="sales-chart"
      :options="chartOptions"
      :data="chartData"
      :height="100"
    />
  </div>
</template>
