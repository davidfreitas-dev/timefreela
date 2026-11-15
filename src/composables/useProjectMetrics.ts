import { computed, type MaybeRefOrGetter, toValue } from 'vue';
import type { Project, Session } from '@/types';
import { BillingType } from '@/constants/billing';

export interface ProjectStats {
  totalSeconds: number;
  sessionCount: number;
  isFixed: boolean;
  realHourlyRate: number | null; // em centavos por hora
  plannedHourlyRate: number | null; // em centavos por hora
  profitabilityVariance: number | null; // % vs estimativa planejada (+X% ou -X%)
  profitabilityStatus: 'lucrative' | 'deficit' | 'on-track' | 'neutral';
}

export function useProjectMetrics(
  projects: MaybeRefOrGetter<Project[]>,
  sessions: MaybeRefOrGetter<Session[]>
) {
  const projectsList = computed(() => toValue(projects) || []);
  const sessionsList = computed(() => toValue(sessions) || []);

  // Map of project ID to aggregated stats
  const projectStatsMap = computed(() => {
    const map = new Map<string, ProjectStats>();

    for (const project of projectsList.value) {
      const projectSessions = sessionsList.value.filter(s => s.projectId === project.id);
      const totalSeconds = projectSessions.reduce((acc, s) => acc + (s.duration || 0), 0);
      const sessionCount = projectSessions.length;
      const isFixed = project.billingType === BillingType.FIXED || (project.billingType as string) === 'fixed';

      let realHourlyRate: number | null = null;
      let plannedHourlyRate: number | null = null;
      let profitabilityVariance: number | null = null;
      let profitabilityStatus: 'lucrative' | 'deficit' | 'on-track' | 'neutral' = 'neutral';

      if (isFixed) {
        // Taxa Real = Valor Fixo Total / Horas Efetivamente Trabalhadas
        if (totalSeconds > 0) {
          realHourlyRate = Math.round((project.billingAmount * 3600) / totalSeconds);
        }

        // Taxa Planejada = Valor Fixo Total / Horas Estimadas
        if (project.estimatedDuration && project.estimatedDuration > 0) {
          plannedHourlyRate = Math.round((project.billingAmount * 3600) / project.estimatedDuration);
        }

        if (realHourlyRate !== null && plannedHourlyRate !== null && plannedHourlyRate > 0) {
          profitabilityVariance = ((realHourlyRate - plannedHourlyRate) / plannedHourlyRate) * 100;
          if (profitabilityVariance >= 5) {
            profitabilityStatus = 'lucrative';
          } else if (profitabilityVariance <= -5) {
            profitabilityStatus = 'deficit';
          } else {
            profitabilityStatus = 'on-track';
          }
        }
      } else {
        // Projeto por hora: taxa é o próprio valor/hora contratado
        realHourlyRate = project.billingAmount;
        plannedHourlyRate = project.billingAmount;
        profitabilityStatus = 'neutral';
      }

      map.set(project.id, {
        totalSeconds,
        sessionCount,
        isFixed,
        realHourlyRate,
        plannedHourlyRate,
        profitabilityVariance,
        profitabilityStatus,
      });
    }

    return map;
  });

  const getStats = (projectId: string): ProjectStats => {
    return (
      projectStatsMap.value.get(projectId) || {
        totalSeconds: 0,
        sessionCount: 0,
        isFixed: false,
        realHourlyRate: null,
        plannedHourlyRate: null,
        profitabilityVariance: null,
        profitabilityStatus: 'neutral',
      }
    );
  };

  // Resumo geral
  const summary = computed(() => {
    const all = projectsList.value;
    const totalProjects = all.length;
    const activeProjectsCount = all.filter(p => p.active).length;
    const fixedProjects = all.filter(p => p.billingType === BillingType.FIXED || (p.billingType as string) === 'fixed');
    const fixedProjectsCount = fixedProjects.length;

    // Calcular Taxa Real Média Ponderada em Projetos de Valor Fixo com horas trabalhadas
    let totalFixedAmount = 0;
    let totalFixedSeconds = 0;

    for (const p of fixedProjects) {
      const stats = projectStatsMap.value.get(p.id);
      if (stats && stats.totalSeconds > 0) {
        totalFixedAmount += p.billingAmount;
        totalFixedSeconds += stats.totalSeconds;
      }
    }

    const averageRealHourlyRateFixed =
      totalFixedSeconds > 0 ? Math.round((totalFixedAmount * 3600) / totalFixedSeconds) : null;

    return {
      totalProjects,
      activeProjectsCount,
      fixedProjectsCount,
      averageRealHourlyRateFixed,
    };
  });

  return {
    projectStatsMap,
    getStats,
    summary,
  };
}
