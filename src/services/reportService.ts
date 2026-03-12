import { where, Timestamp, type QueryConstraint } from 'firebase/firestore';
import { firestoreClient } from '../api/firestore';
import { COLLECTIONS } from '../constants';
import type { Project, Session } from '../types';

interface SessionFirestore extends Omit<Session, 'date' | 'startTime' | 'endTime' | 'createdAt' | 'updatedAt'> {
  date: Timestamp;
  startTime: Timestamp;
  endTime: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface EnrichedSession extends Session {
  projectTitle: string;
  billingType: 'hourly' | 'fixed';
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

export const reportService = {
  calculateSessionAmount(session: Pick<EnrichedSession, 'duration' | 'billingType' | 'billingAmount' | 'estimatedDuration'>): number {
    if (session.billingType === 'hourly') {
      return (session.duration / 3600) * session.billingAmount;
    } else {
      const estimatedHours = (session.estimatedDuration || 0) / 3600;
      if (estimatedHours > 0) {
        const sessionHours = session.duration / 3600;
        return (session.billingAmount / estimatedHours) * sessionHours;
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
    const sessions = await firestoreClient.getDocs<SessionFirestore>(COLLECTIONS.SESSIONS, conditions);
    
    return sessions.map(data => ({
      ...data,
      date: data.date?.toDate() || null,
      createdAt: data.createdAt?.toDate() || null,
      updatedAt: data.updatedAt?.toDate() || null,
      startTime: data.startTime?.toDate() || null,
      endTime: data.endTime?.toDate() || null,
    })) as Session[];
  },

  enrichSessions(
    sessions: Session[],
    projects: Project[]
  ): EnrichedSession[] {
    return sessions.map(session => {
      const project = projects.find(p => p.id === session.projectId);

      return {
        ...session,
        projectTitle: project?.title || '',
        billingType: (project?.billingType as 'hourly' | 'fixed') || 'hourly',
        billingAmount: project?.billingAmount || 0,
        estimatedDuration: project?.estimatedDuration
      };
    });
  },

  groupSessionsByDate(sessions: EnrichedSession[]): Record<string, ReportDay> {
    const grouped: Record<string, ReportDay> = {};

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
      grouped[dateKey].totalAmount += this.calculateSessionAmount(session);
      grouped[dateKey].sessions.push(session);
    }

    return grouped;
  },

  groupSessionsByProject(sessions: EnrichedSession[], projects: Project[]): ReportProjectGroup[] {
    const grouped: Record<string, ReportProjectGroup> = {};

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
      grouped[session.projectId].subtotalValue += this.calculateSessionAmount(session);
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
    const conditions = [where('userId', '==', userId)];
    const sessions = await firestoreClient.getDocs<SessionFirestore>(COLLECTIONS.SESSIONS, conditions);

    const years = new Set<number>();
    sessions.forEach(session => {
      if (session.date) {
        const date = session.date.toDate();
        years.add(date.getFullYear());
      }
    });

    return Array.from(years).sort((a, b) => b - a);
  }
};

