<script setup lang="ts">
import { computed } from 'vue';
import AppButton from './AppButton.vue';
import AppIcon from './AppIcon.vue';

const props = defineProps<{
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
}>();

const emit = defineEmits<{
  (e: 'update:currentPage', page: number): void;
}>();

const totalPages = computed(() => Math.ceil(props.totalItems / props.itemsPerPage));

const visiblePages = computed(() => {
  const pages: (number | string)[] = [];
  const current = props.currentPage;
  const total = totalPages.value;

  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
  } else {
    if (current <= 3) {
      pages.push(1, 2, 3, 4, '...', total);
    } else if (current >= total - 2) {
      pages.push(1, '...', total - 3, total - 2, total - 1, total);
    } else {
      pages.push(1, '...', current - 1, current, current + 1, '...', total);
    }
  }

  return pages;
});

const goToPage = (page: number | string) => {
  if (typeof page === 'number' && page !== props.currentPage) {
    emit('update:currentPage', page);
  }
};

const nextPage = () => {
  if (props.currentPage < totalPages.value) {
    emit('update:currentPage', props.currentPage + 1);
  }
};

const prevPage = () => {
  if (props.currentPage > 1) {
    emit('update:currentPage', props.currentPage - 1);
  }
};
</script>

<template>
  <div v-if="totalPages > 1" class="flex items-center justify-center gap-1 mt-4">
    <AppButton
      variant="ghost"
      color="secondary"
      size="small"
      icon-only
      :disabled="currentPage === 1"
      @click="prevPage"
      aria-label="Página anterior"
    >
      <AppIcon name="chevron_left" />
    </AppButton>

    <template v-for="(page, index) in visiblePages" :key="index">
      <AppButton
        v-if="typeof page === 'number'"
        :variant="page === currentPage ? 'fill' : 'ghost'"
        :color="page === currentPage ? 'primary' : 'secondary'"
        size="small"
        :icon-only="true"
        class="w-8 h-8 rounded-md font-medium"
        @click="goToPage(page)"
      >
        {{ page }}
      </AppButton>
      <span
        v-else
        class="w-8 h-8 flex items-center justify-center text-font/50 dark:text-font-dark/50"
      >
        ...
      </span>
    </template>

    <AppButton
      variant="ghost"
      color="secondary"
      size="small"
      icon-only
      :disabled="currentPage === totalPages"
      @click="nextPage"
      aria-label="Próxima página"
    >
      <AppIcon name="chevron_right" />
    </AppButton>
  </div>
</template>
