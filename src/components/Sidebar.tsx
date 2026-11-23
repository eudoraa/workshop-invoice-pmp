import React from 'react';
import {
  Calculator,
  ClipboardList,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
  Wrench,
  X,
} from 'lucide-react';
import { ActivePage } from '../types/invoice';

interface SidebarProps {
  activePage: ActivePage;
  onSelectPage: (page: ActivePage) => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  isMobileDrawerOpen: boolean;
  onCloseMobileDrawer: () => void;
  isCalculatorOpen: boolean;
  onToggleCalculatorDesktop: () => void;
  onOpenCalculatorMobile: () => void;
  activeClientName: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onSelectPage,
  isSidebarOpen,
  onToggleSidebar,
  isMobileDrawerOpen,
  onCloseMobileDrawer,
  isCalculatorOpen,
  onToggleCalculatorDesktop,
  onOpenCalculatorMobile,
  activeClientName,
}) => {
  const renderSidebarContent = (expanded: boolean, isMobile: boolean) => (
    <>
      {/* Top Header & Navigation */}
      <div>
        {/* Header Sidebar */}
        <div
          className={`border-b border-[#CED4DA]/15 flex items-center ${
            expanded ? 'p-4 justify-between gap-2.5' : 'p-3 justify-center'
          }`}
        >
          {expanded ? (
            <>
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-[#2B3F64] border border-[#CED4DA]/25 flex items-center justify-center shrink-0 shadow-xs">
                  <Wrench className="w-4 h-4 text-[#F8F9FA]" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xs font-bold text-white leading-snug">
                    CV PERKASA MANDIRI PUTRA
                  </h1>
                  <p className="text-[11px] text-[#CED4DA] mt-0.5 truncate">
                    Workshop Invoice System
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={isMobile ? onCloseMobileDrawer : onToggleSidebar}
                aria-label={isMobile ? 'Tutup Menu Navigasi' : 'Tutup Sidebar'}
                title={isMobile ? 'Tutup Menu Navigasi' : 'Tutup Sidebar'}
                className="p-1.5 rounded-lg text-[#CED4DA] hover:text-white hover:bg-[#2B3F64] transition-colors shrink-0 cursor-pointer"
              >
                {isMobile ? (
                  <X className="w-4 h-4" />
                ) : (
                  <PanelLeftClose className="w-4 h-4" />
                )}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onToggleSidebar}
              aria-label="Buka Sidebar"
              title="Buka Sidebar"
              className="w-10 h-10 rounded-lg bg-[#2B3F64] hover:bg-[#2A3E63] border border-[#CED4DA]/25 flex items-center justify-center text-[#F8F9FA] hover:text-white transition-colors cursor-pointer"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Sections */}
        <nav
          className={expanded ? 'p-4 space-y-5' : 'p-2.5 space-y-4'}
          aria-label="Navigasi Utama"
        >
          {/* Section 1: MENU UTAMA */}
          <div className="space-y-2">
            {expanded && (
              <div className="px-3 mb-2 text-[11px] font-semibold tracking-wider text-[#CED4DA] uppercase">
                MENU UTAMA
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                onSelectPage('INVOICE');
                if (isMobile) onCloseMobileDrawer();
              }}
              title="Buat Invoice"
              aria-label="Buat Invoice"
              aria-current={activePage === 'INVOICE' ? 'page' : undefined}
              className={`w-full flex items-center rounded-lg font-semibold text-sm transition-colors cursor-pointer ${
                expanded ? 'gap-3 px-3 py-2.5' : 'justify-center p-2.5'
              } ${
                activePage === 'INVOICE'
                  ? 'bg-[#2B3F64] text-white shadow-xs ring-1 ring-[#CED4DA]/25'
                  : 'text-[#CED4DA] hover:bg-[#2B3F64]/60 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4 shrink-0" />
              {expanded && <span className="truncate">Buat Invoice</span>}
            </button>

            <button
              type="button"
              onClick={() => {
                onSelectPage('PKB');
                if (isMobile) onCloseMobileDrawer();
              }}
              title="Buat PKB"
              aria-label="Buat PKB"
              aria-current={activePage === 'PKB' ? 'page' : undefined}
              className={`w-full flex items-center rounded-lg font-semibold text-sm transition-colors cursor-pointer ${
                expanded ? 'gap-3 px-3 py-2.5' : 'justify-center p-2.5'
              } ${
                activePage === 'PKB'
                  ? 'bg-[#2B3F64] text-white shadow-xs ring-1 ring-[#CED4DA]/25'
                  : 'text-[#CED4DA] hover:bg-[#2B3F64]/60 hover:text-white'
              }`}
            >
              <ClipboardList className="w-4 h-4 shrink-0" />
              {expanded && <span className="truncate">Buat PKB</span>}
            </button>
          </div>

          {/* Section 2: TOOLS */}
          <div className="pt-4 border-t border-[#CED4DA]/15 space-y-2">
            {expanded && (
              <div className="px-3 mb-2 text-[11px] font-semibold tracking-wider text-[#CED4DA] uppercase">
                TOOLS
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                if (isMobile) {
                  onOpenCalculatorMobile();
                  onCloseMobileDrawer();
                } else {
                  onToggleCalculatorDesktop();
                }
              }}
              title="Kalkulator"
              aria-label="Kalkulator"
              aria-pressed={isCalculatorOpen}
              data-testid={isMobile ? 'mobile-sidebar-kalkulator' : 'sidebar-kalkulator'}
              className={`w-full flex items-center rounded-lg font-semibold text-sm transition-colors cursor-pointer ${
                expanded ? 'gap-3 px-3 py-2.5' : 'justify-center p-2.5'
              } ${
                isCalculatorOpen
                  ? 'bg-[#2B3F64] text-white shadow-xs ring-1 ring-[#CED4DA]/25'
                  : 'text-[#CED4DA] hover:bg-[#2B3F64]/60 hover:text-white'
              }`}
            >
              <Calculator className="w-4 h-4 shrink-0" />
              {expanded && <span className="truncate">Kalkulator</span>}
            </button>
          </div>
        </nav>
      </div>

      {/* Bottom Indicator: Preset Tujuan Aktif */}
      {expanded ? (
        <div className="p-4 m-3 rounded-lg bg-[#162238] border border-[#CED4DA]/20">
          <div className="text-[11px] font-medium text-[#CED4DA]">
            Preset Tujuan Aktif
          </div>
          <div
            className="mt-1 text-xs font-semibold text-[#F8F9FA] leading-snug break-words"
            data-testid={isMobile ? 'mobile-sidebar-active-preset' : 'sidebar-active-preset'}
          >
            {activePage === 'PKB'
              ? 'SOLUSI MOBILITAS BANGSA (Khusus GoFleet)'
              : activeClientName}
          </div>
        </div>
      ) : (
        <div className="p-2.5 mb-2 flex justify-center">
          <div
            className="w-10 h-10 rounded-lg bg-[#162238] border border-[#CED4DA]/20 flex items-center justify-center text-[10px] font-bold text-[#F8F9FA]"
            title={`Preset Tujuan Aktif: ${
              activePage === 'PKB' ? 'SOLUSI MOBILITAS BANGSA' : activeClientName
            }`}
          >
            {activePage === 'PKB' || activeClientName.includes('SOLUSI')
              ? 'GF'
              : 'OLX'}
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Desktop Collapsible Sidebar (lg+) */}
      <aside
        data-testid="app-sidebar"
        data-open={isSidebarOpen ? 'true' : 'false'}
        className={`hidden lg:flex no-print shrink-0 bg-[#1F2E4A] text-white flex-col justify-between border-r border-[#CED4DA]/15 select-none transition-all duration-300 sticky top-0 h-screen ${
          isSidebarOpen ? 'w-64' : 'w-16'
        }`}
      >
        {renderSidebarContent(isSidebarOpen, false)}
      </aside>

      {/* Mobile Drawer Sidebar (< lg) */}
      {isMobileDrawerOpen && (
        <div className="lg:hidden no-print fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-[#1F2E4A]/55 backdrop-blur-[1px]"
            onClick={onCloseMobileDrawer}
            aria-hidden="true"
          />
          <aside
            data-testid="mobile-sidebar-drawer"
            className="relative z-50 w-72 max-w-[82vw] h-full bg-[#1F2E4A] text-white flex flex-col justify-between border-r border-[#CED4DA]/15 shadow-2xl select-none"
          >
            {renderSidebarContent(true, true)}
          </aside>
        </div>
      )}
    </>
  );
};

