import { defineStore, storeToRefs } from 'pinia';
import { ref, computed } from 'vue';
import { useUserStore } from '@/stores/userStore';
import { useProjectStore } from '@/stores/projectStore';
import { reportService, type ReportDay, type ReportProjectGroup } from '@/services/reportService';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import dayjs from 'dayjs';

export const useReportStore = defineStore('reportStore', () => {
  const userStore = useUserStore();
  const { user } = storeToRefs(userStore);
  const projectStore = useProjectStore();
  const { items: projects } = storeToRefs(projectStore);
  const reports = ref<ReportDay[]>([]);
  const groups = ref<ReportProjectGroup[]>([]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value / 100);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

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
    if (!user.value) return;

    interface JsPDFWithAutoTable extends jsPDF {
      lastAutoTable: {
        finalY: number;
      };
    }

    const doc = new jsPDF() as JsPDFWithAutoTable;
    const pageWidth = doc.internal.pageSize.getWidth();
    const primaryColor: [number, number, number] = [3, 141, 231];

    // 1. Cabeçalho
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('Relatório de Tempo e Faturamento', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${dayjs().format('DD/MM/YYYY HH:mm')}`, pageWidth - 14, 22, { align: 'right' });

    // Informações do Profissional
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');
    doc.text(user.value.name || 'Freelancer', 14, 35);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(user.value.email || '', 14, 40);

    // Linha divisória
    doc.setDrawColor(230);
    doc.line(14, 45, pageWidth - 14, 45);

    // 2. Resumo Geral
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo do Período', 14, 55);

    const summaryData = [
      ['Total de Horas', formatDuration(totalTime.value)],
      ['Receita Total', formatCurrency(totalAmount.value)],
    ];

    autoTable(doc, {
      startY: 60,
      head: [],
      body: summaryData,
      theme: 'plain',
      styles: { fontSize: 11, cellPadding: 2 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } }
    });

    let currentY = doc.lastAutoTable.finalY + 15;

    // 3. Detalhamento por Projeto
    groups.value.forEach((group) => {
      // Verificar se cabe na página
      if (currentY > 240) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      doc.text(group.project.title, 14, currentY);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      const billingType = group.project.billingType === 'hourly' ? 'Por Hora' : 'Valor Fixo';
      doc.text(`${billingType} - ${formatCurrency(group.project.billingAmount)}${group.project.billingType === 'hourly' ? '/h' : ''}`, 14, currentY + 6);

      doc.setTextColor(0);
      autoTable(doc, {
        startY: currentY + 10,
        head: [['Data', 'Duração', 'Início', 'Fim', 'Valor', 'Status']],
        body: group.sessions.map(s => [
          dayjs(s.date).format('DD/MM/YYYY'),
          formatDuration(s.duration),
          s.startTime ? dayjs(s.startTime).format('HH:mm') : '-',
          s.endTime ? dayjs(s.endTime).format('HH:mm') : '-',
          formatCurrency(reportService.calculateSessionAmount(s)),
          s.isBilled ? 'Faturado' : 'Pendente'
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [240, 240, 240], textColor: [50, 50, 50], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [252, 252, 252] },
        margin: { left: 14, right: 14 }
      });

      currentY = doc.lastAutoTable.finalY + 10;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`Subtotal do Projeto: ${formatDuration(group.subtotalSeconds)} | ${formatCurrency(group.subtotalValue)}`, pageWidth - 14, currentY, { align: 'right' });
      
      currentY += 15;
    });

    // Rodapé em todas as páginas
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`TimeFreela - Gestão de Tempo para Freelancers | Página ${i} de ${pageCount}`, pageWidth / 2, 287, { align: 'center' });
    }

    doc.save(`relatorio_timefreela_${dayjs().format('YYYY-MM-DD')}.pdf`);
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