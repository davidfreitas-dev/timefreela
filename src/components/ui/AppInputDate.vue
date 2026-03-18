<script setup lang="ts">
import { computed } from 'vue';
import { VueDatePicker } from '@vuepic/vue-datepicker';
import { useDark } from '@vueuse/core';
import { ptBR } from 'date-fns/locale';
import dayjs from '@/lib/dayjs';
import '@vuepic/vue-datepicker/dist/main.css';

interface TimeValue {
  hours: number;
  minutes: number;
  seconds?: number;
}

const props = withDefaults(defineProps<{
  label?: string;
  placeholder?: string;
  modelValue: Date | Date[] | null;
  disabled?: boolean;
  error?: string;
  mode?: 'date' | 'range' | 'time';
}>(), {
  mode: 'date',
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: Date | Date[] | null): void;
  (e: 'onKeyupEnter'): void;
  (e: 'blur'): void;
}>();

const isDark = useDark();
const hasError = computed(() => !!props.error);
const formatStr = computed(() => props.mode === 'time' ? 'HH:mm' : 'DD/MM/YYYY');

const isTimeValue = (val: unknown): val is TimeValue => 
  !!val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date) && 'hours' in val;

const toFullDate = (time: TimeValue): Date => {
  const base = props.modelValue instanceof Date ? props.modelValue : new Date();
  const d = new Date(base);
  d.setHours(time.hours, time.minutes, time.seconds ?? 0, 0);
  return d;
};

const dateValue = computed({
  get: () => {
    if (props.mode === 'time' && props.modelValue instanceof Date) {
      return {
        hours: props.modelValue.getHours(),
        minutes: props.modelValue.getMinutes(),
        seconds: props.modelValue.getSeconds(),
      };
    }
    return props.modelValue;
  },
  set: (val) => {
    if (!val) return emit('update:modelValue', null);

    if (isTimeValue(val)) {
      return emit('update:modelValue', toFullDate(val));
    }

    if (typeof val === 'string') {
      const parsed = dayjs(val);
      if (parsed.isValid()) emit('update:modelValue', parsed.toDate());
      return;
    }

    emit('update:modelValue', val as Date | Date[] | null);
  },
});

const format = (date: Date | Date[] | TimeValue) => {
  if (!date) return '';

  const formatSingle = (d: Date | TimeValue) => {
    const dateObj = isTimeValue(d) ? toFullDate(d) : (d as Date);
    const parsed = dayjs(dateObj);
    return parsed.isValid() ? parsed.format(formatStr.value) : '';
  };

  if (Array.isArray(date)) {
    return date.map(formatSingle).filter(Boolean).join(' - ');
  }
  
  return formatSingle(date);
};
</script>

<template>
  <div class="flex flex-col gap-2 relative w-full" :class="{ 'has-error': hasError }">
    <label v-if="label" class="text-font dark:text-font-dark font-semibold">{{ label }}</label>

    <VueDatePicker
      v-model="dateValue"
      :placeholder="placeholder || formatStr"
      :disabled="disabled"
      :dark="isDark"
      :locale="ptBR"
      :time-picker="mode === 'time'"
      :range="mode === 'range'"
      auto-apply
      :is-24="true"
      :format="format"
      teleport="body"
      hide-input-icon
      @blur="emit('blur')"
      @keydown.enter="emit('onKeyupEnter')"
    />

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
