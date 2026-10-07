<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue';

const emit = defineEmits<{
 (event: 'update:modelValue', value: string): void;
 (event: 'enter'): void;
 (event: 'blur', e: FocusEvent): void;
}>();

const { disabled, label, placeholder, modelValue } = defineProps<{
 modelValue: string;
 label?: string;
 placeholder?: string;
 disabled?: boolean;
}>();

const updateValue = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.value);
};
</script>

<template>
  <div class="flex flex-col gap-2 relative w-full">
    <label v-if="label" class="text-font dark:text-font-dark font-semibold">{{ label }}</label>

    <div class="relative">
      <input
        type="text"
        :value="modelValue"
        :placeholder="placeholder || ''"
        :disabled="disabled"
        :class="[
          'text-font dark:text-font-dark bg-accent dark:bg-neutral-dark text-[14px] w-full h-11 rounded-xl pl-4 pr-10 focus:outline-none focus:ring-1 transition-all duration-200 disabled:cursor-not-allowed disabled:bg-disabled/60 dark:disabled:bg-disabled-dark disabled:text-secondary dark:disabled:text-secondary-dark disabled:placeholder:text-secondary/60 dark:disabled:placeholder:text-secondary-dark/60',
          'border border-neutral dark:border-disabled-dark focus:ring-primary focus:border-primary '
        ]"
        :aria-label="label"
        @input="updateValue"
        @blur="$emit('blur', $event)"
        @keyup.enter="emit('enter')"
      >
      <div class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-disabled dark:text-secondary-dark pointer-events-none">
        <AppIcon name="search" class="w-5 h-5" />
      </div>
    </div>
  </div>
</template>
