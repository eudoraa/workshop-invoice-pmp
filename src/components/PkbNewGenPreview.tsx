import React from 'react';
import { LineItem, PkbData } from '../types/invoice';
import {
  calculatePkbTotals,
  formatCurrencyComma,
  NEW_GEN_WORKSHOP_INFO,
} from '../utils/invoiceLogic';
import { NewGenKopHeader } from './NewGenKopHeader';

interface PkbNewGenPreviewProps {
  data: PkbData;
}

export const PkbNewGenPreview: React.FC<PkbNewGenPreviewProps> = ({ data }) => {
  const totals = calculatePkbTotals(data);

  const renderSectionTable = (
    sectionTitle: string,
    columnTitle: string,
    amountColumnTitle: string,
    items: LineItem[],
    subtotalLabel: string,
    subtotalAmount: number
  ) => {
    return (
      <div className="mt-[16px]">
        {/* Section Title with 3px left border accent */}
        <div className="border-l-[3px] border-[#1e293b] pl-2.5 text-[10.5pt] font-bold uppercase text-[#0f172a] leading-tight mb-2">
          {sectionTitle}
        </div>

        <table className="w-full border-collapse text-[10pt] leading-snug text-[#0f172a]">
          <thead>
            <tr className="bg-[#f8fafc] border-t-[1.5px] border-b-[1.5px] border-[#1e293b]">
              <th className="py-[8px] px-[6px] text-left font-bold w-[6%] uppercase text-[9.5pt]">
                NO
              </th>
              <th className="py-[8px] px-[6px] text-left font-bold w-[44%] uppercase text-[9.5pt]">
                {columnTitle}
              </th>
              <th className="py-[8px] px-[6px] text-center font-bold w-[8%] uppercase text-[9.5pt]">
                QTY
              </th>
              <th className="py-[8px] px-[6px] text-right font-bold w-[21%] uppercase text-[9.5pt] leading-tight">
                HARGA
                <br />
                SATUAN
              </th>
              <th className="py-[8px] px-[6px] text-right font-bold w-[21%] uppercase text-[9.5pt]">
                {amountColumnTitle}
              </th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr className="border-b border-[#e2e8f0]">
                <td className="py-[8px] px-[6px] text-left">-</td>
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
                  <tr key={item.id} className="border-b border-[#e2e8f0]">
                    <td className="py-[8px] px-[6px] text-left align-top tabular-nums">
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

        {/* Subtotal Row aligned to right */}
        <div className="flex items-center text-[10pt] pt-2">
          <div className="w-[79%] text-right pr-3 font-semibold text-[#475569] whitespace-nowrap">
            {subtotalLabel} :
          </div>
          <div className="w-[21%] px-[6px] flex items-center justify-between font-bold text-[#0f172a] tabular-nums">
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
      data-template-style="newgen"
      className="a4-invoice-sheet bg-white text-[#0f172a] mx-auto shadow-md border border-slate-200 w-[210mm] min-w-[210mm] max-w-[210mm] min-h-[297mm] p-[15mm] box-border"
      style={{
        fontFamily: 'Arial, Helvetica, Calibri, sans-serif',
      }}
    >
      {/* 1. KOP SURAT MURNI NEW GEN */}
      <NewGenKopHeader
        companyName={NEW_GEN_WORKSHOP_INFO.pkbName}
        documentTitle="PERINTAH KERJA BENGKEL"
        categoryBadge="SERVICE"
      />

      {/* 2. STRIP INFORMASI PKB (5 KOLOM) */}
      <div className="mt-4 bg-[#f8fafc] border border-[#cbd5e1] rounded-[6px] px-[14px] py-[12px]">
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-2">
            <div className="text-[8pt] font-semibold uppercase tracking-wider text-[#64748b]">
              NO PKB
            </div>
            <div
              className="text-[10pt] font-bold text-[#0f172a] mt-1"
              data-testid="pkb-preview-no-pkb"
            >
              {data.noPkb || '-'}
            </div>
          </div>
          <div className="col-span-3">
            <div className="text-[8pt] font-semibold uppercase tracking-wider text-[#64748b]">
              NO POLISI
            </div>
            <div
              className="text-[10pt] font-bold text-[#0f172a] mt-1"
              data-testid="pkb-preview-nopol"
            >
              {data.noPolisi || '-'}
            </div>
          </div>
          <div className="col-span-3">
            <div className="text-[8pt] font-semibold uppercase tracking-wider text-[#64748b]">
              TYPE
            </div>
            <div
              className="text-[10pt] font-bold text-[#0f172a] mt-1"
              data-testid="pkb-preview-type"
            >
              {data.typeModel || '-'}
            </div>
          </div>
          <div className="col-span-2">
            <div className="text-[8pt] font-semibold uppercase tracking-wider text-[#64748b]">
              TANGGAL
            </div>
            <div
              className="text-[10pt] font-bold text-[#0f172a] mt-1 tabular-nums"
              data-testid="pkb-preview-tanggal"
            >
              {data.tanggalPkb || '-'}
            </div>
          </div>
          <div className="col-span-2">
            <div className="text-[8pt] font-semibold uppercase tracking-wider text-[#64748b]">
              KM
            </div>
            <div
              className="text-[10pt] font-bold text-[#0f172a] mt-1 tabular-nums"
              data-testid="pkb-preview-km"
            >
              {data.km || '-'}
            </div>
          </div>
        </div>
      </div>

      {/* 3. TABEL RINCIAN JASA & RINCIAN PART */}
      {renderSectionTable(
        'RINCIAN JASA',
        'JASA',
        'BIAYA JASA',
        data.jasaList,
        'Sub. Total Jasa',
        totals.subTotalJasa
      )}

      {renderSectionTable(
        'RINCIAN PART',
        'PART',
        'BIAYA PART',
        data.sparepartList,
        'Sub. Total Part',
        totals.subTotalPart
      )}

      {/* 4. KOTAK TOTAL PKB (TANPA BANK & TANPA TANDA TANGAN) */}
      <div className="mt-[20px] pt-[18px] border-t-[1.5px] border-[#1e293b] flex justify-end">
        <div className="w-[44%] bg-[#f8fafc] border-[1.5px] border-[#1e293b] rounded-[6px] px-[14px] py-[10px] flex items-center justify-between">
          <span className="text-[10.5pt] font-bold uppercase text-[#0f172a]">
            TOTAL
          </span>
          <span
            className="text-[13pt] font-bold text-[#0f172a] tabular-nums"
            data-testid="pkb-preview-grand-total"
          >
            Rp {formatCurrencyComma(totals.grandTotal)}
          </span>
        </div>
      </div>
    </div>
  );
};
