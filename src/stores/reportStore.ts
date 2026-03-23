import { defineStore, storeToRefs } from 'pinia';
import { ref, computed } from 'vue';
import { useUserStore } from '@/stores/userStore';
import { useProjectStore } from '@/stores/projectStore';
import { reportService, type ReportDay, type ReportProjectGroup, type EnrichedSession } from '@/services/reportService';
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
  const yearlyReports = ref<ReportDay[]>([]);

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

  const yearlyMonthlySummary = computed(() => {
    const result: Record<string, { totalEarnings: number; totalTime: number }> = {};

    yearlyReports.value.forEach(report => {
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

  const yearlySummary = computed(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const earnings = new Array(12).fill(0);
    const time = new Array(12).fill(0);

    yearlyReports.value.forEach(report => {
      const date = dayjs(report.date);
      const monthIndex = date.month();
      
      time[monthIndex] += report.totalSeconds / 3600; // converter para horas decimais
      earnings[monthIndex] += report.totalAmount / 100; // converter centavos para reais
    });

    return {
      labels: months,
      earnings,
      time
    };
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

  const fetchYearlyReports = async (year: number): Promise<void> => {
    if (!user.value?.id) return;
    
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);
    
    const data = await reportService.getReportsData(
      user.value.id,
      projects.value,
      startDate,
      endDate
    );
    
    yearlyReports.value = data.reports;
  };

  const getYearsWithData = async (): Promise<number[]> => {
    if (!user.value?.id) {
      throw new Error('Usuário não autenticado.');
    }

    return reportService.getYearsWithData(user.value.id);
  };

  const downloadCsv = async () => {
    // 1. Coleta todas as sessões em um array flat
    const allSessions: EnrichedSession[] = [];
    reports.value.forEach(day => {
      day.sessions.forEach(session => {
        allSessions.push(session);
      });
    });

    if (allSessions.length === 0) return;

    // 2. Define o cabeçalho (Excel pt-BR prefere ponto e vírgula)
    const header = [
      'Data',
      'Projeto',
      'Inicio',
      'Fim',
      'Duracao (HH:mm)',
      'Duracao (Segundos)',
      'Valor (BRL)',
      'Status',
      'Tipo de Cobranca',
      'Valor Unitario'
    ].join(';');

    // 3. Formata as linhas
    const rows = allSessions.map(s => {
      const amount = reportService.calculateSessionAmount(s) / 100;
      const unitValue = s.billingAmount / 100;
      const billingType = s.billingType === 'hourly' ? 'Por Hora' : 'Valor Fixo';
      const status = s.isBilled ? 'Faturado' : 'Pendente';
      
      return [
        dayjs(s.date).format('DD/MM/YYYY'),
        `"${(s.projectTitle || '').replace(/"/g, '""')}"`,
        s.startTime ? dayjs(s.startTime).format('HH:mm') : '-',
        s.endTime ? dayjs(s.endTime).format('HH:mm') : '-',
        formatDuration(s.duration),
        s.duration,
        amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        status,
        billingType,
        unitValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      ].join(';');
    });

    // 4. Cria o conteúdo do arquivo com BOM para UTF-8 (Excel reconhece acentos)
    const csvContent = [header, ...rows].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // 5. Aciona o download
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_timefreela_${dayjs().format('YYYY-MM-DD')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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

  const downloadJsonBackup = async () => {
    if (!user.value?.id) return;

    // 1. Buscar todas as sessões brutas
    const allSessions = await reportService.getRawSessions(user.value.id);
    
    // 2. Preparar o objeto de backup
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      user: {
        id: user.value.id,
        name: user.value.name,
        email: user.value.email
      },
      projects: projects.value,
      sessions: allSessions
    };

    // 3. Criar blob e download
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `timefreela_backup_${dayjs().format('YYYY-MM-DD')}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    reports.value = [];
    groups.value = [];
    yearlyReports.value = [];
  };

  return {
    reports,
    groups,
    yearlyReports,
    fetchReports,
    fetchYearlyReports,
    getYearsWithData,
    downloadCsv,
    downloadPdf,
    downloadJsonBackup,
    totalTime,
    totalAmount,
    currentMonthStats,
    yearStats,
    monthlySummary,
    yearlyMonthlySummary,
    yearlySummary,
    reset,
    calculateSessionAmount: reportService.calculateSessionAmount,
  };
});
