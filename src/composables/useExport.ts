import { ref } from 'vue';
import { useReportStore } from '../stores/reportStore';

export function useExport() {
  const reportStore = useReportStore();
  const isExporting = ref(false);

  const exportCsv = async (search: string = '', billedFilter: 'all' | 'billed' | 'unbilled' = 'all') => {
    isExporting.value = true;
    try {
      await reportStore.downloadCsv(search, billedFilter);
    } finally {
      isExporting.value = false;
    }
  };

  const exportPdf = async (search: string = '', billedFilter: 'all' | 'billed' | 'unbilled' = 'all') => {
    isExporting.value = true;
    try {
      await reportStore.downloadPdf(search, billedFilter);
    } finally {
      isExporting.value = false;
    }
  };

  return {
    exportCsv,
    exportPdf,
    isExporting
  };
}
