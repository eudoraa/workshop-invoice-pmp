import { jsPDF } from 'jspdf';
import { PMP_LOGO_BASE64 } from '../components/PmpMonogramLogo';
import { LineItem, PkbData, TemplateStyle } from '../types/invoice';
import {
  calculatePkbTotals,
  formatCurrencyComma,
  getTargetPkbFilename,
  PKB_WORKSHOP_INFO,
} from './invoiceLogic';
import { generateNewGenPkbPdf } from './newGenPdfGenerator';

/**
 * Generates and downloads a 100% Native Vector A4 PDF for PKB (Perintah Kerja Bengkel)
 * using jsPDF, matching PKB_PMP6909_B1550DOC.pdf.
 */
export function generatePkbPdf(
  data: PkbData,
  templateStyle: TemplateStyle = 'default'
): void {
  if (templateStyle === 'newgen') {
    generateNewGenPkbPdf(data);
    return;
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 15;
  const rightEdge = pageWidth - marginX; // 195mm

  let y = 14;

  const ensureSpace = (neededMm: number) => {
    if (y + neededMm > pageHeight - 15) {
      doc.addPage();
      y = 15;
    }
  };

  doc.setTextColor(0, 0, 0);
  doc.setDrawColor(0, 0, 0);

  // =========================================================================
  // 1. KOP SURAT PKB
  // =========================================================================
  // Left: Larger PMP Logo (width 34mm, height 17mm)
  doc.addImage(PMP_LOGO_BASE64, 'PNG', 18, 14, 34, 17);

  // Workshop identity side-by-side to the right of PMP Logo
  const identityX = 55;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(PKB_WORKSHOP_INFO.name, identityX, 18.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(PKB_WORKSHOP_INFO.addressLine1, identityX, 23.5);
  doc.text(PKB_WORKSHOP_INFO.addressLine2, identityX, 28);

  // Right Top: Perintah Kerja Bengkel / Service (centered on right block)
  const rightTitleCenterX = 172;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(PKB_WORKSHOP_INFO.titleLine1, rightTitleCenterX, 21, { align: 'center' });
  doc.text(PKB_WORKSHOP_INFO.titleLine2, rightTitleCenterX, 25.5, { align: 'center' });

  // Horizontal divider line directly below Kop Surat
  y = 33.5;
  doc.setLineWidth(0.35);
  doc.line(marginX, y, rightEdge, y);

  // =========================================================================
  // 2. INFORMASI PKB & UNIT (2 KOLOM DI BAWAH GARIS KOP)
  // =========================================================================
  y += 10;
  const infoTopY = y;

  // Left Column
  const leftLabelX = marginX + 1;
  const leftColonX = marginX + 34;
  const leftValX = marginX + 39;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  doc.text('No PKB', leftLabelX, infoTopY);
  doc.text(':', leftColonX, infoTopY);
  doc.text(data.noPkb || '-', leftValX, infoTopY);

  doc.text('No Polisi', leftLabelX, infoTopY + 6);
  doc.text(':', leftColonX, infoTopY + 6);
  doc.text(data.noPolisi || '-', leftValX, infoTopY + 6);

  doc.text('Type', leftLabelX, infoTopY + 12);
  doc.text(':', leftColonX, infoTopY + 12);
  doc.text(data.typeModel || '-', leftValX, infoTopY + 12);

  // Right Column (Tanggal and KM values right-aligned at right edge)
  const rightLabelX = 128;
  const rightColonX = 154;
  const rightValEdge = rightEdge - 1;

  doc.text('Tanggal', rightLabelX, infoTopY);
  doc.text(':', rightColonX, infoTopY);
  doc.text(data.tanggalPkb || '-', rightValEdge, infoTopY, { align: 'right' });

  doc.text('KM', rightLabelX, infoTopY + 6);
  doc.text(':', rightColonX, infoTopY + 6);
  doc.text(data.km || '-', rightValEdge, infoTopY + 6, { align: 'right' });

  y = infoTopY + 22;

  // =========================================================================
  // 3 & 4. TABEL RINCIAN JASA & RINCIAN PART
  // =========================================================================
  const colNoCenter = marginX + 6; // 21mm
  const colDescLeft = marginX + 14; // 29mm
  const colDescCenter = marginX + 54; // 69mm
  const colQtyCenter = marginX + 98; // 113mm
  const colPriceRpLeft = marginX + 112; // 127mm
  const colPriceRight = marginX + 140; // 155mm
  const colPriceCenter = (colPriceRpLeft + colPriceRight) / 2;
  const colBiayaRpLeft = marginX + 150; // 165mm
  const colBiayaRight = rightEdge - 1; // 194mm
  const colBiayaCenter = (colBiayaRpLeft + colBiayaRight) / 2;

  const renderPkbSection = (
    sectionTitle: string,
    columnTitle: string,
    items: LineItem[],
    subtotalLabel: string,
    subtotalValue: number
  ) => {
    ensureSpace(32);

    // Bold section title with full horizontal line directly underneath
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text(sectionTitle, marginX + 1, y);

    y += 2;
    doc.setLineWidth(0.35);
    doc.line(marginX, y, rightEdge, y);

    // Column Header row (Bold)
    y += 6.5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('No', colNoCenter, y, { align: 'center' });
    doc.text(columnTitle, colDescCenter, y, { align: 'center' });
    doc.text('Qty', colQtyCenter, y, { align: 'center' });
    doc.text('Harga Satuan', colPriceCenter, y, { align: 'center' });
    doc.text('Biaya Jasa', colBiayaCenter, y, { align: 'center' });

    // Horizontal line below column header
    y += 2.2;
    doc.setLineWidth(0.3);
    doc.line(marginX, y, rightEdge, y);

    // Body rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);

    if (items.length === 0) {
      y += 5.5;
      doc.text('-', colNoCenter, y, { align: 'center' });
      doc.text('-', colDescLeft, y);
      doc.text('0', colQtyCenter, y, { align: 'center' });
      doc.text('Rp', colPriceRpLeft, y);
      doc.text('0', colPriceRight, y, { align: 'right' });
      doc.text('Rp', colBiayaRpLeft, y);
      doc.text('0', colBiayaRight, y, { align: 'right' });
      y += 2.5;
    } else {
      items.forEach((item, idx) => {
        ensureSpace(10);
        y += 5;
        const unitPrice = Math.round(Number(item.hargaSatuan) || 0);
        const qty = Math.round(Number(item.qty) || 0);
        const rowTotal = unitPrice * qty;

        doc.text(String(idx + 1), colNoCenter, y, { align: 'center' });
        const descLines = doc.splitTextToSize(item.nama || '-', 74);
        doc.text(descLines, colDescLeft, y);

        doc.text(String(qty), colQtyCenter, y, { align: 'center' });

        doc.text('Rp', colPriceRpLeft, y);
        doc.text(formatCurrencyComma(unitPrice), colPriceRight, y, { align: 'right' });

        doc.text('Rp', colBiayaRpLeft, y);
        doc.text(formatCurrencyComma(rowTotal), colBiayaRight, y, { align: 'right' });

        if (descLines.length > 1) {
          y += (descLines.length - 1) * 3.8;
        }
      });
      y += 2.5;
    }

    // Horizontal line below last item row
    doc.line(marginX, y, rightEdge, y);

    // Subtotal Row: Bold label right-aligned before Rp column, nominal normal
    y += 5.2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(subtotalLabel, colBiayaRpLeft - 6, y, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.text('Rp', colBiayaRpLeft, y);
    doc.text(formatCurrencyComma(subtotalValue), colBiayaRight, y, { align: 'right' });

    y += 12;
  };

  const totals = calculatePkbTotals(data);

  renderPkbSection(
    'Rincian Jasa',
    'Jasa',
    data.jasaList,
    'Sub. Total Jasa :',
    totals.subTotalJasa
  );

  renderPkbSection(
    'Rincian Part',
    'Part',
    data.sparepartList,
    'Sub. Total Part :',
    totals.subTotalPart
  );

  // =========================================================================
  // 5. TOTAL AKHIR: ~10mm spacing, 1 horizontal line ABOVE Total :, NO line below
  // =========================================================================
  ensureSpace(16);
  y -= 2; // Combined with +12 after Rincian Part gives ~10mm spacing
  doc.setLineWidth(0.35);
  doc.line(marginX, y, rightEdge, y);

  y += 5.2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Total :', colBiayaRpLeft - 6, y, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Rp', colBiayaRpLeft, y);
  doc.text(formatCurrencyComma(totals.grandTotal), colBiayaRight, y, { align: 'right' });

  // No Bank Info and No Signature block at bottom

  const filename = getTargetPkbFilename(data.noPkb, data.noPolisi);
  doc.save(filename);
}
