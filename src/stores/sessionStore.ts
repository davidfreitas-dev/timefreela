import { defineStore, storeToRefs } from 'pinia';
import { ref, type Ref } from 'vue';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe
} from 'firebase/firestore';
import { db } from '@/services/firestore';
import { useUserStore } from '@/stores/userStore';
import type { Session } from '@/types/session';

export const useSessionStore = defineStore('sessionStore', () => {
  const { user } = storeToRefs(useUserStore());
  const unsubscribe: Ref<Unsubscribe | null> = ref(null);
  const sessions: Ref<Session[]> = ref([]);
  const currentSession = ref<Omit<Session, 'id' | 'userId' | 'createdAt'> | null>(null);

  const startSession = (projectId: string) => {
    currentSession.value = {
      projectId,
      duration: 0,
      isManual: false,
      isBilled: false,
      startTime: new Date(),
      endTime: null,
      date: null,
    };
  };

  const finishSession = async () => {
    if (!currentSession.value) return;

    if (!user.value?.id) {
      throw new Error('Usuário não autenticado.');
    }

    const now = new Date();

    const session: Omit<Session, 'id'> = {
      ...currentSession.value,
      userId: user.value.id,
      endTime: now,
      date: now,
      createdAt: serverTimestamp()
    };

    addSession(session);

    currentSession.value = null;
  };

  const fetchSessions = async (projectId?: string) => {
    if (!user.value?.id) {
      throw new Error('Usuário não autenticado.');
    }

    if (unsubscribe.value) {
      unsubscribe.value();
    }

    const constraints = [
      where('userId', '==', user.value.id),
      orderBy('startTime', 'desc')
    ];

    if (projectId) {
      constraints.push(where('projectId', '==', projectId));
    }

    const querySessions = query(collection(db, 'sessions'), ...constraints);

    unsubscribe.value = onSnapshot(
      querySessions,
      (snapshot) => {
        sessions.value = snapshot.docs.map(doc => {
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
      },
      (error) => {
        console.error('Erro ao escutar sessões:', error);
      }
    );
  };

  const addSession = async (session: Omit<Session, 'id' | 'userId' | 'createdAt'>) => {
    if (!user.value?.id) {
      throw new Error('Usuário não autenticado.');
    }

    const sessionData: Omit<Session, 'id'> = {
      ...session,
      userId: user.value.id,
      createdAt: serverTimestamp()
    };

    await addDoc(collection(db, 'sessions'), sessionData);
  };

  const updateSession = async (sessionId: string, updatedData: Partial<Session>) => {
    const sessionRef = doc(db, 'sessions', sessionId);

    await updateDoc(sessionRef, {
      ...updatedData,
      updatedAt: serverTimestamp()
    });
  };

  const deleteSession = async (sessionId: string) => {
    await deleteDoc(doc(db, 'sessions', sessionId));
  };

  const getSessionById = async (sessionId: string): Promise<Session | null> => {
    const sessionRef = doc(db, 'sessions', sessionId);
    
    const snapshot = await getDoc(sessionRef);

    if (!snapshot.exists()) return null;

    const data = snapshot.data();

    return {
      id: snapshot.id,
      ...data,
      createdAt: data.createdAt?.toDate() || null,
      updatedAt: data.updatedAt?.toDate() || null,
      startTime: data.startTime?.toDate() || null, 
      endTime: data.endTime?.toDate() || null, 
      date: data.date?.toDate() || null 
    } as Session;
  };

  const stopListeningSessions = () => {
    unsubscribe.value?.();
    unsubscribe.value = null;
  };

  const resetSessions = () => {
    sessions.value = [];
  };

  return {
    sessions,
    currentSession,
    fetchSessions,
    addSession,
    updateSession,
    deleteSession,
    getSessionById,
    stopListeningSessions,
    resetSessions,
    startSession,
    finishSession
  };
});
