import {
  where,
  orderBy,
  Timestamp,
  query,
  collection,
  onSnapshot,
  limit,
  type Unsubscribe,
  type QueryConstraint
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { firestoreClient } from '../api/firestore';
import { COLLECTIONS } from '../constants';
import type { Session, SessionFirestoreData } from '../types';

export const sessionService = {
  listenToSessions(
    userId: string,
    filters: { projectId?: string; startDate?: Date; endDate?: Date; limit?: number },
    onUpdate: (sessions: Session[]) => void,
    onError: (error: any) => void
  ): Unsubscribe {
    const constraints: QueryConstraint[] = [
      where('userId', '==', userId),
      orderBy('date', 'desc'),
      limit(filters.limit || 100)
    ];

    if (filters.projectId) {
      constraints.push(where('projectId', '==', filters.projectId));
    }

    if (filters.startDate && filters.endDate) {
      const start = new Date(filters.startDate);
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);

      constraints.push(where('date', '>=', Timestamp.fromDate(start)));
      constraints.push(where('date', '<=', Timestamp.fromDate(end)));
    }

    const q = query(collection(db, COLLECTIONS.SESSIONS), ...constraints);

    return onSnapshot(
      q,
      (snapshot) => {
        const sessions = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || null,
            updatedAt: data.updatedAt?.toDate() || null,
            startTime: data.startTime?.toDate() || null,
            endTime: data.endTime?.toDate() || null,
            date: data.date?.toDate() || null
          } as Session;
        });
        onUpdate(sessions);
      },
      onError
    );
  },

  async getSessionById(id: string): Promise<Session | null> {
    const data = await firestoreClient.getDoc<SessionFirestoreData>(COLLECTIONS.SESSIONS, id);
    if (!data) return null;

    const toDate = (value: any): Date | null => {
      if (!value) return null;
      if (typeof value.toDate === 'function') return value.toDate();
      if (value instanceof Date) return value;
      return null;
    };

    return {
      id,
      ...data,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
      startTime: toDate(data.startTime),
      endTime: toDate(data.endTime),
      date: toDate(data.date)
    } as Session;
  },

  async createSession(data: SessionFirestoreData): Promise<string> {
    const now = Timestamp.now();
    const toDate = (value: any): Date | any => {
      if (typeof value === 'string') return new Date(value);
      return value;
    };

    const sessionData = {
      ...data,
      date: toDate(data.date),
      startTime: toDate(data.startTime),
      endTime: toDate(data.endTime),
      createdAt: now,
      updatedAt: now,
    };
    return firestoreClient.addDoc(COLLECTIONS.SESSIONS, sessionData);
  },

  async updateSession(id: string, data: Partial<SessionFirestoreData>): Promise<void> {
    const toDate = (value: any): Date | any => {
      if (typeof value === 'string') return new Date(value);
      return value;
    };

    const updatedData = {
      ...data,
      updatedAt: Timestamp.now(),
    };

    if (data.date) updatedData.date = toDate(data.date);
    if (data.startTime) updatedData.startTime = toDate(data.startTime);
    if (data.endTime) updatedData.endTime = toDate(data.endTime);

    return firestoreClient.updateDoc(COLLECTIONS.SESSIONS, id, updatedData);
  },

  async deleteSession(id: string): Promise<void> {
    return firestoreClient.deleteDoc(COLLECTIONS.SESSIONS, id);
  },

  async markSessionsAsBilled(sessionIds: string[]): Promise<void> {
    const now = Timestamp.now();
    const operations = sessionIds.map((id) => ({
      type: 'update' as const,
      path: COLLECTIONS.SESSIONS,
      id,
      data: {
        isBilled: true,
        updatedAt: now,
      },
    }));
    return firestoreClient.batchWrite(operations);
  }
};
