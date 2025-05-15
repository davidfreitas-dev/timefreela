import type { FieldValue } from 'firebase/firestore';

export interface Session {
  id: string;
  userId: string;
  projectId: string;
  startTime: Date | null;
  endTime: Date | null;
  duration: number; // segundos
  isManual: boolean;
  isBilled: boolean;
  createdAt?: Date | FieldValue;
  updatedAt?: Date | FieldValue;
}
