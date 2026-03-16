<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '@/stores/authStore';
import { useTimerStore } from '@/stores/timerStore';
import { useBeforeUnloadGuard } from '@/composables/useBeforeUnloadGuard';
import { useToast } from '@/composables/useToast';
import AppSidebar from '@/components/layout/AppSidebar.vue';
import AppHeader from '@/components/layout/AppHeader.vue';
import AppTimerWidget from '@/components/layout/AppTimerWidget.vue';
import AppToast from '@/components/ui/AppToast.vue';

const route = useRoute();

const { isAuthenticated } = storeToRefs(useAuthStore());
const { isRunning } = storeToRefs(useTimerStore());

useBeforeUnloadGuard(() => isRunning.value);

const { toastData } = useToast();
</script>

<template>
  <div class="app flex h-screen bg-background dark:bg-accent-dark overflow-hidden">
    <AppSidebar v-if="isAuthenticated" />
    
    <div class="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
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
    <AppToast ref="toast" :toast-data="toastData" />
  </div>
</template>
