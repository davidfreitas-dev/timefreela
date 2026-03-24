import { where, Timestamp, type QueryConstraint, orderBy, limit, FieldValue } from 'firebase/firestore';
import { firestoreClient } from '../api/firestore';
import { COLLECTIONS, BillingType } from '../constants';
import type { Project, Session, SessionFirestoreData } from '../types';

export interface EnrichedSession extends Session {
  projectTitle: string;
  billingType: BillingType;
  billingAmount: number;
  estimatedDuration?: number;
}

export interface ReportDay {
  date: string;
  totalSeconds: number;
  totalAmount: number;
  sessions: EnrichedSession[];
}

export interface ReportProjectGroup {
  project: Project;
  sessions: EnrichedSession[];
  subtotalSeconds: number;
  subtotalValue: number;
}

type TimestampValue = Timestamp | FieldValue | Date | string | { seconds: number; nanoseconds?: number } | null | undefined;

const toDate = (value: TimestampValue): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  if (typeof value === 'string') {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }
  return null;
};

const mapSession = (id: string, data: SessionFirestoreData): Session => {
  const { createdAt, updatedAt, startTime, endTime, date, ...rest } = data;
  return {
    id,
    ...rest,
    createdAt: toDate(createdAt),
    updatedAt: toDate(updatedAt),
    startTime: toDate(startTime),
    endTime: toDate(endTime),
    date: toDate(date)
  };
};

export const reportService = {
  calculateSessionAmount(session: EnrichedSession, totalProjectSeconds?: number): number {
    const amount = session.billingAmount;
    
    if (session.billingType === BillingType.HOURLY) {
      return (session.duration / 3600) * amount;
    } else {
      // For fixed projects, we distribute the total amount based on worked hours
      // We prefer using the actual total worked hours if available, 
      // otherwise fallback to estimatedDuration or just 0 if neither is present.
      const divisor = totalProjectSeconds || session.estimatedDuration || 0;
      
      if (divisor > 0) {
        return (amount / (divisor / 3600)) * (session.duration / 3600);
      }
      return 0;
    }
  },

  buildQueryConditions(
    userId: string,
    startDate?: Date,
    endDate?: Date,
    billedFilter: 'all' | 'billed' | 'unbilled' = 'all'
  ): QueryConstraint[] {
    const conditions: QueryConstraint[] = [where('userId', '==', userId)];

    if (startDate && endDate) {
      const startTimestamp = Timestamp.fromDate(startDate);
      const endCopy = new Date(endDate);
      endCopy.setHours(23, 59, 59, 999);
      const endTimestamp = Timestamp.fromDate(endCopy);

      conditions.push(where('date', '>=', startTimestamp));
      conditions.push(where('date', '<=', endTimestamp));
    }

    if (billedFilter === 'billed') conditions.push(where('isBilled', '==', true));
    if (billedFilter === 'unbilled') conditions.push(where('isBilled', '==', false));

    return conditions;
  },

  async getRawSessions(
    userId: string,
    startDate?: Date,
    endDate?: Date,
    billedFilter: 'all' | 'billed' | 'unbilled' = 'all'
  ): Promise<Session[]> {
    const conditions = this.buildQueryConditions(userId, startDate, endDate, billedFilter);
    const sessionsData = await firestoreClient.getDocs<SessionFirestoreData>(COLLECTIONS.SESSIONS, [...conditions, orderBy('date', 'asc')]);
    
    return sessionsData.map(data => {
      const { id, ...rest } = data as { id: string } & SessionFirestoreData;
      return mapSession(id, rest);
    });
  },

  enrichSessions(
    sessions: Session[],
    projects: Project[]
  ): EnrichedSession[] {
    return sessions.map(session => {
      const project = projects.find(p => p.id === session.projectId);

      return {
        ...session,
        projectTitle: session.projectTitle || project?.title || '',
        billingType: (session.billingType || project?.billingType || BillingType.HOURLY) as BillingType,
        billingAmount: session.billingAmount !== undefined ? session.billingAmount : (project?.billingAmount || 0),
        estimatedDuration: project?.estimatedDuration
      };
    });
  },

  groupSessionsByDate(sessions: EnrichedSession[]): Record<string, ReportDay> {
    const grouped: Record<string, ReportDay> = {};

    // Group by project first to calculate total worked seconds per project for fixed price distribution
    const projectTotals: Record<string, number> = {};
    for (const session of sessions) {
      projectTotals[session.projectId] = (projectTotals[session.projectId] || 0) + session.duration;
    }

    for (const session of sessions) {
      const dateKey = session.date instanceof Date 
        ? session.date.toISOString().split('T')[0] 
        : 'sem-data';

      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          date: dateKey,
          totalSeconds: 0,
          totalAmount: 0,
          sessions: []
        };
      }

      grouped[dateKey].totalSeconds += session.duration;
      grouped[dateKey].totalAmount += this.calculateSessionAmount(session, projectTotals[session.projectId]);
      grouped[dateKey].sessions.push(session);
    }

    return grouped;
  },

  groupSessionsByProject(sessions: EnrichedSession[], projects: Project[]): ReportProjectGroup[] {
    const grouped: Record<string, ReportProjectGroup> = {};
    
    // Calculate total worked seconds per project
    const projectTotals: Record<string, number> = {};
    for (const session of sessions) {
      projectTotals[session.projectId] = (projectTotals[session.projectId] || 0) + session.duration;
    }

    for (const session of sessions) {
      if (!grouped[session.projectId]) {
        const project = projects.find(p => p.id === session.projectId);
        if (!project) continue;

        grouped[session.projectId] = {
          project,
          sessions: [],
          subtotalSeconds: 0,
          subtotalValue: 0
        };
      }

      grouped[session.projectId].sessions.push(session);
      grouped[session.projectId].subtotalSeconds += session.duration;
      grouped[session.projectId].subtotalValue += this.calculateSessionAmount(session, projectTotals[session.projectId]);
    }

    return Object.values(grouped).sort((a, b) => b.subtotalValue - a.subtotalValue);
  },

  async getReportsData(
    userId: string,
    projects: Project[],
    startDate?: Date,
    endDate?: Date,
    billedFilter: 'all' | 'billed' | 'unbilled' = 'all'
  ): Promise<{ reports: ReportDay[], groups: ReportProjectGroup[] }> {
    const rawSessions = await this.getRawSessions(userId, startDate, endDate, billedFilter);
    const enrichedSessions = this.enrichSessions(rawSessions, projects);
    
    const groupedByDate = this.groupSessionsByDate(enrichedSessions);
    const reports = Object.values(groupedByDate).sort((a, b) => b.date.localeCompare(a.date));
    
    const groups = this.groupSessionsByProject(enrichedSessions, projects);

    return { reports, groups };
  },

  async getYearsWithData(userId: string): Promise<number[]> {
    const oldestRef = await firestoreClient.getDocs<SessionFirestoreData>(COLLECTIONS.SESSIONS, [
      where('userId', '==', userId),
      orderBy('date', 'asc'),
      limit(1)
    ]);

    const newestRef = await firestoreClient.getDocs<SessionFirestoreData>(COLLECTIONS.SESSIONS, [
      where('userId', '==', userId),
      orderBy('date', 'desc'),
      limit(1)
    ]);

    if (oldestRef.length === 0) return [new Date().getFullYear()];

    const startDate = toDate(oldestRef[0].date);
    const endDate = toDate(newestRef[0].date);
    
    const startYear = startDate ? startDate.getFullYear() : new Date().getFullYear();
    const endYear = endDate ? endDate.getFullYear() : new Date().getFullYear();
    
    const years = [];
    for (let y = endYear; y >= startYear; y--) {
      years.push(y);
    }

    return years;
  }
};
