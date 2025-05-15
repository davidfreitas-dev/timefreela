<script setup lang="ts">
defineProps<{
  name: string;
}>();
</script>

<template>
  <span class="material-icons-outlined">
    {{ name }}
  </span>
</template>
