<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { useUserStore } from '@/stores/userStore';
import { useTimerStore } from '@/stores/timerStore';
import { ROUTES } from '@/constants/routes';
import AppLogo from '@/components/layout/AppLogo.vue';
import AppIcon from '@/components/ui/AppIcon.vue';

const router = useRouter();
const authStore = useAuthStore();
const userStore = useUserStore();
const timerStore = useTimerStore();

const isMenuOpen = ref(false);

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

const closeMenu = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (!target.closest('.user-menu')) {
    isMenuOpen.value = false;
  }
};

onMounted(() => {
  window.addEventListener('click', closeMenu);
});

onUnmounted(() => {
  window.removeEventListener('click', closeMenu);
});

const handleLogout = async () => {
  await authStore.logout();
  router.push(ROUTES.LOGIN);
};

const navigateToSettings = () => {
  router.push(ROUTES.SETTINGS);
  isMenuOpen.value = false;
};

const userInitial = () => {
  return userStore.displayName ? userStore.displayName.charAt(0).toUpperCase() : 'U';
};
</script>

<template>
  <header class="h-16 bg-white dark:bg-dark-surface border-b border-neutral dark:border-neutral-dark flex items-center justify-between px-6 sticky top-0 z-30">
    <div class="flex items-center gap-4">
      <AppLogo :is-expanded="true" />
    </div>

    <div class="flex items-center gap-4">
      <div v-if="timerStore.isRunning" class="hidden sm:flex items-center bg-primary-accent dark:bg-primary-accent-dark px-3 py-1.5 rounded-full border border-primary/20">
        <AppIcon name="timer" class="text-primary mr-2" />
        <span class="text-primary font-mono font-bold">{{ timerStore.elapsedFormatted }}</span>
      </div>

      <div class="user-menu relative">
        <button 
          class="flex items-center gap-2 p-1 rounded-full hover:bg-neutral/50 dark:hover:bg-neutral-dark/50 transition-colors focus:outline-none"
          @click="toggleMenu"
        >
          <div class="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
            {{ userInitial() }}
          </div>
          <AppIcon name="expand_more" :class="['text-secondary transition-transform duration-200', { 'rotate-180': isMenuOpen }]" />
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
            class="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-surface border border-neutral dark:border-neutral-dark rounded-xl shadow-lg py-1 z-50 overflow-hidden"
          >
            <div class="px-4 py-2 border-b border-neutral dark:border-neutral-dark mb-1">
              <p class="text-sm font-semibold text-font dark:text-font-dark truncate">
                {{ userStore.displayName }}
              </p>
              <p class="text-xs text-secondary dark:text-secondary-dark truncate">
                {{ authStore.firebaseUser?.email }}
              </p>
            </div>
            
            <button 
              class="w-full text-left px-4 py-2 text-sm text-font dark:text-font-dark hover:bg-neutral/50 dark:hover:bg-neutral-dark/50 flex items-center gap-2 transition-colors"
              @click="navigateToSettings"
            >
              <AppIcon name="person" class="text-lg" />
              Perfil
            </button>
            <button 
              class="w-full text-left px-4 py-2 text-sm text-font dark:text-font-dark hover:bg-neutral/50 dark:hover:bg-neutral-dark/50 flex items-center gap-2 transition-colors"
              @click="navigateToSettings"
            >
              <AppIcon name="settings" class="text-lg" />
              Configurações
            </button>
            <hr class="my-1 border-neutral dark:border-neutral-dark">
            <button 
              class="w-full text-left px-4 py-2 text-sm text-danger hover:bg-danger-accent/50 dark:hover:bg-danger-accent-dark/50 flex items-center gap-2 transition-colors"
              @click="handleLogout"
            >
              <AppIcon name="logout" class="text-lg" />
              Sair
            </button>
          </div>
        </Transition>
      </div>
    </div>
  </header>
</template>
