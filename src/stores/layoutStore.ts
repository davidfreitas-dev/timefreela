import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useLayoutStore = defineStore('layout', () => {
  const isSidebarExpanded = ref<boolean>(localStorage.getItem('isSidebarExpanded') === 'true');

  const EXPANDED_WIDTH = '240px';
  const COLLAPSED_WIDTH = '65px';

  const sidebarWidth = computed(() => isSidebarExpanded.value ? EXPANDED_WIDTH : COLLAPSED_WIDTH);
  const sidebarWidthClass = computed(() => isSidebarExpanded.value ? 'w-[240px]' : 'w-[65px]');

  function toggleSidebar() {
    isSidebarExpanded.value = !isSidebarExpanded.value;
    localStorage.setItem('isSidebarExpanded', String(isSidebarExpanded.value));
  }

  function setSidebarExpanded(value: boolean) {
    isSidebarExpanded.value = value;
    localStorage.setItem('isSidebarExpanded', String(value));
  }

  return {
    isSidebarExpanded,
    sidebarWidth,
    sidebarWidthClass,
    toggleSidebar,
    setSidebarExpanded
  };
});
