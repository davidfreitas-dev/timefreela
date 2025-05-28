<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'onKeyupEnter'): void;
}>();

const props = defineProps<{
  label?: string;
  placeholder?: string;
  modelValue?: string | number | null;
  disabled?: boolean;
  error?: string;
}>();

const rawValue = ref('');
const formattedValue = ref('');

const formatCurrency = (value: string): string => {
  const floatValue = parseFloat(value || '0') / 100;
  return floatValue.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

const updateValue = (event: Event): void => {
  const input = event.target as HTMLInputElement;
  const numericValue = input.value.replace(/[^\d]/g, '');

  rawValue.value = numericValue;
  formattedValue.value = formatCurrency(numericValue);

  emit('update:modelValue', numericValue);
};

onMounted(() => {
  const initial = String(props.modelValue ?? '').replace(/[^\d]/g, '');

  rawValue.value = initial;
  formattedValue.value = formatCurrency(initial);

  if (initial !== props.modelValue) {
    emit('update:modelValue', initial);
  }
});

watch(
  () => props.modelValue,
  (newValue) => {
    const stringValue = String(newValue ?? '').replace(/[^\d]/g, '');
    rawValue.value = stringValue;
    formattedValue.value = formatCurrency(stringValue);
  },
  { immediate: true }
);
</script>

<template>
  <div class="flex flex-col gap-1 relative">
    <label v-if="label" class="text-font dark:text-font-dark font-semibold">{{ label }}</label>

    <div class="relative">
      <input
        type="text"
        :value="formattedValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :class="[
          'text-font dark:text-font-dark placeholder:text-disabled dark:placeholder:text-disabled-dark bg-transparent dark:bg-accent-dark border text-base w-full h-[52px] rounded-xl px-4 pr-12 focus:outline-none focus:ring-2 disabled:cursor-not-allowed',
          error ? 'border-danger focus:ring-danger' : 'border-neutral dark:border-neutral-dark focus:ring-primary dark:focus:ring-primary'
        ]"
        @input="updateValue"
        @keyup.enter="$emit('onKeyupEnter')"
      >
    </div>

    <span v-if="error" class="text-sm text-danger">{{ error }}</span>
  </div>
</template>
