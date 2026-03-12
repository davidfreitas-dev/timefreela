# GEMINI.md - TimeFreela Project Context for Gemini

This document provides an in-depth context about the TimeFreela project, designed to assist Gemini in understanding the structure, technologies, and conventions of the source code.

## 1. Project Overview

**Name:** TimeFreela
**Description:** TimeFreela is a web application developed for freelancers, allowing them to track time spent on various projects and generate detailed reports.

**Key Features:**
- User Authentication (Login, Register)
- Project Management (Create, Edit, Delete projects)
- Session Tracking (Start, Stop, Pause sessions per project)
- Detailed Reports (View time spent per project, per day, etc.)
- Timer Widget for easy time tracking

## 2. Technologies Used

The TimeFreela project is built with the following technologies and frameworks:

-   **Frontend Framework**: Vue 3 (with Composition API)
-   **Language**: TypeScript
-   **State Management**: Pinia
-   **Routing**: Vue Router
-   **Styling**: Tailwind CSS
-   **Backend/Database**: Firebase (Authentication and Firestore)
-   **Build Tool**: Vite
-   **CI/CD Automation**: GitHub Actions for Firebase Hosting

## 3. Project Structure

The code organization follows a modular and logical pattern, facilitating maintenance and scalability:

-   `src/`: Contains all application source code.
    -   `assets/`: Static assets like images (e.g., `logo.png`).
    -   `components/`: Reusable Vue components (e.g., `Button.vue`, `Modal.vue`, `TimerWidget.vue`).
    -   `composables/`: Reusable Composition API functions for state and reactivity logic (e.g., `useLoading.ts`, `useToast.ts`).
    -   `filters/`: Data formatting logic (e.g., `index.ts`).
    -   `plugins/`: Vue plugins (e.g., `filters.ts`).
    -   `router/`: Vue Router configuration for route management (e.g., `index.ts`).
    -   `services/`: Service modules for interacting with external APIs, mainly Firebase Firestore (e.g., `firestore.ts`).
    -   `stores/`: Pinia state management modules, each for a specific part of the application's state (e.g., `authStore.ts`, `projectStore.ts`, `timerStore.ts`).
    -   `types/`: TypeScript type definitions for data models and interfaces (e.g., `project.ts`, `session.ts`, `user.ts`).
    -   `views/`: Vue components representing entire application pages or screens (e.g., `Home.vue`, `Projects.vue`, `Session.vue`, `auth/Login.vue`).
    -   `App.vue`: Root application component.
    -   `main.ts`: Vue application entry point.
    -   `style.css`, `tailwind.css`: Global style files and Tailwind CSS configuration.
    -   `vite-env.d.ts`: Type definitions for the Vite environment.

-   `public/`: Static files served directly (e.g., `favicon.ico`).
-   `.github/workflows/`: GitHub Actions configurations for CI/CD.
-   `.firebaserc`, `firebase.json`: Firebase configurations.
-   `package.json`, `package-lock.json`: Dependency management.
-   `tsconfig.*.json`: TypeScript configurations.
-   `vite.config.ts`: Vite configuration.

## 4. Code Conventions and Patterns

-   **Vue Components**: Use Single File Components (`.vue`) format. Logic is generally defined using the `<script setup lang="ts">` of the Composition API.
-   **TypeScript**: Strongly typed throughout the application. Gemini should always prioritize maintaining and adding correct typing.
-   **Tailwind CSS**: Tailwind utility classes are used for styling. New styling should follow this pattern.
-   **Pinia**: Global state management is done through Pinia stores. Interactions with the state should use actions and getters defined in the stores.
-   **Firebase**: Interactions with Firebase Authentication and Firestore are encapsulated in `src/services` and/or directly in actions of Pinia stores.
-   **Naming**: CamelCase for variables and functions, PascalCase for components and types.
-   **Formatting**: The project should follow the defined linting and formatting rules (`.eslintrc.cjs`).

## 5. How Gemini Should Interact with the Code

When performing tasks in this project, Gemini should:

1.  **Respect Technologies**: Assume and use Vue 3, TypeScript, Pinia, Vue Router, Tailwind CSS, and Firebase as the fundamental technologies.
2.  **Maintain Typing**: Whenever modifying or adding code, ensure that TypeScript typing is correct and consistent.
3.  **Follow Structure**: Add new files and modules in the appropriate directories (e.g., new components in `src/components`, new stores in `src/stores`).
4.  **Adhere to Conventions**: Follow naming conventions, Tailwind CSS styling, and Vue Composition API usage.
5.  **Tests**: If new features or bug fixes are requested, consider adding unit or integration tests if the project already has an established testing structure.
6.  **Verification**: After modifications, indicate running linting (`npm run lint`), type-checking (`tsc --noEmit`), and, if applicable, tests.

This context should provide a solid foundation for Gemini to effectively understand and interact with the TimeFreela project.