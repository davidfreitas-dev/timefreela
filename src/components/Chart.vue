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

const props = defineProps<{
  labels: string[];
  data: number[];
  datasetLabel?: string;
  backgroundColor?: string;
  options?: ChartOptions<'bar'>;
  total?: number;
}>();

const isDark = useDark();

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

const chartOptions = computed<ChartOptions<'bar'>>(() => {
  const textColor = isDark.value ? '#f4f4f4' : '#3c3c3c';
  const gridColor = isDark.value ? '#3a3a3a' : '#eaeaea';

  return {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: textColor
        }
      },
      title: {
        color: textColor
      },
      tooltip: {
        bodyColor: textColor
      }
    },
    scales: {
      x: {
        ticks: {
          color: textColor
        },
        grid: {
          color: gridColor
        }
      },
      y: {
        ticks: {
          color: textColor
        },
        grid: {
          color: gridColor
        }
      }
    },
    ...props.options
  };
});
</script>

<template>
  <div class="wrapper">
    <div class="mb-3">
      <div class="font-normal text-secondary dark:text-secondary-dark mb-1">
        Média Receita Mensal
      </div>

      <h2 class="text-font dark:text-font-dark text-4xl font-bold">
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