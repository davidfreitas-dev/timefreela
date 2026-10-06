<script setup lang="ts">
import AppLogo from '@/components/layout/AppLogo.vue';
import AppMenuItem from '@/components/layout/AppMenuItem.vue';
import AppThemeSwitcher from '@/components/layout/AppThemeSwitcher.vue';
import { ROUTES } from '@/constants/routes';

interface MenuItemData {
 to: string;
 icon: string;
 text: string;
 group?: string;
}

defineProps<{
 isExpanded: boolean;
}>();

const menuItems: MenuItemData[] = [
  { to: ROUTES.DASHBOARD, icon: 'dashboard', text: 'Painel' },
  { to: ROUTES.PROJECTS, icon: 'folder', text: 'Projetos', group: 'Gestão' },
  { to: ROUTES.SESSIONS, icon: 'schedule', text: 'Sessões', group: 'Gestão' },
  { to: ROUTES.TIMER, icon: 'timer', text: 'Timer', group: 'Ferramentas' },
  { to: ROUTES.SETTINGS, icon: 'settings', text: 'Configurações', group: 'Sistema' }
];
</script>

<template>
  <aside
    :class="[
      'fixed left-0 top-0 h-full bg-background dark:bg-accent-dark border-r border-neutral/50 dark:border-neutral-dark/50 z-50 flex flex-col overflow-x-hidden transition-all duration-300',
      isExpanded ? 'w-[240px]' : 'w-[65px]'
    ]"
  >
    <div :class="['py-7 flex items-center gap-2', isExpanded ? 'px-6' : 'px-0 justify-center']">
      <AppLogo :is-expanded="isExpanded" />
    </div>

    <nav :class="['flex-1 mt-4 space-y-1 overflow-y-auto overflow-x-hidden', isExpanded ? 'px-4' : 'px-2']">
      <template v-for="(item, index) in menuItems" :key="item.to">
        <div
          v-if="item.group && item.group !== menuItems[index - 1]?.group"
          :class="['mt-6 flex items-center transition-all duration-300', isExpanded ? 'px-4 py-2' : 'justify-center py-2']"
        >
          <span v-if="isExpanded" class="font-bold text-disabled dark:text-disabled-dark uppercase tracking-wider text-[11px] truncate">
            {{ item.group }}
          </span>
          <div v-else class="h-[1px] w-6 bg-neutral dark:bg-neutral-dark" />
        </div>
        <AppMenuItem
          :to="item.to"
          :icon="item.icon"
          :text="item.text"
          :is-expanded="isExpanded"
        />
      </template>
    </nav>

    <div class="mt-auto pt-4">
      <AppThemeSwitcher :is-expanded="isExpanded" />
    </div>
  </aside>
</template>
