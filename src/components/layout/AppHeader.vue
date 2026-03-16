<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { useUserStore } from '@/stores/userStore';
import { useLayoutStore } from '@/stores/layoutStore';
import { ROUTES } from '@/constants/routes';
import AppIcon from '@/components/ui/AppIcon.vue';

const router = useRouter();
const authStore = useAuthStore();
const userStore = useUserStore();
const layoutStore = useLayoutStore();

const isMenuOpen = ref(false);

const handleLogout = async () => {
  await authStore.logout();
  router.push(ROUTES.LOGIN);
};

const userInitial = () => {
  return userStore.displayName ? userStore.displayName.charAt(0).toUpperCase() : 'U';
};
</script>

<template>
  <header class="h-16 bg-white dark:bg-background-dark border-b border-neutral dark:border-neutral-dark flex items-center justify-between px-6 sticky top-0 z-30">
    <div class="flex items-center">
      <button 
        class="p-2 rounded-lg hover:bg-neutral/50 dark:hover:bg-neutral-dark/50 transition-colors focus:outline-none cursor-pointer text-secondary dark:text-secondary-dark"
        @click="layoutStore.toggleSidebar"
      >
        <AppIcon 
          :name="layoutStore.isSidebarExpanded ? 'menu_open' : 'menu'" 
          class="text-2xl"
        />
      </button>
    </div>

    <div 
      class="user-menu relative"
      @mouseenter="isMenuOpen = true"
      @mouseleave="isMenuOpen = false"
    >
      <button 
        class="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral/50 dark:hover:bg-neutral-dark/50 transition-colors focus:outline-none"
      >
        <div class="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shadow-sm">
          {{ userInitial() }}
        </div>
        <span class="text-sm font-medium text-font dark:text-font-dark hidden sm:block">
          {{ userStore.displayName }}
        </span>
        <AppIcon 
          name="expand_more" 
          :class="['text-secondary transition-transform duration-200', { 'rotate-180': isMenuOpen }]" 
        />
      </button>

      <Transition
        enter-active-class="transition duration-100 ease-out"
        enter-from-class="transform scale-95 opacity-0"
        enter-to-class="transform scale-100 opacity-100"
        leave-active-class="transition duration-75 ease-in"
        leave-from-class="transform scale-100 opacity-100"
        leave-to-class="transform scale-95 opacity-0"
      >
        <div 
          v-if="isMenuOpen"
          class="absolute right-0 mt-1 w-48 bg-white dark:bg-accent-dark border border-neutral dark:border-neutral-dark rounded-xl shadow-lg py-1 z-50 overflow-hidden"
        >
          <button 
            class="w-full text-left px-4 py-2 text-sm text-danger hover:bg-danger-accent/50 dark:hover:bg-danger-accent-dark/50 flex items-center gap-2 transition-colors font-medium"
            @click="handleLogout"
          >
            <AppIcon name="logout" class="text-lg" />
            Finalizar Sessão
          </button>
        </div>
      </Transition>
    </div>
  </header>
</template>
