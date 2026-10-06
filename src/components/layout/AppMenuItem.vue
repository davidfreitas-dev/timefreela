<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppIcon from '@/components/ui/AppIcon.vue';

const props = defineProps<{
 to: string;
 icon: string;
 text: string;
 isExpanded: boolean;
}>();

const route = useRoute();
const isActive = computed(() => {
  if (props.to === '/') {
    return route.path === '/';
  }
  return route.path === props.to || route.path.startsWith(props.to + '/');
});

const linkClasses = computed(() =>
  isActive.value
    ? 'bg-primary dark:bg-primary-dark text-white font-semibold shadow-sm'
    : 'text-secondary dark:text-secondary-dark hover:bg-neutral/50 dark:hover:bg-neutral-dark/50 hover:text-font dark:hover:text-font-dark'
);

const iconClasses = computed(() =>
  isActive.value
    ? 'text-white'
    : 'text-secondary/70 dark:text-secondary-dark/70 group-hover:text-secondary dark:group-hover:text-secondary-dark'
);
</script>

<template>
  <router-link
    :to="to"
    :class="[
      'flex items-center rounded-lg transition-all group py-3 text-sm font-medium',
      isExpanded ? 'px-4 justify-start' : 'px-0 justify-center w-12 mx-auto',
      linkClasses
    ]"
    :title="!isExpanded ? text : ''"
  >
    <AppIcon
      :name="icon"
      size="20"
      :class="['transition-colors', isExpanded ? 'mr-3' : '', iconClasses]"
    />
    <span 
      v-if="isExpanded"
      class="whitespace-nowrap"
    >
      {{ text }}
    </span>
  </router-link>
</template>
