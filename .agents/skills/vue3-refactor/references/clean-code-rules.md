# Clean code checklist for Vue 3 components

## 1. Single responsibility
Signs of too much: > ~200-300 lines, API + business rules + formatting + UI mixed, template with independent sections.
Fix: split into child components and composables.

## 2. View orchestrates, component presents
- Views: wire stores, routes and composables; compose smaller components.
- UI components: props in, events out; no direct `axios`, router or store access.

## 3. Logic out of the template
Rule of thumb: if an expression takes more than a second to understand, make it a `computed`.
```vue
<!-- bad -->
<span v-if="user && user.orders.filter(o => o.status === 'paid').length > 0">
<!-- good -->
<span v-if="hasPaidOrders">
```

## 4. Composables by feature
- Intent-revealing names (`useCheckout`, `usePagination`).
- Return only what the consumer needs.
- No dependency on the calling component's internals.

## 5. Naming
- Handlers: `handleSubmit`, `onSelectItem`.
- Booleans: `isLoading`, `hasError`, `canSubmit`.
- Events: use kebab-case for events emitted and listened to in templates (e.g., `@handle-change`).
- No generic names (`data`, `item`, `temp`, `flag`) or abbreviations.
- Functions use verbs; computed use nouns/states.

## 6. Small functions, one abstraction level
The main function reads like a script:
```ts
async function submit() {
  if (!validate()) return
  const payload = buildPayload()
  await save(payload)
  notifySuccess()
}
```

## 7. Props down, events up
- Never mutate props; use `defineModel()` for `v-model`.
- Avoid deep prop drilling: use `provide/inject` or Pinia when justified.
- Avoid calling child methods via `ref` (exception: `defineExpose` in punctual cases).

## 8. Explicit types at boundaries
Props, emits, composable returns and API responses.

## 9. Duplication with judgment
Duplicate twice, abstract on the third. A premature "generic" component full of flags is worse than duplication.

## 10. Loading, error and empty states
Never implement only the happy path. Prefer a reusable request composable.

## 11. Side-effect cleanup
- Every `watch`, listener and timer needs cleanup (`onUnmounted`, `onWatcherCleanup`).
- Prefer `computed` over `watch` for derived values.
- Avoid `watch` that only syncs state with other state.

## 12. Dead code and comments
Remove unused refs/imports and `console.log`. Comments explain *why*, not *what*; if you need to explain *what*, rename.

## Safe refactoring workflow
1. Cover current behavior with tests (Vitest + Vue Test Utils).
2. Small steps: computed → function → composable → child component.
3. Run lint and type-check each step (`vue-tsc`, ESLint).
4. Never mix refactoring and behavior changes in the same commit.
