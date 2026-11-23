import { jsPDF } from 'jspdf';
import { PMP_LOGO_BASE64 } from '../components/PmpMonogramLogo';
import { InvoiceData, LineItem, TemplateStyle } from '../types/invoice';
import {
  calculateInvoiceTotals,
  formatCurrencyComma,
  getTargetPdfFilename,
  resolveDisplaySpk,
  WORKSHOP_INFO,
} from './invoiceLogic';
import { generateNewGenInvoicePdf } from './newGenPdfGenerator';

/**
 * Generates and downloads a Native Vector A4 PDF Invoice using jsPDF with the official
 * PMP_LOGO_BASE64 image in the header and full vector text/lines throughout the document.
 */
export function generateAndDownloadInvoicePdf(
  data: InvoiceData,
  templateStyle: TemplateStyle = 'default'
): void {
  if (templateStyle === 'newgen') {
    generateNewGenInvoicePdf(data);
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
  const centerX = PAGE_WIDTH / 2; // 105 mm
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
  // 1. KOP SURAT (HEADER)
  // =========================================================================
  // Left Top: Official PMP Logo Image (proportional 2:1 ratio -> width 22mm, height 11mm)
  doc.addImage(PMP_LOGO_BASE64, 'PNG', marginX, MARGIN_TOP, 22, 11);

  // Workshop Identity directly under PMP Logo
  let leftY = MARGIN_TOP + 16.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(WORKSHOP_INFO.name, marginX, leftY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  leftY += 5.2;
  const kopAddr1 = doc.splitTextToSize(WORKSHOP_INFO.addressLine1, 104);
  doc.text(kopAddr1, marginX, leftY);
  leftY += kopAddr1.length * 4.5;
  const kopAddr2 = doc.splitTextToSize(WORKSHOP_INFO.addressLine2, 104);
  doc.text(kopAddr2, marginX, leftY);
  leftY += kopAddr2.length * 4.5;
  doc.text(WORKSHOP_INFO.phone, marginX, leftY);

  // Right Top: Kategori Pekerjaan, Email, NPWP (left-aligned inside right block)
  const rightBlockX = 124;
  let rightY = MARGIN_TOP + 11.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text((data.kategoriPekerjaan || '').toUpperCase(), rightBlockX, rightY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  rightY += 6;
  doc.text(`Email : ${WORKSHOP_INFO.email}`, rightBlockX, rightY);
  rightY += 4.8;
  doc.text(`NPWP : ${WORKSHOP_INFO.npwp}`, rightBlockX, rightY);

  // Center Title: INVOICE (14pt Bold, Kapital) + Full Horizontal Line below
  y = Math.max(leftY, rightY) + 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('INVOICE', centerX, y, { align: 'center' });

  y += 3;
  doc.setLineWidth(0.45);
  doc.line(marginX, y, rightEdge, y);

  // =========================================================================
  // 2. INFORMASI KLIEN & INFORMASI BENGKEL (2 KOLOM DI BAWAH GARIS KOP)
  // =========================================================================
  y += 6.5;
  const infoStartY = y;

  // Left Column: Kepada Yth
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.8);
  doc.text('Kepada Yth', marginX, infoStartY);

  let clientY = infoStartY + 6.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.8);
  doc.text(data.namaKlien || '-', marginX, clientY);
  clientY += 4.8;
  const addr1Lines = doc.splitTextToSize(data.alamatBaris1 || '', 104);
  doc.text(addr1Lines, marginX, clientY);
  clientY += addr1Lines.length * 4.6;
  const addr2Lines = doc.splitTextToSize(data.alamatBaris2 || '', 104);
  doc.text(addr2Lines, marginX, clientY);
  clientY += addr2Lines.length * 4.6;

  // Right Column: Informasi Bengkel
  const workshopInfoX = 124;
  const colonX = 144;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.8);
  doc.text('Informasi Bengkel', workshopInfoX, infoStartY);

  doc.setFont('helvetica', 'normal');
  let bengkelY = infoStartY + 6.5;
  doc.text('Hal', workshopInfoX, bengkelY);
  doc.text(`: ${data.hal || '1'}`, colonX, bengkelY);

  bengkelY += 4.8;
  doc.text('No Inv', workshopInfoX, bengkelY);
  doc.text(`: ${data.noInv || '-'}`, colonX, bengkelY);

  bengkelY += 4.8;
  doc.text('Tgl Inv', workshopInfoX, bengkelY);
  doc.text(`: ${data.tglInv || '-'}`, colonX, bengkelY);

  if (data.includeSpk) {
    bengkelY += 4.8;
    doc.text('No. SPK', workshopInfoX, bengkelY);
    doc.text(`: ${resolveDisplaySpk(data.noSpk, data.noInv)}`, colonX, bengkelY);
  }

  y = Math.max(clientY, bengkelY) + 5;

  // =========================================================================
  // 3. TABEL DATA KENDARAAN (1 BARIS, HANYA GARIS HORIZONTAL ATAS & BAWAH)
  // =========================================================================
  doc.setLineWidth(0.35);
  doc.line(marginX, y, rightEdge, y);

  y += 5.5;
  const colPolisiX = marginX + 2;
  const colModelX = marginX + 42;
  const colTahunX = marginX + 102;
  const colSpoX = marginX + 128;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.8);
  doc.text('NO. POLISI', colPolisiX, y);
  doc.text('MODEL', colModelX, y);
  doc.text('TAHUN', colTahunX, y);
  doc.text('NOMOR SPO', colSpoX, y);

  y += 5.8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.8);
  doc.text(data.noPolisi || '-', colPolisiX, y);
  doc.text(data.model || '-', colModelX, y);
  doc.text(data.tahun || '', colTahunX, y);
  doc.text(data.nomorSpo || '-', colSpoX, y);

  y += 3.8;
  doc.line(marginX, y, rightEdge, y);

  // =========================================================================
  // 4. TABEL LIST JASA & LIST SPAREPART (HANYA GARIS HORIZONTAL)
  // =========================================================================
  // Column coordinates (total width = 180mm: 15mm to 195mm)
  const colNoCenter = marginX + 5.5; // 20.5mm
  const colDescLeft = marginX + 13; // 28mm
  const colDescCenter = marginX + 58; // 73mm
  const colPriceRpLeft = marginX + 104; // 119mm
  const colPriceRight = marginX + 134; // 149mm
  const colPriceCenter = (colPriceRpLeft + colPriceRight) / 2;
  const colQtyCenter = marginX + 143; // 158mm
  const colAmountRpLeft = marginX + 151; // 166mm
  const colAmountRight = rightEdge - 1; // 194mm
  const colAmountCenter = (colAmountRpLeft + colAmountRight) / 2;

  const renderItemsSection = (
    sectionTitle: string,
    itemHeaderLabel: string,
    items: LineItem[],
    subtotalLabel: string,
    subtotalValue: number
  ) => {
    ensureSpace(34);
    y += 7;

    // Section title (Bold, left-aligned)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text(sectionTitle, marginX, y);

    y += 6.2;
    // Header row (NO top horizontal line)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('No', colNoCenter, y, { align: 'center' });
    doc.text(itemHeaderLabel, colDescCenter, y, { align: 'center' });
    doc.text('HARGA SATUAN', colPriceCenter, y, { align: 'center' });
    doc.text('QTY', colQtyCenter, y, { align: 'center' });
    doc.text('JUMLAH', colAmountCenter, y, { align: 'center' });

    // Horizontal line directly below column header
    y += 2.8;
    doc.setLineWidth(0.35);
    doc.line(marginX, y, rightEdge, y);

    // Body rows (10pt, generous vertical rhythm)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    if (items.length === 0) {
      y += 6.8;
      doc.text('-', colNoCenter, y, { align: 'center' });
      doc.text('-', colDescLeft, y);
      doc.text('Rp', colPriceRpLeft, y);
      doc.text('0', colPriceRight, y, { align: 'right' });
      doc.text('0', colQtyCenter, y, { align: 'center' });
      doc.text('Rp', colAmountRpLeft, y);
      doc.text('0', colAmountRight, y, { align: 'right' });
      y += 3.2;
    } else {
      items.forEach((item, idx) => {
        ensureSpace(12);
        y += 6.8;
        const unitPrice = Math.round(Number(item.hargaSatuan) || 0);
        const qty = Math.round(Number(item.qty) || 0);
        const rowTotal = unitPrice * qty;

        doc.text(String(idx + 1), colNoCenter, y, { align: 'center' });
        const descLines = doc.splitTextToSize(item.nama || '-', 72);
        doc.text(descLines, colDescLeft, y);

        doc.text('Rp', colPriceRpLeft, y);
        doc.text(formatCurrencyComma(unitPrice), colPriceRight, y, { align: 'right' });

        doc.text(String(qty), colQtyCenter, y, { align: 'center' });

        doc.text('Rp', colAmountRpLeft, y);
        doc.text(formatCurrencyComma(rowTotal), colAmountRight, y, { align: 'right' });

        if (descLines.length > 1) {
          y += (descLines.length - 1) * 4.6;
        }
      });
      y += 3.2;
    }

    // Horizontal line below last item row
    doc.line(marginX, y, rightEdge, y);

    // Subtotal row below closing line
    y += 6;
    const subtotalLabelX = marginX + 104;
    const subtotalColonX = marginX + 146;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(subtotalLabel, subtotalLabelX, y);
    doc.text(':', subtotalColonX, y);
    doc.text('Rp', colAmountRpLeft, y);
    doc.text(formatCurrencyComma(subtotalValue), colAmountRight, y, { align: 'right' });
  };

  const totals = calculateInvoiceTotals(data);

  // Render LIST JASA
  renderItemsSection('LIST JASA', 'Jasa', data.jasaList, 'Sub. Total (Jasa)', totals.subTotalJasa);

  // Render LIST SPAREPART
  renderItemsSection(
    'LIST SPAREPART',
    'Part',
    data.sparepartList,
    data.labelSubtotalSparepart || 'Sub. Total (Sparepart)',
    totals.subTotalSparepart
  );

  // Optional PPN & PPh rows directly below Sparepart subtotal
  const summaryLabelX = marginX + 104;
  const summaryColonX = marginX + 146;

  if (data.enablePpn) {
    ensureSpace(8);
    y += 5.8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`PPN (${data.ppnRate}%)`, summaryLabelX, y);
    doc.text(':', summaryColonX, y);
    doc.text('Rp', colAmountRpLeft, y);
    doc.text(formatCurrencyComma(totals.ppnAmount), colAmountRight, y, { align: 'right' });
  }

  if (data.enablePph) {
    ensureSpace(8);
    y += 5.8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`PPh 23 (${data.pphRate}%)`, summaryLabelX, y);
    doc.text(':', summaryColonX, y);
    doc.text('Rp', colAmountRpLeft, y);
    doc.text(`-${formatCurrencyComma(totals.pphAmount)}`, colAmountRight, y, { align: 'right' });
  }

  // =========================================================================
  // 5. BLOK BAWAH (TOTAL + INFORMASI BANK & TANDA TANGAN)
  //    Mengalir alami tepat di bawah garis penutup tabel (~6mm), tanpa ruang kosong tengah
  // =========================================================================
  const hasRole = Boolean(data.jabatanPenandatangan && data.jabatanPenandatangan.trim());
  const footerTotalBlockHeight = 6 + 9.4 + 8 + 22 + (hasRole ? 6 : 0);
  ensureSpace(footerTotalBlockHeight);

  y += 6;

  // Grand Total Row sandwiched between two full horizontal lines
  doc.setLineWidth(0.38);
  doc.line(marginX, y, rightEdge, y);

  y += 6.2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('Total', summaryLabelX, y);
  doc.text(':', summaryColonX, y);
  doc.text('Rp', colAmountRpLeft, y);
  doc.text(formatCurrencyComma(totals.grandTotal), colAmountRight, y, { align: 'right' });

  y += 3.2;
  doc.line(marginX, y, rightEdge, y);

  // Footer 2 Columns: Informasi Bank & Tanda Tangan (~8mm gap)
  const footerTopY = y + 8;

  // Left Column: Informasi Bank
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.8);
  doc.text('Informasi Bank', marginX, footerTopY);

  doc.setFont('helvetica', 'normal');
  let bankY = footerTopY + 6.5;
  doc.text(WORKSHOP_INFO.bankName, marginX, bankY);
  bankY += 4.8;
  doc.text(WORKSHOP_INFO.bankAccount, marginX, bankY);
  bankY += 4.8;
  doc.text(WORKSHOP_INFO.bankHolder, marginX, bankY);
  bankY += 4.8;
  doc.text(WORKSHOP_INFO.bankCity, marginX, bankY);

  // Right Column: Tanda Tangan (Center-aligned on Right Block)
  const sigCenterX = 160;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.8);
  doc.text(`Jakarta, ${data.tglInv || '-'}`, sigCenterX, footerTopY, { align: 'center' });

  // ~22mm (~75px) natural wet signature & stamp space
  const sigNameY = footerTopY + 22;
  // Regular text, NOT bold and NOT underlined
  doc.setFont('helvetica', 'normal');
  doc.text(data.namaPenandatangan || '', sigCenterX, sigNameY, { align: 'center' });

  // 1 empty line spacing (~5.8mm), then Jabatan Penandatangan (hidden if empty)
  if (hasRole) {
    doc.text(data.jabatanPenandatangan.trim(), sigCenterX, sigNameY + 5.8, { align: 'center' });
  }

  const filename = getTargetPdfFilename(data.noInv, data.noPolisi);
  doc.save(filename);
}
