<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useUserStore } from '@/stores/userStore';
import Container from '@/components/shared/Container.vue';
import Breadcrumb from '@/components/shared/Breadcrumb.vue';

const { user } = storeToRefs(useUserStore());
</script>

<template>
  <Container>
    <Breadcrumb :title="`Olá, ${user?.name || 'Convidado'}! 👋`" />
  </Container>
</template>
