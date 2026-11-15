import { defineStore, storeToRefs } from 'pinia';
import { ref, toRaw, markRaw, type Ref } from 'vue';
import type { Unsubscribe, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { useUserStore } from '@/stores/userStore';
import { useProjectStore } from '@/stores/projectStore';
import { sessionService } from '@/services/sessionService';
import type { Session, NewSession, SessionFirestoreData, Project } from '@/types';

export const useSessionStore = defineStore('sessionStore', () => {
  const { user } = storeToRefs(useUserStore());
  const projectStore = useProjectStore();

  const unsubscribe: Ref<Unsubscribe | null> = ref(null);
  const activeSession: Ref<NewSession | null> = ref(null);
  const items: Ref<Session[]> = ref([]);

  // Estado da paginação por cursores no Firestore
  const paginatedItems: Ref<Session[]> = ref([]);
  const totalCount = ref(0);
  const currentPage = ref(1);
  const pageSize = ref(15);
  const hasMore = ref(false);

  // Mapa nativo puro (NÃO reativo) para armazenar os cursores brutos do Firestore
  // Isso evita que o Vue envolva o DocumentSnapshot em um Proxy, o que quebrava o structuredClone no IndexedDB
  const pageCursors = new Map<number, QueryDocumentSnapshot<DocumentData> | null>([[1, null]]);

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

  const resetPagination = () => {
    currentPage.value = 1;
    pageCursors.clear();
    pageCursors.set(1, null);
  };

  const fetchPaginated = async (
    userId: string,
    page: number = 1,
    filters: { projectId?: string; startDate?: Date; endDate?: Date; isBilled?: boolean } = {}
  ) => {
    const rawCursor = page > 1 ? (pageCursors.get(page) || null) : null;
    const cleanCursor = rawCursor ? markRaw(toRaw(rawCursor)) : null;

    const result = await sessionService.getPaginatedSessions(
      userId,
      pageSize.value,
      cleanCursor,
      filters
    );

    paginatedItems.value = result.sessions;
    items.value = result.sessions;
    totalCount.value = result.totalCount;
    currentPage.value = page;
    hasMore.value = result.hasMore;

    if (result.lastVisibleDoc) {
      pageCursors.set(page + 1, markRaw(toRaw(result.lastVisibleDoc)));
    }

    return result;
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

    const sessionData: SessionFirestoreData = {
      ...session,
      userId: getUserId(),
      projectTitle: project?.title || 'Projeto não encontrado',
      billingType: project?.billingType,
      billingAmount: project?.billingAmount,
    };

    return sessionService.createSession(sessionData);
  };

  const update = async (sessionId: string, updatedData: Partial<Session>): Promise<void> => {
    const dataToUpdate: Partial<SessionFirestoreData> = { ...updatedData } as Partial<SessionFirestoreData>;
    const currentSession = items.value.find(s => s.id === sessionId);

    // Only update project details and billing snapshots if the project actually changed
    if (updatedData.projectId && updatedData.projectId !== currentSession?.projectId) {
      const project = projectStore.items.find(p => p.id === updatedData.projectId);
      if (project) {
        dataToUpdate.projectTitle = project.title;
        dataToUpdate.billingType = project.billingType;
        dataToUpdate.billingAmount = project.billingAmount;
      }
    } else {
      // Preserve existing historical billing snapshot
      delete dataToUpdate.billingType;
      delete dataToUpdate.billingAmount;
    }

    await sessionService.updateSession(sessionId, dataToUpdate);
  };

  const remove = async (sessionId: string): Promise<void> => {
    await sessionService.deleteSession(sessionId);
  };

  const finishSession = async () => {
    if (!activeSession.value) return;

    const project = projectStore.items.find(p => p.id === activeSession.value?.projectId);
    const now = new Date();

    const sessionData: SessionFirestoreData = {
      ...activeSession.value,
      userId: getUserId(),
      projectTitle: project?.title || 'Projeto não encontrado',
      billingType: project?.billingType,
      billingAmount: project?.billingAmount,
      endTime: now,
      date: now,
    };

    await sessionService.createSession(sessionData);

    activeSession.value = null;
  };

  const setBillingStatus = async (selectedIds: string[], isBilled: boolean): Promise<void> => {
    await sessionService.setSessionsBillingStatus(selectedIds, isBilled);
  };

  const markBilled = async (selectedIds: string[]): Promise<void> => {
    await setBillingStatus(selectedIds, true);
  };

  const markUnbilled = async (selectedIds: string[]): Promise<void> => {
    await setBillingStatus(selectedIds, false);
  };

  const stopListeningSessions = () => {
    unsubscribe.value?.();
    unsubscribe.value = null;
  };

  const reset = () => {
    stopListeningSessions();
    items.value = [];
    activeSession.value = null;
  };

  const restoreSessions = async (userId: string, sessionsToRestore: Session[], projects: Project[]) => {
    try {
      // Stop listening to prevent conflicts during restore
      stopListeningSessions();
      await sessionService.restore(userId, sessionsToRestore, projects);
      // No need to fetch here, the page will be reloaded by the composable
    } catch (error) {
      console.error('Erro ao restaurar sessões:', error);
      throw error;
    }
  };

  return {
    items,
    paginatedItems,
    totalCount,
    currentPage,
    pageSize,
    hasMore,
    activeSession,
    fetchAll,
    fetchOne,
    fetchPaginated,
    resetPagination,
    startSession,
    create,
    update,
    remove,
    finishSession,
    markBilled,
    markUnbilled,
    setBillingStatus,
    stopListeningSessions,
    reset,
    restoreSessions,
  };
}, {
  persist: {
    key: 'sessionStore',
    storage: sessionStorage,
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