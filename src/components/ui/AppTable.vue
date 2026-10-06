<script setup lang="ts" generic="T">
import { type VNode } from 'vue';
defineProps<{
  headers: (string | VNode)[];
  items: T[];
}>();
</script>

<template>
  <div class="overflow-x-auto scrollbar">
    <table class="min-w-full text-left">
      <thead class="border-b border-neutral dark:border-neutral-dark text-font-accent dark:text-font-accent-dark">
        <tr>
          <th
            v-for="(header, index) in headers"
            :key="index"
            :class="[
              'px-6 py-4 text-font dark:text-font-dark',
              index === 0 && 'pr-0'
            ]"
          >
            <component 
              :is="header" 
              v-if="typeof header !== 'string'" 
            />
            <span v-else>{{ header }}</span>
          </th>
        </tr>
      </thead>
      <tbody class="text-secondary dark:text-secondary-dark text-base">
        <tr
          v-for="(item, index) in items"
          :key="index"
          :class="index !== items.length - 1 ? 'border-b border-neutral dark:border-neutral-dark' : ''"
        >
          <slot
            name="row"
            :item="item"
            :index="index"
          />
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.scrollbar::-webkit-scrollbar {
  height: 8px;
  background-color: transparent;
}

.scrollbar::-webkit-scrollbar-thumb {
  background-color: #eaeaea; 
  border-radius: 4px;
}

.dark .scrollbar::-webkit-scrollbar-thumb {
  background-color: #3a3a3a; 
}

:deep(th:first-child),
:deep(td:first-child) {
  padding-left: 2rem !important; /* pl-8 */
}

:deep(th:last-child),
:deep(td:last-child) {
  padding-right: 2rem !important; /* pr-8 */
}
</style>
