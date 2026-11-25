import React from 'react';
import { Mail, Phone } from 'lucide-react';
import { NEW_GEN_WORKSHOP_INFO } from '../utils/invoiceLogic';
import { PMP_LOGO_BASE64 } from './PmpMonogramLogo';

interface NewGenKopHeaderProps {
  companyName: string;
  documentTitle: string;
  categoryBadge: string;
  badgeTestId?: string;
  isPrintMode?: boolean;
}

export const NewGenKopHeader: React.FC<NewGenKopHeaderProps> = ({
  companyName,
  documentTitle,
  categoryBadge,
  badgeTestId,
  isPrintMode = false,
}) => {
  return (
    <div>
      {/* Kop Surat Murni New Gen */}
      <div className="flex items-start justify-between gap-2 pb-3 border-b-2 border-[#1e293b]">
        {/* Left: PMP Logo (~19mm x 9.5mm) + Workshop Identity side-by-side */}
        <div className="flex items-start gap-2.5 min-w-0">
          <img
            src={PMP_LOGO_BASE64}
            alt="Logo CV Perkasa Mandiri Putra"
            className="w-[19mm] h-[9.5mm] object-contain shrink-0 mt-0.5"
          />
          <div className="min-w-0">
            <div className="text-[11.5pt] font-bold text-[#0f172a] leading-tight tracking-tight whitespace-nowrap">
              {companyName}
            </div>
            <div className="text-[7.5pt] text-[#475569] leading-[1.35] mt-0.5">
              <div className="whitespace-nowrap">
                {NEW_GEN_WORKSHOP_INFO.addressLine1}
              </div>
              <div className="whitespace-nowrap">
                {NEW_GEN_WORKSHOP_INFO.addressLine2}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Contact Icons & NPWP stacked 3 lines, right-aligned */}
        <div className="text-right shrink-0 space-y-0.5 leading-[1.35]">
          <div className="flex items-center justify-end gap-1.5 text-[8.2pt] text-[#0f172a] whitespace-nowrap">
            <Phone className="w-3 h-3 text-[#475569] shrink-0" strokeWidth={1.8} />
            <span className="tabular-nums">{NEW_GEN_WORKSHOP_INFO.phone}</span>
          </div>
          <div className="flex items-center justify-end gap-1.5 text-[8.2pt] text-[#0f172a] whitespace-nowrap">
            <Mail className="w-3 h-3 text-[#475569] shrink-0" strokeWidth={1.8} />
            <span>{NEW_GEN_WORKSHOP_INFO.email}</span>
          </div>
          <div className="text-[8.2pt] text-[#475569] whitespace-nowrap">
            NPWP : {NEW_GEN_WORKSHOP_INFO.npwp}
          </div>
        </div>
      </div>

      {/* Document Title Row directly below Kop line */}
      <div className="mt-3 flex items-center justify-between gap-4">
        <div
          className="text-[14pt] font-bold uppercase text-[#0f172a] leading-none"
          style={{ letterSpacing: '0.08em' }}
          data-testid={isPrintMode ? undefined : 'newgen-document-title'}
        >
          {documentTitle}
        </div>
        <div
          data-testid={isPrintMode ? undefined : badgeTestId}
          className="bg-[#f8fafc] border border-[#cbd5e1] rounded-[4px] px-[10px] py-[3px] text-[9pt] font-bold uppercase text-[#0f172a] whitespace-nowrap shrink-0"
        >
          {categoryBadge || '-'}
        </div>
      </div>
    </div>
  );
};
