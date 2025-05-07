<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import Logo from '@/components/shared/Logo.vue';
import MenuItem from '@/components/shared/MenuItem.vue';

interface MenuItemData {
  to: string;
  icon: string;
  text: string;
}

const menuItems: MenuItemData[] = [
  { to: '/', icon: 'dashboard', text: 'Dashboard' },
  { to: '/projects', icon: 'category', text: 'Projetos' },
  { to: '/timer', icon: 'timer', text: 'Timer' },
  { to: '/reports', icon: 'bar_chart', text: 'Relatórios' },
  { to: '/settings', icon: 'settings', text: 'Configurações' }
];

const sidebarWidth = ref<string>('w-[65px]');
const isExpanded = ref<boolean>(localStorage.getItem('isExpanded') === 'true');

const EXPANDED_WIDTH = '230px';
const COLLAPSED_WIDTH = '65px';

const emit = defineEmits<{
  (e: 'onWidthChange', width: string): void;
}>();

watchEffect(() => {
  sidebarWidth.value = isExpanded.value ? 'w-[230px]' : 'w-[65px]';
  emit('onWidthChange', isExpanded.value ? EXPANDED_WIDTH : COLLAPSED_WIDTH);
});

const toggleSidebar = (): void => {
  isExpanded.value = !isExpanded.value;
  localStorage.setItem('isExpanded', String(isExpanded.value));
};
</script>

<template>
  <aside :class="['flex flex-col bg-gray-50 text-secondary border border-neutral overflow-hidden min-h-screen p-4 transition-all ease-in-out duration-200', sidebarWidth]">
    <Logo :is-expanded="isExpanded" />

    <div :class="['menu-toggle-wrap flex mb-4 select-none transition-all duration-200 relative', { 'justify-end': isExpanded, 'top-[-3.25rem]': isExpanded, 'top-0': !isExpanded }]">
      <button class="menu-toggle transition-all duration-200 rounded-xl focus:outline-none cursor-pointer" @click="toggleSidebar">
        <span class="material-icons text-font p-1 text-2xl transition-all duration-200 hover:text-primary" :style="{ transform: isExpanded ? 'rotate(-180deg)' : 'none' }">
          keyboard_double_arrow_right
        </span>
      </button>
    </div>

    <div class="menu space-y-4 -mx-4">
      <MenuItem
        v-for="item in menuItems.slice(0, -1)"
        :key="item.to"
        :to="item.to"
        :icon="item.icon"
        :text="item.text"
        :is-expanded="isExpanded"
      />
    </div>

    <div class="flex-1" />

    <div class="menu -mx-4 mb-4">
      <MenuItem
        :to="menuItems[menuItems.length - 1]?.to"
        :icon="menuItems[menuItems.length - 1]?.icon"
        :text="menuItems[menuItems.length - 1]?.text"
        :is-expanded="isExpanded"
      />
    </div>
  </aside>
</template>
