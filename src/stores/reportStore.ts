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
  billingType: 'hourly' | 'fixed';
  billingAmount: number;
  estimatedDuration?: number;
  isBilled: boolean;
  isManual: boolean;
  duration: number;
  date: string;
}

interface FirestoreSessionData {
  userId: string;
  projectId: string;
  isBilled: boolean;
  isManual: boolean;
  duration: number;
  date: Timestamp;
}

interface ReportDay {
  date: string;
  totalSeconds: number;
  totalAmount: number;
  sessions: Session[];
}

function buildQueryConditions(
  userId: string,
  startDate?: Date,
  endDate?: Date,
  billedFilter: 'all' | 'billed' | 'unbilled' = 'all'
) {
  const conditions = [where('userId', '==', userId)];

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
}

function mapSnapshotToRawSessions(snapshot: Awaited<ReturnType<typeof getDocs>>) {
  return snapshot.docs.map(doc => {
    const data = doc.data() as FirestoreSessionData;

    return {
      userId: data.userId,
      projectId: data.projectId,
      isBilled: data.isBilled,
      isManual: data.isManual,
      duration: data.duration,
      date: data.date?.toDate().toISOString().split('T')[0] || '',
    };
  });
}

function enrichSessionsWithProjectData(
  rawSessions: Omit<Session, 'projectTitle' | 'billingType' | 'billingAmount'>[],
  projects: { id: string; title: string; billingType: 'hourly' | 'fixed'; billingAmount: number; estimatedDuration?: number; }[]
): Session[] {
  return rawSessions.map(session => {
    const project = projects.find(p => p.id === session.projectId);

    return {
      ...session,
      projectTitle: project?.title || '',
      billingType: project?.billingType || 'hourly',
      billingAmount: project?.billingAmount || 0,
      estimatedDuration: project?.estimatedDuration
    };
  });
}

function groupSessionsByDate(sessions: Session[]): Record<string, ReportDay> {
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

    grouped[session.date].totalSeconds += session.duration;
    grouped[session.date].totalAmount += calculateSessionAmount(session);
    grouped[session.date].sessions.push(session);
  }

  return grouped;
}

function calculateSessionAmount(session: Session): number {
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

  const currentMonthStats = computed(() => {
    const now = new Date();
    const yearMonth = now.toISOString().slice(0, 7); // formato YYYY-MM

    let totalSeconds = 0;
    let estimated = 0;
    let billed = 0;
    let toReceive = 0;

    reports.value
      .filter(r => r.date.startsWith(yearMonth))
      .forEach(day => {
        totalSeconds += day.totalSeconds;
        estimated += day.totalAmount;

        day.sessions.forEach(session => {
          const sessionAmount = calculateSessionAmount(session);
          if (session.isBilled) {
            billed += sessionAmount;
          } else {
            toReceive += sessionAmount;
          }
        });
      });

    return {
      totalSeconds,
      estimated,
      billed,
      toReceive
    };
  });

  const monthlySummary = computed(() => {
    const result: Record<string, { totalEarnings: number; totalTime: number }> = {};

    reports.value.forEach(report => {
      const month = report.date.slice(0, 7);
      if (!result[month]) {
        result[month] = {
          totalEarnings: 0,
          totalTime: 0
        };
      }

      result[month].totalTime += report.totalSeconds;

      for (const session of report.sessions) {
        result[month].totalEarnings += calculateSessionAmount(session);
      }
    });

    return result;
  });

  const fetchReports = async (
    startDate?: Date,
    endDate?: Date,
    billedFilter: 'all' | 'billed' | 'unbilled' = 'all'
  ): Promise<void> => {
    if (!user.value?.id) {
      throw new Error('Usuário não autenticado.');
    }

    const q = query(
      collection(db, 'sessions'),
      ...buildQueryConditions(user.value.id, startDate, endDate, billedFilter)
    );

    const snapshot = await getDocs(q);
    const rawSessions = mapSnapshotToRawSessions(snapshot);
    const sessions = enrichSessionsWithProjectData(rawSessions, projects.value);
    const groupedReports = groupSessionsByDate(sessions);

    reports.value = Object.values(groupedReports).sort((a, b) => b.date.localeCompare(a.date));
  };

  return {
    reports,
    fetchReports,
    totalTime,
    totalAmount,
    currentMonthStats,
    monthlySummary
  };
});
