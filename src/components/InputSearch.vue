<script setup lang="ts">
const props = defineProps<{
  modelValue: string;
  placeholder?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const updateValue = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.value);
};
</script>

<template>
  <div class="flex items-center gap-3 h-[52px] w-full p-4 bg-transparent border border-neutral dark:border-neutral-dark focus-within:border-none rounded-xl focus-within:ring-2 ring-primary dark:ring-primary">
    <input
      type="text"
      class="flex-1 bg-transparent text-base text-font dark:text-font-dark placeholder:text-secondary dark:placeholder:text-secondary-dark outline-none"
      :value="props.modelValue"
      :placeholder="props.placeholder || 'O que você busca?'"
      @input="updateValue"
    >
  </div>
</template>
