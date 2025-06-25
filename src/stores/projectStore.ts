import { defineStore, storeToRefs } from 'pinia';
import { ref, type Ref } from 'vue';
import {
  collection,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe
} from 'firebase/firestore';
import { db } from '@/services/firestore';
import type { Project } from '@/types/project';
import { useUserStore } from '@/stores/userStore';

export const useProjectStore = defineStore('projectStore', () => {
  const { user } = storeToRefs(useUserStore());
  const unsubscribe = ref<Unsubscribe | null>(null);
  const projects: Ref<Project[]> = ref([]);

  const fetchProjects = async (): Promise<void> => {
    if (!user.value?.id) {
      throw new Error('Usuário não autenticado.');
    }

    if (unsubscribe.value) unsubscribe.value();

    const queryProjects = query(
      collection(db, 'projects'),
      where('userId', '==', user.value?.id),
      orderBy('title')
    );

    return new Promise<void>((resolve, reject) => {
      unsubscribe.value = onSnapshot(
        queryProjects,
        (snapshot) => {
          projects.value = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate() || null,
              updatedAt: data.updatedAt?.toDate() || null
            } as Project;
          });          
          resolve();
        },
        (error) => {
          console.error('Erro ao escutar projetos:', error);
          reject(error);
        }
      );
    });
  };

  const getProjectById = async (projectId: string) => {
    const projectRef = doc(db, 'projects', projectId);

    const snapshot = await getDoc(projectRef);

    if (!snapshot.exists()) return null; 
  
    const data = snapshot.data();

    return {
      id: snapshot.id,
      ...data,
      createdAt: data.createdAt?.toDate() || null,
      updatedAt: data.updatedAt?.toDate() || null 
    } as Project;
  };

  const addProject = async (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    if (!user.value?.id) {
      throw new Error('Usuário não autenticado.');
    }

    const projectData: Omit<Project, 'id'> = {
      ...project,
      userId: user.value?.id,
      createdAt: serverTimestamp()
    };

    await addDoc(collection(db, 'projects'), projectData);
  };

  const updateProject = async (projectId: string, updatedProject: Partial<Project>) => {
    const updatedData: Partial<Project> = {
      ...updatedProject,
      updatedAt: serverTimestamp()
    };

    await updateDoc(doc(db, 'projects', projectId), updatedData);
  };

  const deleteProject = async (projectId: string) => {
    await deleteDoc(doc(db, 'projects', projectId));
  };

  const stopListeningProjects = () => {
    unsubscribe.value?.();
    unsubscribe.value = null;
  };

  const resetProjects = () => {
    projects.value = [];
  };

  return {
    projects,
    fetchProjects,
    addProject,
    updateProject,
    deleteProject,
    getProjectById,
    stopListeningProjects,
    resetProjects
  };
});
