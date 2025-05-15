import type { FieldValue } from 'firebase/firestore';

export interface Session {
  id: string;
  userId: string;
  projectId: string;
  duration: number; // segundos
  isManual: boolean;
  isBilled: boolean;
  date: Date | FieldValue;
  endTime: Date | FieldValue;
  startTime: Date | FieldValue;
  createdAt?: Date | FieldValue;
  updatedAt?: Date | FieldValue;
}
