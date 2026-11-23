import { jsPDF } from 'jspdf';
import { PMP_LOGO_BASE64 } from '../components/PmpMonogramLogo';
import { InvoiceData, LineItem, PkbData } from '../types/invoice';
import {
  calculateInvoiceTotals,
  calculatePkbTotals,
  formatCurrencyComma,
  getTargetPdfFilename,
  getTargetPkbFilename,
  NEW_GEN_WORKSHOP_INFO,
  resolveDisplaySpk,
  WORKSHOP_INFO,
} from './invoiceLogic';

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN_TOP = 15;
const MARGIN_BOTTOM = 15;
const MARGIN_LEFT = 15;
const MARGIN_RIGHT = 15;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT; // 180 mm
const RIGHT_EDGE = MARGIN_LEFT + CONTENT_WIDTH; // 195 mm
const BOTTOM_LIMIT = PAGE_HEIGHT - MARGIN_BOTTOM; // 282 mm

const INK = [15, 23, 42] as const; // #0f172a
const MUTED = [71, 85, 105] as const; // #475569
const SUBTLE = [100, 116, 139] as const; // #64748b
const BORDER = [203, 213, 225] as const; // #cbd5e1
const BORDER_ROW = [226, 232, 240] as const; // #e2e8f0
const BORDER_STRONG = [30, 41, 59] as const; // #1e293b
const TINT = [248, 250, 252] as const; // #f8fafc

function drawVectorPhoneIcon(doc: jsPDF, x: number, y: number) {
  doc.setDrawColor(...MUTED);
  doc.setLineWidth(0.32);
  // Crisp minimalist phone handset silhouette in 2.6x2.6mm bounds
  doc.roundedRect(x + 0.4, y + 0.2, 1.8, 2.5, 0.35, 0.35, 'S');
  doc.line(x + 1.0, y + 2.3, x + 1.6, y + 2.3);
}

function drawVectorMailIcon(doc: jsPDF, x: number, y: number) {
  doc.setDrawColor(...MUTED);
  doc.setLineWidth(0.32);
  // Envelope rectangle + V-flap in 3.2x2.2mm bounds
  doc.rect(x, y + 0.3, 3.2, 2.1, 'S');
  doc.line(x, y + 0.3, x + 1.6, y + 1.5);
  doc.line(x + 3.2, y + 0.3, x + 1.6, y + 1.5);
}

function drawNewGenKopHeader(
  doc: jsPDF,
  marginX: number,
  rightEdge: number,
  companyName: string,
  documentTitle: string,
  categoryBadge: string
): number {
  const topY = MARGIN_TOP;

  // Left: PMP Logo (~22mm x 11mm) + Company Name & 2-line Address
  doc.addImage(PMP_LOGO_BASE64, 'PNG', marginX, topY, 22, 11);

  const identityX = marginX + 25;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...INK);
  doc.text(companyName, identityX, topY + 4.4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...MUTED);
  const addr1 = doc.splitTextToSize(NEW_GEN_WORKSHOP_INFO.addressLine1, 90);
  const addr2 = doc.splitTextToSize(NEW_GEN_WORKSHOP_INFO.addressLine2, 90);
  let leftAddrY = topY + 9.4;
  doc.text(addr1, identityX, leftAddrY);
  leftAddrY += addr1.length * 4.3;
  doc.text(addr2, identityX, leftAddrY);
  leftAddrY += (addr2.length - 1) * 4.3;

  // Right: Stacked 3 lines (Phone with icon, Email with icon, NPWP) at 9.5pt
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...INK);

  const phoneText = NEW_GEN_WORKSHOP_INFO.phone;
  const phoneW = doc.getTextWidth(phoneText);
  doc.text(phoneText, rightEdge, topY + 4, { align: 'right' });
  drawVectorPhoneIcon(doc, rightEdge - phoneW - 4.4, topY + 1.3);

  const emailText = NEW_GEN_WORKSHOP_INFO.email;
  const emailW = doc.getTextWidth(emailText);
  doc.text(emailText, rightEdge, topY + 8.8, { align: 'right' });
  drawVectorMailIcon(doc, rightEdge - emailW - 5.1, topY + 6.2);

  doc.setTextColor(...MUTED);
  doc.text(`NPWP : ${NEW_GEN_WORKSHOP_INFO.npwp}`, rightEdge, topY + 13.6, {
    align: 'right',
  });

  // Strong Kop bottom divider (2px ~ 0.65mm)
  const kopLineY = Math.max(leftAddrY, topY + 13.6) + 4;
  doc.setDrawColor(...BORDER_STRONG);
  doc.setLineWidth(0.65);
  doc.line(marginX, kopLineY, rightEdge, kopLineY);

  // Document Title Row below Kop divider (14pt bold)
  const titleY = kopLineY + 8.2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...INK);
  doc.text(documentTitle, marginX, titleY);

  // Right Category Capsule Badge
  const badgeText = (categoryBadge || '-').toUpperCase();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  const badgeTextW = doc.getTextWidth(badgeText);
  const badgeW = badgeTextW + 8.5;
  const badgeH = 7;
  const badgeX = rightEdge - badgeW;
  const badgeY = titleY - 5.2;

  doc.setFillColor(...TINT);
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.32);
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 1.2, 1.2, 'FD');
  doc.setTextColor(...INK);
  doc.text(badgeText, badgeX + badgeW / 2, badgeY + 4.8, { align: 'center' });

  return titleY + 5.8;
}

function drawNewGenSectionTable(
  doc: jsPDF,
  startY: number,
  marginX: number,
  rightEdge: number,
  pageHeight: number,
  sectionTitle: string,
  columnTitle: string,
  amountColumnTitle: string,
  items: LineItem[],
  subtotalLabel: string,
  subtotalValue: number,
  qtyFirst: boolean
): number {
  let y = startY;
  const contentW = rightEdge - marginX; // 180mm

  const ensureSpace = (neededMm: number) => {
    if (y + neededMm > pageHeight - MARGIN_BOTTOM) {
      doc.addPage();
      y = MARGIN_TOP;
    }
  };

  ensureSpace(34);

  // Section Title with 3px (~1mm) left border accent
  doc.setFillColor(...BORDER_STRONG);
  doc.rect(marginX, y - 3.8, 1.1, 4.8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...INK);
  doc.text(sectionTitle, marginX + 3.4, y);

  y += 3.2;

  // Table Header Box (#f8fafc fill, top & bottom 1.5px ~ 0.45mm #1e293b)
  const headerH = 10.2;
  doc.setFillColor(...TINT);
  doc.rect(marginX, y, contentW, headerH, 'F');

  doc.setDrawColor(...BORDER_STRONG);
  doc.setLineWidth(0.45);
  doc.line(marginX, y, rightEdge, y);
  doc.line(marginX, y + headerH, rightEdge, y + headerH);

  // Column x-coordinates (total 180mm: 15..195)
  const colNoX = marginX + 2.5;
  const colDescX = marginX + 12.5;
  const colRightEdge = rightEdge - 2.5;

  // Layout options:
  // Invoice: NO (6%) | JASA/PART (44%) | HARGA SATUAN (20%) | QTY (9%) | JUMLAH (21%)
  // PKB:     NO (6%) | JASA/PART (44%) | QTY (9%) | HARGA SATUAN (20%) | BIAYA JASA / BIAYA PART (21%)
  const colPriceRpLeft = qtyFirst ? marginX + 108 : marginX + 96;
  const colPriceRight = qtyFirst ? marginX + 140 : marginX + 128;
  const colQtyCenter = qtyFirst ? marginX + 98 : marginX + 137;
  const colAmountRpLeft = marginX + 148;
  const colAmountRight = colRightEdge;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...INK);
  doc.text('NO', colNoX, y + 6.4);
  doc.text(columnTitle, colDescX, y + 6.4);

  if (qtyFirst) {
    doc.text('QTY', colQtyCenter, y + 6.4, { align: 'center' });
    doc.text('HARGA', colPriceRight, y + 4.3, { align: 'right' });
    doc.text('SATUAN', colPriceRight, y + 8.3, { align: 'right' });
    doc.text(amountColumnTitle, colAmountRight, y + 6.4, { align: 'right' });
  } else {
    doc.text('HARGA', colPriceRight, y + 4.3, { align: 'right' });
    doc.text('SATUAN', colPriceRight, y + 8.3, { align: 'right' });
    doc.text('QTY', colQtyCenter, y + 6.4, { align: 'center' });
    doc.text(amountColumnTitle, colAmountRight, y + 6.4, { align: 'right' });
  }

  y += headerH;

  // Table Rows (10pt, ~8px vertical padding rhythm)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...INK);

  const descMaxW = 76;

  if (items.length === 0) {
    const rowH = 9;
    doc.text('-', colNoX, y + 6);
    doc.text('-', colDescX, y + 6);
    doc.text('Rp', colPriceRpLeft, y + 6);
    doc.text('0', colPriceRight, y + 6, { align: 'right' });
    doc.text('0', colQtyCenter, y + 6, { align: 'center' });
    doc.text('Rp', colAmountRpLeft, y + 6);
    doc.text('0', colAmountRight, y + 6, { align: 'right' });
    y += rowH;
    doc.setDrawColor(...BORDER_ROW);
    doc.setLineWidth(0.25);
    doc.line(marginX, y, rightEdge, y);
  } else {
    items.forEach((item, idx) => {
      const descLines = doc.splitTextToSize(item.nama || '-', descMaxW);
      const rowH = Math.max(9, 4.8 + descLines.length * 4.6);
      ensureSpace(rowH + 4);

      const textY = y + 6;
      const unitPrice = Math.round(Number(item.hargaSatuan) || 0);
      const qty = Math.round(Number(item.qty) || 0);
      const rowTotal = unitPrice * qty;

      doc.text(String(idx + 1), colNoX, textY);
      doc.text(descLines, colDescX, textY);

      doc.text('Rp', colPriceRpLeft, textY);
      doc.text(formatCurrencyComma(unitPrice), colPriceRight, textY, {
        align: 'right',
      });

      doc.text(String(qty), colQtyCenter, textY, { align: 'center' });

      doc.text('Rp', colAmountRpLeft, textY);
      doc.text(formatCurrencyComma(rowTotal), colAmountRight, textY, {
        align: 'right',
      });

      y += rowH;
      doc.setDrawColor(...BORDER_ROW);
      doc.setLineWidth(0.25);
      doc.line(marginX, y, rightEdge, y);
    });
  }

  // Subtotal Row
  y += 6.2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text(`${subtotalLabel} :`, colAmountRpLeft - 6, y, { align: 'right' });

  doc.setTextColor(...INK);
  doc.text('Rp', colAmountRpLeft, y);
  doc.text(formatCurrencyComma(subtotalValue), colAmountRight, y, {
    align: 'right',
  });

  // Gap between table sections (~16px -> ~6.5mm)
  return y + 7.5;
}

/**
 * Generates and downloads a 100% Native Vector A4 Invoice PDF in the "New Gen"
 * Minimalis Otomotif Elegan style with 15mm margins and natural cohesive flow.
 */
export function generateNewGenInvoicePdf(data: InvoiceData): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageHeight = PAGE_HEIGHT;
  const marginX = MARGIN_LEFT;
  const marginTop = MARGIN_TOP;
  const rightEdge = RIGHT_EDGE; // 195 mm
  const contentW = CONTENT_WIDTH; // 180 mm
  const bottomLimit = BOTTOM_LIMIT; // 282 mm

  let y = drawNewGenKopHeader(
    doc,
    marginX,
    rightEdge,
    NEW_GEN_WORKSHOP_INFO.invoiceName,
    'INVOICE',
    data.kategoriPekerjaan || 'SERVICE BERKALA'
  );

  // =========================================================================
  // 2. DUA KARTU INFORMASI (KEPADA YTH & INFORMASI BENGKEL)
  // =========================================================================
  const gapCards = 5;
  const leftCardW = (contentW - gapCards) * (1.22 / 2.22); // ~96.2mm
  const rightCardX = marginX + leftCardW + gapCards;
  const rightCardW = rightEdge - rightCardX; // ~78.8mm

  // Measure left card address lines to size card height dynamically
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  const addr1Lines = doc.splitTextToSize(data.alamatBaris1 || '', leftCardW - 10);
  const addr2Lines = doc.splitTextToSize(data.alamatBaris2 || '', leftCardW - 10);
  const leftContentH =
    19 + (addr1Lines.length + addr2Lines.length) * 4.4 + 4;
  const rightContentH = data.includeSpk ? 37.5 : 32.5;
  const cardH = Math.max(leftContentH, rightContentH, 35);

  // Left Card: KEPADA YTH
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.32);
  doc.roundedRect(marginX, y, leftCardW, cardH, 1.8, 1.8, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.8);
  doc.setTextColor(...SUBTLE);
  doc.text('KEPADA YTH', marginX + 5, y + 6.4);
  doc.line(marginX + 5, y + 8.6, marginX + leftCardW - 5, y + 8.6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...INK);
  doc.text(data.namaKlien || '-', marginX + 5, y + 14.2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...MUTED);
  let addrY = y + 19.2;
  if (addr1Lines.length > 0 && addr1Lines[0] !== '') {
    doc.text(addr1Lines, marginX + 5, addrY);
    addrY += addr1Lines.length * 4.4;
  }
  if (addr2Lines.length > 0 && addr2Lines[0] !== '') {
    doc.text(addr2Lines, marginX + 5, addrY);
  }

  // Right Card: INFORMASI BENGKEL
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.32);
  doc.roundedRect(rightCardX, y, rightCardW, cardH, 1.8, 1.8, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.8);
  doc.setTextColor(...SUBTLE);
  doc.text('INFORMASI BENGKEL', rightCardX + 5, y + 6.4);
  doc.line(rightCardX + 5, y + 8.6, rightCardX + rightCardW - 5, y + 8.6);

  const infoLabelX = rightCardX + 5;
  const infoValX = rightCardX + 26;
  let infoY = y + 14.2;

  const drawInfoRow = (label: string, val: string, boldVal = false) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...MUTED);
    doc.text(label, infoLabelX, infoY);

    doc.setFont('helvetica', boldVal ? 'bold' : 'normal');
    doc.setTextColor(...INK);
    doc.text(`: ${val}`, infoValX, infoY);
    infoY += 5.1;
  };

  drawInfoRow('Hal', data.hal || '1');
  drawInfoRow('No Inv', data.noInv || '-', true);
  drawInfoRow('Tgl Inv', data.tglInv || '-');
  if (data.includeSpk) {
    drawInfoRow('No. SPK', resolveDisplaySpk(data.noSpk, data.noInv));
  }

  y += cardH + 5.5;

  // =========================================================================
  // 3. STRIP DATA KENDARAAN
  // =========================================================================
  const stripH = 17.5;
  doc.setFillColor(...TINT);
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.32);
  doc.roundedRect(marginX, y, contentW, stripH, 1.8, 1.8, 'FD');

  const stripCols = [
    { label: 'NO. POLISI', value: data.noPolisi || '-', x: marginX + 5 },
    { label: 'MODEL KENDARAAN', value: data.model || '-', x: marginX + 43 },
    { label: 'TAHUN', value: data.tahun || '-', x: marginX + 102 },
    { label: 'NOMOR SPO', value: data.nomorSpo || '-', x: marginX + 128 },
  ];

  stripCols.forEach((col) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...SUBTLE);
    doc.text(col.label, col.x, y + 6.2);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...INK);
    doc.text(col.value, col.x, y + 12.8);
  });

  y += stripH + 7;

  // =========================================================================
  // 4. TABEL LIST JASA & LIST SPAREPART + PAJAK
  // =========================================================================
  const totals = calculateInvoiceTotals(data);

  y = drawNewGenSectionTable(
    doc,
    y,
    marginX,
    rightEdge,
    pageHeight,
    'LIST JASA',
    'JASA',
    'JUMLAH',
    data.jasaList,
    'Sub. Total (Jasa)',
    totals.subTotalJasa,
    false
  );

  y = drawNewGenSectionTable(
    doc,
    y,
    marginX,
    rightEdge,
    pageHeight,
    'LIST SPAREPART',
    'PART',
    'JUMLAH',
    data.sparepartList,
    data.labelSubtotalSparepart || 'Sub. Total (Sparepart)',
    totals.subTotalSparepart,
    false
  );

  const colAmountRpLeft = marginX + 148;
  const colAmountRight = rightEdge - 2.5;

  if (data.enablePpn) {
    if (y + 8 > bottomLimit) {
      doc.addPage();
      y = marginTop;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...MUTED);
    doc.text(`PPN (${data.ppnRate}%) :`, colAmountRpLeft - 6, y - 1.5, {
      align: 'right',
    });
    doc.setTextColor(...INK);
    doc.text('Rp', colAmountRpLeft, y - 1.5);
    doc.text(formatCurrencyComma(totals.ppnAmount), colAmountRight, y - 1.5, {
      align: 'right',
    });
    y += 5.5;
  }

  if (data.enablePph) {
    if (y + 8 > bottomLimit) {
      doc.addPage();
      y = marginTop;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...MUTED);
    doc.text(`PPh 23 (${data.pphRate}%) :`, colAmountRpLeft - 6, y - 1.5, {
      align: 'right',
    });
    doc.setTextColor(...INK);
    doc.text('Rp', colAmountRpLeft, y - 1.5);
    doc.text(`-${formatCurrencyComma(totals.pphAmount)}`, colAmountRight, y - 1.5, {
      align: 'right',
    });
    y += 5.5;
  }

  // =========================================================================
  // 5. FOOTER: MENGALIR ALAMI TEPAT DI BAWAH TABEL (~6mm), TANPA RUANG KOSONG TENGAH
  // =========================================================================
  const hasRole = Boolean(data.jabatanPenandatangan && data.jabatanPenandatangan.trim() !== '');
  const totalBoxH = 12;
  // divider->cards (6mm) + totalBoxH (12mm) + date gap (8mm) + sig gap (22mm) + name (5.5mm) + optional role (5.2mm)
  const footerBlockH = 6 + totalBoxH + 8 + 22 + 5.5 + (hasRole ? 5.2 : 0);

  if (y + 2 + footerBlockH > bottomLimit) {
    doc.addPage();
    y = marginTop;
  } else {
    y += 1.5; // Combined with table bottom spacing gives ~6mm cohesive gap
  }

  doc.setDrawColor(...BORDER_STRONG);
  doc.setLineWidth(0.5);
  doc.line(marginX, y, rightEdge, y);
  y += 6;

  // Left: Informasi Bank Card
  const bankCardW = 84;
  const bankCardH = 34;
  doc.setFillColor(...TINT);
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.32);
  doc.roundedRect(marginX, y, bankCardW, bankCardH, 1.8, 1.8, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.8);
  doc.setTextColor(...SUBTLE);
  doc.text('INFORMASI BANK', marginX + 5, y + 6.6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.8);
  doc.setTextColor(...INK);
  doc.text(WORKSHOP_INFO.bankName, marginX + 5, y + 13);

  doc.setFontSize(11.5);
  doc.text(WORKSHOP_INFO.bankAccount, marginX + 5, y + 19);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.2);
  doc.setTextColor(...MUTED);
  doc.text(WORKSHOP_INFO.bankHolder, marginX + 5, y + 25);
  doc.text(WORKSHOP_INFO.bankCity, marginX + 5, y + 29.8);

  // Right Top: Kotak Sorotan TOTAL
  const totalBoxW = 84;
  const totalBoxX = rightEdge - totalBoxW;
  doc.setFillColor(...TINT);
  doc.setDrawColor(...BORDER_STRONG);
  doc.setLineWidth(0.5);
  doc.roundedRect(totalBoxX, y, totalBoxW, totalBoxH, 1.8, 1.8, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...INK);
  doc.text('TOTAL', totalBoxX + 5, y + 7.8);

  doc.setFontSize(12.5);
  doc.text(`Rp ${formatCurrencyComma(totals.grandTotal)}`, rightEdge - 5, y + 7.9, {
    align: 'right',
  });

  // Right Bottom: Kolom Tanda Tangan (~8mm dari kotak total, ~22mm ruang tanda tangan & stempel)
  const sigCenterX = totalBoxX + totalBoxW / 2;
  const dateY = y + totalBoxH + 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.8);
  doc.setTextColor(...INK);
  doc.text(`Jakarta, ${data.tglInv || '-'}`, sigCenterX, dateY, { align: 'center' });

  const sigLineY = dateY + 22; // ~22mm (~75px) natural space for wet signature & stamp
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.35);
  doc.line(sigCenterX - 32, sigLineY, sigCenterX + 32, sigLineY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...INK);
  doc.text(data.namaPenandatangan || '', sigCenterX, sigLineY + 5.5, {
    align: 'center',
  });

  if (hasRole) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...MUTED);
    doc.text(data.jabatanPenandatangan.trim(), sigCenterX, sigLineY + 10.6, {
      align: 'center',
    });
  }

  const filename = getTargetPdfFilename(data.noInv, data.noPolisi);
  doc.save(filename);
}

/**
 * Generates and downloads a 100% Native Vector A4 PKB PDF in the "New Gen"
 * Minimalis Otomotif Elegan style with 15mm margins and proportional typography.
 */
export function generateNewGenPkbPdf(data: PkbData): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageHeight = PAGE_HEIGHT;
  const marginX = MARGIN_LEFT;
  const rightEdge = RIGHT_EDGE; // 195 mm
  const contentW = CONTENT_WIDTH; // 180 mm

  let y = drawNewGenKopHeader(
    doc,
    marginX,
    rightEdge,
    NEW_GEN_WORKSHOP_INFO.pkbName,
    'PERINTAH KERJA BENGKEL',
    'SERVICE'
  );

  // =========================================================================
  // 2. STRIP INFORMASI PKB (5 KOLOM)
  // =========================================================================
  const stripH = 16.8;
  doc.setFillColor(...TINT);
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.32);
  doc.roundedRect(marginX, y, contentW, stripH, 1.8, 1.8, 'FD');

  const stripCols = [
    { label: 'NO PKB', value: data.noPkb || '-', x: marginX + 4.5 },
    { label: 'NO POLISI', value: data.noPolisi || '-', x: marginX + 35 },
    { label: 'TYPE', value: data.typeModel || '-', x: marginX + 71 },
    { label: 'TANGGAL', value: data.tanggalPkb || '-', x: marginX + 114 },
    { label: 'KM', value: data.km || '-', x: marginX + 152 },
  ];

  stripCols.forEach((col) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.8);
    doc.setTextColor(...SUBTLE);
    doc.text(col.label, col.x, y + 5.8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...INK);
    doc.text(col.value, col.x, y + 12.2);
  });

  y += stripH + 7;

  // =========================================================================
  // 3. TABEL RINCIAN JASA & RINCIAN PART
  // =========================================================================
  const totals = calculatePkbTotals(data);

  y = drawNewGenSectionTable(
    doc,
    y,
    marginX,
    rightEdge,
    pageHeight,
    'RINCIAN JASA',
    'JASA',
    'BIAYA JASA',
    data.jasaList,
    'Sub. Total Jasa',
    totals.subTotalJasa,
    true
  );

  y = drawNewGenSectionTable(
    doc,
    y,
    marginX,
    rightEdge,
    pageHeight,
    'RINCIAN PART',
    'PART',
    'BIAYA PART',
    data.sparepartList,
    'Sub. Total Part',
    totals.subTotalPart,
    true
  );

  // =========================================================================
  // 4. KOTAK TOTAL PKB (TANPA BANK & TANPA TANDA TANGAN)
  // =========================================================================
  if (y + 22 > BOTTOM_LIMIT) {
    doc.addPage();
    y = MARGIN_TOP;
  } else {
    y += 1.5;
  }

  doc.setDrawColor(...BORDER_STRONG);
  doc.setLineWidth(0.5);
  doc.line(marginX, y, rightEdge, y);
  y += 6;

  const totalBoxW = 82;
  const totalBoxX = rightEdge - totalBoxW;
  const totalBoxH = 12;
  doc.setFillColor(...TINT);
  doc.setDrawColor(...BORDER_STRONG);
  doc.setLineWidth(0.5);
  doc.roundedRect(totalBoxX, y, totalBoxW, totalBoxH, 1.8, 1.8, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...INK);
  doc.text('TOTAL', totalBoxX + 5, y + 7.8);

  doc.setFontSize(12.5);
  doc.text(`Rp ${formatCurrencyComma(totals.grandTotal)}`, rightEdge - 5, y + 7.9, {
    align: 'right',
  });

  const filename = getTargetPkbFilename(data.noPkb, data.noPolisi);
  doc.save(filename);
}
