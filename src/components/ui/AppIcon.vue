<script setup lang="ts">
import type { Component } from 'vue';
import { computed } from 'vue';
import {
  LayoutDashboard,
  LayoutGrid,
  History,
  Timer,
  Settings,
  MoreHorizontal,
  Pencil,
  Trash,
  Search,
  X,
  EyeOff,
  Eye,
  Check,
  Pause,
  Play,
  Square,
  User,
  LogOut,
  Plus,
  Table,
  Download,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Home,
  TriangleAlert,
  Info,
  Menu,
  Folder,
  Clock,
  Palette,
  Sun,
  Moon
} from '@lucide/vue';

defineOptions({ 
  inheritAttrs: false 
});

const props = withDefaults(defineProps<{
  name: string;
  size?: 'sm' | 'md' | 'lg' | number | string;
}>(), {
  size: 'md'
});

const iconMap: Record<string, Component> = {
  'dashboard': LayoutDashboard,
  'category': LayoutGrid,
  'history': History,
  'timer': Timer,
  'settings': Settings,
  'more_horiz': MoreHorizontal,
  'edit': Pencil,
  'delete': Trash,
  'search': Search,
  'close': X,
  'visibility_off': EyeOff,
  'visibility': Eye,
  'check': Check,
  'pause': Pause,
  'play_arrow': Play,
  'stop': Square,
  'person': User,
  'logout': LogOut,
  'add': Plus,
  'table_chart': Table,
  'download': Download,
  'chevron_right': ChevronRight,
  'chevron_left': ChevronLeft,
  'expand_more': ChevronDown,
  'keyboard_arrow_down': ChevronDown,
  'home': Home,
  'warning': TriangleAlert,
  'info': Info,
  'menu': Menu,
  'folder': Folder,
  'schedule': Clock,
  'palette': Palette,
  'light_mode': Sun,
  'dark_mode': Moon
};

const iconComponent = computed<Component>(() => {
  return iconMap[props.name] || Info;
});

const numericSize = computed(() => {
  if (typeof props.size === 'number') return props.size;
  
  // if string number
  if (!isNaN(Number(props.size))) return Number(props.size);

  switch (props.size) {
    case 'sm': return 18; // smaller size for buttons
    case 'lg': return 48; // large size for empty states
    case 'md': 
    default: return 24;
  }
});
</script>

<template>
  <component :is="iconComponent" v-bind="$attrs" :size="numericSize" />
</template>
