<script setup lang="ts">
import { onMounted, computed, watch, ref } from 'vue';
import { debounce } from 'vue-debounce';
import { storeToRefs } from 'pinia';
import { helpers, required } from '@vuelidate/validators';
import { useVuelidate } from '@vuelidate/core';
import { useLoading } from '@/composables/useLoading';
import { useProjectStore } from '@/stores/projectStore';
import { useReportStore } from '@/stores/reportStore';
import { useUserStore } from '@/stores/userStore';
import AppContainer from '@/components/layout/AppContainer.vue';
import AppBreadcrumb from '@/components/ui/AppBreadcrumb.vue';
import AppInputSearch from '@/components/ui/AppInputSearch.vue';
import AppSelect from '@/components/ui/AppSelect.vue';
import AppInputDate from '@/components/ui/AppInputDate.vue';
import AppTable from '@/components/ui/AppTable.vue';
import AppLoader from '@/components/ui/AppLoader.vue';
import AppCard from '@/components/ui/AppCard.vue';

const projectStore = useProjectStore();
const reportStore = useReportStore();
const userStore = useUserStore();

const { user } = storeToRefs(userStore);
const { groups } = storeToRefs(reportStore);

const dateInterval = ref({
  start: null as Date | null,
  end: null as Date | null,
});

const isAfterStart = helpers.withParams(
  { type: 'isAfterStart' },
  (value: Date | null, vm) => {
    if (!value || !vm.start) return true;
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
  await reportStore.fetchReports(startDate, endDate, selectedFilter.value.value);
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
  if (user.value?.id) {
    await withLoading(async () => {
      await projectStore.fetchAll(user.value!.id);
      await reportStore.fetchReports();
    }, 'Não foi possível carregar os dados. Tente novamente mais tarde.');  
  }
});

const revenueByProject = computed(() => {
  if (!groups.value?.length) return [];

  return groups.value.map(group => ({
    projectId: group.project.id,
    projectTitle: group.project.title,
    billingType: group.project.billingType,
    totalSeconds: group.subtotalSeconds,
    totalAmount: group.subtotalValue
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
    <AppBreadcrumb title="Relatórios" description="Gerencie os relatórios aqui." />

    <div class="cards flex flex-col md:flex-row items-center w-full gap-5 my-8">
      <AppCard class="w-full md:w-1/2">
        <span class="card-body text-secondary dark:text-secondary-dark text-sm">
          Horas Trabalhadas
        </span>
        <h1 class="card-title text-font dark:text-white text-5xl font-semibold font-mono tracking-tight mt-2">
          {{ $filters.formatDuration(reportStore.totalTime) }}
        </h1>
      </AppCard>

      <AppCard class="w-full md:w-1/2">
        <span class="card-body text-secondary dark:text-secondary-dark text-sm">
          Receita Total
        </span>
        <h1 class="card-title text-font dark:text-white text-5xl font-semibold font-mono tracking-tight mt-2">
          {{ $filters.formatCurrencyBRL(reportStore.totalAmount) }}
        </h1>
      </AppCard>
    </div>

    <section class="earning">
      <h1 class="section-title text-font dark:text-white text-xl font-semibold mb-4">
        Faturamento por Projeto
      </h1>
      <div class="relative rounded-3xl bg-background dark:bg-accent-dark shadow-md pb-2">
        <div class="filters grid grid-cols-1 md:grid-cols-2 gap-4 w-full px-6 pt-6 border-b border-neutral dark:border-neutral-dark pb-6">
          <AppInputDate
            v-model="dateInterval.start"
            placeholder="Data inicial"
            :error="v$.start.$dirty && v$.start.$error ? 'Data inicial é obrigatória.' : ''"
            @blur="v$.start.$touch()"
          />          

          <AppInputDate
            v-model="dateInterval.end"
            placeholder="Data final"
            :error="v$.end.$dirty && v$.end.$error
              ? v$.end.$errors.find(e => e.$validator === 'isAfterStart')
                ? 'Data final não pode ser anterior à data inicial.'
                : 'Data final é obrigatória.'
              : ''"
            @blur="v$.end.$touch()"
          />          

          <AppInputSearch v-model="search" placeholder="Buscar por projeto" />          

          <AppSelect v-model="selectedFilter" :options="filterOptions" />
        </div>

        <AppLoader
          v-if="isLoading"
          color="primary"
          class="w-4 h-4 mx-auto my-10"
        />

        <div class="rounded-2xl overflow-auto">
          <AppTable
            v-if="!isLoading && filteredRevenue?.length"
            :headers="tableHeaders"
            :items="filteredRevenue"
          >
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
        
        <div v-if="!isLoading && !filteredRevenue?.length" class="text-secondary dark:text-gray-400 text-center my-10">
          Nenhum dado encontrado.
        </div>
      </div>
    </section>
  </AppContainer>
</template>