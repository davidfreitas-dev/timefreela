<script setup lang="ts">
import AppHeader from './AppHeader.vue';
import AppSidebar from './AppSidebar.vue';
import AppContainer from './AppContainer.vue';
</script>

<template>
  <div class="flex h-screen bg-background dark:bg-background-dark overflow-hidden">
    <AppSidebar />
    <div class="flex flex-col flex-1 min-w-0">
      <AppHeader />
      <main class="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8">
        <AppContainer>
          <slot />
          <!-- If used with router-view nesting, it can also have a router-view -->
          <!-- <router-view /> -->
        </AppContainer>
      </main>
    </div>
  </div>
</template>
