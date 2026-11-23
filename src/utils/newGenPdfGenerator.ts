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
  const topY = 13;

  // Left: PMP Logo (~20mm x 10mm) + Company Name & 2-line Address
  doc.addImage(PMP_LOGO_BASE64, 'PNG', marginX, topY, 20, 10);

  const identityX = marginX + 23;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(...INK);
  doc.text(companyName, identityX, topY + 3.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(...MUTED);
  doc.text(NEW_GEN_WORKSHOP_INFO.addressLine1, identityX, topY + 7.8);
  doc.text(NEW_GEN_WORKSHOP_INFO.addressLine2, identityX, topY + 11.4);

  // Right: Stacked 3 lines (Phone with icon, Email with icon, NPWP)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(...INK);

  const phoneText = NEW_GEN_WORKSHOP_INFO.phone;
  const phoneW = doc.getTextWidth(phoneText);
  doc.text(phoneText, rightEdge, topY + 3.2, { align: 'right' });
  drawVectorPhoneIcon(doc, rightEdge - phoneW - 4.2, topY + 0.6);

  const emailText = NEW_GEN_WORKSHOP_INFO.email;
  const emailW = doc.getTextWidth(emailText);
  doc.text(emailText, rightEdge, topY + 7.4, { align: 'right' });
  drawVectorMailIcon(doc, rightEdge - emailW - 4.8, topY + 4.9);

  doc.setTextColor(...MUTED);
  doc.text(`NPWP : ${NEW_GEN_WORKSHOP_INFO.npwp}`, rightEdge, topY + 11.4, {
    align: 'right',
  });

  // Strong Kop bottom divider (2px ~ 0.65mm)
  const kopLineY = topY + 15;
  doc.setDrawColor(...BORDER_STRONG);
  doc.setLineWidth(0.65);
  doc.line(marginX, kopLineY, rightEdge, kopLineY);

  // Document Title Row below Kop divider
  const titleY = kopLineY + 7.2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13.5);
  doc.setTextColor(...INK);
  doc.text(documentTitle, marginX, titleY);

  // Right Category Capsule Badge
  const badgeText = (categoryBadge || '-').toUpperCase();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  const badgeTextW = doc.getTextWidth(badgeText);
  const badgeW = badgeTextW + 7;
  const badgeH = 6.2;
  const badgeX = rightEdge - badgeW;
  const badgeY = titleY - 4.5;

  doc.setFillColor(...TINT);
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 1.2, 1.2, 'FD');
  doc.setTextColor(...INK);
  doc.text(badgeText, badgeX + badgeW / 2, badgeY + 4.2, { align: 'center' });

  return titleY + 4.8;
}

function drawNewGenSectionTable(
  doc: jsPDF,
  startY: number,
  marginX: number,
  rightEdge: number,
  pageHeight: number,
  sectionTitle: string,
  columnTitle: string,
  items: LineItem[],
  subtotalLabel: string,
  subtotalValue: number,
  qtyFirst: boolean
): number {
  let y = startY;
  const contentW = rightEdge - marginX; // 180mm

  const ensureSpace = (neededMm: number) => {
    if (y + neededMm > pageHeight - 15) {
      doc.addPage();
      y = 15;
    }
  };

  ensureSpace(28);

  // Section Title with 3px (~1mm) left border accent
  doc.setFillColor(...BORDER_STRONG);
  doc.rect(marginX, y - 3.3, 1.0, 4.2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...INK);
  doc.text(sectionTitle, marginX + 3, y);

  y += 2.6;

  // Table Header Box (#f8fafc fill, top & bottom 1.5px ~ 0.45mm #1e293b)
  const headerH = 8.5;
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
  // Invoice: NO (6%) | JASA/PART (46%) | HARGA SATUAN (20%) | QTY (8%) | JUMLAH (20%)
  // PKB:     NO (6%) | JASA/PART (46%) | QTY (8%) | HARGA SATUAN (20%) | BIAYA JASA (20%)
  const colPriceRpLeft = qtyFirst ? marginX + 109 : marginX + 94;
  const colPriceRight = qtyFirst ? marginX + 141 : marginX + 127;
  const colQtyCenter = qtyFirst ? marginX + 101 : marginX + 136;
  const colAmountRpLeft = marginX + 151;
  const colAmountRight = colRightEdge;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...INK);
  doc.text('NO', colNoX, y + 5.5);
  doc.text(columnTitle, colDescX, y + 5.5);

  if (qtyFirst) {
    doc.text('QTY', colQtyCenter, y + 5.5, { align: 'center' });
    doc.text('HARGA', colPriceRight, y + 3.7, { align: 'right' });
    doc.text('SATUAN', colPriceRight, y + 7.1, { align: 'right' });
    doc.text('BIAYA JASA', colAmountRight, y + 5.5, { align: 'right' });
  } else {
    doc.text('HARGA', colPriceRight, y + 3.7, { align: 'right' });
    doc.text('SATUAN', colPriceRight, y + 7.1, { align: 'right' });
    doc.text('QTY', colQtyCenter, y + 5.5, { align: 'center' });
    doc.text('JUMLAH', colAmountRight, y + 5.5, { align: 'right' });
  }

  y += headerH;

  // Table Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...INK);

  const descMaxW = qtyFirst ? 78 : 78;

  if (items.length === 0) {
    const rowH = 7;
    doc.text('-', colNoX, y + 4.8);
    doc.text('-', colDescX, y + 4.8);
    doc.text('Rp', colPriceRpLeft, y + 4.8);
    doc.text('0', colPriceRight, y + 4.8, { align: 'right' });
    doc.text('0', colQtyCenter, y + 4.8, { align: 'center' });
    doc.text('Rp', colAmountRpLeft, y + 4.8);
    doc.text('0', colAmountRight, y + 4.8, { align: 'right' });
    y += rowH;
    doc.setDrawColor(...BORDER_ROW);
    doc.setLineWidth(0.25);
    doc.line(marginX, y, rightEdge, y);
  } else {
    items.forEach((item, idx) => {
      const descLines = doc.splitTextToSize(item.nama || '-', descMaxW);
      const rowH = Math.max(7.2, 4.5 + descLines.length * 3.8);
      ensureSpace(rowH + 4);

      const textY = y + 4.8;
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
  y += 5.2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  doc.text(`${subtotalLabel} :`, colAmountRpLeft - 6, y, { align: 'right' });

  doc.setTextColor(...INK);
  doc.text('Rp', colAmountRpLeft, y);
  doc.text(formatCurrencyComma(subtotalValue), colAmountRight, y, {
    align: 'right',
  });

  return y + 7;
}

/**
 * Generates and downloads a 100% Native Vector A4 Invoice PDF in the "New Gen"
 * Minimalis Otomotif Elegan style matching Mockup_Desain_Opsi2_Invoice_dan_PKB_PMP.pdf Page 1.
 */
export function generateNewGenInvoicePdf(data: InvoiceData): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 15;
  const rightEdge = pageWidth - marginX; // 195mm
  const contentW = rightEdge - marginX; // 180mm

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
  const gapCards = 4.5;
  const leftCardW = (contentW - gapCards) * (1.25 / 2.25); // ~97.5mm
  const rightCardX = marginX + leftCardW + gapCards;
  const rightCardW = rightEdge - rightCardX; // ~78mm

  // Measure left card address lines to size card height dynamically
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const addr1Lines = doc.splitTextToSize(data.alamatBaris1 || '', leftCardW - 8);
  const addr2Lines = doc.splitTextToSize(data.alamatBaris2 || '', leftCardW - 8);
  const leftContentH =
    14 + (addr1Lines.length + addr2Lines.length) * 3.6 + 3;
  const rightContentH = data.includeSpk ? 31 : 27;
  const cardH = Math.max(leftContentH, rightContentH, 29);

  // Left Card: KEPADA YTH
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.32);
  doc.roundedRect(marginX, y, leftCardW, cardH, 1.8, 1.8, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...SUBTLE);
  doc.text('KEPADA YTH', marginX + 4, y + 5.2);
  doc.line(marginX + 4, y + 7, marginX + leftCardW - 4, y + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...INK);
  doc.text(data.namaKlien || '-', marginX + 4, y + 11.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  let addrY = y + 15.8;
  if (addr1Lines.length > 0 && addr1Lines[0] !== '') {
    doc.text(addr1Lines, marginX + 4, addrY);
    addrY += addr1Lines.length * 3.6;
  }
  if (addr2Lines.length > 0 && addr2Lines[0] !== '') {
    doc.text(addr2Lines, marginX + 4, addrY);
  }

  // Right Card: INFORMASI BENGKEL
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.32);
  doc.roundedRect(rightCardX, y, rightCardW, cardH, 1.8, 1.8, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...SUBTLE);
  doc.text('INFORMASI BENGKEL', rightCardX + 4, y + 5.2);
  doc.line(rightCardX + 4, y + 7, rightCardX + rightCardW - 4, y + 7);

  const infoLabelX = rightCardX + 4;
  const infoValX = rightCardX + 24;
  let infoY = y + 11.5;

  const drawInfoRow = (label: string, val: string, boldVal = false) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(label, infoLabelX, infoY);

    doc.setFont('helvetica', boldVal ? 'bold' : 'normal');
    doc.setTextColor(...INK);
    doc.text(`: ${val}`, infoValX, infoY);
    infoY += 4.3;
  };

  drawInfoRow('Hal', data.hal || '1');
  drawInfoRow('No Inv', data.noInv || '-', true);
  drawInfoRow('Tgl Inv', data.tglInv || '-');
  if (data.includeSpk) {
    drawInfoRow('No. SPK', resolveDisplaySpk(data.noSpk, data.noInv));
  }

  y += cardH + 4.5;

  // =========================================================================
  // 3. STRIP DATA KENDARAAN
  // =========================================================================
  const stripH = 14.5;
  doc.setFillColor(...TINT);
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.32);
  doc.roundedRect(marginX, y, contentW, stripH, 1.8, 1.8, 'FD');

  const stripCols = [
    { label: 'NO. POLISI', value: data.noPolisi || '-', x: marginX + 4 },
    { label: 'MODEL KENDARAAN', value: data.model || '-', x: marginX + 42 },
    { label: 'TAHUN', value: data.tahun || '-', x: marginX + 102 },
    { label: 'NOMOR SPO', value: data.nomorSpo || '-', x: marginX + 128 },
  ];

  stripCols.forEach((col) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...SUBTLE);
    doc.text(col.label, col.x, y + 5.2);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...INK);
    doc.text(col.value, col.x, y + 10.6);
  });

  y += stripH + 6.5;

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
    data.sparepartList,
    data.labelSubtotalSparepart || 'Sub. Total (Sparepart)',
    totals.subTotalSparepart,
    false
  );

  const colAmountRpLeft = marginX + 151;
  const colAmountRight = rightEdge - 2.5;

  if (data.enablePpn) {
    if (y + 8 > pageHeight - 15) {
      doc.addPage();
      y = 15;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...MUTED);
    doc.text(`PPN (${data.ppnRate}%) :`, colAmountRpLeft - 6, y - 2, {
      align: 'right',
    });
    doc.setTextColor(...INK);
    doc.text('Rp', colAmountRpLeft, y - 2);
    doc.text(formatCurrencyComma(totals.ppnAmount), colAmountRight, y - 2, {
      align: 'right',
    });
    y += 4.5;
  }

  if (data.enablePph) {
    if (y + 8 > pageHeight - 15) {
      doc.addPage();
      y = 15;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...MUTED);
    doc.text(`PPh 23 (${data.pphRate}%) :`, colAmountRpLeft - 6, y - 2, {
      align: 'right',
    });
    doc.setTextColor(...INK);
    doc.text('Rp', colAmountRpLeft, y - 2);
    doc.text(`-${formatCurrencyComma(totals.pphAmount)}`, colAmountRight, y - 2, {
      align: 'right',
    });
    y += 4.5;
  }

  // =========================================================================
  // 5. FOOTER: DIVIDER TEGAS, INFORMASI BANK, KOTAK TOTAL, & TANDA TANGAN LUAS
  // =========================================================================
  if (y + 62 > pageHeight - 12) {
    doc.addPage();
    y = 15;
  }

  doc.setDrawColor(...BORDER_STRONG);
  doc.setLineWidth(0.5);
  doc.line(marginX, y, rightEdge, y);
  y += 5.5;

  // Left: Informasi Bank Card
  const bankCardW = 82;
  const bankCardH = 29;
  doc.setFillColor(...TINT);
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.32);
  doc.roundedRect(marginX, y, bankCardW, bankCardH, 1.8, 1.8, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...SUBTLE);
  doc.text('INFORMASI BANK', marginX + 4.5, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...INK);
  doc.text(WORKSHOP_INFO.bankName, marginX + 4.5, y + 11.5);

  doc.setFontSize(10.5);
  doc.text(WORKSHOP_INFO.bankAccount, marginX + 4.5, y + 16.8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(WORKSHOP_INFO.bankHolder, marginX + 4.5, y + 21.8);
  doc.text(WORKSHOP_INFO.bankCity, marginX + 4.5, y + 25.8);

  // Right Top: Kotak Sorotan TOTAL
  const totalBoxW = 82;
  const totalBoxX = rightEdge - totalBoxW;
  const totalBoxH = 10.5;
  doc.setFillColor(...TINT);
  doc.setDrawColor(...BORDER_STRONG);
  doc.setLineWidth(0.5);
  doc.roundedRect(totalBoxX, y, totalBoxW, totalBoxH, 1.8, 1.8, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...INK);
  doc.text('TOTAL', totalBoxX + 4.5, y + 6.7);

  doc.setFontSize(11.5);
  doc.text(`Rp ${formatCurrencyComma(totals.grandTotal)}`, rightEdge - 4.5, y + 6.8, {
    align: 'right',
  });

  // Right Bottom: Kolom Tanda Tangan Luas (~28mm signature gap)
  const sigCenterX = totalBoxX + totalBoxW / 2;
  const dateY = y + totalBoxH + 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...INK);
  doc.text(`Jakarta, ${data.tglInv || '-'}`, sigCenterX, dateY, { align: 'center' });

  const sigLineY = dateY + 28; // ~28mm generous space for wet signature & stamp
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.35);
  doc.line(sigCenterX - 30, sigLineY, sigCenterX + 30, sigLineY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...INK);
  doc.text(data.namaPenandatangan || '', sigCenterX, sigLineY + 5.2, {
    align: 'center',
  });

  if (data.jabatanPenandatangan && data.jabatanPenandatangan.trim() !== '') {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...MUTED);
    doc.text(data.jabatanPenandatangan.trim(), sigCenterX, sigLineY + 9.8, {
      align: 'center',
    });
  }

  const filename = getTargetPdfFilename(data.noInv, data.noPolisi);
  doc.save(filename);
}

/**
 * Generates and downloads a 100% Native Vector A4 PKB PDF in the "New Gen"
 * Minimalis Otomotif Elegan style matching Mockup_Desain_Opsi2_Invoice_dan_PKB_PMP.pdf Page 2.
 */
export function generateNewGenPkbPdf(data: PkbData): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 15;
  const rightEdge = pageWidth - marginX; // 195mm
  const contentW = rightEdge - marginX; // 180mm

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
  const stripH = 14.5;
  doc.setFillColor(...TINT);
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.32);
  doc.roundedRect(marginX, y, contentW, stripH, 1.8, 1.8, 'FD');

  const stripCols = [
    { label: 'NO PKB', value: data.noPkb || '-', x: marginX + 4 },
    { label: 'NO POLISI', value: data.noPolisi || '-', x: marginX + 34 },
    { label: 'TYPE', value: data.typeModel || '-', x: marginX + 70 },
    { label: 'TANGGAL', value: data.tanggalPkb || '-', x: marginX + 114 },
    { label: 'KM', value: data.km || '-', x: marginX + 152 },
  ];

  stripCols.forEach((col) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...SUBTLE);
    doc.text(col.label, col.x, y + 5.2);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...INK);
    doc.text(col.value, col.x, y + 10.6);
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
    data.sparepartList,
    'Sub. Total Part',
    totals.subTotalPart,
    true
  );

  // =========================================================================
  // 4. KOTAK TOTAL PKB (TANPA BANK & TANPA TANDA TANGAN)
  // =========================================================================
  if (y + 22 > pageHeight - 15) {
    doc.addPage();
    y = 15;
  }

  doc.setDrawColor(...BORDER_STRONG);
  doc.setLineWidth(0.5);
  doc.line(marginX, y, rightEdge, y);
  y += 5.5;

  const totalBoxW = 76;
  const totalBoxX = rightEdge - totalBoxW;
  const totalBoxH = 11;
  doc.setFillColor(...TINT);
  doc.setDrawColor(...BORDER_STRONG);
  doc.setLineWidth(0.5);
  doc.roundedRect(totalBoxX, y, totalBoxW, totalBoxH, 1.8, 1.8, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...INK);
  doc.text('TOTAL', totalBoxX + 4.5, y + 7);

  doc.setFontSize(11.5);
  doc.text(`Rp ${formatCurrencyComma(totals.grandTotal)}`, rightEdge - 4.5, y + 7.1, {
    align: 'right',
  });

  const filename = getTargetPkbFilename(data.noPkb, data.noPolisi);
  doc.save(filename);
}
