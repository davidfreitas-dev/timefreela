<script setup lang="ts">
import { computed } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';

defineOptions({ inheritAttrs: false });

type ChipColor = 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
type ChipVariant = 'solid' | 'outline' | 'accent';
type ChipSize = 'sm' | 'md' | 'lg';

const props = withDefaults(defineProps<{
  label?: string;
  color?: ChipColor;
  variant?: ChipVariant;
  size?: ChipSize;
  closable?: boolean;
  disabled?: boolean;
}>(), {
  color: 'primary',
  variant: 'solid',
  size: 'md',
  closable: false,
  disabled: false,
});

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void;
  (e: 'close', event: MouseEvent): void;
}>();

const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 ease-in max-w-full select-none';

const sizeClasses = {
  sm: 'h-6 px-2.5 text-[11px] gap-1 rounded-full',
  md: 'h-7 px-3 text-xs gap-1.5 rounded-full',
  lg: 'h-8 px-4 text-sm gap-2 rounded-full',
};

const closeIconSizeClasses = {
  sm: 'w-3 h-3',
  md: 'w-3.5 h-3.5',
  lg: 'w-4 h-4',
};

const variantClasses = computed(() => {
  const { variant, color } = props;

  if (variant === 'solid') {
    return {
      'bg-primary text-white hover:bg-primary-hover': color === 'primary',
      'bg-disabled/30 dark:bg-disabled-dark/40 text-font dark:text-font-dark hover:bg-disabled/40 dark:hover:bg-disabled-dark/50': color === 'secondary',
      'bg-success text-white hover:bg-success-hover': color === 'success',
      'bg-warning text-white hover:bg-warning-hover': color === 'warning',
      'bg-danger text-white hover:bg-danger-hover': color === 'danger',
    };
  }

  if (variant === 'outline') {
    return {
      'bg-transparent border border-primary text-primary hover:bg-primary-accent dark:hover:bg-primary/10': color === 'primary',
      'bg-transparent border border-disabled text-secondary dark:border-disabled-dark dark:text-secondary-dark hover:bg-neutral dark:hover:bg-background-dark': color === 'secondary',
      'bg-transparent border border-success text-success hover:bg-success-accent dark:hover:bg-success/10': color === 'success',
      'bg-transparent border border-warning text-warning hover:bg-warning-accent dark:hover:bg-warning/10': color === 'warning',
      'bg-transparent border border-danger text-danger hover:bg-danger-accent dark:hover:bg-danger/10': color === 'danger',
    };
  }

  if (variant === 'accent') {
    return {
      'bg-primary-accent text-primary dark:bg-primary-accent-dark dark:text-primary-dark hover:bg-primary/10 dark:hover:bg-primary/30': color === 'primary',
      'bg-neutral text-secondary dark:bg-disabled-dark/40 dark:text-font-dark hover:bg-disabled dark:hover:bg-secondary/40': color === 'secondary',
      'bg-success-accent text-success dark:bg-success-accent-dark dark:text-success-dark hover:bg-success/10 dark:hover:bg-success/30': color === 'success',
      'bg-warning-accent text-warning dark:bg-warning-accent-dark dark:text-warning-dark hover:bg-warning/10 dark:hover:bg-warning/30': color === 'warning',
      'bg-danger-accent text-danger dark:bg-danger-accent-dark dark:text-danger-dark hover:bg-danger/10 dark:hover:bg-danger/30': color === 'danger',
    };
  }

  return {};
});

const handleClick = (e: MouseEvent) => {
  if (!props.disabled) {
    emit('click', e);
  }
};
</script>

<template>
  <div
    v-bind="$attrs"
    :class="[
      baseClasses,
      sizeClasses[size],
      variantClasses,
      disabled ? 'opacity-50 cursor-not-allowed' : ($attrs.onClick ? 'cursor-pointer' : 'cursor-default')
    ]"
    @click="handleClick"
  >
    <slot name="left-icon" />
    
    <span class="truncate">
      <slot>{{ label }}</slot>
    </span>

    <slot name="right-icon" />

    <button
      v-if="closable"
      type="button"
      :disabled="disabled"
      class="flex items-center justify-center rounded-full p-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 transition-opacity opacity-70 hover:opacity-100 cursor-pointer disabled:cursor-not-allowed disabled:hover:opacity-70"
      :class="{
        'focus-visible:ring-primary': color === 'primary',
        'focus-visible:ring-disabled': color === 'secondary',
        'focus-visible:ring-success': color === 'success',
        'focus-visible:ring-warning': color === 'warning',
        'focus-visible:ring-danger': color === 'danger',
        '-mr-1': true // Pull the icon slightly to the right to align better with padding
      }"
      aria-label="Remover"
      @click.stop="emit('close', $event)"
    >
      <AppIcon name="close" :class="closeIconSizeClasses[size]" />
    </button>
  </div>
</template>
