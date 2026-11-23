import React from 'react';
import { LineItem, PkbData, TemplateStyle } from '../types/invoice';
import {
  calculatePkbTotals,
  formatCurrencyComma,
  PKB_WORKSHOP_INFO,
} from '../utils/invoiceLogic';
import { PkbNewGenPreview } from './PkbNewGenPreview';
import { PMP_LOGO_BASE64 } from './PmpMonogramLogo';

interface PkbPaperPreviewProps {
  data: PkbData;
  templateStyle?: TemplateStyle;
}

export const PkbPaperPreview: React.FC<PkbPaperPreviewProps> = ({
  data,
  templateStyle = 'default',
}) => {
  if (templateStyle === 'newgen') {
    return <PkbNewGenPreview data={data} />;
  }

  const totals = calculatePkbTotals(data);

  const renderPkbSection = (
    sectionTitle: string,
    columnTitle: string,
    amountColumnTitle: string,
    items: LineItem[],
    subtotalLabel: string,
    subtotalAmount: number
  ) => {
    return (
      <div className="mt-[16px]">
        {/* Bold Section Title with full horizontal line directly underneath */}
        <div className="font-bold text-[10.5pt] text-black pb-1.5 border-b border-black">
          {sectionTitle}
        </div>

        <table className="w-full border-collapse text-[10pt] leading-snug mt-1">
          <thead>
            <tr className="border-b border-black">
              <th className="py-[8px] px-[6px] text-center font-bold w-[7%] whitespace-nowrap">
                No
              </th>
              <th className="py-[8px] px-[6px] text-center font-bold w-[43%] whitespace-nowrap">
                {columnTitle}
              </th>
              <th className="py-[8px] px-[6px] text-center font-bold w-[8%] whitespace-nowrap">
                Qty
              </th>
              <th className="py-[8px] px-[6px] text-center font-bold w-[21%] whitespace-nowrap">
                Harga Satuan
              </th>
              <th className="py-[8px] px-[6px] text-center font-bold w-[21%] whitespace-nowrap">
                {amountColumnTitle}
              </th>
            </tr>
          </thead>
          <tbody className="border-b border-black">
            {items.length === 0 ? (
              <tr>
                <td className="py-[8px] px-[6px] text-center">-</td>
                <td className="py-[8px] px-[6px] text-left">-</td>
                <td className="py-[8px] px-[6px] text-center tabular-nums">0</td>
                <td className="py-[8px] px-[6px]">
                  <div className="flex items-center justify-between tabular-nums">
                    <span>Rp</span>
                    <span>0</span>
                  </div>
                </td>
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
                    <td className="py-[8px] px-[6px] text-center align-top tabular-nums">
                      {qty}
                    </td>
                    <td className="py-[8px] px-[6px] align-top">
                      <div className="flex items-center justify-between gap-1 tabular-nums">
                        <span>Rp</span>
                        <span>{formatCurrencyComma(unitPrice)}</span>
                      </div>
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

        {/* Subtotal Row below table closing line */}
        <div className="flex items-center text-[10pt] pt-2">
          <div className="w-[79%] text-right pr-3 font-bold whitespace-nowrap">
            {subtotalLabel}
          </div>
          <div className="w-[21%] px-[6px] flex items-center justify-between tabular-nums">
            <span>Rp</span>
            <span>{formatCurrencyComma(subtotalAmount)}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      id="a4-pkb-preview"
      data-testid="a4-pkb-preview"
      className="a4-invoice-sheet bg-white text-black mx-auto shadow-md border border-slate-200 w-[210mm] min-w-[210mm] max-w-[210mm] min-h-[297mm] p-[15mm] box-border"
      style={{
        fontFamily: 'Arial, Helvetica, Calibri, sans-serif',
      }}
    >
      {/* 1. KOP SURAT PKB */}
      <div className="flex items-center justify-between gap-2.5 pb-3 border-b-[1.5px] border-black">
        {/* Left: Larger PMP Logo + Workshop Identity side-by-side */}
        <div className="flex items-center gap-[10px] flex-1 min-w-0">
          <img
            src={PMP_LOGO_BASE64}
            alt="Logo CV. Perkasa Mandiri Putra"
            className="w-[26mm] h-[13mm] object-contain shrink-0"
          />
          <div className="text-[8.5pt] leading-snug text-black flex-1 min-w-0">
            <div className="text-[14.5pt] font-bold uppercase tracking-tight leading-tight mb-0.5 whitespace-nowrap">
              {PKB_WORKSHOP_INFO.name}
            </div>
            <div className="whitespace-nowrap">{PKB_WORKSHOP_INFO.addressLine1}</div>
            <div className="whitespace-nowrap">{PKB_WORKSHOP_INFO.addressLine2}</div>
          </div>
        </div>

        {/* Right: Document Title centered on right block */}
        <div className="shrink-0 w-[29%] text-center text-[13pt] font-bold leading-snug text-black">
          <div className="whitespace-nowrap">{PKB_WORKSHOP_INFO.titleLine1}</div>
          <div>{PKB_WORKSHOP_INFO.titleLine2}</div>
        </div>
      </div>

      {/* 2. INFORMASI PKB & UNIT (2 KOLOM DI BAWAH GARIS KOP) */}
      <div className="mt-5 flex items-start justify-between gap-6 text-[9.8pt] leading-[1.55] text-black">
        {/* Left Column */}
        <div className="w-[54%] space-y-1">
          <div className="grid grid-cols-12">
            <span className="col-span-4">No PKB</span>
            <span className="col-span-8" data-testid="pkb-preview-no-pkb">
              : &nbsp;&nbsp;{data.noPkb || '-'}
            </span>
          </div>
          <div className="grid grid-cols-12">
            <span className="col-span-4">No Polisi</span>
            <span className="col-span-8" data-testid="pkb-preview-nopol">
              : &nbsp;&nbsp;{data.noPolisi || '-'}
            </span>
          </div>
          <div className="grid grid-cols-12">
            <span className="col-span-4">Type</span>
            <span className="col-span-8" data-testid="pkb-preview-type">
              : &nbsp;&nbsp;{data.typeModel || '-'}
            </span>
          </div>
        </div>

        {/* Right Column (values right-aligned at end of right column) */}
        <div className="w-[40%] space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <span className="w-16">Tanggal</span>
              <span>:</span>
            </div>
            <span className="tabular-nums" data-testid="pkb-preview-tanggal">
              {data.tanggalPkb || '-'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <span className="w-16">KM</span>
              <span>:</span>
            </div>
            <span className="tabular-nums" data-testid="pkb-preview-km">
              {data.km || '-'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. TABEL RINCIAN JASA */}
      {renderPkbSection(
        'Rincian Jasa',
        'Jasa',
        'Biaya Jasa',
        data.jasaList,
        'Sub. Total Jasa :',
        totals.subTotalJasa
      )}

      {/* 4. TABEL RINCIAN PART */}
      {renderPkbSection(
        'Rincian Part',
        'Part',
        'Biaya Part',
        data.sparepartList,
        'Sub. Total Part :',
        totals.subTotalPart
      )}

      {/* 5. TOTAL BARIS: 20px spacing, 1 horizontal line ABOVE Total :, NO line below */}
      <div className="mt-[20px] border-t border-black pt-2">
        <div className="flex items-center text-[10.5pt]">
          <div className="w-[79%] text-right pr-3 font-bold whitespace-nowrap">
            Total :
          </div>
          <div
            className="w-[21%] px-[6px] flex items-center justify-between font-semibold tabular-nums"
            data-testid="pkb-preview-grand-total"
          >
            <span>Rp</span>
            <span>{formatCurrencyComma(totals.grandTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
