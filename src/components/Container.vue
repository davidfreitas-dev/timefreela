<script setup lang="ts">
const { sidebarWidth } = defineProps<{
  sidebarWidth?: string
}>();
</script>

<template>
  <main class="p-7 transition-all ease-in-out duration-200" :style="{ width: `calc(100% - ${sidebarWidth})` }">
    <slot />
  </main>
</template>
