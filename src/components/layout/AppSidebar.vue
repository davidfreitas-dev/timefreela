<script setup lang="ts">
import { storeToRefs } from 'pinia';
import AppLogo from '@/components/layout/AppLogo.vue';
import AppMenuItem from '@/components/layout/AppMenuItem.vue';
import { ROUTES } from '@/constants/routes';
import { useLayoutStore } from '@/stores/layoutStore';

interface MenuItemData {
  to: string;
  icon: string;
  text: string;
}

const layoutStore = useLayoutStore();
const { isSidebarExpanded, sidebarWidthClass } = storeToRefs(layoutStore);

const menuItems: MenuItemData[] = [
  { to: ROUTES.DASHBOARD, icon: 'dashboard', text: 'Dashboard' },
  { to: ROUTES.PROJECTS, icon: 'category', text: 'Projetos' },
  { to: ROUTES.SESSIONS, icon: 'history', text: 'Sessões' },
  { to: ROUTES.TIMER, icon: 'timer', text: 'Timer' },
  { to: ROUTES.SETTINGS, icon: 'settings', text: 'Configurações' }
];
</script>

<template>
  <aside
    :class="[
      'flex flex-col text-secondary dark:text-secondary-dark dark:border-neutral-dark overflow-hidden min-h-screen p-6 transition-all ease-in-out duration-200',
      { 'px-2': !isSidebarExpanded },
      sidebarWidthClass
    ]"
  >
    <div class="header flex justify-center h-16">
      <AppLogo :is-expanded="isSidebarExpanded" />
    </div>

    <div class="menu space-y-4">
      <AppMenuItem
        v-for="item in menuItems.slice(0, -1)"
        :key="item.to"
        :to="item.to"
        :icon="item.icon"
        :text="item.text"
        :is-expanded="isSidebarExpanded"
      />
    </div>

    <div class="flex-1" />

    <div class="menu">
      <AppMenuItem
        :to="menuItems[menuItems.length - 1]?.to"
        :icon="menuItems[menuItems.length - 1]?.icon"
        :text="menuItems[menuItems.length - 1]?.text"
        :is-expanded="isSidebarExpanded"
      />
    </div>
  </aside>
</template>
