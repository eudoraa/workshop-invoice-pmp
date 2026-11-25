import { jsPDF } from 'jspdf';
import { PMP_LOGO_BASE64 } from '../components/PmpMonogramLogo';
import { InvoiceData, LineItem, TemplateStyle } from '../types/invoice';
import {
  calculateInvoiceTotals,
  formatCurrencyComma,
  getTargetPdfFilename,
  normalizeAddressText,
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

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 15;
  const rightEdge = pageWidth - marginX; // 195mm
  const centerX = pageWidth / 2; // 105mm

  let y = 12;

  const ensureSpace = (neededMm: number) => {
    if (y + neededMm > pageHeight - 15) {
      doc.addPage();
      y = 15;
    }
  };

  doc.setTextColor(0, 0, 0);
  doc.setDrawColor(0, 0, 0);

  // =========================================================================
  // 1. KOP SURAT (HEADER)
  // =========================================================================
  // Left Top: Official PMP Logo Image (proportional 2:1 ratio -> width 18mm, height 9mm)
  doc.addImage(PMP_LOGO_BASE64, 'PNG', 15, 12, 18, 9);

  // Workshop Identity directly under PMP Logo (starting at Y = 25)
  let leftY = 25;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(WORKSHOP_INFO.name, marginX, leftY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  leftY += 3.8;
  doc.text(WORKSHOP_INFO.addressLine1, marginX, leftY);
  leftY += 3.8;
  doc.text(WORKSHOP_INFO.addressLine2, marginX, leftY);
  leftY += 3.8;
  doc.text(WORKSHOP_INFO.phone, marginX, leftY);

  // Right Top: Kategori Pekerjaan, Email, NPWP (left-aligned inside right block)
  const rightBlockX = 132;
  let rightY = 23;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text((data.kategoriPekerjaan || '').toUpperCase(), rightBlockX, rightY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  rightY += 5;
  doc.text(`Email : ${WORKSHOP_INFO.email}`, rightBlockX, rightY);
  rightY += 4.2;
  doc.text(`NPWP : ${WORKSHOP_INFO.npwp}`, rightBlockX, rightY);

  // Center Title: INVOICE (Bold, Kapital, ~12pt) + Full Horizontal Line below
  y = Math.max(leftY, rightY) + 4.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('INVOICE', centerX, y, { align: 'center' });

  y += 2.2;
  doc.setLineWidth(0.4);
  doc.line(marginX, y, rightEdge, y);

  // =========================================================================
  // 2. INFORMASI KLIEN & INFORMASI BENGKEL (2 KOLOM DI BAWAH GARIS KOP)
  // =========================================================================
  y += 5.5;
  const infoStartY = y;

  // Left Column: Kepada Yth
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Kepada Yth', marginX, infoStartY);

  // 1 empty line spacing, then client details
  let clientY = infoStartY + 7.2;
  doc.setFont('helvetica', 'normal');
  doc.text(data.namaKlien || '-', marginX, clientY);
  clientY += 4.2;
  const addr1Lines = doc.splitTextToSize(
    normalizeAddressText(data.alamatBaris1 || ''),
    105
  );
  doc.text(addr1Lines, marginX, clientY);
  clientY += addr1Lines.length * 4.0;
  const addr2Lines = doc.splitTextToSize(
    normalizeAddressText(data.alamatBaris2 || ''),
    105
  );
  doc.text(addr2Lines, marginX, clientY);
  clientY += addr2Lines.length * 4.0;

  // Right Column: Informasi Bengkel
  const workshopInfoX = 132;
  const colonX = 152;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Informasi Bengkel', workshopInfoX, infoStartY);

  let bengkelY = infoStartY + 7.2;
  doc.text('Hal', workshopInfoX, bengkelY);
  doc.text(`: ${data.hal || '1'}`, colonX, bengkelY);

  bengkelY += 4.2;
  doc.text('No Inv', workshopInfoX, bengkelY);
  doc.text(`: ${data.noInv || '-'}`, colonX, bengkelY);

  bengkelY += 4.2;
  doc.text('Tgl Inv', workshopInfoX, bengkelY);
  doc.text(`: ${data.tglInv || '-'}`, colonX, bengkelY);

  if (data.includeSpk) {
    bengkelY += 4.2;
    doc.text('No. SPK', workshopInfoX, bengkelY);
    doc.text(`: ${resolveDisplaySpk(data.noSpk, data.noInv)}`, colonX, bengkelY);
  }

  y = Math.max(clientY, bengkelY) + 4.5;

  // =========================================================================
  // 3. TABEL DATA KENDARAAN (1 BARIS, HANYA GARIS HORIZONTAL ATAS & BAWAH)
  // =========================================================================
  doc.setLineWidth(0.35);
  doc.line(marginX, y, rightEdge, y);

  y += 4.5;
  const colPolisiX = marginX + 2;
  const colModelX = marginX + 42;
  const colTahunX = marginX + 102;
  const colSpoX = marginX + 128;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('NO. POLISI', colPolisiX, y);
  doc.text('MODEL', colModelX, y);
  doc.text('TAHUN', colTahunX, y);
  doc.text('NOMOR SPO', colSpoX, y);

  y += 4.8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(data.noPolisi || '-', colPolisiX, y);
  doc.text(data.model || '-', colModelX, y);
  doc.text(data.tahun || '', colTahunX, y);
  doc.text(data.nomorSpo || '-', colSpoX, y);

  y += 2.6;
  doc.line(marginX, y, rightEdge, y);

  // =========================================================================
  // 4. TABEL LIST JASA & LIST SPAREPART (HANYA GARIS HORIZONTAL)
  // =========================================================================
  // Column coordinates (total width = 180mm: 15mm to 195mm)
  const colNoCenter = marginX + 6; // 21mm
  const colDescLeft = marginX + 14; // 29mm
  const colDescCenter = marginX + 62; // 77mm
  const colPriceRpLeft = marginX + 108; // 123mm
  const colPriceRight = marginX + 136; // 151mm
  const colPriceCenter = (colPriceRpLeft + colPriceRight) / 2;
  const colQtyCenter = marginX + 145; // 160mm
  const colAmountRpLeft = marginX + 153; // 168mm
  const colAmountRight = rightEdge - 1; // 194mm
  const colAmountCenter = (colAmountRpLeft + colAmountRight) / 2;

  const renderItemsSection = (
    sectionTitle: string,
    itemHeaderLabel: string,
    items: LineItem[],
    subtotalLabel: string,
    subtotalValue: number
  ) => {
    ensureSpace(28);
    y += 7;

    // Section title (Bold, left-aligned)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(sectionTitle, marginX, y);

    y += 5;
    // Header row (NO top horizontal line)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text('No', colNoCenter, y, { align: 'center' });
    doc.text(itemHeaderLabel, colDescCenter, y, { align: 'center' });
    doc.text('HARGA SATUAN', colPriceCenter, y, { align: 'center' });
    doc.text('QTY', colQtyCenter, y, { align: 'center' });
    doc.text('JUMLAH', colAmountCenter, y, { align: 'center' });

    // Horizontal line directly below column header
    y += 2;
    doc.setLineWidth(0.3);
    doc.line(marginX, y, rightEdge, y);

    // Body rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);

    if (items.length === 0) {
      y += 5.5;
      doc.text('-', colNoCenter, y, { align: 'center' });
      doc.text('-', colDescLeft, y);
      doc.text('Rp', colPriceRpLeft, y);
      doc.text('0', colPriceRight, y, { align: 'right' });
      doc.text('0', colQtyCenter, y, { align: 'center' });
      doc.text('Rp', colAmountRpLeft, y);
      doc.text('0', colAmountRight, y, { align: 'right' });
      y += 2.5;
    } else {
      items.forEach((item, idx) => {
        ensureSpace(10);
        y += 5;
        const unitPrice = Math.round(Number(item.hargaSatuan) || 0);
        const qty = Math.round(Number(item.qty) || 0);
        const rowTotal = unitPrice * qty;

        doc.text(String(idx + 1), colNoCenter, y, { align: 'center' });
        const descLines = doc.splitTextToSize(item.nama || '-', 76);
        doc.text(descLines, colDescLeft, y);

        doc.text('Rp', colPriceRpLeft, y);
        doc.text(formatCurrencyComma(unitPrice), colPriceRight, y, { align: 'right' });

        doc.text(String(qty), colQtyCenter, y, { align: 'center' });

        doc.text('Rp', colAmountRpLeft, y);
        doc.text(formatCurrencyComma(rowTotal), colAmountRight, y, { align: 'right' });

        if (descLines.length > 1) {
          y += (descLines.length - 1) * 3.8;
        }
      });
      y += 2.5;
    }

    // Horizontal line below last item row
    doc.line(marginX, y, rightEdge, y);

    // Subtotal row below closing line
    y += 5;
    const subtotalLabelX = marginX + 108;
    const subtotalColonX = marginX + 148;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
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

  // Optional PPN & PPh rows above Total
  const summaryLabelX = marginX + 108;
  const summaryColonX = marginX + 148;

  if (data.enablePpn) {
    ensureSpace(8);
    y += 4.8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`PPN (${data.ppnRate}%)`, summaryLabelX, y);
    doc.text(':', summaryColonX, y);
    doc.text('Rp', colAmountRpLeft, y);
    doc.text(formatCurrencyComma(totals.ppnAmount), colAmountRight, y, { align: 'right' });
  }

  if (data.enablePph) {
    ensureSpace(8);
    y += 4.8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`PPh 23 (${data.pphRate}%)`, summaryLabelX, y);
    doc.text(':', summaryColonX, y);
    doc.text('Rp', colAmountRpLeft, y);
    doc.text(`-${formatCurrencyComma(totals.pphAmount)}`, colAmountRight, y, { align: 'right' });
  }

  // Grand Total Row sandwiched between two full horizontal lines
  ensureSpace(14);
  y += 3.5;
  doc.setLineWidth(0.35);
  doc.line(marginX, y, rightEdge, y);

  y += 4.8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Total', summaryLabelX, y);
  doc.text(':', summaryColonX, y);
  doc.text('Rp', colAmountRpLeft, y);
  doc.text(formatCurrencyComma(totals.grandTotal), colAmountRight, y, { align: 'right' });

  y += 2.4;
  doc.line(marginX, y, rightEdge, y);

  // =========================================================================
  // 5. FOOTER (2 KOLOM BAWAH: INFORMASI BANK & TANDA TANGAN)
  // =========================================================================
  ensureSpace(48);
  y += 10;
  const footerTopY = y;

  // Left Column: Informasi Bank
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Informasi Bank', marginX, footerTopY);

  let bankY = footerTopY + 7.5;
  doc.text(WORKSHOP_INFO.bankName, marginX, bankY);
  bankY += 4.2;
  doc.text(WORKSHOP_INFO.bankAccount, marginX, bankY);
  bankY += 4.2;
  doc.text(WORKSHOP_INFO.bankHolder, marginX, bankY);
  bankY += 4.2;
  doc.text(WORKSHOP_INFO.bankCity, marginX, bankY);

  // Right Column: Tanda Tangan (Center-aligned on Right Block)
  const sigCenterX = 160;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Jakarta, ${data.tglInv || '-'}`, sigCenterX, footerTopY, { align: 'center' });

  // ~25mm empty signature space
  const sigNameY = footerTopY + 26;
  // Regular text, NOT bold and NOT underlined
  doc.setFont('helvetica', 'normal');
  doc.text(data.namaPenandatangan || '', sigCenterX, sigNameY, { align: 'center' });

  // 1 empty line spacing (~6.5mm), then Jabatan Penandatangan (hidden if empty)
  if (data.jabatanPenandatangan && data.jabatanPenandatangan.trim()) {
    doc.text(data.jabatanPenandatangan.trim(), sigCenterX, sigNameY + 6.5, { align: 'center' });
  }

  const filename = getTargetPdfFilename(data.noInv, data.noPolisi);
  doc.save(filename);
}
