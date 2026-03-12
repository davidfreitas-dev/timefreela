import { defineStore, storeToRefs } from 'pinia';
import { ref, computed } from 'vue';
import { useUserStore } from '@/stores/userStore';
import { useProjectStore } from '@/stores/projectStore';
import { reportService, type ReportDay, type ReportProjectGroup } from '@/services/reportService';

export const useReportStore = defineStore('reportStore', () => {
  const { user } = storeToRefs(useUserStore());
  const projectStore = useProjectStore();
  const { items: projects } = storeToRefs(projectStore);
  const reports = ref<ReportDay[]>([]);
  const groups = ref<ReportProjectGroup[]>([]);

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
          const sessionAmount = reportService.calculateSessionAmount(session);
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

  const yearStats = computed(() => {
    let totalSeconds = 0;
    let estimated = 0;
    let billed = 0;
    let toReceive = 0;

    reports.value
      .forEach(day => {
        totalSeconds += day.totalSeconds;
        estimated += day.totalAmount;

        day.sessions.forEach(session => {
          const sessionAmount = reportService.calculateSessionAmount(session);
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
        result[month].totalEarnings += reportService.calculateSessionAmount(session);
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

    const data = await reportService.getReportsData(
      user.value.id,
      projects.value,
      startDate,
      endDate,
      billedFilter
    );

    reports.value = data.reports;
    groups.value = data.groups;
  };

  const getYearsWithData = async (): Promise<number[]> => {
    if (!user.value?.id) {
      throw new Error('Usuário não autenticado.');
    }

    return reportService.getYearsWithData(user.value.id);
  };

  const downloadCsv = async () => {
    console.log('Download CSV not yet implemented');
  };

  const downloadPdf = async () => {
    console.log('Download PDF not yet implemented');
  };

  return {
    reports,
    groups,
    fetchReports,
    getYearsWithData,
    downloadCsv,
    downloadPdf,
    totalTime,
    totalAmount,
    currentMonthStats,
    yearStats,
    monthlySummary
  };
});