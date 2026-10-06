<script setup lang="ts">
import { ref, watch, toRefs } from 'vue';
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from '@headlessui/vue';
import { type Option } from '@/types';
import AppIcon from '@/components/ui/AppIcon.vue';

const props = defineProps<{
 options: Option[];
 modelValue: Option | null;
 label?: string;
 error?: string;
 disabled?: boolean;
}>();

const emit = defineEmits<{
 (e: 'update:modelValue', value: Option | null): void;
}>();

const { modelValue, error, disabled } = toRefs(props);

const selectedOption = ref<Option | null>(modelValue.value ?? null);

watch(modelValue, (newValue) => {
  selectedOption.value = newValue;
});

watch(selectedOption, (newValue) => {
  emit('update:modelValue', newValue);
});
</script>

<template>
  <div class="flex flex-col gap-2 relative w-full">
    <label v-if="props.label" class="text-font font-semibold dark:text-font-dark">
      {{ props.label }}
    </label>

    <Listbox v-slot="{ open }" v-model="selectedOption" :disabled="disabled">
      <div class="relative w-full">
        <ListboxButton
          :class="[
            'flex items-center gap-3 h-[44px] w-full px-4 py-2 bg-neutral dark:bg-neutral-dark rounded-lg text-[14px] text-left placeholder:text-secondary focus:outline-none focus:ring-1 disabled:cursor-not-allowed disabled:bg-disabled dark:disabled:bg-disabled-dark disabled:text-secondary dark:disabled:text-secondary-dark disabled:placeholder:text-secondary/60 dark:disabled:placeholder:text-secondary-dark/60',
            error
              ? 'border border-danger focus:ring-danger focus:border-danger'
              : 'border border-disabled dark:border-disabled-dark dark:text-font-dark dark:placeholder:text-secondary focus:ring-primary focus:border-primary'
          ]"
        >
          <span class="flex-1 truncate text-font dark:text-font-dark">
            {{ selectedOption?.label || 'Selecione uma opção' }}
          </span>
          <AppIcon
            name="keyboard_arrow_down"
            class="text-font dark:text-font-dark transform transition-transform duration-200"
            :class="{ 'rotate-180': open }"
          />
        </ListboxButton>

        <transition
          leave-active-class="transition duration-100 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <ListboxOptions
            class="absolute mt-1.5 max-h-60 w-full overflow-auto rounded-lg bg-neutral dark:bg-neutral-dark text-[14px] shadow-lg focus:outline-none border border-disabled dark:border-disabled-dark z-30 scrollbar"
          >
            <ListboxOption
              v-for="option in props.options"
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
                <span
                  :class="[
                    selected ? 'font-semibold' : 'font-normal',
                    'block truncate',
                  ]"
                >
                  {{ option.label }}
                </span>
                <span
                  v-if="selected"
                  class="absolute inset-y-0 left-0 flex items-center pl-3 text-primary"
                >
                  <AppIcon name="check" />
                </span>
              </li>
            </ListboxOption>
          </ListboxOptions>
        </transition>
      </div>
    </Listbox>

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
</style>
