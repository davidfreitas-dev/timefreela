<script setup lang="ts">
import { ref, nextTick } from 'vue';
import { Menu, MenuButton, MenuItem } from '@headlessui/vue';
import AppIcon from '@/components/ui/AppIcon.vue';

defineEmits<{
  (e: 'edit'): void
  (e: 'delete'): void
}>();

const position = ref({ top: 0, left: 0 });

const updateDropdownPosition = (event: MouseEvent) => {
  nextTick(() => {
    const button = event.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();
    position.value = {
      top: rect.bottom + window.scrollY,
      left: rect.right - 144 + window.scrollX, // 144 = largura do dropdown
    };
  });
};
</script>

<template>
  <div class="relative inline-block text-left">
    <Menu v-slot="{ open }" as="div">
      <MenuButton
        class="inline-flex items-center justify-center rounded-full p-2 text-secondary hover:bg-accent focus:outline-none"
        @click="updateDropdownPosition"
      >
        <AppIcon name="more_horiz" class="text-xl" />
      </MenuButton>

      <Teleport v-if="open" to="body">
        <div
          class="absolute z-50 w-36 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none"
          :style="{ top: `${position.top}px`, left: `${position.left}px` }"
        >
          <div class="px-1 py-1">
            <MenuItem v-slot="{ active }">
              <button
                :class="[
                  active ? 'bg-primary-accent text-primary' : 'text-font',
                  'group flex w-full items-center rounded-md px-2 py-2 text-sm cursor-pointer'
                ]"
                @click="$emit('edit')"
              >
                <AppIcon name="edit" class="mr-2 text-primary-hover group-hover:text-primary" />
                Editar
              </button>
            </MenuItem>
            <MenuItem v-slot="{ active }">
              <button
                :class="[
                  active ? 'bg-danger-accent text-danger' : 'text-font',
                  'group flex w-full items-center rounded-md px-2 py-2 text-sm cursor-pointer'
                ]"
                @click="$emit('delete')"
              >
                <AppIcon name="delete" class="mr-2 text-danger-hover group-hover:text-danger" />
                Excluir
              </button>
            </MenuItem>
          </div>
        </div>
      </Teleport>
    </Menu>
  </div>
</template>
