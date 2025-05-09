<script setup lang="ts">
import { computed } from 'vue';
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption
} from '@headlessui/vue';

type OptionType<T = string | number> = {
  [key: string]: T;
};

const props = defineProps<{
  modelValue: OptionType | null
  options: OptionType[]
  label?: string
  placeholder?: string
  labelKey?: string
  error?: string
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: OptionType | null): void
}>();

const modelValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

const labelKey = computed(() => props.labelKey ?? 'name');
</script>

<template>
  <div class="flex flex-col gap-1 relative">
    <label v-if="label" class="text-font font-semibold">{{ label }}</label>

    <Listbox v-model="modelValue">
      <div class="relative">
        <ListboxButton
          :class="[
            'relative w-full h-[52px] text-left cursor-default rounded-md px-4 text-base text-font bg-white focus:outline-none ring-offset-1 border focus:ring-2',
            error ? 'border-danger focus:ring-danger' : 'border-neutral focus:ring-primary'
          ]"
        >
          <span class="block truncate" :class="{ 'text-neutral-400': !modelValue }">
            {{ modelValue?.[labelKey] ?? placeholder }}
          </span>
          <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <span class="material-icons-outlined">
              keyboard_arrow_down
            </span>
          </span>
        </ListboxButton>

        <transition
          leave-active-class="transition duration-100 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <ListboxOptions
            class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none"
          >
            <ListboxOption
              v-for="item in options"
              :key="item[labelKey]"
              v-slot="{ active, selected }"
              :value="item"
            >
              <li
                :class="[
                  active ? 'bg-primary-accent text-primary' : 'text-font',
                  'relative cursor-default select-none py-2 pl-10 pr-4'
                ]"
              >
                <span :class="[selected ? 'font-medium' : 'font-normal', 'block truncate']">
                  {{ item[labelKey] }}
                </span>
                <span
                  v-if="selected"
                  class="absolute inset-y-0 left-0 flex items-center pl-3 text-primary"
                >
                  <span class="material-icons-outlined">
                    check
                  </span>
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
