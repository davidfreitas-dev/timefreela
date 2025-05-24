<script setup lang="ts">
import { computed } from 'vue';
import { Switch } from '@headlessui/vue';

const props = defineProps<{
  modelValue: number | boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void;
}>();

const isChecked = computed({
  get: () => props.modelValue === 1,
  set: (val: boolean) => {
    emit('update:modelValue', val ? 1 : 0);
  }
});

const onToggle = (val: boolean) => {
  isChecked.value = val;
};
</script>

<template>
  <Switch
    :model-value="isChecked"
    :class="isChecked ? 'bg-primary' : 'bg-primary-accent'"
    class="relative inline-flex h-[32px] w-[68px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75"
    @update:model-value="onToggle"
  >
    <span class="sr-only">Ativar configuração</span>
    <span
      aria-hidden="true"
      :class="isChecked ? 'translate-x-9' : 'translate-x-0'"
      class="pointer-events-none inline-block h-[28px] w-[28px] transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out"
    />
  </Switch>
</template>
