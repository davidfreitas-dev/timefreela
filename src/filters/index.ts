import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
dayjs.locale('pt-br');

type FilterFunction = (value: string | number | null | undefined) => string;

const filters: Record<string, FilterFunction> = {
  formatCurrencyBRL(value) {
    const numericValue = typeof value === 'string' ? parseFloat(value) : value ?? 0;
    const valueInReais = numericValue / 100;
    return valueInReais.toLocaleString('pt-br', {
      style: 'currency',
      currency: 'BRL',
    });
  },
  formatDate(value: unknown) {
    return (value instanceof Date || dayjs.isDayjs(value))
      ? dayjs(value).format('DD [de] MMM [de] YYYY')
      : '--';
  },
  formatTime(value: unknown) {
    return (value instanceof Date || dayjs.isDayjs(value))
      ? dayjs(value).format('HH:mm')
      : '--';
  },
  formatDuration(value) {
    const seconds = typeof value === 'string' ? parseInt(value) : Number(value);
    if (isNaN(seconds) || seconds < 0) return '--';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}min`;
  },
};

export default filters;
