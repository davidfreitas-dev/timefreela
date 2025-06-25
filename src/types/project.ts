import type { FieldValue } from 'firebase/firestore';

export interface Project {
  id: string;
  userId?: string;
  title: string;
  description: string;
  tags?: string[];
  billingType: 'hourly' | 'fixed';
  billingAmount: number; 
  estimatedDuration?: number;
  active: number;
  createdAt?: Date | FieldValue;
  updatedAt?: Date | FieldValue;
}
