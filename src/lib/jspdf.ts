import { jsPDF } from 'jspdf';

export const createPdfInstance = () => {
  return new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
};
