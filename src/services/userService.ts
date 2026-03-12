import { firestoreClient } from '../api/firestore';
import { COLLECTIONS } from '../constants';
import type { User } from '../types';

export const userService = {
  async createUser(uid: string, data: Omit<User, 'id'>): Promise<void> {
    return firestoreClient.setDoc(COLLECTIONS.USERS, uid, data);
  },

  async getUser(uid: string): Promise<User | null> {
    return firestoreClient.getDoc<User>(COLLECTIONS.USERS, uid);
  },

  async updateUser(uid: string, data: Partial<User>): Promise<void> {
    return firestoreClient.updateDoc<User>(COLLECTIONS.USERS, uid, data);
  }
};
