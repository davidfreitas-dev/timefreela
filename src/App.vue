<script setup lang="ts">
import { ref } from 'vue';
import { RouterView } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/composables/useToast';
import Sidebar from '@/components/shared/Sidebar.vue';
import Toast from '@/components/shared/Toast.vue';

const { isAuthenticated } = storeToRefs(useAuthStore());

const { toast, toastData } = useToast();

const sidebarWidth = ref<string>('230px');

const changeSidebarWidth = (event: string): void => {
  sidebarWidth.value = event;
};
</script>

<template>
  <div class="app flex">
    <Sidebar v-if="isAuthenticated" @on-width-change="changeSidebarWidth" />
    <main class="flex-1 h-screen transition-all ease-in-out duration-200">
      <RouterView v-slot="{ Component }">
        <Transition
          appear
          mode="out-in"
          enter-active-class="transition-opacity duration-300"
          enter-from-class="opacity-0"
          enter-to-class="opacity-100"
          leave-active-class="transition-opacity duration-200"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <component :is="Component" :key="$route.fullPath" />
        </Transition>
      </RouterView>
    </main>
    <Toast ref="toast" :toast-data="toastData" />
  </div>
</template>
