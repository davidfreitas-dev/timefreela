<script setup lang="ts">
import { computed } from 'vue';
import { VueDatePicker } from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import { useDark } from '@vueuse/core';
import { ptBR } from 'date-fns/locale';

type InputMode = 'date' | 'datetime' | 'time';

const emit = defineEmits<{
  (e: 'update:modelValue', value: Date | string | null): void;
  (e: 'onKeyupEnter'): void;
  (e: 'blur'): void;
}>();

const props = withDefaults(defineProps<{
  label?: string;
  placeholder?: string;
  modelValue: Date | string | null;
  disabled?: boolean;
  error?: string;
  timePicker?: boolean;
  mode?: InputMode;
}>(), {
  mode: 'date'
});

const isDark = useDark();

const hasError = computed(() => !!props.error);

const inputMode = computed<InputMode>(() => {
  if (props.mode) {
    return props.mode;
  }
  return props.timePicker ? 'datetime' : 'date';
});

const isTimePicker = computed(() => inputMode.value === 'time');
const isDatePicker = computed(() => inputMode.value === 'date' || inputMode.value === 'datetime');

const dateValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value as Date | null),
});

const format = computed(() => {
  if (inputMode.value === 'datetime') return 'dd/MM/yyyy HH:mm';
  if (inputMode.value === 'time') return 'HH:mm';
  return 'dd/MM/yyyy';
});

const handleBlur = () => {
  emit('blur');
};

const handleEnter = () => {
  emit('onKeyupEnter');
};
</script>

<template>
  <div class="flex flex-col gap-2 relative w-full" :class="{ 'has-error': hasError }">
    <label v-if="label" class="text-font dark:text-font-dark font-semibold">{{ label }}</label>

    <div class="relative">
      <VueDatePicker
        v-model="dateValue"
        :placeholder="placeholder || format"
        :disabled="disabled"
        :dark="isDark"
        :format-locale="ptBR"
        cancel-text="Cancelar"
        select-text="Selecionar"
        now-button-label="Agora"
        :format="format"
        :auto-apply="!isDatePicker"
        :time-picker="isTimePicker"
        :enable-time-picker="inputMode === 'datetime'"
        hide-input-icon
        @blur="handleBlur"
        @keydown.enter="handleEnter"
      />
    </div>

    <span v-if="error" class="text-sm text-danger">{{ error }}</span>
  </div>
</template>

<style scoped>
/* Configurações globais do componente */
:deep(.dp__main) {
  font-family: inherit;
  --dp-font-size: 1rem;
  --dp-border-radius: 12px; /* rounded-xl */
  --dp-input-padding: 1rem;
  --dp-input-height: 52px;
}

/* Variáveis para Tema Claro */
:deep(.dp__theme_light) {
  --dp-background-color: color-mix(in srgb, var(--color-accent), transparent 30%);
  --dp-text-color: var(--color-font);
  --dp-hover-color: var(--color-accent);
  --dp-primary-color: var(--color-primary);
  --dp-border-color: transparent;
  --dp-border-color-focus: var(--color-primary);
  --dp-menu-border-color: var(--color-neutral);
}

/* Variáveis para Tema Escuro */
:deep(.dp__theme_dark) {
  --dp-background-color: color-mix(in srgb, var(--color-background-dark), transparent 30%);
  --dp-text-color: var(--color-font-dark);
  --dp-hover-color: var(--color-accent-dark);
  --dp-primary-color: var(--color-primary-dark);
  --dp-border-color: transparent;
  --dp-border-color-focus: var(--color-primary-dark);
  --dp-menu-border-color: var(--color-neutral-dark);
}

/* Ajustes finos no input para bater 100% com o layout */
:deep(.dp__input) {
  border: none !important;
  height: 52px !important;
  transition: all 0.2s ease-in-out;
}

:deep(.dp__input:focus),
:deep(.dp__input_focus) {
  box-shadow: 0 0 0 2px var(--dp-border-color-focus) !important;
  outline: none;
}

/* Estado de Erro */
.has-error :deep(.dp__input) {
  border: 1px solid var(--color-danger) !important;
}

.has-error :deep(.dp__input:focus),
.has-error :deep(.dp__input_focus) {
  box-shadow: 0 0 0 2px var(--color-danger) !important;
}

/* Esconder o ícone de calendário */
:deep(.dp__input_icon) {
  display: none !important;
}

:deep(.dp__input) {
  padding-inline-start: 1rem !important;
}

/* Placeholder */
:deep(.dp__input::placeholder) {
  color: var(--color-disabled);
  opacity: 1;
}

:deep(.dp__theme_dark .dp__input::placeholder) {
  color: var(--color-disabled-dark);
}

/* Estilização do Menu (Dropdown) */
:deep(.dp__menu) {
  border: 1px solid var(--dp-menu-border-color) !important;
  background-color: var(--color-background) !important;
}

:deep(.dp__theme_dark .dp__menu) {
  background-color: var(--color-background-dark) !important;
}

/* Ajuste da seta do menu */
:deep(.dp__arrow_top), :deep(.dp__arrow_bottom) {
  border: 1px solid var(--dp-menu-border-color);
  background-color: var(--color-background) !important;
}

:deep(.dp__theme_dark .dp__arrow_top), 
:deep(.dp__theme_dark .dp__arrow_bottom) {
  background-color: var(--color-background-dark) !important;
}
</style>
