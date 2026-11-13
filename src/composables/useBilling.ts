import { computed, type Ref } from 'vue';
import type { Session, Project } from '../types';
import { reportService } from '../services/reportService';
import filters from '../filters';

export function useBilling(sessions: Ref<Session[]> | Session[], project?: Ref<Project | null> | Project | null) {
  const sessionsRef = computed(() => Array.isArray(sessions) ? sessions : (sessions as Ref<Session[]>).value);
  const projectRef = computed(() => {
    if (!project) return null;
    if ('value' in project) return (project as Ref<Project | null>).value;
    return project as Project;
  });

  const totalSeconds = computed(() => {
    return sessionsRef.value.reduce((acc, session) => acc + session.duration, 0);
  });

  const getSessionAmount = (session: Session) => {
    const p = projectRef.value;
    return reportService.calculateSessionAmount({
      ...session,
      billingType: session.billingType || p?.billingType,
      billingAmount: session.billingAmount !== undefined ? session.billingAmount : p?.billingAmount,
    }, totalSeconds.value);
  };

  const calculateTotalValue = (targetSessions: Session[]) => {
    return targetSessions.reduce((acc, session) => acc + getSessionAmount(session), 0);
  };

  const billedSessions = computed(() => sessionsRef.value.filter(s => s.isBilled));
  const pendingSessions = computed(() => sessionsRef.value.filter(s => !s.isBilled));

  const totalValueCents = computed(() => calculateTotalValue(sessionsRef.value));
  const billedValueCents = computed(() => calculateTotalValue(billedSessions.value));
  const pendingValueCents = computed(() => calculateTotalValue(pendingSessions.value));

  return {
    totalSeconds,
    totalValueCents,
    billedValueCents,
    pendingValueCents,
    totalValueFormatted: computed(() => filters.formatCurrencyBRL(totalValueCents.value)),
    billedValueFormatted: computed(() => filters.formatCurrencyBRL(billedValueCents.value)),
    pendingValueFormatted: computed(() => filters.formatCurrencyBRL(pendingValueCents.value)),
    getSessionAmount,
  };
}
