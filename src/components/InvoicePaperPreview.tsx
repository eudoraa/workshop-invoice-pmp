import React from 'react';
import { InvoiceData, LineItem, TemplateStyle } from '../types/invoice';
import {
  calculateInvoiceTotals,
  formatCurrencyComma,
  resolveDisplaySpk,
  WORKSHOP_INFO,
} from '../utils/invoiceLogic';
import { InvoiceNewGenPreview } from './InvoiceNewGenPreview';
import { PMP_LOGO_BASE64 } from './PmpMonogramLogo';

interface InvoicePaperPreviewProps {
  data: InvoiceData;
  templateStyle?: TemplateStyle;
}

export const InvoicePaperPreview: React.FC<InvoicePaperPreviewProps> = ({
  data,
  templateStyle = 'default',
}) => {
  if (templateStyle === 'newgen') {
    return <InvoiceNewGenPreview data={data} />;
  }

  const totals = calculateInvoiceTotals(data);

  const renderTableSection = (
    sectionTitle: string,
    columnTitle: string,
    items: LineItem[],
    subtotalLabel: string,
    subtotalAmount: number
  ) => {
    return (
      <div className="mt-[16px]">
        <div className="font-bold text-[10.5pt] tracking-normal text-black mb-1.5">
          {sectionTitle}
        </div>
        <table className="w-full border-collapse text-[10pt] leading-snug">
          <thead>
            {/* ONLY horizontal line below the header; NO line above header and NO vertical lines */}
            <tr className="border-b border-black">
              <th className="py-[8px] px-[6px] text-center font-normal w-[7%] whitespace-nowrap">No</th>
              <th className="py-[8px] px-[6px] text-center font-normal w-[43%] whitespace-nowrap">{columnTitle}</th>
              <th className="py-[8px] px-[6px] text-center font-normal w-[21%] whitespace-nowrap">HARGA SATUAN</th>
              <th className="py-[8px] px-[6px] text-center font-normal w-[8%] whitespace-nowrap">QTY</th>
              <th className="py-[8px] px-[6px] text-center font-normal w-[21%] whitespace-nowrap">JUMLAH</th>
            </tr>
          </thead>
          <tbody className="border-b border-black">
            {items.length === 0 ? (
              <tr>
                <td className="py-[8px] px-[6px] text-center">-</td>
                <td className="py-[8px] px-[6px] text-left">-</td>
                <td className="py-[8px] px-[6px]">
                  <div className="flex items-center justify-between tabular-nums">
                    <span>Rp</span>
                    <span>0</span>
                  </div>
                </td>
                <td className="py-[8px] px-[6px] text-center tabular-nums">0</td>
                <td className="py-[8px] px-[6px]">
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
                  <tr key={item.id}>
                    <td className="py-[8px] px-[6px] text-center align-top tabular-nums">
                      {idx + 1}
                    </td>
                    <td className="py-[8px] px-[6px] text-left align-top break-words">
                      {item.nama || '-'}
                    </td>
                    <td className="py-[8px] px-[6px] align-top">
                      <div className="flex items-center justify-between gap-1 tabular-nums">
                        <span>Rp</span>
                        <span>{formatCurrencyComma(unitPrice)}</span>
                      </div>
                    </td>
                    <td className="py-[8px] px-[6px] text-center align-top tabular-nums">
                      {qty}
                    </td>
                    <td className="py-[8px] px-[6px] align-top">
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

        {/* Subtotal Row directly below the table closing line */}
        <div className="grid grid-cols-12 items-center text-[10pt] pt-2">
          <div className="col-span-5" />
          <div className="col-span-4 flex items-center justify-between pr-2 whitespace-nowrap">
            <span>{subtotalLabel}</span>
            <span>:</span>
          </div>
          <div className="col-span-3 px-[6px] flex items-center justify-between tabular-nums">
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
      className="a4-invoice-sheet bg-white text-black mx-auto shadow-md border border-slate-200 w-[210mm] min-w-[210mm] max-w-[210mm] min-h-[297mm] p-[15mm] box-border"
      style={{
        fontFamily: 'Arial, Helvetica, Calibri, sans-serif',
      }}
    >
      {/* 1. KOP SURAT (HEADER) */}
      <div className="flex items-start justify-between gap-3">
        {/* Left: Monogram PMP + Workshop Identity */}
        <div className="flex-1 min-w-0">
          <img
            src={PMP_LOGO_BASE64}
            alt="Logo CV Perkasa Mandiri Putra"
            className="h-11 w-auto object-contain mb-2"
          />
          <div className="text-[8.5pt] leading-snug text-black">
            <div className="text-[15pt] font-bold leading-tight mb-1 whitespace-nowrap">
              {WORKSHOP_INFO.name}
            </div>
            <div className="whitespace-nowrap">{WORKSHOP_INFO.addressLine1}</div>
            <div className="whitespace-nowrap">{WORKSHOP_INFO.addressLine2}</div>
            <div className="whitespace-nowrap">{WORKSHOP_INFO.phone}</div>
          </div>
        </div>

        {/* Right: Kategori Pekerjaan, Email, NPWP */}
        <div className="shrink-0 w-[37%] pt-5 text-left text-black">
          <div
            className="text-[13pt] font-bold uppercase tracking-tight leading-snug"
            data-testid="preview-kategori"
          >
            {data.kategoriPekerjaan || '-'}
          </div>
          <div className="text-[9.5pt] leading-[1.45] mt-1.5">
            <div className="whitespace-nowrap">Email : {WORKSHOP_INFO.email}</div>
            <div className="whitespace-nowrap">NPWP : {WORKSHOP_INFO.npwp}</div>
          </div>
        </div>
      </div>

      {/* Center INVOICE title & Full Horizontal Line */}
      <div className="mt-4 text-center">
        <div className="text-[14pt] font-bold uppercase tracking-wide text-black">
          INVOICE
        </div>
        <div className="border-b-[1.5px] border-black mt-1.5 w-full" />
      </div>

      {/* 2. INFORMASI KLIEN & INFORMASI BENGKEL (2 KOLOM DI BAWAH GARIS KOP) */}
      <div className="mt-4 flex items-start justify-between gap-6 text-[9.8pt] leading-[1.48] text-black">
        {/* Left: Kepada Yth */}
        <div className="w-[57%]">
          <div>Kepada Yth</div>
          <div className="h-3.5" aria-hidden="true" />
          <div className="font-semibold" data-testid="preview-client-name">{data.namaKlien || '-'}</div>
          <div>{data.alamatBaris1}</div>
          <div>{data.alamatBaris2}</div>
        </div>

        {/* Right: Informasi Bengkel */}
        <div className="w-[41%]">
          <div>Informasi Bengkel</div>
          <div className="h-3.5" aria-hidden="true" />
          <div className="space-y-1">
            <div className="grid grid-cols-12">
              <span className="col-span-4">Hal</span>
              <span className="col-span-8">: {data.hal || '1'}</span>
            </div>
            <div className="grid grid-cols-12">
              <span className="col-span-4">No Inv</span>
              <span className="col-span-8" data-testid="preview-no-inv">
                : {data.noInv || '-'}
              </span>
            </div>
            <div className="grid grid-cols-12">
              <span className="col-span-4">Tgl Inv</span>
              <span className="col-span-8">: {data.tglInv || '-'}</span>
            </div>
            {data.includeSpk && (
              <div className="grid grid-cols-12" data-testid="preview-spk-row">
                <span className="col-span-4">No. SPK</span>
                <span className="col-span-8">
                  : {resolveDisplaySpk(data.noSpk, data.noInv)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. TABEL DATA KENDARAAN (1 BARIS, HANYA GARIS HORIZONTAL ATAS & BAWAH) */}
      <div className="mt-4 border-t border-b border-black py-[10px]">
        <div className="grid grid-cols-12 text-[9.8pt] leading-snug text-left">
          <div className="col-span-3">
            <div className="font-bold">NO. POLISI</div>
            <div className="mt-1" data-testid="preview-no-polisi">
              {data.noPolisi || '-'}
            </div>
          </div>
          <div className="col-span-4">
            <div className="font-bold">MODEL</div>
            <div className="mt-1" data-testid="preview-model">
              {data.model || '-'}
            </div>
          </div>
          <div className="col-span-2">
            <div className="font-bold">TAHUN</div>
            <div className="mt-1" data-testid="preview-tahun">
              {data.tahun || ''}
            </div>
          </div>
          <div className="col-span-3">
            <div className="font-bold">NOMOR SPO</div>
            <div className="mt-1 break-all" data-testid="preview-nomor-spo">
              {data.nomorSpo || '-'}
            </div>
          </div>
        </div>
      </div>

      {/* 4. TABEL LIST JASA & LIST SPAREPART */}
      {renderTableSection(
        'LIST JASA',
        'Jasa',
        data.jasaList,
        'Sub. Total (Jasa)',
        totals.subTotalJasa
      )}

      {renderTableSection(
        'LIST SPAREPART',
        'Part',
        data.sparepartList,
        data.labelSubtotalSparepart || 'Sub. Total (Sparepart)',
        totals.subTotalSparepart
      )}

      {/* Optional Tax Rows (PPN & PPh 23) */}
      {data.enablePpn && (
        <div
          className="grid grid-cols-12 items-center text-[10pt] pt-1.5"
          data-testid="preview-ppn-row"
        >
          <div className="col-span-5" />
          <div className="col-span-4 flex items-center justify-between pr-2 whitespace-nowrap">
            <span>PPN ({data.ppnRate}%)</span>
            <span>:</span>
          </div>
          <div className="col-span-3 px-[6px] flex items-center justify-between tabular-nums">
            <span>Rp</span>
            <span>{formatCurrencyComma(totals.ppnAmount)}</span>
          </div>
        </div>
      )}

      {data.enablePph && (
        <div
          className="grid grid-cols-12 items-center text-[10pt] pt-1.5"
          data-testid="preview-pph-row"
        >
          <div className="col-span-5" />
          <div className="col-span-4 flex items-center justify-between pr-2 whitespace-nowrap">
            <span>PPh 23 ({data.pphRate}%)</span>
            <span>:</span>
          </div>
          <div className="col-span-3 px-[6px] flex items-center justify-between tabular-nums">
            <span>Rp</span>
            <span>-{formatCurrencyComma(totals.pphAmount)}</span>
          </div>
        </div>
      )}

      {/* 5. BLOK TOTAL, INFORMASI BANK, & TANDA TANGAN (ALUR ALAMI TEPAT DI BAWAH TABEL) */}
      <div className="mt-[20px]">
        {/* Total Akhir Sandwiched Between Full Horizontal Lines Top & Bottom */}
        <div className="border-t border-b border-black py-2">
          <div className="grid grid-cols-12 items-center text-[10.5pt] font-semibold">
            <div className="col-span-5" />
            <div className="col-span-4 flex items-center justify-between pr-2 whitespace-nowrap">
              <span>Total</span>
              <span>:</span>
            </div>
            <div
              className="col-span-3 px-[6px] flex items-center justify-between tabular-nums"
              data-testid="preview-grand-total"
            >
              <span>Rp</span>
              <span>{formatCurrencyComma(totals.grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* FOOTER (2 KOLOM BAWAH: INFORMASI BANK & TANDA TANGAN) */}
        <div className="mt-[26px] flex items-start justify-between text-[9.8pt] leading-[1.5] text-black">
          {/* Left: Informasi Bank */}
          <div className="w-[50%]">
            <div>Informasi Bank</div>
            <div className="h-3.5" aria-hidden="true" />
            <div>{WORKSHOP_INFO.bankName}</div>
            <div>{WORKSHOP_INFO.bankAccount}</div>
            <div>{WORKSHOP_INFO.bankHolder}</div>
            <div>{WORKSHOP_INFO.bankCity}</div>
          </div>

          {/* Right: Tanda Tangan (Center-aligned on Right Block) */}
          <div className="w-[42%] text-center">
            <div>Jakarta, {data.tglInv || '-'}</div>
            {/* ~75px / 22mm wet signature & stamp space */}
            <div className="h-[75px]" aria-hidden="true" />
            {/* Regular font weight, NO bold and NO underline */}
            <div
              className="font-normal no-underline"
              data-testid="preview-signatory-name"
            >
              {data.namaPenandatangan}
            </div>
            {data.jabatanPenandatangan && data.jabatanPenandatangan.trim() !== '' && (
              <>
                <div className="h-3" aria-hidden="true" />
                <div data-testid="preview-signatory-role">
                  {data.jabatanPenandatangan}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
