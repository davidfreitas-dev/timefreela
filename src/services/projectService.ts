import { where, orderBy, Timestamp, FieldValue } from 'firebase/firestore';
import { firestoreClient, type BatchOperation } from '../api/firestore';
import { COLLECTIONS } from '../constants';
import type { Project, Session } from '../types';

type TimestampValue = Timestamp | FieldValue | Date | string | { seconds: number; nanoseconds?: number } | null | undefined;

const toTimestamp = (value: TimestampValue, fallback: Timestamp = Timestamp.now()): Timestamp => {
  if (!value) return fallback;
  if (value instanceof Timestamp) return value;
  if (value instanceof Date) return Timestamp.fromDate(value);
  if (typeof value === 'string') {
    const date = new Date(value);
    return isNaN(date.getTime()) ? fallback : Timestamp.fromDate(date);
  }
  if (typeof value === 'object' && 'seconds' in value) {
    return new Timestamp(value.seconds, value.nanoseconds || 0);
  }
  return fallback;
};

const mapProjectData = (p: Partial<Project>, userId: string, now: Timestamp) => ({
  userId,
  title: String(p.title || 'Sem título').trim().padEnd(3, '.'),
  active: p.active !== undefined ? Boolean(p.active) : true,
  createdAt: toTimestamp(p.createdAt, now),
  updatedAt: toTimestamp(p.updatedAt, now),
  description: String(p.description || ''),
  tags: Array.isArray(p.tags) ? p.tags : [],
  billingType: p.billingType || 'fixed',
  billingAmount: Number(p.billingAmount || 0),
  estimatedDuration: p.estimatedDuration ? Number(p.estimatedDuration) : null,
});

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
    // 1. Get all sessions for this project
    const sessions = await firestoreClient.getDocs<Session>(COLLECTIONS.SESSIONS, [
      where('projectId', '==', id)
    ]);

    // 2. Prepare batch delete operations
    const operations: BatchOperation[] = [
      { type: 'delete', path: COLLECTIONS.PROJECTS, id },
      ...sessions.map(s => ({
        type: 'delete',
        path: COLLECTIONS.SESSIONS,
        id: s.id
      } as BatchOperation))
    ];

    // 3. Execute batch delete
    return firestoreClient.batchWrite(operations);
  },

  async restore(userId: string, projectsToRestore: Partial<Project>[]): Promise<void> {
    // 1. Limpeza: Deleta projetos existentes do usuário
    const existingProjects = await this.getProjectsByUser(userId);
    if (existingProjects.length > 0) {
      const deleteOps: BatchOperation[] = existingProjects.map(p => ({
        type: 'delete',
        path: COLLECTIONS.PROJECTS,
        id: p.id,
      }));
      await firestoreClient.batchWrite(deleteOps);
      // Delay necessário para propagação dos índices no Firestore
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // 2. Restauração: Cria novos projetos a partir do backup
    if (projectsToRestore.length > 0) {
      const now = Timestamp.now();
      const createOps: BatchOperation[] = projectsToRestore
        .filter(p => p.id) // Garante que o ID existe
        .map(p => ({
          type: 'set',
          path: COLLECTIONS.PROJECTS,
          id: String(p.id),
          data: mapProjectData(p, userId, now),
        }));

      if (createOps.length > 0) {
        await firestoreClient.batchWrite(createOps);
      }
    }
  }
};
