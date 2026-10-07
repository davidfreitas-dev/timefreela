<script setup lang="ts">
import { ref, computed } from 'vue';
import { type PropType } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import { formatBrazilianPhone, applyCurrencyMask, parseCurrency, formatCentsToCurrency } from '@/utils/mask';

const emit = defineEmits<{
  (event: 'update:modelValue', value: string | number | null): void;
  (event: 'onKeyupEnter'): void;
  (event: 'blur', e: FocusEvent): void;
}>();

interface ValidationField {
  $error: boolean;
  $errors: Array<{ $message: string }>;
  $touch: () => void;
}

const props = defineProps({
  disabled: { 
    type: Boolean, 
    default: false 
  },
  type: { 
    type: String, 
    default: '' 
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
    type: [String, Number] as PropType<string | number | null>,
    default: null
  },
  error: { 
    type: String, 
    default: '' 
  },
  maskType: {
    type: String as PropType<'phone' | 'currency' | 'none'>,
    default: 'none'
  },
  validation: {
    type: Object as PropType<ValidationField | null>,
    default: null
  }
});

const showPassword = ref(false);

const inputType = computed(() =>
  props.type === 'password' ? (showPassword.value ? 'text' : 'password') : props.type
);

const displayError = computed(() => {
  if (props.validation) {
    if (!props.validation.$error) return '';
    if (props.validation.$errors && props.validation.$errors.length > 0 && props.validation.$errors[0].$message) {
      return props.validation.$errors[0].$message;
    }
    return props.error;
  }
  return props.error;
});

const updateValue = (event: Event) => {
  const input = event.target as HTMLInputElement;
  let val = input.value;
  
  if (props.maskType === 'phone') {
    val = formatBrazilianPhone(val);
    input.value = val;
    emit('update:modelValue', val);
  } else if (props.maskType === 'currency') {
    val = applyCurrencyMask(val);
    input.value = val;
    emit('update:modelValue', parseCurrency(val));
  } else {
    emit('update:modelValue', val);
  }
};

const handleBlur = (event: FocusEvent) => {
  if (props.validation && typeof props.validation.$touch === 'function') {
    props.validation.$touch();
  }
  emit('blur', event);
};

const displayValue = computed(() => {
  if (props.maskType === 'phone' && props.modelValue) {
    return formatBrazilianPhone(String(props.modelValue));
  }
  if (props.maskType === 'currency') {
    return formatCentsToCurrency(props.modelValue === null || props.modelValue === '' ? 0 : props.modelValue);
  }
  return props.modelValue;
});
</script>

<template>
  <div class="flex flex-col gap-2 relative">
    <label v-if="props.label" class="text-font dark:text-font-dark font-semibold">{{ props.label }}</label>

    <div class="relative">
      <input
        :type="inputType"
        :value="displayValue"
        :placeholder="props.placeholder"
        :disabled="props.disabled"
        :class="[
          'text-[14px] text-font dark:text-font-dark bg-accent dark:bg-neutral-dark w-full h-11 rounded-xl px-4 focus:outline-none focus:ring-1 transition-all duration-200 disabled:cursor-not-allowed disabled:bg-disabled/60 dark:disabled:bg-disabled-dark disabled:text-secondary dark:disabled:text-secondary-dark disabled:placeholder:text-secondary/60 dark:disabled:placeholder:text-secondary-dark/60',
          displayError
            ? 'border border-danger focus:ring-danger focus:border-danger'
            : 'border border-neutral dark:border-disabled-dark focus:ring-primary focus:border-primary'
        ]"
        @input="updateValue"
        @keyup.enter="$emit('onKeyupEnter')"
        @blur="handleBlur"
      >

      <button
        v-if="props.type === 'password'"
        type="button"
        class="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 text-disabled dark:text-secondary-dark hover:text-secondary dark:hover:text-font-dark cursor-pointer"
        @click="showPassword = !showPassword"
      >
        <AppIcon :name="showPassword ? 'visibility_off' : 'visibility'" />
      </button>
    </div>

    <span v-if="displayError" class="text-[14px] text-danger">{{ displayError }}</span>
  </div>
</template>
