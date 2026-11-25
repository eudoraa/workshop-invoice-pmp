/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  Download,
  FileSearch,
  LayoutTemplate,
  PanelLeft,
  Printer,
  RotateCcw,
} from 'lucide-react';
import { FloatingCalculator } from './components/FloatingCalculator';
import { InvoiceFormPanel } from './components/InvoiceFormPanel';
import { InvoicePaperPreview } from './components/InvoicePaperPreview';
import { PkbFormPanel } from './components/PkbFormPanel';
import { PkbPaperPreview } from './components/PkbPaperPreview';
import { Sidebar } from './components/Sidebar';
import { SpoModal } from './components/SpoModal';
import {
  CalculatorState,
  createInitialCalculatorState,
} from './utils/calculatorLogic';
import {
  ActivePage,
  InvoiceData,
  PkbData,
  SpoExtractionResult,
  TemplateStyle,
} from './types/invoice';
import {
  createInitialInvoiceData,
  createInitialPkbData,
  getPrintDocumentTitle,
  getTargetPdfFilename,
  getTargetPkbFilename,
  normalizeInvoiceData,
  parseTemplateStyle,
  resolveDisplaySpk,
  resolveSpoToInvoiceAndPkb,
  syncPkbNoFromInvoice,
} from './utils/invoiceLogic';
import { generateAndDownloadInvoicePdf } from './utils/pdfGenerator';
import { generatePkbPdf } from './utils/pkbPdfGenerator';

const INVOICE_STORAGE_KEY = 'pmp_workshop_invoice_state_v1';
const PKB_STORAGE_KEY = 'pmp_workshop_pkb_state_v1';
const TEMPLATE_STYLE_STORAGE_KEY = 'pmp_workshop_template_style_v1';

function loadSavedTemplateStyle(): TemplateStyle {
  try {
    return parseTemplateStyle(localStorage.getItem(TEMPLATE_STYLE_STORAGE_KEY));
  } catch {
    return 'default';
  }
}

function loadSavedInvoiceData(): InvoiceData {
  try {
    const raw = localStorage.getItem(INVOICE_STORAGE_KEY);
    if (!raw) {
      return createInitialInvoiceData();
    }
    const parsed = JSON.parse(raw) as Partial<InvoiceData>;
    const initial = createInitialInvoiceData();
    const merged: InvoiceData = {
      ...initial,
      ...parsed,
      jasaList: Array.isArray(parsed.jasaList) ? parsed.jasaList : [],
      sparepartList: Array.isArray(parsed.sparepartList) ? parsed.sparepartList : [],
    };
    merged.noSpk = resolveDisplaySpk(merged.noSpk, merged.noInv);
    return normalizeInvoiceData(merged);
  } catch {
    return createInitialInvoiceData();
  }
}

function loadSavedPkbData(): PkbData {
  try {
    const raw = localStorage.getItem(PKB_STORAGE_KEY);
    if (!raw) {
      return createInitialPkbData();
    }
    const parsed = JSON.parse(raw) as Partial<PkbData>;
    const initial = createInitialPkbData();
    return {
      ...initial,
      ...parsed,
      jasaList: Array.isArray(parsed.jasaList) ? parsed.jasaList : [],
      sparepartList: Array.isArray(parsed.sparepartList) ? parsed.sparepartList : [],
    };
  } catch {
    return createInitialPkbData();
  }
}

export default function App() {
  const [activePage, setActivePage] = useState<ActivePage>('INVOICE');
  const [mobileTab, setMobileTab] = useState<'FORM' | 'PREVIEW'>('FORM');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState<boolean>(false);
  const [isCalculatorMinimized, setIsCalculatorMinimized] = useState<boolean>(false);
  const [calculatorState, setCalculatorState] = useState<CalculatorState>(() =>
    createInitialCalculatorState()
  );
  const [templateStyle, setTemplateStyle] = useState<TemplateStyle>(() =>
    loadSavedTemplateStyle()
  );
  const [invoiceData, setInvoiceData] = useState<InvoiceData>(() =>
    loadSavedInvoiceData()
  );
  const [pkbData, setPkbData] = useState<PkbData>(() => loadSavedPkbData());
  const [isSpoModalOpen, setIsSpoModalOpen] = useState<boolean>(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  // Auto-save templateStyle to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(TEMPLATE_STYLE_STORAGE_KEY, templateStyle);
    } catch {
      // Ignore storage quota errors
    }
  }, [templateStyle]);

  // Auto-save Invoice to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(INVOICE_STORAGE_KEY, JSON.stringify(invoiceData));
    } catch {
      // Ignore storage quota errors
    }
  }, [invoiceData]);

  // Auto-save PKB to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(PKB_STORAGE_KEY, JSON.stringify(pkbData));
    } catch {
      // Ignore storage quota errors
    }
  }, [pkbData]);

  // Synchronize No PKB automatically ONLY when active preset is GoFleet (unless manually overridden)
  useEffect(() => {
    setPkbData((prev) =>
      syncPkbNoFromInvoice(prev, invoiceData.presetId, invoiceData.noInv)
    );
  }, [invoiceData.noInv, invoiceData.presetId]);

  // Auto-dismiss notification toast
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(''), 4500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const targetFilename =
    activePage === 'INVOICE'
      ? getTargetPdfFilename(invoiceData.noInv, invoiceData.noPolisi)
      : getTargetPkbFilename(pkbData.noPkb, pkbData.noPolisi);

  const handleApplySpoExtraction = (extracted: SpoExtractionResult) => {
    const plan = resolveSpoToInvoiceAndPkb({
      currentInvoice: invoiceData,
      currentPkb: pkbData,
      extracted,
      activePage,
    });

    setInvoiceData(plan.nextInvoice);
    setPkbData(plan.nextPkb);
    setToastMessage(plan.toastMessage);
  };

  const handleConfirmReset = () => {
    if (activePage === 'INVOICE') {
      const freshInvoice = createInitialInvoiceData();
      setInvoiceData(freshInvoice);
      try {
        localStorage.removeItem(INVOICE_STORAGE_KEY);
      } catch {
        // ignore
      }
      setToastMessage('Form invoice berhasil direset.');
    } else {
      const freshPkb = createInitialPkbData();
      setPkbData(freshPkb);
      try {
        localStorage.removeItem(PKB_STORAGE_KEY);
      } catch {
        // ignore
      }
      setToastMessage('Form PKB berhasil direset.');
    }
    setIsResetConfirmOpen(false);
  };

  const handlePrint = useCallback(() => {
    const originalTitle = document.title;
    const printTitle = getPrintDocumentTitle(targetFilename);
    let restored = false;

    const restoreTitle = () => {
      if (restored) return;
      restored = true;
      document.title = originalTitle;
      window.removeEventListener('afterprint', restoreTitle);
    };

    window.addEventListener('afterprint', restoreTitle, { once: true });
    document.title = printTitle;
    window.print();
    window.setTimeout(restoreTitle, 1000);
  }, [targetFilename]);

  // Intercept Cmd + P (macOS) & Ctrl + P (Windows/Linux) to run unified print flow
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handlePrint();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrint]);

  const handleDownloadPdf = () => {
    if (activePage === 'INVOICE') {
      generateAndDownloadInvoicePdf(invoiceData, templateStyle);
    } else {
      generatePkbPdf(pkbData, templateStyle);
    }
    setToastMessage(`Mengunduh ${targetFilename}`);
  };

  const handleToggleCalculatorDesktop = () => {
    setIsCalculatorOpen((prev) => {
      if (prev) {
        setIsCalculatorMinimized(false);
        return false;
      }
      setIsCalculatorMinimized(false);
      return true;
    });
  };

  const handleOpenCalculatorMobile = () => {
    setIsCalculatorOpen(true);
    setIsCalculatorMinimized(false);
  };

  const handleTopBarSidebarToggle = () => {
    if (window.innerWidth < 1024) {
      setIsMobileDrawerOpen((prev) => !prev);
    } else {
      setIsSidebarOpen((prev) => !prev);
    }
  };

  return (
    <>
      {/* Seluruh Aplikasi Interaktif disembunyikan saat Cetak Printer */}
      <div className="print:hidden min-h-screen bg-[#F7F5F0] text-[#213448] flex flex-col lg:flex-row">
        {/* Kolom Kiri: Collapsible Sidebar Navigasi */}
      <Sidebar
        activePage={activePage}
        onSelectPage={setActivePage}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        isMobileDrawerOpen={isMobileDrawerOpen}
        onCloseMobileDrawer={() => setIsMobileDrawerOpen(false)}
        isCalculatorOpen={isCalculatorOpen}
        onToggleCalculatorDesktop={handleToggleCalculatorDesktop}
        onOpenCalculatorMobile={handleOpenCalculatorMobile}
        activeClientName={invoiceData.namaKlien}
      />

      {/* Kolom Kanan: Area Kerja Utama */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="no-print sticky top-0 z-30 bg-white border-b border-[#94B4C1]/40 px-4 lg:px-5 py-3 flex flex-wrap xl:flex-nowrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={handleTopBarSidebarToggle}
              aria-label={isSidebarOpen ? 'Perkecil Sidebar' : 'Perluas Sidebar'}
              title={isSidebarOpen ? 'Perkecil Sidebar' : 'Perluas Sidebar'}
              data-testid="topbar-sidebar-toggle"
              className="p-1.5 rounded-lg text-[#547792] hover:text-[#213448] hover:bg-[#EAE0CF]/40 border border-[#94B4C1]/50 transition-colors shrink-0 cursor-pointer"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
            <h2 className="text-base font-bold text-[#213448] whitespace-nowrap">
              {activePage === 'INVOICE'
                ? 'Buat Invoice'
                : 'Buat PKB (Perintah Kerja Bengkel)'}
            </h2>
            <span
              className="text-xs font-mono bg-[#EAE0CF]/50 text-[#213448] px-2.5 py-1 rounded-md border border-[#94B4C1]/30 truncate"
              data-testid="topbar-target-filename"
              title={targetFilename}
            >
              {targetFilename}
            </span>
          </div>

          {/* Tombol Aksi + Pemilih Template di Kanan Atas */}
          <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
            <button
              type="button"
              onClick={() => setIsSpoModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#EAE0CF] bg-[#213448] hover:bg-[#547792] hover:text-white rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FileSearch className="w-3.5 h-3.5" />
              <span>Ekstrak SPO</span>
            </button>

            {/* Pemilih Template Desain (Default vs New Gen) tepat di sebelah Reset Form */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-[#94B4C1] hover:bg-[#EAE0CF]/30 rounded-lg transition-colors shrink-0">
              <LayoutTemplate className="w-3.5 h-3.5 text-[#547792] shrink-0" />
              <select
                aria-label="Template Desain"
                data-testid="template-style-select"
                value={templateStyle}
                onChange={(e) => setTemplateStyle(parseTemplateStyle(e.target.value))}
                className="text-xs font-semibold text-[#213448] bg-transparent focus:outline-none cursor-pointer pr-0.5"
              >
                <option value="default">Default</option>
                <option value="newgen">New Gen</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => setIsResetConfirmOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#213448] bg-white hover:bg-[#EAE0CF]/30 border border-[#94B4C1] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Form</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#213448] bg-white hover:bg-[#EAE0CF]/30 border border-[#94B4C1] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Printer</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#547792] hover:bg-[#213448] rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>
                {activePage === 'INVOICE'
                  ? 'Download PDF Invoice'
                  : 'Download PDF PKB'}
              </span>
            </button>
          </div>
        </header>

        {/* Notification Toast */}
        {toastMessage && (
          <div
            role="status"
            data-testid="app-toast"
            className="no-print fixed bottom-5 right-5 z-40 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#213448] text-[#EAE0CF] text-xs font-medium shadow-lg border border-[#547792]"
          >
            <CheckCircle2 className="w-4 h-4 text-[#94B4C1] shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Workspace (Grid 2 Panel: Panel Kiri Form Input & Panel Kanan Live Preview Kertas A4) */}
        <main className="flex-1 p-5 lg:p-6">
          {/* Tab Switcher Mobile (Form Input / Preview A4) */}
          <div
            className="no-print xl:hidden grid grid-cols-2 gap-2 mb-5 p-1 rounded-xl bg-white border border-[#94B4C1]/40 shadow-xs"
            role="tablist"
            aria-label="Tampilan Mobile"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mobileTab === 'FORM'}
              data-testid="mobile-tab-form"
              onClick={() => setMobileTab('FORM')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                mobileTab === 'FORM'
                  ? 'bg-[#213448] text-white'
                  : 'bg-[#EAE0CF]/40 text-[#213448] hover:bg-[#EAE0CF]/70'
              }`}
            >
              Form Input
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mobileTab === 'PREVIEW'}
              data-testid="mobile-tab-preview"
              onClick={() => setMobileTab('PREVIEW')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                mobileTab === 'PREVIEW'
                  ? 'bg-[#213448] text-white'
                  : 'bg-[#EAE0CF]/40 text-[#213448] hover:bg-[#EAE0CF]/70'
              }`}
            >
              Preview A4
            </button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            {/* Panel Kiri: Form Pengaturan & Input */}
            <div
              className={`no-print xl:col-span-5 ${
                mobileTab === 'FORM' ? 'block' : 'hidden xl:block'
              }`}
            >
              {activePage === 'INVOICE' ? (
                <InvoiceFormPanel data={invoiceData} onChange={setInvoiceData} />
              ) : (
                <PkbFormPanel
                  data={pkbData}
                  linkedNoInv={invoiceData.noInv}
                  activeInvoicePreset={invoiceData.presetId}
                  onChange={setPkbData}
                />
              )}
            </div>

            {/* Panel Kanan: Live Preview Kertas A4 (Kertas putih #FFFFFF di dalam bingkai #EAE0CF/35) */}
            <div
              className={`xl:col-span-7 ${
                mobileTab === 'PREVIEW' ? 'block' : 'hidden xl:block'
              }`}
            >
              <div className="bg-[#EAE0CF]/35 rounded-2xl p-4 sm:p-5 border border-[#94B4C1]/35 overflow-x-auto">
                <div className="no-print flex items-center justify-between mb-3 px-1">
                  <span className="text-xs font-semibold text-[#213448]">
                    {activePage === 'INVOICE'
                      ? 'Live Preview Kertas A4 Invoice (Identik Cetak & PDF Vektor)'
                      : 'Live Preview Kertas A4 PKB (Identik Cetak & PDF Vektor)'}
                  </span>
                  <span className="text-xs font-mono text-[#547792] tabular-nums">
                    210mm × 297mm
                  </span>
                </div>
                <div className="min-w-[680px]">
                  {activePage === 'INVOICE' ? (
                    <InvoicePaperPreview
                      data={invoiceData}
                      templateStyle={templateStyle}
                    />
                  ) : (
                    <PkbPaperPreview
                      data={pkbData}
                      templateStyle={templateStyle}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Floating Windows Standard Calculator */}
      <FloatingCalculator
        isOpen={isCalculatorOpen}
        isMinimized={isCalculatorMinimized}
        state={calculatorState}
        onStateChange={setCalculatorState}
        onMinimize={() => setIsCalculatorMinimized(true)}
        onRestore={() => setIsCalculatorMinimized(false)}
        onClose={() => {
          setIsCalculatorOpen(false);
          setIsCalculatorMinimized(false);
        }}
      />

      {/* Modal Ekstrak SPO / PO */}
      <SpoModal
        isOpen={isSpoModalOpen}
        onClose={() => setIsSpoModalOpen(false)}
        onApplyExtraction={handleApplySpoExtraction}
      />

      {/* Modal Konfirmasi Reset Form */}
      {isResetConfirmOpen && (
        <div
          className="no-print fixed inset-0 z-50 bg-[#213448]/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-modal-title"
        >
          <div className="bg-white rounded-xl border border-[#94B4C1]/40 shadow-xl w-full max-w-md p-6">
            <h3 id="reset-modal-title" className="text-base font-bold text-[#213448]">
              {activePage === 'INVOICE'
                ? 'Konfirmasi Reset Form Invoice'
                : 'Konfirmasi Reset Form PKB'}
            </h3>
            <p className="text-xs text-[#547792] mt-2 leading-relaxed">
              Apakah Anda yakin ingin mengosongkan seluruh input pada form{' '}
              {activePage === 'INVOICE' ? 'Invoice' : 'PKB'} ini? Data yang tersimpan
              otomatis di browser akan direset ke pengaturan awal.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-[#213448] bg-white hover:bg-[#EAE0CF]/30 border border-[#94B4C1] rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Ya, Reset Form
              </button>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Kontainer Khusus Cetak A4 (100% tanpa scale/transform/padding workspace) */}
      <div
        className="hidden print:block print-sheet-root"
        data-testid="print-sheet-root"
      >
        {activePage === 'INVOICE' ? (
          <InvoicePaperPreview
            data={invoiceData}
            templateStyle={templateStyle}
            isPrintMode
          />
        ) : (
          <PkbPaperPreview
            data={pkbData}
            templateStyle={templateStyle}
            isPrintMode
          />
        )}
      </div>
    </>
  );
}
