import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import dayjs from '@/lib/dayjs';

export interface InvoiceIssuer {
  name: string;
  document: string; // CPF ou CNPJ
  email: string;
  phone?: string;
  address?: string;
}

export interface InvoiceClient {
  name: string;
  document?: string;
  email?: string;
  address?: string;
}

export interface InvoicePaymentInfo {
  pixKeyType: 'email' | 'cpf' | 'cnpj' | 'phone' | 'random';
  pixKey: string;
  pixBeneficiary?: string;
  bankName?: string;
  bankAgency?: string;
  bankAccount?: string;
  dueDate: string; // YYYY-MM-DD ou formato legível
  notes?: string;
}

export interface InvoiceData {
  invoiceNumber: string; // Ex: #FAT-2026-001
  issueDate: string;
  issuer: InvoiceIssuer;
  client: InvoiceClient;
  items: {
    description: string;
    projectTitle: string;
    durationSeconds: number;
    hourlyRateOrAmount: number; // centavos
    totalAmount: number; // centavos
    date?: Date | string | null;
  }[];
  discountCents?: number;
  taxCents?: number;
  payment: InvoicePaymentInfo;
}

interface JsPDFWithAutoTable extends jsPDF {
  lastAutoTable: {
    finalY: number;
  };
}

export const invoiceService = {
  formatCurrency(valueInCents: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format((valueInCents || 0) / 100);
  },

  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}min`;
  },

  generateInvoiceNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(100 + Math.random() * 900);
    return `#FAT-${year}-${random}`;
  },

  generatePdf(data: InvoiceData): jsPDF {
    const doc = new jsPDF() as JsPDFWithAutoTable;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const primaryColor: [number, number, number] = [3, 141, 231]; // Cor da marca TimeFreela
    const darkTextColor: [number, number, number] = [30, 41, 59];
    const secondaryTextColor: [number, number, number] = [100, 116, 139];

    // 1. Cabeçalho Superior da Fatura
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, pageWidth, 42, 'F');

    // Título da Fatura
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(...primaryColor);
    doc.text('FATURA DE SERVIÇOS', 14, 20);

    // Número da fatura
    doc.setFontSize(11);
    doc.setTextColor(...darkTextColor);
    doc.text(data.invoiceNumber, 14, 28);

    // Data de Emissão e Vencimento no canto superior direito
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...secondaryTextColor);
    doc.text(`Emissão: ${data.issueDate}`, pageWidth - 14, 18, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 38); // Vermelho suave para destaque de vencimento
    doc.text(`Vencimento: ${data.payment.dueDate}`, pageWidth - 14, 26, { align: 'right' });

    // Barra de destaque colorida
    doc.setFillColor(...primaryColor);
    doc.rect(0, 41, pageWidth, 2, 'F');

    // 2. Seções: Prestador (Emissor) e Tomador (Cliente) lado a lado
    let currentY = 52;
    const colWidth = (pageWidth - 36) / 2;
    const rightColX = 18 + colWidth;

    // Emissor
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...primaryColor);
    doc.text('PRESTADOR DE SERVIÇO', 14, currentY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...darkTextColor);
    doc.text(data.issuer.name || 'Freelancer', 14, currentY + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...secondaryTextColor);
    let issuerY = currentY + 13;
    if (data.issuer.document) {
      doc.text(`Documento: ${data.issuer.document}`, 14, issuerY);
      issuerY += 5;
    }
    if (data.issuer.email) {
      doc.text(`E-mail: ${data.issuer.email}`, 14, issuerY);
      issuerY += 5;
    }
    if (data.issuer.phone) {
      doc.text(`Tel: ${data.issuer.phone}`, 14, issuerY);
      issuerY += 5;
    }

    // Cliente
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...primaryColor);
    doc.text('TOMADOR / CLIENTE', rightColX, currentY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...darkTextColor);
    doc.text(data.client.name || 'Cliente', rightColX, currentY + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...secondaryTextColor);
    let clientY = currentY + 13;
    if (data.client.document) {
      doc.text(`CNPJ/CPF: ${data.client.document}`, rightColX, clientY);
      clientY += 5;
    }
    if (data.client.email) {
      doc.text(`E-mail: ${data.client.email}`, rightColX, clientY);
      clientY += 5;
    }
    if (data.client.address) {
      doc.text(`Endereço: ${data.client.address}`, rightColX, clientY);
      clientY += 5;
    }

    currentY = Math.max(issuerY, clientY) + 8;

    // 3. Tabela de Serviços e Itens
    const tableBody = data.items.map((item, index) => [
      String(index + 1),
      `${item.projectTitle}\n${item.description || 'Execução de serviços e horas técnicas'}`,
      item.date ? (typeof item.date === 'string' ? item.date : dayjs(item.date).format('DD/MM/YYYY')) : '-',
      this.formatDuration(item.durationSeconds),
      item.hourlyRateOrAmount > 0 ? this.formatCurrency(item.hourlyRateOrAmount) : '-',
      this.formatCurrency(item.totalAmount),
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['#', 'Descrição do Serviço', 'Data', 'Duração', 'Valor / Taxa', 'Total']],
      body: tableBody,
      theme: 'striped',
      headStyles: {
        fillColor: primaryColor,
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'left',
      },
      styles: {
        fontSize: 9,
        cellPadding: 4,
        textColor: darkTextColor,
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 26, halign: 'center' },
        3: { cellWidth: 24, halign: 'center' },
        4: { cellWidth: 28, halign: 'right' },
        5: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    });

    currentY = doc.lastAutoTable.finalY + 10;

    // 4. Totais e Resumo Financeiro
    const subtotal = data.items.reduce((sum, item) => sum + item.totalAmount, 0);
    const discount = data.discountCents || 0;
    const tax = data.taxCents || 0;
    const totalFinal = Math.max(0, subtotal - discount + tax);

    // Se espaço insuficiente para totais + pagamento, adiciona página
    if (currentY + 65 > pageHeight - 20) {
      doc.addPage();
      currentY = 20;
    }

    const totalsX = pageWidth - 80;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...secondaryTextColor);

    doc.text('Subtotal:', totalsX, currentY);
    doc.text(this.formatCurrency(subtotal), pageWidth - 14, currentY, { align: 'right' });

    if (discount > 0) {
      currentY += 6;
      doc.text('Desconto:', totalsX, currentY);
      doc.setTextColor(220, 38, 38);
      doc.text(`- ${this.formatCurrency(discount)}`, pageWidth - 14, currentY, { align: 'right' });
      doc.setTextColor(...secondaryTextColor);
    }

    if (tax > 0) {
      currentY += 6;
      doc.text('Impostos / Retenções:', totalsX, currentY);
      doc.text(`+ ${this.formatCurrency(tax)}`, pageWidth - 14, currentY, { align: 'right' });
    }

    currentY += 8;
    doc.setDrawColor(226, 232, 240);
    doc.line(totalsX, currentY - 2, pageWidth - 14, currentY - 2);

    // Box do Total Final
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(totalsX - 4, currentY, (pageWidth - 14) - (totalsX - 4), 14, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...darkTextColor);
    doc.text('TOTAL:', totalsX, currentY + 9);
    doc.setFontSize(12);
    doc.setTextColor(...primaryColor);
    doc.text(this.formatCurrency(totalFinal), pageWidth - 18, currentY + 9, { align: 'right' });

    currentY += 22;

    // 5. Bloco de Instruções de Pagamento (PIX e Dados Bancários)
    const paymentBoxY = currentY;
    const paymentBoxWidth = pageWidth - 28;
    const paymentBoxHeight = 44;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, paymentBoxY, paymentBoxWidth, paymentBoxHeight, 3, 3, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...primaryColor);
    doc.text('INFORMAÇÕES PARA PAGAMENTO', 20, paymentBoxY + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...darkTextColor);

    // Pix
    if (data.payment.pixKey) {
      doc.setFont('helvetica', 'bold');
      doc.text('Chave Pix:', 20, paymentBoxY + 16);
      doc.setFont('helvetica', 'normal');
      doc.text(data.payment.pixKey, 45, paymentBoxY + 16);

      if (data.payment.pixBeneficiary) {
        doc.setFont('helvetica', 'bold');
        doc.text('Beneficiário:', 20, paymentBoxY + 22);
        doc.setFont('helvetica', 'normal');
        doc.text(data.payment.pixBeneficiary, 45, paymentBoxY + 22);
      }
    }

    // Dados bancários (se informados)
    if (data.payment.bankName) {
      doc.setFont('helvetica', 'bold');
      doc.text('Banco:', 20, paymentBoxY + 28);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `${data.payment.bankName} | Agência: ${data.payment.bankAgency || '-'} | Conta: ${data.payment.bankAccount || '-'}`,
        45,
        paymentBoxY + 28
      );
    }

    // Observações
    if (data.payment.notes) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(...secondaryTextColor);
      doc.text(`Obs: ${data.payment.notes}`, 20, paymentBoxY + 36);
    }

    // 6. Rodapé
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...secondaryTextColor);
    doc.text(
      'Fatura gerada eletronicamente pelo TimeFreela • Gestão Inteligente para Freelancers',
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );

    return doc;
  },

  downloadPdf(data: InvoiceData): void {
    const doc = this.generatePdf(data);
    const filename = `FATURA_${data.invoiceNumber.replace('#', '')}.pdf`;
    doc.save(filename);
  },
};
