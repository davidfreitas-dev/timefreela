---
name: developer-guidelines
trigger: always_on
---

# Project: Developer Guidelines

This document consolidates the guidelines for the TimeFreela project ecosystem:
- **Frontend** — Vue 3 + Vite + Tailwind CSS v4 + TypeScript
- **Backend/Services** — Firebase (Firestore + Authentication)

---

## Table of Contents

1. [Critical Rules](#1-critical-rules-)
2. [Architecture & Code Structure](#2-architecture--code-structure)
3. [Technologies Used](#3-technologies-used)
4. [Code Quality Standards](#4-code-quality-standards)
5. [Security & Authentication](#5-security--authentication)
6. [Commands Reference](#6-commands-reference)
7. [Quick Reference](#7-quick-reference)

---

## 1. Critical Rules ⚠️

### Rule #1: No Git Operations
**NEVER** use shell commands like `git add` or `git commit`. All Git operations must be done manually by the user. The assistant should only create, modify, or delete files as requested.

### Rule #2: No Hardcoded Credentials
- Never hardcode credentials, API keys, secrets.
- Always use environment variables and `.env` files for sensitive data.
- Always ensure newly created sensitive files are immediately added to `.gitignore`.

---

## 2. Architecture & Code Structure

The project follows a modular pattern using Vue 3 Composition API.

| Directory | Responsibility |
|---|---|
| `src/components/` | Reusable Vue components (e.g., UI elements, Timer Widget) |
| `src/views/` | Page components representing complete views or screens |
| `src/stores/` | Pinia state management modules |
| `src/services/` | Firebase and external API interaction logic |
| `src/composables/` | Reusable Vue Composition API functions |
| `src/types/` | TypeScript interfaces and types |
| `src/router/` | Vue Router definitions |

**Design Principles:**
- **Composition API Only**: ALWAYS use Vue 3 Composition API with `<script setup lang="ts">` syntax. Avoid Options API.
- **Modularity**: Extract reusable logic into composables (`src/composables`) and global state into stores (`src/stores`).
- **Separation of Concerns**: Keep business logic out of components when possible, relying on stores and services.
- **Detailed Architecture**: The frontend code quality rules, component design system, naming conventions, and architecture are completely maintained in the `@senior-frontend-architect` and `@vue3-refactor` skills. Delegate architectural and refactoring frontend tasks to these skills.

---

## 3. Technologies Used

- **Framework**: Vue 3 (Composition API)
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4
- **State Management**: Pinia (with `pinia-plugin-persistedstate`)
- **Routing**: Vue Router
- **Database/Auth**: Firebase (Firestore, Authentication)
- **Other Key Libraries**:
  - `chart.js` / `vue-chartjs` for reports
  - `@vuelidate/core` for form validation
  - `@vueuse/core` for utility composables
  - `dayjs` for date formatting
  - `jspdf` for PDF generation
  - `@headlessui/vue` for accessible UI components

---

## 4. Code Quality Standards

### Code Style
- Follow strongly typed TypeScript practices. Always define interfaces/types for data models (especially for Firestore documents).
- Naming Conventions:
  - CamelCase for variables, functions, and composables (e.g., `useTimer`).
  - PascalCase for components and types (e.g., `TimerWidget.vue`, `Project`).
- Styling: Use Tailwind utility classes directly in the template.

### Development Guidelines
- Always run type-checking (`npm run build` or `npx vue-tsc -b`) to verify changes if you perform validations.
- Keep components small and focused.

---

## 5. Security & Authentication

- **Authentication**: Managed via Firebase Authentication.
- **State**: User session is managed via Pinia store (e.g., `authStore.ts`).
- **Authorization**: Use Vue Router navigation guards to protect private routes (e.g., Dashboard, Projects, Reports) from unauthenticated access.
- **Firestore Security Rules**: Always structure data anticipating user-scoped access (e.g., associating projects with a user ID).

---

## 6. Commands Reference

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

---

## 7. Quick Reference

✅ Never use Git commands (`git add`, `git commit`)
✅ Never hardcode credentials, API keys, or secrets
✅ Always use environment variables for sensitive data
✅ Always use Vue 3 Composition API with `<script setup lang="ts">`
✅ Use Tailwind CSS for all styling
✅ Ensure TypeScript typing is accurate, especially for Firebase payloads