<script setup lang="ts" generic="T">
defineProps<{
  headers: string[];
  items: T[];
}>();
</script>

<template>
  <div class="overflow-x-auto">
    <table class="min-w-full text-left">
      <thead class="border-y border-neutral text-font-accent">
        <tr>
          <th
            v-for="(header, index) in headers"
            :key="index"
            class="px-6 py-4 text-font"
          >
            {{ header }}
          </th>
        </tr>
      </thead>
      <tbody class="text-font text-base">
        <tr
          v-for="(item, index) in items"
          :key="index"
          :class="index !== items.length - 1 ? 'border-b border-neutral' : ''"
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
