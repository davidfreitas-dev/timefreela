import { where, orderBy, Timestamp } from 'firebase/firestore';
import { firestoreClient } from '../api/firestore';
import { COLLECTIONS } from '../constants';
import type { Project } from '../types';

export const projectService = {
  async getProjectsByUser(userId: string): Promise<Project[]> {
    return firestoreClient.getDocs<Project>(COLLECTIONS.PROJECTS, [
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    ]);
  },

  async getProjectById(id: string): Promise<Project | null> {
    return firestoreClient.getDoc<Project>(COLLECTIONS.PROJECTS, id);
  },

  async createProject(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = Timestamp.now();
    const projectData = {
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    return firestoreClient.addDoc(COLLECTIONS.PROJECTS, projectData);
  },

  async updateProject(id: string, data: Partial<Project>): Promise<void> {
    const updatedData = {
      ...data,
      updatedAt: Timestamp.now(),
    };
    return firestoreClient.updateDoc(COLLECTIONS.PROJECTS, id, updatedData);
  },

  async archiveProject(id: string): Promise<void> {
    return this.updateProject(id, { active: false });
  },

  async deleteProject(id: string): Promise<void> {
    return firestoreClient.deleteDoc(COLLECTIONS.PROJECTS, id);
  }
};
