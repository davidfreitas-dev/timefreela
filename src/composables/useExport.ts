import { ref } from 'vue';
import { useReportStore } from '../stores/reportStore';

export function useExport() {
  const reportStore = useReportStore();
  const isExporting = ref(false);

  const exportCsv = async () => {
    isExporting.value = true;
    try {
      await reportStore.downloadCsv();
    } finally {
      isExporting.value = false;
    }
  };

  const exportPdf = async () => {
    isExporting.value = true;
    try {
      await reportStore.downloadPdf();
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
