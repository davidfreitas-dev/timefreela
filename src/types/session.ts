import type { FieldValue } from 'firebase/firestore';

export interface Session {
  id: string;
  userId: string;
  projectId: string;
  duration: number;
  isManual: boolean;
  isBilled: boolean;
  date: Date | null;
  endTime: Date | null;
  startTime: Date | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface SessionFirestoreData {
  userId: string;
  projectId: string;
  duration: number;
  isManual: boolean;
  isBilled: boolean;
  date: Date | FieldValue | null;
  endTime: Date | FieldValue | null;
  startTime: Date | FieldValue | null;
  createdAt?: Date | FieldValue | null;
  updatedAt?: Date | FieldValue | null;
}

export type NewSession = Omit<SessionFirestoreData, 'userId' | 'createdAt'>;
