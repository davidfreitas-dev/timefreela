import { defineStore, storeToRefs } from 'pinia';
import { ref, type Ref } from 'vue';
import type { Unsubscribe } from 'firebase/firestore';
import { useUserStore } from '@/stores/userStore';
import { useProjectStore } from '@/stores/projectStore';
import { sessionService } from '@/services/sessionService';
import type { Session, NewSession, SessionFirestoreData } from '@/types';

export const useSessionStore = defineStore('sessionStore', () => {
  const { user } = storeToRefs(useUserStore());
  const projectStore = useProjectStore();
  
  const unsubscribe: Ref<Unsubscribe | null> = ref(null);
  const activeSession: Ref<NewSession | null> = ref(null);
  const items: Ref<Session[]> = ref([]);
  const currentLimit = ref(100);
  const hasMore = ref(false);

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
        { projectId, startDate, endDate, limit: currentLimit.value },
        (updatedSessions) => {
          items.value = updatedSessions;
          // Se o número de itens for igual ao limite atual, assumimos que pode haver mais.
          // Uma forma mais precisa seria buscar limit + 1, mas para uma UI simples de "Load More", isso costuma bastar.
          hasMore.value = updatedSessions.length === currentLimit.value;
          resolve();
        },
        (error) => {
          console.error('Erro ao escutar sessões:', error);
          reject(error);
        }
      );
    });
  };

  const loadMore = async (
    userId: string,
    projectId?: string,
    startDate?: Date,
    endDate?: Date
  ) => {
    currentLimit.value += 100;
    await fetchAll(userId, projectId, startDate, endDate);
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
    const project = projectStore.items.find(p => p.id === session.projectId);
    
    const sessionData = {
      ...session,
      userId: getUserId(),
      projectTitle: project?.title || 'Projeto não encontrado',
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

    const project = projectStore.items.find(p => p.id === activeSession.value?.projectId);
    const now = new Date();

    const sessionData = {
      ...activeSession.value,
      userId: getUserId(),
      projectTitle: project?.title || 'Projeto não encontrado',
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
    currentLimit,
    hasMore,
    fetchAll,
    loadMore,
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