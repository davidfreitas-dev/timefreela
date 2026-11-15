import {
  where,
  orderBy,
  Timestamp,
  query,
  collection,
  onSnapshot,
  limit,
  startAfter,
  getDocs,
  getCountFromServer,
  type Unsubscribe,
  type QueryConstraint,
  type QueryDocumentSnapshot,
  type DocumentData,
  FieldValue
} from 'firebase/firestore';
import { toRaw, markRaw } from 'vue';
import { db } from '../lib/firebase';
import { firestoreClient, type BatchOperation } from '../api/firestore';
import { COLLECTIONS } from '../constants';
import type { Session, SessionFirestoreData, Project } from '../types';

/**
 * Helpers para conversão de tipos do Firestore
 */
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

const toTimestamp = (value: TimestampValue): Timestamp => {
  if (!value) return Timestamp.now();
  if (value instanceof Timestamp) return value;
  if (value instanceof Date) return Timestamp.fromDate(value);
  if (typeof value === 'string') {
    const date = new Date(value);
    return isNaN(date.getTime()) ? Timestamp.now() : Timestamp.fromDate(date);
  }
  if (typeof value === 'object' && 'seconds' in value) {
    return new Timestamp(value.seconds, value.nanoseconds || 0);
  }
  return Timestamp.now();
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

export const sessionService = {
  listenToSessions(
    userId: string,
    filters: { projectId?: string; startDate?: Date; endDate?: Date; limit?: number },
    onUpdate: (sessions: Session[]) => void,
    onError: (error: Error) => void
  ): Unsubscribe {
    const constraints: QueryConstraint[] = [
      where('userId', '==', userId),
      orderBy('date', 'desc')
    ];

    if (filters.limit) {
      constraints.push(limit(filters.limit));
    }

    if (filters.projectId) {
      constraints.push(where('projectId', '==', filters.projectId));
    }

    if (filters.startDate && filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      constraints.push(where('date', '>=', Timestamp.fromDate(filters.startDate)));
      constraints.push(where('date', '<=', Timestamp.fromDate(end)));
    }

    const q = query(collection(db, COLLECTIONS.SESSIONS), ...constraints);

    return onSnapshot(
      q,
      (snapshot) => {
        const sessions = snapshot.docs.map((doc) => mapSession(doc.id, doc.data() as SessionFirestoreData));
        onUpdate(sessions);
      },
      onError
    );
  },

  async getRawSessionsByUser(userId: string): Promise<Session[]> {
    return firestoreClient.getDocs<Session>(COLLECTIONS.SESSIONS, [where('userId', '==', userId)]);
  },

  async getPaginatedSessions(
    userId: string,
    pageSize: number = 15,
    cursorDoc: QueryDocumentSnapshot<DocumentData> | null = null,
    filters: { projectId?: string; startDate?: Date; endDate?: Date; isBilled?: boolean } = {}
  ): Promise<{
    sessions: Session[];
    totalCount: number;
    lastVisibleDoc: QueryDocumentSnapshot<DocumentData> | null;
    hasMore: boolean;
  }> {
    const baseConstraints: QueryConstraint[] = [
      where('userId', '==', userId)
    ];

    if (filters.isBilled !== undefined) {
      baseConstraints.push(where('isBilled', '==', filters.isBilled));
    }

    if (filters.projectId) {
      baseConstraints.push(where('projectId', '==', filters.projectId));
    }

    if (filters.startDate && filters.endDate) {
      const rawStart = toRaw(filters.startDate);
      const rawEnd = toRaw(filters.endDate);
      const startDate = rawStart instanceof Date ? new Date(rawStart.getTime()) : new Date(rawStart);
      const endDate = rawEnd instanceof Date ? new Date(rawEnd.getTime()) : new Date(rawEnd);
      endDate.setHours(23, 59, 59, 999);
      baseConstraints.push(where('date', '>=', Timestamp.fromDate(startDate)));
      baseConstraints.push(where('date', '<=', Timestamp.fromDate(endDate)));
    }

    // 1. Obter contagem total de itens correspondentes via agregação nativa do Firestore
    let totalCount = 0;
    try {
      const countQuery = query(collection(db, COLLECTIONS.SESSIONS), ...baseConstraints);
      const countSnapshot = await getCountFromServer(countQuery);
      totalCount = countSnapshot.data().count;
    } catch (countError) {
      console.warn('Erro ao obter contagem do servidor, usando fallback:', countError);
    }

    // 2. Query paginada com ordenação e cursor desprovido de Proxies do Vue
    const queryConstraints: QueryConstraint[] = [
      ...baseConstraints,
      orderBy('date', 'desc'),
    ];

    const rawCursor = cursorDoc ? markRaw(toRaw(cursorDoc)) : null;
    if (rawCursor) {
      queryConstraints.push(startAfter(rawCursor));
    }

    queryConstraints.push(limit(pageSize));

    const pageQuery = query(collection(db, COLLECTIONS.SESSIONS), ...queryConstraints);
    const snapshot = await getDocs(pageQuery);

    const sessions = snapshot.docs.map(doc => mapSession(doc.id, doc.data() as SessionFirestoreData));
    const lastVisibleDoc = snapshot.docs.length > 0 ? markRaw(toRaw(snapshot.docs[snapshot.docs.length - 1])) : null;
    const hasMore = snapshot.docs.length === pageSize;

    return {
      sessions,
      totalCount: totalCount || sessions.length,
      lastVisibleDoc,
      hasMore,
    };
  },

  async getSessionById(id: string): Promise<Session | null> {
    const data = await firestoreClient.getDoc<SessionFirestoreData>(COLLECTIONS.SESSIONS, id);
    return data ? mapSession(id, data) : null;
  },

  async createSession(data: SessionFirestoreData): Promise<string> {
    const now = Timestamp.now();
    const sessionData: SessionFirestoreData = {
      ...data,
      date: data.date ? toTimestamp(data.date as TimestampValue) : null,
      startTime: data.startTime ? toTimestamp(data.startTime as TimestampValue) : null,
      endTime: data.endTime ? toTimestamp(data.endTime as TimestampValue) : null,
      createdAt: now,
      updatedAt: now,
    };
    return firestoreClient.addDoc(COLLECTIONS.SESSIONS, sessionData);
  },

  async updateSession(id: string, data: Partial<SessionFirestoreData>): Promise<void> {
    const updatedData: Partial<SessionFirestoreData> = {
      ...data,
      updatedAt: Timestamp.now(),
    };

    if (data.date) updatedData.date = toTimestamp(data.date as TimestampValue);
    if (data.startTime) updatedData.startTime = toTimestamp(data.startTime as TimestampValue);
    if (data.endTime) updatedData.endTime = toTimestamp(data.endTime as TimestampValue);

    return firestoreClient.updateDoc(COLLECTIONS.SESSIONS, id, updatedData);
  },

  async deleteSession(id: string): Promise<void> {
    return firestoreClient.deleteDoc(COLLECTIONS.SESSIONS, id);
  },

  async setSessionsBillingStatus(sessionIds: string[], isBilled: boolean): Promise<void> {
    const now = Timestamp.now();
    const operations: BatchOperation[] = sessionIds.map((id) => ({
      type: 'update',
      path: COLLECTIONS.SESSIONS,
      id,
      data: { isBilled, updatedAt: now },
    }));
    return firestoreClient.batchWrite(operations);
  },

  async markSessionsAsBilled(sessionIds: string[]): Promise<void> {
    return this.setSessionsBillingStatus(sessionIds, true);
  },

  async restore(userId: string, sessionsToRestore: Partial<Session>[], projects: Project[]): Promise<void> {
    // 1. Delete all existing sessions for this user
    const existingSessions = await this.getRawSessionsByUser(userId);
    if (existingSessions.length > 0) {
      const deleteOps: BatchOperation[] = existingSessions.map(s => ({
        type: 'delete',
        path: COLLECTIONS.SESSIONS,
        id: s.id,
      }));
      await firestoreClient.batchWrite(deleteOps);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // 2. Create new sessions from backup
    if (sessionsToRestore.length === 0) return;

    const validProjectIds = new Set(projects.map(p => p.id));
    const createOps: BatchOperation[] = sessionsToRestore
      .filter(s => s.projectId && validProjectIds.has(s.projectId))
      .map(s => {
        const project = projects.find(p => p.id === s.projectId);
        return {
          type: 'set',
          path: COLLECTIONS.SESSIONS,
          id: s.id as string,
          data: {
            userId,
            projectId: String(s.projectId),
            projectTitle: String(s.projectTitle || project?.title || 'Projeto não encontrado'),
            duration: Math.max(0, Number(s.duration || 0)),
            isManual: s.isManual ?? true,
            isBilled: s.isBilled ?? false,
            billingType: s.billingType || project?.billingType || 'hourly',
            billingAmount: s.billingAmount !== undefined ? Number(s.billingAmount) : (project?.billingAmount ?? 0),
            date: toTimestamp(s.date),
            startTime: toTimestamp(s.startTime),
            endTime: toTimestamp(s.endTime),
            createdAt: toTimestamp(s.createdAt),
            updatedAt: toTimestamp(s.updatedAt),
          },
        };
      });

    if (createOps.length > 0) {
      await firestoreClient.batchWrite(createOps);
    }
  }
};
