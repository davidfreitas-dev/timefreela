import { defineStore, storeToRefs } from 'pinia';
import { ref, computed } from 'vue';
import { collection, getDocs, query, Timestamp, where } from 'firebase/firestore';
import { db } from '@/services/firestore';
import { useUserStore } from '@/stores/userStore';
import { useProjectStore } from '@/stores/projectStore';

interface Session {
  userId: string;
  projectId: string;
  projectTitle: string;
  hourlyRate: number;
  duration: number;
  isBilled: boolean;
  isManual: boolean;
  date: string; // YYYY-MM-DD
}

interface ReportDay {
  date: string;
  totalSeconds: number;
  totalAmount: number;
  sessions: Session[];
}

export const useReportStore = defineStore('reportStore', () => {
  const { user } = storeToRefs(useUserStore());
  const { projects } = storeToRefs(useProjectStore());
  const reports = ref<ReportDay[]>([]);

  const totalTime = computed(() =>
    reports.value.reduce((sum, day) => sum + day.totalSeconds, 0)
  );

  const totalAmount = computed(() =>
    reports.value.reduce((sum, day) => sum + day.totalAmount, 0)
  );

  const fetchReports = async (
    startDate?: Date,
    endDate?: Date,
    billedFilter: 'all' | 'billed' | 'unbilled' = 'all'
  ): Promise<void> => {
    if (!user.value?.id) {
      throw new Error('Usuário não autenticado.');
    }

    const sessionsRef = collection(db, 'sessions');
    const conditions = [where('userId', '==', user.value.id)];

    if (startDate && endDate) {
      const startTimestamp = Timestamp.fromDate(startDate);
      endDate.setHours(23, 59, 59, 999);
      const endTimestamp = Timestamp.fromDate(endDate);

      conditions.push(where('date', '>=', startTimestamp));
      conditions.push(where('date', '<=', endTimestamp));
    }

    if (billedFilter === 'billed') conditions.push(where('isBilled', '==', true));
    if (billedFilter === 'unbilled') conditions.push(where('isBilled', '==', false));
    
    const q = query(sessionsRef, ...conditions);
    const snapshot = await getDocs(q);

    const rawSessions: Omit<Session, 'hourlyRate' | 'projectTitle'>[] = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      rawSessions.push({
        userId: data.userId,
        projectId: data.projectId,
        duration: data.duration,
        date: data.date?.toDate().toISOString().split('T')[0] || '',
        isBilled: data.isBilled,
        isManual: data.isManual
      });
    });

    const sessions: Session[] = rawSessions.map(session => {
      const project = projects.value.find(p => p.id === session.projectId);
      return {
        ...session,
        projectTitle: project?.title || '',
        hourlyRate: project?.hourlyRate || 0
      };
    });

    const grouped: Record<string, ReportDay> = {};
    for (const session of sessions) {
      if (!grouped[session.date]) {
        grouped[session.date] = {
          date: session.date,
          totalSeconds: 0,
          totalAmount: 0,
          sessions: []
        };
      }
      const { duration, hourlyRate } = session;
      grouped[session.date].totalSeconds += duration;
      grouped[session.date].totalAmount += (duration / 3600) * hourlyRate;
      grouped[session.date].sessions.push(session);
    }

    reports.value = Object.values(grouped).sort((a, b) => b.date.localeCompare(a.date));
  };

  return {
    reports,
    fetchReports,
    totalTime,
    totalAmount
  };
});
