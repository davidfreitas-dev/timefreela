# `<script setup>` organization order

## File blocks
```vue
<script setup lang="ts">
</script>

<template>
</template>

<style scoped>
</style>
```

## Order inside `<script setup>`
1. Imports (external libs first, then internal: components, types)
2. `defineProps`, `defineEmits`, `defineModel`, `defineOptions`
3. Composables and stores (`useRouter`, `useRoute`, `useXxxStore`, `useI18n`)
4. Reactive state (`ref`, `reactive`)
5. `computed`
6. Watchers (`watch`, `watchEffect`)
7. Functions (handlers, actions)
8. Lifecycle hooks (`onMounted`, `onUnmounted`)
9. `defineExpose` (only if really needed)

## Growing components
- Small component: keep the order above (grouped by type).
- Large component: group by **feature** using composables.

```ts
const { search, filtered } = useProductFilter(store.items)
const { loading, load } = useProductLoader(props.categoryId)
```

## Other conventions
- Use `lang="ts"` and type props via generics: `defineProps<{ ... }>()`.
- Use `defineModel()` instead of manual `modelValue` + `update:modelValue`.
- Reactive props destructuring is available in Vue 3.5+ (often removes `withDefaults`).
- Naming: components in PascalCase, composables prefixed with `use`, handlers with `handle`/`on`.
- Events: Always use kebab-case for emitted events in templates (e.g., `@handle-change`).
- Global state in Pinia; reusable local state in composables.
