<script setup lang="ts">
import { ref, watch, toRefs, computed } from 'vue';
import {
  Combobox,
  ComboboxInput,
  ComboboxButton,
  ComboboxOptions,
  ComboboxOption,
} from '@headlessui/vue';
import { type Option } from '@/types';
import AppIcon from '@/components/ui/AppIcon.vue';
import AppSpinnerLoader from '@/components/ui/AppSpinnerLoader.vue';

const props = withDefaults(defineProps<{
 options: Option[];
 modelValue: Option | null;
 label?: string;
 error?: string;
 placeholder?: string;
 clearable?: boolean;
 loading?: boolean;
 inputClass?: string;
 disabled?: boolean;
}>(), {
  label: '',
  error: '',
  placeholder: 'Selecione uma opção',
  clearable: false,
  loading: false,
  inputClass: '',
  disabled: false
});

const emit = defineEmits<{
 (e: 'update:modelValue', value: Option | null): void;
}>();

const { modelValue } = toRefs(props);

const selectedOption = ref<Option | null>(modelValue.value ?? null);
const query = ref('');

const filteredOptions = computed(() => {
  if (!query.value) return props.options;
  return props.options.filter((option) =>
    option.label.toLowerCase().includes(query.value.toLowerCase())
  );
});

watch(modelValue, (newValue) => {
  if (newValue?.value !== selectedOption.value?.value) {
    selectedOption.value = newValue;
  }
});

watch(selectedOption, (newValue) => {
  if (newValue?.value !== modelValue.value?.value) {
    emit('update:modelValue', newValue);
  }
});

const clearSelection = () => {
  selectedOption.value = null;
  query.value = '';
};
</script>

<template>
  <div class="flex flex-col gap-2 relative w-full">
    <label v-if="props.label" class="text-font font-semibold dark:text-font-dark">
      {{ props.label }}
    </label>

    <Combobox
      v-slot="{ open }"
      v-model="selectedOption"
      :disabled="disabled"
      @close="query = ''"
    >
      <div class="relative w-full" :class="{ 'z-50': open }">
        <div class="relative flex items-center w-full">
          <ComboboxInput
            :class="[
              props.inputClass || 'flex items-center gap-3 h-11 w-full pl-4 pr-10 py-2 bg-neutral dark:bg-neutral-dark text-font dark:text-font-dark rounded-xl text-[14px] text-left placeholder:text-secondary focus:outline-none focus:ring-1 transition-all duration-200 disabled:cursor-not-allowed disabled:bg-disabled dark:disabled:bg-disabled-dark disabled:text-secondary dark:disabled:text-secondary-dark disabled:placeholder:text-secondary/60 dark:disabled:placeholder:text-secondary-dark/60',
              error
                ? 'border border-danger focus:ring-danger focus:border-danger'
                : (props.inputClass ? '' : 'border border-disabled dark:border-disabled-dark dark:placeholder:text-secondary focus:ring-primary focus:border-primary'),
              selectedOption && !open && $slots.selected ? 'text-transparent! dark:text-transparent! select-none' : ''
            ]"
            :display-value="(opt) => (opt as Option)?.label || ''"
            :placeholder="placeholder"
            @change="query = $event.target.value"
          />

          <!-- Rich selection overlay when closed -->
          <div
            v-if="selectedOption && !open && $slots.selected"
            class="absolute inset-y-0 left-0 flex items-center pl-4 pr-16 pointer-events-none w-full truncate text-font dark:text-font-dark"
          >
            <slot name="selected" :option="selectedOption" />
          </div>

          <div class="absolute inset-y-0 right-0 flex items-center pr-3 gap-1 z-10">
            <!-- Spinner -->
            <AppSpinnerLoader
              v-if="loading"
              size="sm"
              text=""
              class="shrink-0 mr-1"
            />

            <!-- Clear Button -->
            <button
              v-if="clearable && selectedOption && !loading"
              type="button"
              class="text-disabled hover:text-secondary dark:hover:text-disabled cursor-pointer p-1 rounded-full flex items-center justify-center"
              @click.stop="clearSelection"
            >
              <AppIcon name="close" class="w-4 h-4" />
            </button>
            <ComboboxButton v-if="!loading" class="flex items-center p-1 cursor-pointer">
              <AppIcon
                name="keyboard_arrow_down"
                class="text-font dark:text-font-dark transform transition-transform duration-200"
                :class="{ 'rotate-180': open }"
              />
            </ComboboxButton>
          </div>
        </div>

        <transition
          leave-active-class="transition duration-100 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <ComboboxOptions
            class="absolute mt-1.5 max-h-60 w-full overflow-auto rounded-xl bg-neutral dark:bg-neutral-dark text-[14px] shadow-lg focus:outline-none border border-disabled dark:border-disabled-dark z-50 scrollbar"
          >
            <div
              v-if="filteredOptions.length === 0 && query !== ''"
              class="relative cursor select-none py-4 px-4 text-secondary dark:text-secondary-dark"
            >
              Nenhuma opção encontrada.
            </div>

            <ComboboxOption
              v-for="option in filteredOptions"
              :key="String(option.value)"
              v-slot="{ active, selected }"
              :value="option"
              as="template"
            >
              <li
                :class="[
                  active ? 'bg-white dark:bg-disabled-dark text-font dark:text-white' : 'text-font dark:text-font-dark',
                  'relative cursor-pointer select-none py-4 pl-12 pr-4 transition-colors duration-150',
                ]"
              >
                <slot
                  name="option"
                  :option="option"
                  :active="active"
                  :selected="selected"
                >
                  <span
                    :class="[
                      selected ? 'font-semibold' : 'font-normal',
                      'block truncate',
                    ]"
                  >
                    {{ option.label }}
                  </span>
                </slot>
                <span
                  v-if="selected"
                  class="absolute inset-y-0 left-0 flex items-center pl-3 text-primary"
                >
                  <AppIcon name="check" />
                </span>
              </li>
            </ComboboxOption>
          </ComboboxOptions>
        </transition>
      </div>
    </Combobox>

    <span v-if="error" class="text-[14px] text-danger">{{ error }}</span>
  </div>
</template>

<style scoped>
.scrollbar {
  scrollbar-width: thin;
  scrollbar-color: var(--color-gray-300) transparent;
}

.dark .scrollbar {
  scrollbar-color: var(--color-gray-500) transparent;
}

.scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
  background-color: transparent;
}

.scrollbar::-webkit-scrollbar-thumb {
  background-color: var(--color-gray-300);
  border-radius: 4px;
}

.dark .scrollbar::-webkit-scrollbar-thumb {
  background-color: var(--color-gray-500);
}

.scrollbar::-webkit-scrollbar-track {
  background-color: transparent;
}
</style>
