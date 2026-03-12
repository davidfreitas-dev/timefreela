import { defineStore, storeToRefs } from 'pinia';
import { ref, type Ref } from 'vue';
import type { Unsubscribe } from 'firebase/firestore';
import { useUserStore } from '@/stores/userStore';
import { sessionService } from '@/services/sessionService';
import type { Session, NewSession, SessionFirestoreData } from '@/types';

export const useSessionStore = defineStore('sessionStore', () => {
  const { user } = storeToRefs(useUserStore());
  
  const unsubscribe: Ref<Unsubscribe | null> = ref(null);
  const activeSession: Ref<NewSession | null> = ref(null);
  const items: Ref<Session[]> = ref([]);

  const getUserId = (): string => {
    if (!user.value?.id) throw new Error('Usuário não autenticado.');
    return user.value.id;
  };

  const fetchAll = async (
    userId: string,
    projectId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<void> => {
    if (unsubscribe.value) unsubscribe.value();

    return new Promise<void>((resolve, reject) => {
      unsubscribe.value = sessionService.listenToSessions(
        userId,
        { projectId, startDate, endDate },
        (updatedSessions) => {
          items.value = updatedSessions;
          resolve();
        },
        (error) => {
          console.error('Erro ao escutar sessões:', error);
          reject(error);
        }
      );
    });
  };

  const fetchOne = async (sessionId: string): Promise<Session | null> => {
    return sessionService.getSessionById(sessionId);
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

  const create = async (session: NewSession): Promise<string> => {
    const sessionData = {
      ...session,
      userId: getUserId(),
    } as unknown as SessionFirestoreData;

    return sessionService.createSession(sessionData);
  };

  const update = async (sessionId: string, updatedData: Partial<Session>): Promise<void> => {
    await sessionService.updateSession(sessionId, updatedData as Partial<SessionFirestoreData>);
  };

  const remove = async (sessionId: string): Promise<void> => {
    await sessionService.deleteSession(sessionId);
  };

  const finishSession = async () => {
    if (!activeSession.value) return;

    const now = new Date();

    const sessionData = {
      ...activeSession.value,
      userId: getUserId(),
      endTime: now,
      date: now,
    } as unknown as SessionFirestoreData;

    await sessionService.createSession(sessionData);

    activeSession.value = null;
  };

  const markBilled = async (selectedIds: string[]): Promise<void> => {
    await sessionService.markSessionsAsBilled(selectedIds);
  };

  const stopListeningSessions = () => {
    unsubscribe.value?.();
    unsubscribe.value = null;
  };

  const resetSessions = () => {
    items.value = [];
  };

  return {
    items,
    activeSession,
    fetchAll,
    fetchOne,
    startSession,
    create,
    update,
    remove,
    finishSession,
    markBilled,
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