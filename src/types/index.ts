import type { Timestamp, FieldValue } from 'firebase/firestore';
import type { BillingType, BillingStatus } from '../constants/billing';

export interface Option {
  label: string;
  value: string | number | boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  createdAt?: Timestamp | Date;
  updatedAt?: Timestamp | Date;
}

export interface Project {
  id: string;
  userId: string;
  title: string;
  description?: string;
  tags: string[];
  billingType: BillingType;
  billingAmount: number;
  estimatedDuration?: number;
  active: boolean;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface Session {
  id: string;
  userId: string;
  projectId: string;
  duration: number; // em segundos
  isManual: boolean;
  isBilled: boolean;
  date: Date | null;
  startTime: Date | null;
  endTime: Date | null;
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

export interface TimerState {
  projectId: string | null;
  startedAt: number | null; // Date.now()
  elapsed: number; // segundos acumulados
  isRunning: boolean;
  isPaused: boolean;
}

export interface ReportFilters {
  projectId?: string;
  startDate?: string;
  endDate?: string;
  billingStatus?: BillingStatus;
}

export interface ReportSummary {
  totalSeconds: number;
  totalBilled: number;
  totalPending: number;
  sessionCount: number;
}

export interface GroupedReport {
  project: Project;
  sessions: Session[];
  subtotalSeconds: number;
  subtotalValue: number;
}
