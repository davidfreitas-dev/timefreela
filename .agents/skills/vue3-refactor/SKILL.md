---
name: vue3-refactor
description: Refactors Vue 3 views (pages, routed components) and components (.vue files) using Composition API with <script setup>, standard block ordering and clean code rules. Use when the user asks to refactor, clean up, reorganize, review or split a Vue view, page or component, or to extract composables from one.
---

# Vue 3 Refactor Skill (views and components)

## Goal
Refactor a Vue 3 view or component so it follows the current community standard (Composition API + `<script setup>`) and clean code principles, **without changing its behavior**.

## Instructions

1. **Read the target file fully** before proposing changes. Identify its responsibilities (routing, API calls, business rules, formatting, UI sections).
2. **Classify the target**:
   - **View**: lives in `src/views/` or `src/pages/`, is referenced by the router, or uses `useRoute`/`useRouter`, stores and composes several components.
   - **Component**: reusable UI piece, receives props and emits events.
   - If unclear, treat it as a component and say so in the report.
3. **Diagnose** using `references/clean-code-rules.md` (both cases) and `references/views.md` (views only). List the violations found (short bullets) before editing.
4. **Reorder the file** following `references/script-setup-order.md`:
   - Block order: `<script setup lang="ts">` → `<template>` → `<style scoped>`.
   - Script order: imports → props/emits/model → composables and stores → state → computed → watchers → functions → lifecycle → `defineExpose`.
5. **Refactor in small steps**, in this order (stop when clean, do not over-engineer):
   1. Move template logic into `computed`.
   2. Rename to intention-revealing names.
   3. Split large functions into small named ones.
   4. Extract cohesive logic into composables (`useXxx`), grouped by feature.
   5. Extract independent template sections into child components.
6. **Apply the role rules**:
   - **View** (see `references/views.md`): the only place that knows route, router and stores. Loads page data through a composable, reacts to route param changes, handles loading/error/empty, and passes plain props to children.
   - **Component**: receives props, emits events, knows nothing about API, route or store.
   - When a component under refactoring reads route/store/API directly, move that to its parent view or a composable.
7. **Type the boundaries**: props, emits, composable returns, route params and API responses.
8. **Clean up**: remove dead code, unused imports and `console.log`; add cleanup for watchers, listeners, timers and in-flight requests.
9. **Follow the examples**: `examples/component/` and `examples/view/` show the expected before/after.
10. **Report** at the end: target type, what changed, files created (composables/subcomponents) and behavior risks.

## Constraints
- Do NOT change behavior, public props, emitted events, route names/paths or guards unless the user asks.
- Do NOT mix refactoring with new features in the same change.
- Do NOT mutate props; use `defineModel()` (Vue 3.4+) for `v-model`.
- Do NOT create generic "helpers" composables; name them by intent (`useCheckout`, not `useHelpers`).
- Do NOT abstract prematurely: duplicate twice, abstract on the third occurrence.
- Do NOT use `watch` to derive state; use `computed`.
- Do NOT let child components access route, router or stores just to avoid passing props.
- Keep small files ordered by type; only extract composables when logic grows.
- If the component/view has no tests, suggest Vitest + Vue Test Utils before large refactors.
- Respect the project's existing conventions (lint config, folder structure, i18n, UI framework) when they conflict with this skill.
