import type { FieldValue } from 'firebase/firestore';

export interface Project {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
  hourlyRate?: number;
  active: number | null;
  userId?: string;
  createdAt?: Date | FieldValue;
  updatedAt?: Date | FieldValue;
}
