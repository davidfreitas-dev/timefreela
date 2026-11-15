<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot
} from '@headlessui/vue';
import AppIcon from '@/components/ui/AppIcon.vue';

const emit = defineEmits<{
  (e: 'onModalClose'): void;
}>();

const { title, align, size = 'lg' } = defineProps<{
  title: string;
  align?: 'top' | 'center' | 'bottom';
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}>();

const open = ref(false);

const openModal = () => {
  open.value = true;
};

const closeModal = () => {
  emit('onModalClose');
  open.value = false;
};

defineExpose({
  openModal,
  closeModal
});

const alignmentClass = computed(() => {
  if (align) {
    switch (align) {
    case 'top':
      return 'items-start';
    case 'bottom':
      return 'items-end';
    case 'center':
      return 'items-center';
    }
  }

  // Padrão automático: 'sm' centralizado; 'md', 'lg', 'xl', '2xl' alinhados ao topo
  return size === 'sm' ? 'items-center' : 'items-start';
});

const sizeClass = computed(() => {
  switch (size) {
  case 'sm':
    return 'w-[95%] sm:max-w-md';
  case 'md':
    return 'w-[95%] sm:max-w-lg';
  case 'lg':
    return 'w-[95%] sm:max-w-3xl';
  case 'xl':
    return 'w-[95%] sm:max-w-5xl';
  case '2xl':
    return 'w-[95%] sm:max-w-7xl';
  default:
    return 'w-[95%] sm:max-w-3xl';
  }
});

const titleClass = computed(() => {
  if (size === 'sm') {
    return 'text-lg font-semibold leading-6 text-font dark:text-font-dark';
  }
  if (size === 'md') {
    return 'text-xl font-semibold leading-6 text-font dark:text-font-dark';
  }
  return 'text-2xl font-semibold leading-6 text-font dark:text-font-dark';
});
</script>

<template>
  <TransitionRoot
    appear
    :show="open"
    as="template"
  >
    <Dialog
      as="div"
      class="relative z-100"
      @close="closeModal"
    >
      <TransitionChild
        as="template"
        enter="duration-300 ease-out"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="duration-200 ease-in"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black/50 dark:bg-black/80" />
      </TransitionChild>

      <div class="fixed inset-0 z-100 overflow-y-auto">
        <div
          class="flex min-h-full justify-center p-4 text-center sm:p-0"
          :class="alignmentClass"
        >
          <TransitionChild
            as="template"
            enter="ease-out duration-300"
            enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enter-to="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leave-from="opacity-100 translate-y-0 sm:scale-100"
            leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <DialogPanel
              class="relative transform overflow-hidden rounded-2xl bg-white dark:bg-accent-dark text-left shadow-xl transition-all my-4 sm:my-8 flex flex-col max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-4rem)]"
              :class="sizeClass"
            >
              <!-- Cabeçalho fixo no topo -->
              <div
                class="modal-header flex justify-between items-center shrink-0 border-b border-neutral/50 dark:border-neutral-dark/50"
                :class="size === 'sm' ? 'px-5 py-4' : 'px-6 py-5'"
              >
                <DialogTitle
                  as="h3"
                  :class="titleClass"
                >
                  {{ title }}
                </DialogTitle>
                
                <button
                  type="button"
                  class="text-secondary dark:text-secondary-dark bg-transparent hover:text-font dark:hover:text-font-dark rounded-lg text-sm p-1.5 ml-auto inline-flex items-center outline-none cursor-pointer transition-colors"
                  @click="closeModal"
                >
                  <AppIcon name="close" class="text-xl" />
                  <span class="sr-only">Close modal</span>
                </button>
              </div>

              <!-- Corpo com rolagem independente -->
              <div
                class="modal-body flex-1 min-h-0 overflow-y-auto overflow-x-hidden"
                :class="[size === 'sm' ? 'p-5' : 'p-6', $slots.footer ? 'pb-0' : '']"
              >
                <slot />
              </div>

              <!-- Rodapé opcional via slot #footer -->
              <div
                v-if="$slots.footer"
                class="modal-footer shrink-0 border-t border-neutral/50 dark:border-neutral-dark/50 bg-white dark:bg-accent-dark"
                :class="size === 'sm' ? 'px-5 py-3' : 'px-6 py-4'"
              >
                <slot name="footer" />
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<style scoped>
.modal-body {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE e Edge */
  -webkit-overflow-scrolling: touch;
}

.modal-body::-webkit-scrollbar {
  display: none; /* Chrome, Safari e Opera */
  width: 0;
  height: 0;
}
</style>
