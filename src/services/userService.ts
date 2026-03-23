import { where } from 'firebase/firestore';
import { firestoreClient, type BatchOperation } from '../api/firestore';
import { COLLECTIONS } from '../constants';
import type { User, Project, Session } from '../types';

export const userService = {
  async createUser(uid: string, data: Omit<User, 'id'>): Promise<void> {
    return firestoreClient.setDoc(COLLECTIONS.USERS, uid, data);
  },

  async getUser(uid: string): Promise<User | null> {
    return firestoreClient.getDoc<User>(COLLECTIONS.USERS, uid);
  },

  async updateUser(uid: string, data: Partial<User>): Promise<void> {
    return firestoreClient.updateDoc<User>(COLLECTIONS.USERS, uid, data);
  },

  async deleteUserData(uid: string): Promise<void> {
    // 1. Get all projects
    const projects = await firestoreClient.getDocs<Project>(COLLECTIONS.PROJECTS, [
      where('userId', '==', uid)
    ]);

    // 2. Get all sessions
    const sessions = await firestoreClient.getDocs<Session>(COLLECTIONS.SESSIONS, [
      where('userId', '==', uid)
    ]);

    // 3. Prepare batch delete
    const operations: BatchOperation[] = [
      { type: 'delete', path: COLLECTIONS.USERS, id: uid },
      ...projects.map(p => ({ type: 'delete' as const, path: COLLECTIONS.PROJECTS, id: p.id })),
      ...sessions.map(s => ({ type: 'delete' as const, path: COLLECTIONS.SESSIONS, id: s.id }))
    ];

    // 4. Execute batch delete
    return firestoreClient.batchWrite(operations);
  }
};
