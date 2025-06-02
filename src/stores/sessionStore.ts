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
import type { SessionFirestoreData, Session, NewSession } from '@/types/session';

export const useSessionStore = defineStore('sessionStore', () => {
  const { user } = storeToRefs(useUserStore());
  
  const unsubscribe: Ref<Unsubscribe | null> = ref(null);
  const activeSession: Ref<NewSession | null> = ref(null);
  const sessions: Ref<Session[]> = ref([]);

  const getUserId = (): string => {
    if (!user.value?.id) throw new Error('Usuário não autenticado.');
    return user.value.id;
  };

  const listenToSessions = async (projectId?: string): Promise<void> => {
    if (unsubscribe.value) {
      unsubscribe.value();
    }

    const constraints = [
      where('userId', '==', getUserId()),
      orderBy('startTime', 'desc')
    ];

    if (projectId) {
      constraints.push(where('projectId', '==', projectId));
    }

    const querySessions = query(collection(db, 'sessions'), ...constraints);

    return new Promise<void>((resolve, reject) => {
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
          resolve();
        },
        (error) => {
          console.error('Erro ao escutar sessões:', error);
          reject(error);
        }
      );
    });
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

  const startSession = (projectId: string): void => {
    activeSession.value = {
      projectId,
      duration: 0,
      isManual: false,
      isBilled: false,
      startTime: new Date(),
      endTime: null,
      date: null,
    };
  };

  const addSession = async (session: NewSession): Promise<void> => {
    const sessionData: SessionFirestoreData = {
      ...session,
      userId: getUserId(),
      createdAt: serverTimestamp()
    };

    await addDoc(collection(db, 'sessions'), sessionData);
  };

  const updateSession = async (sessionId: string, updatedData: Partial<Session>): Promise<void> => {
    const sessionRef = doc(db, 'sessions', sessionId);

    await updateDoc(sessionRef, {
      ...updatedData,
      updatedAt: serverTimestamp()
    });
  };

  const deleteSession = async (sessionId: string): Promise<void> => {
    await deleteDoc(doc(db, 'sessions', sessionId));
  };

  const finishSession = async () => {
    if (!activeSession.value) return;

    const now = new Date();

    const session: SessionFirestoreData = {
      ...activeSession.value,
      userId: getUserId(),
      endTime: now,
      date: now,
      createdAt: serverTimestamp()
    };

    addSession(session);

    activeSession.value = null;
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
    activeSession,
    listenToSessions,
    getSessionById,
    startSession,
    addSession,
    updateSession,
    deleteSession,
    finishSession,
    stopListeningSessions,
    resetSessions
  };
}, {
  persist: {
    key: 'sessionStore',
    storage: localStorage,
    serializer: {
      serialize: (state) => {
        return JSON.stringify({
          activeSession: state.activeSession,
        });
      },
      deserialize: (value) => {
        const parsed = JSON.parse(value);
        const session = parsed?.activeSession;

        if (!session) return { activeSession: null };

        return {
          activeSession: {
            ...session,
            date: session.date ? new Date(session.date) : null,
            endTime: session.endTime ? new Date(session.endTime) : null,
            startTime: session.startTime ? new Date(session.startTime) : null,
          }
        };
      }
    }
  }
});
