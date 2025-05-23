<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useUserStore } from '@/stores/userStore';
import Container from '@/components/Container.vue';
import Breadcrumb from '@/components/Breadcrumb.vue';

const { user } = storeToRefs(useUserStore());
</script>

<template>
  <Container>
    <Breadcrumb :title="`Olá, ${user?.name || 'Convidado'}! 👋`" />
  </Container>
</template>
