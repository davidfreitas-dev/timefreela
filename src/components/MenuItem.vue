<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import Icon from '@/components/Icon.vue';

const props = defineProps<{
  to: string;
  icon: string;
  text: string;
  isExpanded: boolean;
}>();

const route = useRoute();

const isActive = computed(() => route.path === props.to);
</script>

<template>
  <div class="button flex justify-center">
    <router-link
      :to="to"
      :class="[
        'flex items-center text-decoration-none focus:outline-none focus:ring-2 focus:ring-primary-pressed transition ease-in-out duration-200 rounded-lg w-[85%] px-4 py-3',
        {
          'bg-primary dark:bg-primary-dark': isActive,
          'hover:bg-primary-accent dark:hover:bg-primary-accent-dark hover:text-primary-pressed dark:hover:text-primary-dark': !isActive,
        }
      ]"
    >
      <Icon
        :name="icon"
        :class="[
          'text-2xl',
          {
            'text-white': isActive,
            'mr-2': isExpanded,
            '-ml-0.5': !isExpanded,
          }
        ]"
      />
      <span
        :class="[
          'font-medium',
          {
            'text-white': isActive,
            'opacity-100': isExpanded,
            'opacity-0': !isExpanded,
          }
        ]"
      >
        {{ text }}
      </span>
    </router-link>
  </div>
</template>
