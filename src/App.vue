<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useNetwork } from '@vueuse/core';
import { useAuthStore } from '@/stores/authStore';
import { useTimerStore } from '@/stores/timerStore';
import { useLayoutStore } from '@/stores/layoutStore';
import { useBeforeUnloadGuard } from '@/composables/useBeforeUnloadGuard';
import { useTimerTab } from '@/composables/useTimerTab';
import { useTimerForgottenAlert } from '@/composables/useTimerForgottenAlert';
import AppSidebar from '@/components/layout/AppSidebar.vue';
import AppHeader from '@/components/layout/AppHeader.vue';
import AppTimerWidget from '@/components/layout/AppTimerWidget.vue';
import AppIcon from '@/components/ui/AppIcon.vue';

const route = useRoute();
const { isOnline } = useNetwork();

const { isAuthenticated } = storeToRefs(useAuthStore());
const { isRunning } = storeToRefs(useTimerStore());
const { isSidebarExpanded } = storeToRefs(useLayoutStore());

useBeforeUnloadGuard(() => isRunning.value);
useTimerTab();
useTimerForgottenAlert();
</script>

<template>
  <div class="app flex h-screen bg-background dark:bg-accent-dark overflow-hidden">
    <AppSidebar v-if="isAuthenticated" :is-expanded="isSidebarExpanded" />
    
    <div 
      :class="[
        'flex flex-col flex-1 min-w-0 h-full overflow-hidden transition-all duration-300',
        isAuthenticated ? (isSidebarExpanded ? 'ml-64' : 'ml-16.25') : ''
      ]"
    >
      <!-- Alerta de Modo Offline / Cache Firestore -->
      <div
        v-if="!isOnline"
        class="bg-amber-500 text-white text-xs py-1.5 px-4 text-center font-medium flex items-center justify-center gap-2 z-40 shrink-0"
      >
        <AppIcon name="warning" size="sm" />
        <span>Você está offline. O TimeFreela continua funcionando com o cache do Firestore e sincronizará automaticamente quando reconectar.</span>
      </div>

      <AppHeader v-if="isAuthenticated" />
      
      <main 
        :class="[
          'flex-1 overflow-y-auto overflow-x-hidden bg-accent/50 dark:bg-background-dark',
          isAuthenticated ? 'p-4 md:p-6 lg:p-8' : ''
        ]"
      >
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
            <component
              :is="Component"
              :key="route.fullPath"
            />
          </Transition>
        </RouterView>
      </main>
    </div>

    <AppTimerWidget />
  </div>
</template>
