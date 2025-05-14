<script setup lang="ts">
import { reactive, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useProjectStore } from '@/stores/projectStore';
import Container from '@/components/shared/Container.vue';
import Breadcrumb from '@/components/shared/Breadcrumb.vue';
import Badge from '@/components/shared/Badge.vue';
import Button from '@/components/shared/Button.vue';

const router = useRouter();

const projectStore = useProjectStore();

onMounted(() => {
  projectStore.fetchProjects();
});

onBeforeUnmount(() => {
  projectStore.stopListeningProjects();
});

const { projects } = storeToRefs(projectStore);

const tableHead = reactive(['Criado em', 'Título', 'Descrição', 'Valor/Hora', 'Status', 'Ações']);

const editProject = (projectId: string) => {
  router.push(`/projects/${projectId}`);
};
</script>

<template>
  <Container>
    <div class="header flex justify-between items-center">
      <Breadcrumb title="Projetos" description="Gerencie seus projetos aqui." />
      <Button class="h-fit" @click="router.push({ name: 'ProjectCreate' })">
        <span class="material-icons-outlined text-2xl md:mr-2">add</span>
        <span class="hidden md:block">Novo Projeto</span>
      </Button>
    </div>

    <div v-if="projects.length" class="content overflow-x-auto my-7">
      <table class="min-w-full">
        <thead>
          <tr>
            <th
              v-for="(item, i) in tableHead"
              :key="i"
              scope="col"
              class="px-6 py-4 truncate text-left text-font"
            >
              {{ item }}
            </th>
          </tr>
        </thead>

        <tbody class="border border-neutral text-font text-base">
          <template v-for="(project, i) in projects" :key="i">
            <tr>
              <td class="px-6 py-4 w-[20%] max-w-[200px] truncate whitespace-nowrap overflow-hidden">
                {{ $filters.formatDate(project.createdAt) }}
              </td>
              
              <td class="px-6 py-4 w-[20%] max-w-[200px] truncate whitespace-nowrap overflow-hidden">
                {{ project.title }}
              </td>

              <td class="px-6 py-4 w-[30%] max-w-[300px] truncate whitespace-nowrap overflow-hidden">
                {{ project.description || '-' }}
              </td>

              <td class="px-6 py-4 w-[20%] max-w-[200px] truncate whitespace-nowrap overflow-hidden">
                {{ $filters.formatCurrencyBRL(project.hourlyRate) }}
              </td>

              <!-- <td class="px-6 py-4 w-[25%] max-w-[250px] truncate whitespace-nowrap overflow-hidden">
                {{ project.tags?.join(', ') || '-' }}
              </td> -->

              <td class="px-6 py-4 w-[5%] min-w-[50px]">
                <Badge
                  :label="project.active ? 'Ativo' : 'Inativo'"
                  :color="project.active ? 'success' : 'danger'"
                />
              </td>

              <td class="px-6 py-4 w-[5%] min-w-[50px]">
                <button
                  class="p-2 h-10 w-10 bg-primary-accent text-primary focus:ring-2 disabled:bg-disabled disabled:cursor-not-allowed rounded-lg cursor-pointer"
                  @click="editProject(project.id)"
                >
                  <span class="material-icons-outlined">edit</span>
                </button>
              </td>
            </tr>

            <tr v-if="i < projects.length - 1">
              <td colspan="6">
                <div class="w-[95%] h-px bg-neutral mx-auto" />
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <div v-else class="text-gray-500 text-center my-10">
      Nenhum projeto encontrado.
    </div>
  </Container>
</template>
