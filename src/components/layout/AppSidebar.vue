<script setup lang="ts">
import AppLogo from '@/components/layout/AppLogo.vue';
import AppMenuItem from '@/components/layout/AppMenuItem.vue';
import AppThemeSwitcher from '@/components/layout/AppThemeSwitcher.vue';
import { ROUTES } from '@/constants/routes';

interface MenuItem {
  to: string;
  icon: string;
  text: string;
}

interface MenuSection {
  title?: string;
  items: MenuItem[];
}

defineProps<{
  isExpanded: boolean;
}>();

const menuSections: MenuSection[] = [
  {
    items: [
      { to: ROUTES.DASHBOARD, icon: 'dashboard', text: 'Painel' }
    ]
  },
  {
    title: 'Gestão',
    items: [
      { to: ROUTES.PROJECTS, icon: 'folder', text: 'Projetos' },
      { to: ROUTES.SESSIONS, icon: 'schedule', text: 'Sessões' }
    ]
  },
  {
    title: 'Ferramentas',
    items: [
      { to: ROUTES.TIMER, icon: 'timer', text: 'Timer' }
    ]
  },
  {
    title: 'Sistema',
    items: [
      { to: ROUTES.SETTINGS, icon: 'settings', text: 'Configurações' }
    ]
  }
];
</script>

<template>
  <aside
    :class="[
      'fixed left-0 top-0 h-full bg-background dark:bg-accent-dark border-r border-neutral/50 dark:border-neutral-dark/50 z-50 flex flex-col overflow-x-hidden transition-all duration-300',
      isExpanded ? 'w-64' : 'w-16.25'
    ]"
  >
    <div :class="['py-7 flex items-center gap-2', isExpanded ? 'px-6' : 'px-0 justify-center']">
      <AppLogo :is-expanded="isExpanded" />
    </div>

    <nav
      :class="[
        'flex-1 mt-2 overflow-y-auto overflow-x-hidden',
        isExpanded ? 'px-4 space-y-3' : 'px-2'
      ]"
    >
      <template
        v-for="(section, sIndex) in menuSections"
        :key="section.title || sIndex"
      >
        <!-- Divisor sutil entre seções (Colapsado) -->
        <div
          v-if="sIndex > 0 && !isExpanded"
          class="flex justify-center my-2.5"
        >
          <div class="h-px w-6 bg-neutral dark:bg-neutral-dark" />
        </div>

        <div class="space-y-1">
          <!-- Título da Seção (Expandido) -->
          <div
            v-if="section.title && isExpanded"
            class="px-4 pt-1 pb-1 text-[11px] font-bold uppercase tracking-wider text-disabled dark:text-disabled-dark truncate select-none"
          >
            {{ section.title }}
          </div>

          <!-- Itens da Seção -->
          <AppMenuItem
            v-for="item in section.items"
            :key="item.to"
            :to="item.to"
            :icon="item.icon"
            :text="item.text"
            :is-expanded="isExpanded"
          />
        </div>
      </template>
    </nav>

    <div class="mt-auto pt-4">
      <AppThemeSwitcher :is-expanded="isExpanded" />
    </div>
  </aside>
</template>
