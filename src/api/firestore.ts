import {
  collection,
  doc,
  getDoc as getDocFirebase,
  getDocs as getDocsFirebase,
  addDoc as addDocFirebase,
  setDoc as setDocFirebase,
  updateDoc as updateDocFirebase,
  deleteDoc as deleteDocFirebase,
  writeBatch,
  query,
  FirestoreError as FirebaseFirestoreError,
  type QueryConstraint,
  type WithFieldValue,
  type UpdateData,
  type DocumentData
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface BatchOperation {
  type: 'set' | 'update' | 'delete';
  path: string;
  id: string;
  data?: DocumentData;
}

export class FirestoreError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'FirestoreError';
  }
}

const handleFirestoreError = (error: unknown): never => {
  if (error instanceof FirebaseFirestoreError) {
    throw new FirestoreError(error.code, error.message);
  }

  if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
    const err = error as { code: string; message: string };
    throw new FirestoreError(err.code, err.message);
  }

  throw error;
};

export const firestoreClient = {
  async getDoc<T>(path: string, id: string): Promise<T | null> {
    try {
      const docRef = doc(db, path, id);
      const docSnap = await getDocFirebase(docRef);
      if (!docSnap.exists()) return null;
      return { id: docSnap.id, ...docSnap.data() } as T;
    } catch (error) {
      throw handleFirestoreError(error);
    }
  },

  async getDocs<T>(path: string, constraints: QueryConstraint[]): Promise<T[]> {
    try {
      const colRef = collection(db, path);
      const q = query(colRef, ...constraints);
      const querySnapshot = await getDocsFirebase(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
    } catch (error) {
      throw handleFirestoreError(error);
    }
  },

  async addDoc<T>(path: string, data: T): Promise<string> {
    try {
      const colRef = collection(db, path);
      const docRef = await addDocFirebase(colRef, data as WithFieldValue<DocumentData>);
      return docRef.id;
    } catch (error) {
      throw handleFirestoreError(error);
    }
  },

  async setDoc<T>(path: string, id: string, data: T): Promise<void> {
    try {
      const docRef = doc(db, path, id);
      await setDocFirebase(docRef, data as WithFieldValue<DocumentData>);
    } catch (error) {
      throw handleFirestoreError(error);
    }
  },

  async updateDoc<T>(path: string, id: string, data: Partial<T>): Promise<void> {
    try {
      const docRef = doc(db, path, id);
      await updateDocFirebase(docRef, data as UpdateData<DocumentData>);
    } catch (error) {
      throw handleFirestoreError(error);
    }
  },

  async deleteDoc(path: string, id: string): Promise<void> {
    try {
      const docRef = doc(db, path, id);
      await deleteDocFirebase(docRef);
    } catch (error) {
      throw handleFirestoreError(error);
    }
  },

  async batchWrite(operations: BatchOperation[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      operations.forEach(op => {
        const docRef = doc(db, op.path, op.id);
        switch (op.type) {
        case 'set':
          batch.set(docRef, op.data as WithFieldValue<DocumentData>);
          break;
        case 'update':
          batch.update(docRef, op.data as UpdateData<DocumentData>);
          break;
        case 'delete':
          batch.delete(docRef);
          break;
        }
      });
      await batch.commit();
    } catch (error) {
      throw handleFirestoreError(error);
    }
  }
};
