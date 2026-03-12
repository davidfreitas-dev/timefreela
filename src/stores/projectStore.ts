import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { projectService } from '../services/projectService';
import type { Project } from '../types';

export const useProjectStore = defineStore('projects', () => {
  const items = ref<Project[]>([]);
  const current = ref<Project | null>(null);

  const activeProjects = computed(() => items.value.filter((p) => p.active));
  
  const getById = computed(() => (id: string) => 
    items.value.find((p) => p.id === id)
  );

  const fetchAll = async (userId: string) => {
    try {
      items.value = await projectService.getProjectsByUser(userId);
    } catch (error) {
      console.error('Erro ao buscar projetos:', error);
      throw error;
    }
  };

  const fetchOne = async (id: string) => {
    try {
      current.value = await projectService.getProjectById(id);
      return current.value;
    } catch (error) {
      console.error('Erro ao buscar projeto:', error);
      throw error;
    }
  };

  const create = async (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const id = await projectService.createProject(data);
      await fetchAll(data.userId);
      return id;
    } catch (error) {
      console.error('Erro ao criar projeto:', error);
      throw error;
    }
  };

  const update = async (id: string, data: Partial<Project>) => {
    try {
      await projectService.updateProject(id, data);
      
      if (current.value?.id === id) {
        current.value = { ...current.value, ...data };
      }
      
      const index = items.value.findIndex(item => item.id === id);
      if (index !== -1) {
        items.value[index] = { ...items.value[index], ...data };
      }
    } catch (error) {
      console.error('Erro ao atualizar projeto:', error);
      throw error;
    }
  };

  const archive = async (id: string) => {
    try {
      await projectService.archiveProject(id);
      const index = items.value.findIndex(item => item.id === id);
      if (index !== -1) {
        items.value[index].active = false;
      }
    } catch (error) {
      console.error('Erro ao arquivar projeto:', error);
      throw error;
    }
  };

  const remove = async (id: string) => {
    try {
      await projectService.deleteProject(id);
      items.value = items.value.filter(item => item.id !== id);
    } catch (error) {
      console.error('Erro ao deletar projeto:', error);
      throw error;
    }
  };

  return {
    items,
    current,
    activeProjects,
    getById,
    fetchAll,
    fetchOne,
    create,
    update,
    archive,
    remove,
  };
});
