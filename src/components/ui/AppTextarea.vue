<script setup lang="ts">
import { type PropType } from 'vue';

const emit = defineEmits<{
 (event: 'update:modelValue', value: string | number): void;
 (event: 'onKeyupEnter'): void;
 (event: 'blur', e: FocusEvent): void;
}>();

const { disabled, label, placeholder, modelValue, error } = defineProps({
  disabled: {
    type: Boolean,
    default: false
  },
  label: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: ''
  },
  modelValue: {
    type: [String, Number] as PropType<string | number>,
    default: null
  },
  error: {
    type: String,
    default: ''
  }
});

const updateValue = (event: Event) => {
  const textarea = event.target as HTMLTextAreaElement;
  emit('update:modelValue', textarea.value);
};
</script>

<template>
  <div class="flex flex-col gap-2 relative">
    <label v-if="label" class="text-font dark:text-font-dark font-semibold">{{ label }}</label>

    <textarea
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      rows="4"
      :class="[
        'text-font dark:text-font-dark bg-neutral dark:bg-neutral-dark text-[14px] w-full rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-1 disabled:cursor-not-allowed disabled:bg-disabled dark:disabled:bg-disabled-dark disabled:text-secondary dark:disabled:text-secondary-dark disabled:placeholder:text-secondary/60 dark:disabled:placeholder:text-secondary-dark/60',
        error
          ? 'border border-danger focus:ring-danger focus:border-danger'
          : 'border border-disabled dark:border-disabled-dark focus:ring-primary focus:border-primary'
      ]"
      @input="updateValue"
      @keyup.enter="$emit('onKeyupEnter')"
      @blur="$emit('blur', $event)"
    />

    <span v-if="error" class="text-[14px] text-danger">{{ error }}</span>
  </div>
</template>
