import { computed, type Ref } from 'vue';
import type { Session, Project } from '../types';
import { BillingType } from '../constants/billing';

export function useBilling(sessions: Ref<Session[]> | Session[], project: Ref<Project | null> | Project | null) {
  const sessionsRef = computed(() => Array.isArray(sessions) ? sessions : (sessions as Ref<Session[]>).value);
  const projectRef = computed(() => {
    if (!project) return null;
    if ('value' in project) return (project as Ref<Project | null>).value;
    return project as Project;
  });

  const totalSeconds = computed(() => {
    return sessionsRef.value.reduce((acc, session) => acc + session.duration, 0);
  });

  const getSessionValue = (session: Session) => {
    const p = projectRef.value;
    
    // Prioritize session billing data
    const billingType = session.billingType || p?.billingType;
    const billingAmount = session.billingAmount !== undefined ? session.billingAmount : p?.billingAmount;

    if (billingType === undefined || billingAmount === undefined) return 0;

    if (billingType === BillingType.HOURLY) {
      const hourlyRateInReais = billingAmount / 100;
      return (session.duration / 3600) * hourlyRateInReais;
    }

    if (billingType === BillingType.FIXED) {
      if (totalSeconds.value === 0) return 0;
      const totalAmountInReais = billingAmount / 100;
      return (session.duration / totalSeconds.value) * totalAmountInReais;
    }

    return 0;
  };

  const calculateTotalValue = (targetSessions: Session[]) => {
    return targetSessions.reduce((acc, session) => acc + getSessionValue(session), 0);
  };

  const estimatedValueRaw = computed(() => {
    const p = projectRef.value;
    if (!p) return calculateTotalValue(sessionsRef.value);
    
    // For FIXED projects, we might want to show the full fixed amount as "estimated"
    if (p.billingType === BillingType.FIXED) return p.billingAmount / 100;
    
    return calculateTotalValue(sessionsRef.value);
  });

  const billedValueRaw = computed(() => {
    const billedSessions = sessionsRef.value.filter(s => s.isBilled);
    return calculateTotalValue(billedSessions);
  });

  const pendingValueRaw = computed(() => {
    const pendingSessions = sessionsRef.value.filter(s => !s.isBilled);
    return calculateTotalValue(pendingSessions);
  });

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  return {
    totalSeconds,
    estimatedValue: computed(() => formatCurrency(estimatedValueRaw.value)),
    billedValue: computed(() => formatCurrency(billedValueRaw.value)),
    pendingValue: computed(() => formatCurrency(pendingValueRaw.value)),
    estimatedRaw: estimatedValueRaw,
    billedRaw: billedValueRaw,
    pendingRaw: pendingValueRaw,
  };
}
