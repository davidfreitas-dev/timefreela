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

  const billedSeconds = computed(() => {
    return sessionsRef.value
      .filter(s => s.isBilled)
      .reduce((acc, s) => acc + s.duration, 0);
  });

  const pendingSeconds = computed(() => {
    return sessionsRef.value
      .filter(s => !s.isBilled)
      .reduce((acc, s) => acc + s.duration, 0);
  });

  const calculateValue = (seconds: number) => {
    const p = projectRef.value;
    if (!p) return 0;
    
    if (p.billingType === BillingType.HOURLY) {
      const hourlyRateInReais = p.billingAmount / 100;
      return (seconds / 3600) * hourlyRateInReais;
    }
    
    if (p.billingType === BillingType.FIXED) {
      if (totalSeconds.value === 0) return 0;
      const totalAmountInReais = p.billingAmount / 100;
      return (seconds / totalSeconds.value) * totalAmountInReais;
    }
    
    return 0;
  };

  const estimatedValueRaw = computed(() => {
    const p = projectRef.value;
    if (!p) return 0;
    if (p.billingType === BillingType.FIXED) return p.billingAmount / 100;
    return calculateValue(totalSeconds.value);
  });

  const billedValueRaw = computed(() => calculateValue(billedSeconds.value));
  const pendingValueRaw = computed(() => calculateValue(pendingSeconds.value));

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
