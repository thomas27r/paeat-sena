import jsPDF from 'jspdf';

// Color Palette Constants for Institutional PAEAT Theme
export const PDF_COLORS = {
  primary: [61, 8, 27] as [number, number, number], // #3d081b Deep Wine
  primaryDark: [46, 5, 19] as [number, number, number], // #2e0513
  gold: [245, 158, 11] as [number, number, number], // #f59e0b Gold Amber
  goldLight: [254, 243, 199] as [number, number, number], // #fef3c7
  goldBorder: [251, 191, 36] as [number, number, number], // #fbbf24
  textDark: [30, 41, 59] as [number, number, number], // #1e293b
  textMuted: [100, 116, 139] as [number, number, number], // #64748b
  success: [16, 122, 59] as [number, number, number], // #107a3b
  successLight: [236, 253, 245] as [number, number, number], // #ecfdf5
  warning: [217, 119, 6] as [number, number, number], // #d97706
  warningLight: [255, 251, 235] as [number, number, number], // #fffbeb
  bgAlt: [248, 250, 252] as [number, number, number], // #f8fafc
  border: [226, 232, 240] as [number, number, number], // #e2e8f0
};

/**
 * Draws the elegant top institutional banner on page 1
 */
export const drawInstitutionalHeader = (
  doc: jsPDF,
  title: string,
  subtitle: string,
  folioNumber: string,
  extraMeta?: string[]
): number => {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Top Dark Wine Header
  doc.setFillColor(...PDF_COLORS.primary);
  doc.rect(0, 0, pageWidth, 36, 'F');

  // Gold accent bottom line
  doc.setFillColor(...PDF_COLORS.gold);
  doc.rect(0, 36, pageWidth, 2.5, 'F');

  // Decorative Emblem Circle / PAEAT Badge
  doc.setFillColor(74, 11, 34);
  doc.roundedRect(12, 6, 24, 24, 3, 3, 'F');
  doc.setDrawColor(...PDF_COLORS.gold);
  doc.setLineWidth(0.8);
  doc.roundedRect(12, 6, 24, 24, 3, 3, 'D');

  doc.setTextColor(...PDF_COLORS.gold);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('PAEAT', 24, 17, { align: 'center' });
  doc.setFontSize(6.5);
  doc.setTextColor(255, 255, 255);
  doc.text('OFICIAL', 24, 23, { align: 'center' });

  // Main Header Text
  doc.setTextColor(...PDF_COLORS.gold);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('PROGRAMA DE ALIMENTACIÓN ESCOLAR - PAEAT', 40, 14);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Institución Educativa Empresarial · Sistema de Control y Monitoreo de Raciones', 40, 21);

  doc.setFontSize(8);
  doc.setTextColor(220, 220, 220);
  doc.text(`Documento: ${title}`, 40, 28);

  // Folio & Timestamp on right side
  doc.setTextColor(...PDF_COLORS.goldLight);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`FOLIO: ${folioNumber}`, pageWidth - 14, 14, { align: 'right' });

  const nowStr = new Date().toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(230, 230, 230);
  doc.text(`Emisión: ${nowStr}`, pageWidth - 14, 21, { align: 'right' });
  doc.text('Estado: Certificado Oficial', pageWidth - 14, 28, { align: 'right' });

  // Secondary sub-banner for extra meta info
  let currentY = 44;
  if (extraMeta && extraMeta.length > 0) {
    doc.setFillColor(...PDF_COLORS.bgAlt);
    doc.setDrawColor(...PDF_COLORS.border);
    doc.setLineWidth(0.5);
    doc.roundedRect(14, currentY, pageWidth - 28, 11, 2, 2, 'FD');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.primary);

    const step = (pageWidth - 36) / extraMeta.length;
    extraMeta.forEach((item, idx) => {
      doc.text(item, 18 + idx * step, currentY + 7);
    });

    currentY += 16;
  }

  return currentY;
};

/**
 * Draws executive metric stat summary cards
 */
export const drawSummaryMetricCards = (
  doc: jsPDF,
  startY: number,
  cards: { title: string; value: string | number; sub?: string; color?: 'wine' | 'gold' | 'green' | 'amber' }[]
): number => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const cardWidth = (pageWidth - margin * 2 - (cards.length - 1) * 4) / cards.length;
  const cardHeight = 16;

  cards.forEach((card, idx) => {
    const x = margin + idx * (cardWidth + 4);
    
    // Background based on type
    let bgColor = PDF_COLORS.bgAlt;
    let borderColor = PDF_COLORS.border;
    let valColor = PDF_COLORS.textDark;

    if (card.color === 'green') {
      bgColor = PDF_COLORS.successLight;
      borderColor = [167, 243, 208];
      valColor = PDF_COLORS.success;
    } else if (card.color === 'amber') {
      bgColor = PDF_COLORS.warningLight;
      borderColor = [253, 230, 138];
      valColor = PDF_COLORS.warning;
    } else if (card.color === 'wine') {
      bgColor = [253, 242, 248];
      borderColor = [244, 114, 182];
      valColor = PDF_COLORS.primary;
    }

    doc.setFillColor(...bgColor);
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.5);
    doc.roundedRect(x, startY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

    // Title
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.textMuted);
    doc.text(card.title.toUpperCase(), x + cardWidth / 2, startY + 4.5, { align: 'center' });

    // Value
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...valColor);
    doc.text(String(card.value), x + cardWidth / 2, startY + 10.5, { align: 'center' });

    // Subtext if any
    if (card.sub) {
      doc.setFontSize(5.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...PDF_COLORS.textMuted);
      doc.text(card.sub, x + cardWidth / 2, startY + 14.2, { align: 'center' });
    }
  });

  return startY + cardHeight + 6;
};

/**
 * Draws Section Title with bullet bar
 */
export const drawSectionTitle = (doc: jsPDF, y: number, title: string): number => {
  doc.setFillColor(...PDF_COLORS.gold);
  doc.rect(14, y, 3, 5, 'F');

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.primary);
  doc.text(title, 19, y + 4);

  return y + 7;
};

/**
 * Applies running header/footer and page numbers to all pages of the document
 */
export const applyPageFooters = (doc: jsPDF, documentTitle: string) => {
  const totalPages = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // If page > 1, draw a compact top mini-bar
    if (i > 1) {
      doc.setFillColor(...PDF_COLORS.primary);
      doc.rect(0, 0, pageWidth, 10, 'F');
      doc.setFillColor(...PDF_COLORS.gold);
      doc.rect(0, 10, pageWidth, 0.8, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text('PAEAT · INSTITUCIÓN EDUCATIVA EMPRESARIAL', 14, 6.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...PDF_COLORS.goldLight);
      doc.text(documentTitle, pageWidth - 14, 6.5, { align: 'right' });
    }

    // Running Bottom Footer
    doc.setDrawColor(...PDF_COLORS.border);
    doc.setLineWidth(0.4);
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF_COLORS.textMuted);
    doc.text(
      'Documento Oficial del Programa de Alimentación Escolar (PAEAT) · Prohibida su alteración o reproducción no autorizada.',
      14,
      pageHeight - 7
    );

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.primary);
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - 14, pageHeight - 7, { align: 'right' });
  }
};

/**
 * Draws official signature boxes at the bottom of the document
 */
export const drawSignatureBoxes = (doc: jsPDF, finalY: number) => {
  const pageHeight = doc.internal.pageSize.getHeight();
  let sigY = finalY + 12;

  // If not enough room for signatures, create a new page
  if (sigY + 36 > pageHeight - 16) {
    doc.addPage();
    sigY = 24;
  }

  doc.setDrawColor(160, 160, 160);
  doc.setLineWidth(0.5);

  // Left Signature - Administrador
  doc.line(20, sigY + 18, 90, sigY + 18);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textDark);
  doc.text('Firma Responsable / Coordinador PAEAT', 20, sigY + 23);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...PDF_COLORS.textMuted);
  doc.text('C.C. ___________________________________', 20, sigY + 28);
  doc.text('Institución Educativa Empresarial', 20, sigY + 33);

  // Right Signature - Supervisor / Repartidor
  doc.line(120, sigY + 18, 190, sigY + 18);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textDark);
  doc.text('Firma Supervisor de Turno / Repartidor', 120, sigY + 23);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...PDF_COLORS.textMuted);
  doc.text('C.C. ___________________________________', 120, sigY + 28);
  doc.text('Control y Verificación de Entrega', 120, sigY + 33);
};
