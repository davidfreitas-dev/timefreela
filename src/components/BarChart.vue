<script setup lang="ts">
import { computed } from 'vue';
import { useDark } from '@vueuse/core';
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

type DatasetInput = {
  label: string;
  data: number[];
  backgroundColor?: string;
  yAxisID?: string;
};

const props = defineProps<{
  datasets: DatasetInput[];
  chartLabels: string[];
  metrics: {
    label: string;
    value: string;
  }[];
  options?: ChartOptions<'bar'>;
}>();

const isDark = useDark();

const defaultColors = [
  ['#026bb3', '#2f64b5'],
  ['#1a9ef0', '#5a9dfc'],
  ['#00c49a', '#00b894'],
  ['#ffbb28', '#f1c40f'],
  ['#ff8042', '#e67e22']
];

const chartData = computed<ChartData<'bar'>>(() => ({
  labels: props.chartLabels,
  datasets: props.datasets.map((ds, i) => ({
    ...ds,
    backgroundColor: ds.backgroundColor ?? (isDark.value ? defaultColors[i % defaultColors.length][1] : defaultColors[i % defaultColors.length][0]),
    borderRadius: 8,
    barPercentage: 0.6,
    categoryPercentage: 0.6,
    borderSkipped: false,
    order: i + 1
  }))
}));

const chartOptions = computed<ChartOptions<'bar'>>(() => {
  const textColor = isDark.value ? '#f4f4f4' : '#3c3c3c';
  const gridColor = isDark.value ? '#3a3a3a' : '#eaeaea';

  const uniqueYAxes = [...new Set(props.datasets.map(d => d.yAxisID).filter(Boolean))] as string[];

  const scales: ChartOptions<'bar'>['scales'] = {
    x: {
      ticks: { color: textColor },
      grid: { color: gridColor, display: false },
      border: { display: false }
    }
  };

  uniqueYAxes.forEach((id, index) => {
    scales[id] = {
      position: index % 2 === 0 ? 'left' : 'right',
      title: {
        display: true,
        text: id === 'yRevenue' ? 'Receita (R$)' : id === 'yHours' ? 'Horas Trabalhadas' : id,
        color: textColor
      },
      ticks: { color: textColor },
      grid: {
        drawOnChartArea: false,
        color: gridColor
      },
      beginAtZero: true
    };
  });

  return {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: textColor,
          usePointStyle: true,
          pointStyle: 'circle',
        }
      },
      title: {
        color: textColor
      },
      tooltip: {
        bodyColor: '#f4f4f4',
      }
    },
    scales,
    elements: {
      bar: {
        borderRadius: 6,
        borderSkipped: false,
      }
    },
    ...props.options
  };
});
</script>

<template>
  <div class="wrapper">
    <div v-if="props.metrics.length" class="mb-4">
      <div
        v-for="(metric, i) in props.metrics"
        :key="i"
        class="flex flex-col"
      >
        <div class="font-normal text-secondary dark:text-secondary-dark mb-1">
          {{ metric.label }}
        </div>
        <h2 class="text-font dark:text-font-dark text-2xl sm:text-3xl font-bold">
          {{ metric.value }}
        </h2>
      </div>
    </div>

    <Bar
      id="sales-chart"
      :options="chartOptions"
      :data="chartData"
      :height="100"
    />
  </div>
</template>
