<script setup lang="ts">
import { ref, watch, toRefs } from 'vue';
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from '@headlessui/vue';
import { type Option } from '@/types/option';

const props = defineProps<{
  options: Option[];
  modelValue: Option | null;
  label?: string;
  error?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: Option | null): void;
}>();

const { modelValue, error } = toRefs(props);

const selectedOption = ref<Option | null>(modelValue.value ?? null);

watch(modelValue, (newValue) => {
  selectedOption.value = newValue;
});

watch(selectedOption, (newValue) => {
  emit('update:modelValue', newValue);
});
</script>

<template>
  <div class="flex flex-col gap-1 relative w-full">
    <label v-if="props.label" class="text-font font-semibold">
      {{ props.label }}
    </label>

    <Listbox v-model="selectedOption">
      <div class="relative w-full">
        <ListboxButton
          :class="[
            'flex items-center gap-3 h-[52px] w-full p-4 bg-white border border-neutral rounded-xl text-base text-left placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-primary',
            error
              ? 'border border-danger focus:ring-danger'
              : 'border border-disabled focus:ring-primary text-font'
          ]"
        >
          <span class="flex-1 truncate text-font">
            {{ selectedOption?.label || 'Selecione uma opção' }}
          </span>
          <span class="material-icons-outlined">keyboard_arrow_down</span>
        </ListboxButton>

        <transition
          leave-active-class="transition duration-100 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <ListboxOptions
            class="absolute mt-1.5 max-h-60 w-full overflow-auto rounded-xl bg-white text-base shadow-lg focus:outline-none border border-neutral z-10"
          >
            <ListboxOption
              v-for="option in props.options"
              :key="option.value"
              v-slot="{ active, selected }"
              :value="option"
              as="template"
            >
              <li
                :class="[
                  active ? 'bg-primary-accent text-primary' : 'text-font',
                  'relative cursor-pointer select-none py-4 pl-10 pr-4',
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
                  <span class="material-icons-outlined">check</span>
                </span>
              </li>
            </ListboxOption>
          </ListboxOptions>
        </transition>
      </div>
    </Listbox>

    <span v-if="error" class="text-sm text-danger">{{ error }}</span>
  </div>
</template>
