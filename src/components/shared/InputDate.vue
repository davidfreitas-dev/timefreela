<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'onKeyupEnter'): void;
}>();

const props = defineProps<{
  label?: string;
  placeholder?: string;
  modelValue: string | number;
  disabled?: boolean;
  error?: string;
}>();

const MAX_DIGITS = 8;
const rawValue = ref('');
const formattedValue = ref('');

const formatDate = (value: string): string => {
  const cleanValue = value.replace(/[^\d]/g, '').slice(0, MAX_DIGITS);
  const day = cleanValue.slice(0, 2);
  const month = cleanValue.slice(2, 4);
  const year = cleanValue.slice(4, 8);
  return [day, month, year].filter(Boolean).join('/');
};

const updateFormattedValue = () => {
  formattedValue.value = formatDate(rawValue.value);
};

watch(
  () => props.modelValue,
  (newValue) => {
    rawValue.value = String(newValue).replace(/[^\d]/g, '').slice(0, MAX_DIGITS);
    updateFormattedValue();
    emit('update:modelValue', formattedValue.value);
  },
  { immediate: true }
);

onMounted(() => {
  rawValue.value = String(props.modelValue).replace(/[^\d]/g, '').slice(0, MAX_DIGITS);
  updateFormattedValue();
  emit('update:modelValue', formattedValue.value);
});

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const numericValue = target.value.replace(/[^\d]/g, '').slice(0, MAX_DIGITS);
  target.value = numericValue;
  rawValue.value = numericValue;
  formattedValue.value = formatDate(numericValue);
  emit('update:modelValue', formattedValue.value);
};

const hasError = computed(() => !!props.error);
</script>

<template>
  <div class="flex flex-col gap-1 relative">
    <label v-if="label" class="text-font font-semibold">{{ label }}</label>

    <div class="relative">
      <input
        type="text"
        :value="formattedValue"
        :placeholder="placeholder || 'dd/MM/yyyy'"
        :disabled="disabled"
        maxlength="10"
        :class="[
          'text-font placeholder:text-disabled bg-white border text-base w-full h-[52px] rounded-lg px-4 pr-12 focus:outline-none focus:ring-2 disabled:cursor-not-allowed',
          hasError ? 'border-danger focus:ring-danger' : 'border-neutral focus:ring-primary'
        ]"
        @input="handleInput"
        @keyup.enter="emit('onKeyupEnter')"
      >
    </div>

    <span v-if="error" class="text-sm text-danger">{{ error }}</span>
  </div>
</template>
