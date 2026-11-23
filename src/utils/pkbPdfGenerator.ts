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

  const PAGE_WIDTH = 210;
  const PAGE_HEIGHT = 297;
  const MARGIN_TOP = 15;
  const MARGIN_BOTTOM = 15;
  const MARGIN_LEFT = 15;
  const MARGIN_RIGHT = 15;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT; // 180 mm

  const marginX = MARGIN_LEFT;
  const rightEdge = MARGIN_LEFT + CONTENT_WIDTH; // 195 mm
  const bottomLimit = PAGE_HEIGHT - MARGIN_BOTTOM; // 282 mm

  let y = MARGIN_TOP;

  const ensureSpace = (neededMm: number) => {
    if (y + neededMm > bottomLimit) {
      doc.addPage();
      y = MARGIN_TOP;
    }
  };

  doc.setTextColor(0, 0, 0);
  doc.setDrawColor(0, 0, 0);

  // =========================================================================
  // 1. KOP SURAT PKB
  // =========================================================================
  // Left: PMP Logo (width 30mm, height 15mm) starting at X = 15, Y = 15
  doc.addImage(PMP_LOGO_BASE64, 'PNG', marginX, MARGIN_TOP, 30, 15);

  // Workshop identity side-by-side to the right of PMP Logo
  const identityX = marginX + 33;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(PKB_WORKSHOP_INFO.name, identityX, MARGIN_TOP + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  const addrY1 = MARGIN_TOP + 10;
  doc.text(PKB_WORKSHOP_INFO.addressLine1, identityX, addrY1);
  doc.text(PKB_WORKSHOP_INFO.addressLine2, identityX, addrY1 + 4);

  // Right Top: Perintah Kerja Bengkel / Service (centered on right block)
  const rightTitleCenterX = 170;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(PKB_WORKSHOP_INFO.titleLine1, rightTitleCenterX, MARGIN_TOP + 7, { align: 'center' });
  doc.text(PKB_WORKSHOP_INFO.titleLine2, rightTitleCenterX, MARGIN_TOP + 12.5, { align: 'center' });

  // Horizontal divider line directly below Kop Surat
  y = Math.max(addrY1 + 4, MARGIN_TOP + 15) + 4.5;
  doc.setLineWidth(0.4);
  doc.line(marginX, y, rightEdge, y);

  // =========================================================================
  // 2. INFORMASI PKB & UNIT (2 KOLOM DI BAWAH GARIS KOP)
  // =========================================================================
  y += 8.5;
  const infoTopY = y;

  // Left Column
  const leftLabelX = marginX + 1;
  const leftColonX = marginX + 34;
  const leftValX = marginX + 39;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.8);

  doc.text('No PKB', leftLabelX, infoTopY);
  doc.text(':', leftColonX, infoTopY);
  doc.text(data.noPkb || '-', leftValX, infoTopY);

  doc.text('No Polisi', leftLabelX, infoTopY + 6.2);
  doc.text(':', leftColonX, infoTopY + 6.2);
  doc.text(data.noPolisi || '-', leftValX, infoTopY + 6.2);

  doc.text('Type', leftLabelX, infoTopY + 12.4);
  doc.text(':', leftColonX, infoTopY + 12.4);
  doc.text(data.typeModel || '-', leftValX, infoTopY + 12.4);

  // Right Column (Tanggal and KM values right-aligned at right edge)
  const rightLabelX = 126;
  const rightColonX = 152;
  const rightValEdge = rightEdge - 1;

  doc.text('Tanggal', rightLabelX, infoTopY);
  doc.text(':', rightColonX, infoTopY);
  doc.text(data.tanggalPkb || '-', rightValEdge, infoTopY, { align: 'right' });

  doc.text('KM', rightLabelX, infoTopY + 6.2);
  doc.text(':', rightColonX, infoTopY + 6.2);
  doc.text(data.km || '-', rightValEdge, infoTopY + 6.2, { align: 'right' });

  y = infoTopY + 21;

  // =========================================================================
  // 3 & 4. TABEL RINCIAN JASA & RINCIAN PART
  // =========================================================================
  const colNoCenter = marginX + 5.5; // 20.5mm
  const colDescLeft = marginX + 13; // 28mm
  const colDescCenter = marginX + 53; // 68mm
  const colQtyCenter = marginX + 97; // 112mm
  const colPriceRpLeft = marginX + 109; // 124mm
  const colPriceRight = marginX + 139; // 154mm
  const colPriceCenter = (colPriceRpLeft + colPriceRight) / 2;
  const colBiayaRpLeft = marginX + 149; // 164mm
  const colBiayaRight = rightEdge - 1; // 194mm
  const colBiayaCenter = (colBiayaRpLeft + colBiayaRight) / 2;

  const renderPkbSection = (
    sectionTitle: string,
    columnTitle: string,
    amountColumnTitle: string,
    items: LineItem[],
    subtotalLabel: string,
    subtotalValue: number
  ) => {
    ensureSpace(34);

    // Bold section title with full horizontal line directly underneath
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text(sectionTitle, marginX + 1, y);

    y += 2.4;
    doc.setLineWidth(0.35);
    doc.line(marginX, y, rightEdge, y);

    // Column Header row (Bold, 10pt)
    y += 6.5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('No', colNoCenter, y, { align: 'center' });
    doc.text(columnTitle, colDescCenter, y, { align: 'center' });
    doc.text('Qty', colQtyCenter, y, { align: 'center' });
    doc.text('Harga Satuan', colPriceCenter, y, { align: 'center' });
    doc.text(amountColumnTitle, colBiayaCenter, y, { align: 'center' });

    // Horizontal line below column header
    y += 2.6;
    doc.setLineWidth(0.32);
    doc.line(marginX, y, rightEdge, y);

    // Body rows (10pt, generous vertical pitch)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    if (items.length === 0) {
      y += 6.8;
      doc.text('-', colNoCenter, y, { align: 'center' });
      doc.text('-', colDescLeft, y);
      doc.text('0', colQtyCenter, y, { align: 'center' });
      doc.text('Rp', colPriceRpLeft, y);
      doc.text('0', colPriceRight, y, { align: 'right' });
      doc.text('Rp', colBiayaRpLeft, y);
      doc.text('0', colBiayaRight, y, { align: 'right' });
      y += 3;
    } else {
      items.forEach((item, idx) => {
        ensureSpace(12);
        y += 6.8;
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
          y += (descLines.length - 1) * 4.5;
        }
      });
      y += 3;
    }

    // Horizontal line below last item row
    doc.line(marginX, y, rightEdge, y);

    // Subtotal Row: Bold label right-aligned before Rp column, nominal normal
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(subtotalLabel, colBiayaRpLeft - 6, y, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.text('Rp', colBiayaRpLeft, y);
    doc.text(formatCurrencyComma(subtotalValue), colBiayaRight, y, { align: 'right' });

    y += 10;
  };

  const totals = calculatePkbTotals(data);

  renderPkbSection(
    'Rincian Jasa',
    'Jasa',
    'Biaya Jasa',
    data.jasaList,
    'Sub. Total Jasa :',
    totals.subTotalJasa
  );

  renderPkbSection(
    'Rincian Part',
    'Part',
    'Biaya Part',
    data.sparepartList,
    'Sub. Total Part :',
    totals.subTotalPart
  );

  // =========================================================================
  // 5. TOTAL AKHIR: ~6mm spacing, 1 horizontal line ABOVE Total :, NO line below
  // =========================================================================
  ensureSpace(16);
  y -= 4; // Combined with +10 after Rincian Part gives ~6mm cohesive spacing
  doc.setLineWidth(0.38);
  doc.line(marginX, y, rightEdge, y);

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('Total :', colBiayaRpLeft - 6, y, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('Rp', colBiayaRpLeft, y);
  doc.text(formatCurrencyComma(totals.grandTotal), colBiayaRight, y, { align: 'right' });

  // No Bank Info and No Signature block at bottom

  const filename = getTargetPkbFilename(data.noPkb, data.noPolisi);
  doc.save(filename);
}
