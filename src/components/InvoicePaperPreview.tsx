import React from 'react';
import { InvoiceData, LineItem, TemplateStyle } from '../types/invoice';
import {
  calculateInvoiceTotals,
  formatCurrencyComma,
  normalizeAddressText,
  resolveDisplaySpk,
  WORKSHOP_INFO,
} from '../utils/invoiceLogic';
import { InvoiceNewGenPreview } from './InvoiceNewGenPreview';
import { PMP_LOGO_BASE64 } from './PmpMonogramLogo';

interface InvoicePaperPreviewProps {
  data: InvoiceData;
  templateStyle?: TemplateStyle;
  isPrintMode?: boolean;
}

export const InvoicePaperPreview: React.FC<InvoicePaperPreviewProps> = ({
  data,
  templateStyle = 'default',
  isPrintMode = false,
}) => {
  if (templateStyle === 'newgen') {
    return <InvoiceNewGenPreview data={data} isPrintMode={isPrintMode} />;
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
      <div className="mt-4">
        <div className="font-bold text-[12px] tracking-normal text-black mb-1">
          {sectionTitle}
        </div>
        <table className="w-full border-collapse text-[11px] leading-snug">
          <thead>
            {/* ONLY horizontal line below the header; NO line above header and NO vertical lines */}
            <tr className="border-b border-black">
              <th className="py-1 px-1 text-center font-normal w-[7%] whitespace-nowrap">No</th>
              <th className="py-1 px-2 text-center font-normal w-[45%] whitespace-nowrap">{columnTitle}</th>
              <th className="py-1 px-2 text-center font-normal w-[21%] whitespace-nowrap">HARGA SATUAN</th>
              <th className="py-1 px-1 text-center font-normal w-[8%] whitespace-nowrap">QTY</th>
              <th className="py-1 px-1 text-center font-normal w-[19%] whitespace-nowrap">JUMLAH</th>
            </tr>
          </thead>
          <tbody className="border-b border-black">
            {items.length === 0 ? (
              <tr>
                <td className="py-1.5 px-1 text-center">-</td>
                <td className="py-1.5 px-2 text-left">-</td>
                <td className="py-1.5 px-2">
                  <div className="flex items-center justify-between tabular-nums">
                    <span>Rp</span>
                    <span>0</span>
                  </div>
                </td>
                <td className="py-1.5 px-1 text-center tabular-nums">0</td>
                <td className="py-1.5 px-1">
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
                    <td className="py-1 px-1 text-center align-top tabular-nums">
                      {idx + 1}
                    </td>
                    <td className="py-1 px-2 text-left align-top break-words">
                      {item.nama || '-'}
                    </td>
                    <td className="py-1 px-2 align-top">
                      <div className="flex items-center justify-between gap-1 tabular-nums">
                        <span>Rp</span>
                        <span>{formatCurrencyComma(unitPrice)}</span>
                      </div>
                    </td>
                    <td className="py-1 px-1 text-center align-top tabular-nums">
                      {qty}
                    </td>
                    <td className="py-1 px-1 align-top">
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
        <div className="grid grid-cols-12 items-center text-[11px] pt-1.5">
          <div className="col-span-6" />
          <div className="col-span-3 flex items-center justify-between pr-2 whitespace-nowrap">
            <span>{subtotalLabel}</span>
            <span>:</span>
          </div>
          <div className="col-span-3 px-1 flex items-center justify-between tabular-nums">
            <span>Rp</span>
            <span>{formatCurrencyComma(subtotalAmount)}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      id={isPrintMode ? undefined : 'a4-invoice-preview'}
      data-testid={isPrintMode ? 'print-a4-invoice-preview' : 'a4-invoice-preview'}
      className="a4-invoice-sheet bg-white text-black mx-auto shadow-md border border-slate-200 w-full max-w-[210mm] min-h-[297mm] px-[15mm] py-[15mm] box-border"
      style={{
        fontFamily: 'Arial, Helvetica, Calibri, sans-serif',
      }}
    >
      {/* 1. KOP SURAT (HEADER) */}
      <div className="flex items-start justify-between gap-3">
        {/* Left: Monogram PMP + Workshop Identity */}
        <div className="w-[60%]">
          <img
            src={PMP_LOGO_BASE64}
            alt="Logo CV Perkasa Mandiri Putra"
            className="h-9 w-auto object-contain mb-1.5"
          />
          <div className="text-[10px] leading-[1.38] text-black">
            <div className="font-bold">{WORKSHOP_INFO.name}</div>
            <div className="whitespace-nowrap">{WORKSHOP_INFO.addressLine1}</div>
            <div className="whitespace-nowrap">{WORKSHOP_INFO.addressLine2}</div>
            <div>{WORKSHOP_INFO.phone}</div>
          </div>
        </div>

        {/* Right: Kategori Pekerjaan, Email, NPWP */}
        <div className="w-[39%] pt-5 text-left text-black">
          <div
            className="text-[13.5px] font-bold uppercase tracking-tight leading-snug"
            data-testid={isPrintMode ? undefined : 'preview-kategori'}
          >
            {data.kategoriPekerjaan || '-'}
          </div>
          <div className="text-[10px] leading-[1.42] mt-1">
            <div className="whitespace-nowrap">Email : {WORKSHOP_INFO.email}</div>
            <div className="whitespace-nowrap">NPWP : {WORKSHOP_INFO.npwp}</div>
          </div>
        </div>
      </div>

      {/* Center INVOICE title & Full Horizontal Line */}
      <div className="mt-2 text-center">
        <div className="text-[15px] font-bold uppercase tracking-wide text-black">
          INVOICE
        </div>
        <div className="border-b-[1.5px] border-black mt-1 w-full" />
      </div>

      {/* 2. INFORMASI KLIEN & INFORMASI BENGKEL (2 KOLOM DI BAWAH GARIS KOP) */}
      <div className="mt-3 flex items-start justify-between gap-6 text-[11.5px] leading-[1.45] text-black">
        {/* Left: Kepada Yth */}
        <div className="w-[58%]">
          <div>Kepada Yth</div>
          <div className="h-4" aria-hidden="true" />
          <div data-testid={isPrintMode ? undefined : 'preview-client-name'}>
            {data.namaKlien || '-'}
          </div>
          <div>{normalizeAddressText(data.alamatBaris1)}</div>
          <div>{normalizeAddressText(data.alamatBaris2)}</div>
        </div>

        {/* Right: Informasi Bengkel */}
        <div className="w-[40%]">
          <div>Informasi Bengkel</div>
          <div className="h-4" aria-hidden="true" />
          <div className="space-y-0.5">
            <div className="grid grid-cols-12">
              <span className="col-span-4">Hal</span>
              <span className="col-span-8">: {data.hal || '1'}</span>
            </div>
            <div className="grid grid-cols-12">
              <span className="col-span-4">No Inv</span>
              <span
                className="col-span-8"
                data-testid={isPrintMode ? undefined : 'preview-no-inv'}
              >
                : {data.noInv || '-'}
              </span>
            </div>
            <div className="grid grid-cols-12">
              <span className="col-span-4">Tgl Inv</span>
              <span className="col-span-8">: {data.tglInv || '-'}</span>
            </div>
            {data.includeSpk && (
              <div
                className="grid grid-cols-12"
                data-testid={isPrintMode ? undefined : 'preview-spk-row'}
              >
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
      <div className="mt-4 border-t border-b border-black py-1.5">
        <div className="grid grid-cols-12 text-[11.5px] leading-snug text-left">
          <div className="col-span-3">
            <div className="font-bold">NO. POLISI</div>
            <div
              className="mt-0.5"
              data-testid={isPrintMode ? undefined : 'preview-no-polisi'}
            >
              {data.noPolisi || '-'}
            </div>
          </div>
          <div className="col-span-4">
            <div className="font-bold">MODEL</div>
            <div
              className="mt-0.5"
              data-testid={isPrintMode ? undefined : 'preview-model'}
            >
              {data.model || '-'}
            </div>
          </div>
          <div className="col-span-2">
            <div className="font-bold">TAHUN</div>
            <div
              className="mt-0.5"
              data-testid={isPrintMode ? undefined : 'preview-tahun'}
            >
              {data.tahun || ''}
            </div>
          </div>
          <div className="col-span-3">
            <div className="font-bold">NOMOR SPO</div>
            <div
              className="mt-0.5 break-all"
              data-testid={isPrintMode ? undefined : 'preview-nomor-spo'}
            >
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
          className="grid grid-cols-12 items-center text-[11px] pt-1"
          data-testid={isPrintMode ? undefined : 'preview-ppn-row'}
        >
          <div className="col-span-6" />
          <div className="col-span-3 flex items-center justify-between pr-2 whitespace-nowrap">
            <span>PPN ({data.ppnRate}%)</span>
            <span>:</span>
          </div>
          <div className="col-span-3 px-1 flex items-center justify-between tabular-nums">
            <span>Rp</span>
            <span>{formatCurrencyComma(totals.ppnAmount)}</span>
          </div>
        </div>
      )}

      {data.enablePph && (
        <div
          className="grid grid-cols-12 items-center text-[11px] pt-1"
          data-testid={isPrintMode ? undefined : 'preview-pph-row'}
        >
          <div className="col-span-6" />
          <div className="col-span-3 flex items-center justify-between pr-2 whitespace-nowrap">
            <span>PPh 23 ({data.pphRate}%)</span>
            <span>:</span>
          </div>
          <div className="col-span-3 px-1 flex items-center justify-between tabular-nums">
            <span>Rp</span>
            <span>-{formatCurrencyComma(totals.pphAmount)}</span>
          </div>
        </div>
      )}

      {/* Total Akhir Sandwiched Between Full Horizontal Lines Top & Bottom */}
      <div className="mt-2 border-t border-b border-black py-1.5">
        <div className="grid grid-cols-12 items-center text-[11.5px]">
          <div className="col-span-6" />
          <div className="col-span-3 flex items-center justify-between pr-2 whitespace-nowrap">
            <span>Total</span>
            <span>:</span>
          </div>
          <div
            className="col-span-3 px-1 flex items-center justify-between tabular-nums"
            data-testid={isPrintMode ? undefined : 'preview-grand-total'}
          >
            <span>Rp</span>
            <span>{formatCurrencyComma(totals.grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* 5. FOOTER (2 KOLOM BAWAH: INFORMASI BANK & TANDA TANGAN) */}
      <div className="mt-8 flex items-start justify-between text-[11.5px] leading-[1.45] text-black">
        {/* Left: Informasi Bank */}
        <div className="w-[50%]">
          <div>Informasi Bank</div>
          <div className="h-4" aria-hidden="true" />
          <div>{WORKSHOP_INFO.bankName}</div>
          <div>{WORKSHOP_INFO.bankAccount}</div>
          <div>{WORKSHOP_INFO.bankHolder}</div>
          <div>{WORKSHOP_INFO.bankCity}</div>
        </div>

        {/* Right: Tanda Tangan (Center-aligned on Right Block) */}
        <div className="w-[42%] text-center">
          <div>Jakarta, {data.tglInv || '-'}</div>
          {/* ~25mm signature space */}
          <div className="h-[25mm]" aria-hidden="true" />
          {/* Regular font weight, NO bold and NO underline */}
          <div
            className="font-normal no-underline"
            data-testid={isPrintMode ? undefined : 'preview-signatory-name'}
          >
            {data.namaPenandatangan}
          </div>
          {data.jabatanPenandatangan && data.jabatanPenandatangan.trim() !== '' && (
            <>
              <div className="h-4" aria-hidden="true" />
              <div data-testid={isPrintMode ? undefined : 'preview-signatory-role'}>
                {data.jabatanPenandatangan}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
