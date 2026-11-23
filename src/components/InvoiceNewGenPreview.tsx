import React from 'react';
import { InvoiceData, LineItem } from '../types/invoice';
import {
  calculateInvoiceTotals,
  formatCurrencyComma,
  NEW_GEN_WORKSHOP_INFO,
  resolveDisplaySpk,
  WORKSHOP_INFO,
} from '../utils/invoiceLogic';
import { NewGenKopHeader } from './NewGenKopHeader';

interface InvoiceNewGenPreviewProps {
  data: InvoiceData;
}

export const InvoiceNewGenPreview: React.FC<InvoiceNewGenPreviewProps> = ({ data }) => {
  const totals = calculateInvoiceTotals(data);

  const renderSectionTable = (
    sectionTitle: string,
    columnTitle: string,
    items: LineItem[],
    subtotalLabel: string,
    subtotalAmount: number
  ) => {
    return (
      <div className="mt-4">
        {/* Section Title with 3px left border accent */}
        <div className="border-l-[3px] border-[#1e293b] pl-2 text-[10pt] font-bold uppercase text-[#0f172a] leading-tight mb-2">
          {sectionTitle}
        </div>

        <table className="w-full border-collapse text-[9pt] leading-snug text-[#0f172a]">
          <thead>
            <tr className="bg-[#f8fafc] border-t-[1.5px] border-b-[1.5px] border-[#1e293b]">
              <th className="py-1.5 px-2 text-left font-bold w-[6%] uppercase text-[8.5pt]">
                NO
              </th>
              <th className="py-1.5 px-2 text-left font-bold w-[46%] uppercase text-[8.5pt]">
                {columnTitle}
              </th>
              <th className="py-1.5 px-2 text-right font-bold w-[20%] uppercase text-[8.5pt] leading-tight">
                HARGA
                <br />
                SATUAN
              </th>
              <th className="py-1.5 px-1 text-center font-bold w-[8%] uppercase text-[8.5pt]">
                QTY
              </th>
              <th className="py-1.5 px-2 text-right font-bold w-[20%] uppercase text-[8.5pt]">
                JUMLAH
              </th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr className="border-b border-[#e2e8f0]">
                <td className="py-2 px-2 text-left">-</td>
                <td className="py-2 px-2 text-left">-</td>
                <td className="py-2 px-2">
                  <div className="flex items-center justify-between tabular-nums">
                    <span>Rp</span>
                    <span>0</span>
                  </div>
                </td>
                <td className="py-2 px-1 text-center tabular-nums">0</td>
                <td className="py-2 px-2">
                  <div className="flex items-center justify-between tabular-nums">
                    <span>Rp</span>
                    <span>0</span>
                  </div>
                </td>
              </tr>
            ) : (
              items.map((item, idx) => {
                const unitPrice = Math.round(Number(item.hargaSatuan) || 0);
                const qty = Math.round(Number(item.qty) || 0);
                const amount = unitPrice * qty;
                return (
                  <tr key={item.id} className="border-b border-[#e2e8f0]">
                    <td className="py-2 px-2 text-left align-top tabular-nums">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-2 text-left align-top break-words">
                      {item.nama || '-'}
                    </td>
                    <td className="py-2 px-2 align-top">
                      <div className="flex items-center justify-between gap-1 tabular-nums">
                        <span>Rp</span>
                        <span>{formatCurrencyComma(unitPrice)}</span>
                      </div>
                    </td>
                    <td className="py-2 px-1 text-center align-top tabular-nums">
                      {qty}
                    </td>
                    <td className="py-2 px-2 align-top">
                      <div className="flex items-center justify-between gap-1 tabular-nums">
                        <span>Rp</span>
                        <span>{formatCurrencyComma(amount)}</span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Subtotal Row aligned to right */}
        <div className="flex items-center text-[9pt] pt-2">
          <div className="w-[80%] text-right pr-3 font-semibold text-[#475569] whitespace-nowrap">
            {subtotalLabel} :
          </div>
          <div className="w-[20%] px-2 flex items-center justify-between font-bold text-[#0f172a] tabular-nums">
            <span>Rp</span>
            <span>{formatCurrencyComma(subtotalAmount)}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      id="a4-invoice-preview"
      data-testid="a4-invoice-preview"
      data-template-style="newgen"
      className="a4-invoice-sheet bg-white text-[#0f172a] mx-auto shadow-md border border-slate-200 w-full max-w-[210mm] min-h-[297mm] px-[15mm] py-[14mm] box-border"
      style={{
        fontFamily: 'Arial, Helvetica, Calibri, sans-serif',
      }}
    >
      {/* 1. KOP SURAT MURNI NEW GEN */}
      <NewGenKopHeader
        companyName={NEW_GEN_WORKSHOP_INFO.invoiceName}
        documentTitle="INVOICE"
        categoryBadge={data.kategoriPekerjaan || 'SERVICE BERKALA'}
        badgeTestId="preview-kategori"
      />

      {/* 2. DUA KARTU INFORMASI (KEPADA YTH & INFORMASI BENGKEL) */}
      <div
        className="mt-3.5 grid gap-[14px]"
        style={{ gridTemplateColumns: '1.25fr 1fr' }}
      >
        {/* Left Card: KEPADA YTH */}
        <div className="border border-[#cbd5e1] rounded-[6px] px-[12px] py-[10px]">
          <div className="text-[8.5pt] font-semibold uppercase tracking-wider text-[#64748b] pb-1.5 mb-2 border-b border-[#cbd5e1]">
            KEPADA YTH
          </div>
          <div
            className="text-[9.5pt] font-bold text-[#0f172a] leading-snug"
            data-testid="preview-client-name"
          >
            {data.namaKlien || '-'}
          </div>
          <div className="text-[8.5pt] text-[#475569] leading-[1.4] mt-1">
            <div>{data.alamatBaris1}</div>
            <div>{data.alamatBaris2}</div>
          </div>
        </div>

        {/* Right Card: INFORMASI BENGKEL */}
        <div className="border border-[#cbd5e1] rounded-[6px] px-[12px] py-[10px]">
          <div className="text-[8.5pt] font-semibold uppercase tracking-wider text-[#64748b] pb-1.5 mb-2 border-b border-[#cbd5e1]">
            INFORMASI BENGKEL
          </div>
          <div className="space-y-1 text-[8.5pt] leading-[1.35]">
            <div className="grid grid-cols-12">
              <span className="col-span-4 text-[#475569]">Hal</span>
              <span className="col-span-8 font-medium text-[#0f172a]">
                : {data.hal || '1'}
              </span>
            </div>
            <div className="grid grid-cols-12">
              <span className="col-span-4 text-[#475569]">No Inv</span>
              <span
                className="col-span-8 font-bold text-[#0f172a]"
                data-testid="preview-no-inv"
              >
                : {data.noInv || '-'}
              </span>
            </div>
            <div className="grid grid-cols-12">
              <span className="col-span-4 text-[#475569]">Tgl Inv</span>
              <span className="col-span-8 font-medium text-[#0f172a]">
                : {data.tglInv || '-'}
              </span>
            </div>
            {data.includeSpk && (
              <div className="grid grid-cols-12" data-testid="preview-spk-row">
                <span className="col-span-4 text-[#475569]">No. SPK</span>
                <span className="col-span-8 font-medium text-[#0f172a]">
                  : {resolveDisplaySpk(data.noSpk, data.noInv)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. STRIP DATA KENDARAAN */}
      <div className="mt-3.5 bg-[#f8fafc] border border-[#cbd5e1] rounded-[6px] px-[12px] py-[8px]">
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: '0.95fr 1.35fr 0.6fr 1.35fr' }}
        >
          <div>
            <div className="text-[7.5pt] font-semibold uppercase tracking-wider text-[#64748b]">
              NO. POLISI
            </div>
            <div
              className="text-[9pt] font-bold text-[#0f172a] mt-0.5 whitespace-nowrap"
              data-testid="preview-no-polisi"
            >
              {data.noPolisi || '-'}
            </div>
          </div>
          <div>
            <div className="text-[7.5pt] font-semibold uppercase tracking-wider text-[#64748b]">
              MODEL KENDARAAN
            </div>
            <div
              className="text-[9pt] font-bold text-[#0f172a] mt-0.5"
              data-testid="preview-model"
            >
              {data.model || '-'}
            </div>
          </div>
          <div>
            <div className="text-[7.5pt] font-semibold uppercase tracking-wider text-[#64748b]">
              TAHUN
            </div>
            <div
              className="text-[9pt] font-bold text-[#0f172a] mt-0.5 whitespace-nowrap"
              data-testid="preview-tahun"
            >
              {data.tahun || '-'}
            </div>
          </div>
          <div>
            <div className="text-[7.5pt] font-semibold uppercase tracking-wider text-[#64748b]">
              NOMOR SPO
            </div>
            <div
              className="text-[9pt] font-bold text-[#0f172a] mt-0.5 whitespace-nowrap"
              data-testid="preview-nomor-spo"
            >
              {data.nomorSpo || '-'}
            </div>
          </div>
        </div>
      </div>

      {/* 4. TABEL LIST JASA & LIST SPAREPART */}
      {renderSectionTable(
        'LIST JASA',
        'JASA',
        data.jasaList,
        'Sub. Total (Jasa)',
        totals.subTotalJasa
      )}

      {renderSectionTable(
        'LIST SPAREPART',
        'PART',
        data.sparepartList,
        data.labelSubtotalSparepart || 'Sub. Total (Sparepart)',
        totals.subTotalSparepart
      )}

      {/* Optional Tax Rows (PPN & PPh 23) */}
      {data.enablePpn && (
        <div
          className="flex items-center text-[9pt] pt-1.5"
          data-testid="preview-ppn-row"
        >
          <div className="w-[80%] text-right pr-3 font-semibold text-[#475569] whitespace-nowrap">
            PPN ({data.ppnRate}%) :
          </div>
          <div className="w-[20%] px-2 flex items-center justify-between font-bold text-[#0f172a] tabular-nums">
            <span>Rp</span>
            <span>{formatCurrencyComma(totals.ppnAmount)}</span>
          </div>
        </div>
      )}

      {data.enablePph && (
        <div
          className="flex items-center text-[9pt] pt-1.5"
          data-testid="preview-pph-row"
        >
          <div className="w-[80%] text-right pr-3 font-semibold text-[#475569] whitespace-nowrap">
            PPh 23 ({data.pphRate}%) :
          </div>
          <div className="w-[20%] px-2 flex items-center justify-between font-bold text-[#0f172a] tabular-nums">
            <span>Rp</span>
            <span>-{formatCurrencyComma(totals.pphAmount)}</span>
          </div>
        </div>
      )}

      {/* 5. BAGIAN BAWAH: DIVIDER TEGAS, INFORMASI BANK, KOTAK TOTAL, & TANDA TANGAN LUAS */}
      <div className="mt-4 pt-4 border-t-[1.5px] border-[#1e293b] flex items-start justify-between gap-6">
        {/* Left: Kartu Informasi Bank */}
        <div className="w-[46%] bg-[#f8fafc] border border-[#cbd5e1] rounded-[6px] px-[14px] py-[10px]">
          <div className="text-[8.5pt] font-semibold uppercase tracking-wider text-[#64748b] mb-2">
            INFORMASI BANK
          </div>
          <div className="text-[9pt] font-bold text-[#0f172a]">
            {WORKSHOP_INFO.bankName}
          </div>
          <div className="text-[11pt] font-bold text-[#0f172a] tabular-nums tracking-tight mt-0.5">
            {WORKSHOP_INFO.bankAccount}
          </div>
          <div className="text-[8.5pt] text-[#475569] mt-0.5">
            {WORKSHOP_INFO.bankHolder}
          </div>
          <div className="text-[8.5pt] text-[#475569]">
            {WORKSHOP_INFO.bankCity}
          </div>
        </div>

        {/* Right: Kotak TOTAL + Kolom Tanda Tangan Luas */}
        <div className="w-[46%] flex flex-col items-center">
          {/* Kotak Sorotan TOTAL */}
          <div className="w-full bg-[#f8fafc] border-[1.5px] border-[#1e293b] rounded-[6px] px-[14px] py-[9px] flex items-center justify-between">
            <span className="text-[10pt] font-bold uppercase text-[#0f172a]">
              TOTAL
            </span>
            <span
              className="text-[12pt] font-bold text-[#0f172a] tabular-nums"
              data-testid="preview-grand-total"
            >
              Rp {formatCurrencyComma(totals.grandTotal)}
            </span>
          </div>

          {/* Tanda Tangan Ekstra Lega */}
          <div className="mt-4 text-center w-full">
            <div className="text-[9pt] text-[#0f172a]">
              Jakarta, {data.tglInv || '-'}
            </div>
            {/* Ruang tanda tangan ~28mm / 84px */}
            <div className="h-[28mm]" aria-hidden="true" />
            <div className="w-[60mm] max-w-full mx-auto border-t border-[#cbd5e1] pt-1.5">
              <div
                className="text-[10pt] font-bold text-[#0f172a]"
                data-testid="preview-signatory-name"
              >
                {data.namaPenandatangan}
              </div>
              {data.jabatanPenandatangan && data.jabatanPenandatangan.trim() !== '' && (
                <div
                  className="text-[9.5pt] text-[#475569] mt-0.5"
                  data-testid="preview-signatory-role"
                >
                  {data.jabatanPenandatangan}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
