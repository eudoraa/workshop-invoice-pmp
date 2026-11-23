import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Calculator,
  Check,
  Copy,
  Delete,
  History,
  Maximize2,
  Menu,
  Minus,
  Trash2,
  X,
} from 'lucide-react';
import {
  applyMemory,
  applyPercent,
  applyUnary,
  backspace,
  CalcHistoryItem,
  CalcOperator,
  CalculatorState,
  clearAll,
  clearEntry,
  clearHistory,
  evaluateEquals,
  formatDisplayNumber,
  getRawCopyValue,
  inputDecimal,
  inputDigit,
  inputOperator,
  loadHistoryItem,
  MemoryOp,
  toggleSign,
  UnaryOp,
} from '../utils/calculatorLogic';

interface FloatingCalculatorProps {
  isOpen: boolean;
  isMinimized: boolean;
  state: CalculatorState;
  onStateChange: React.Dispatch<React.SetStateAction<CalculatorState>>;
  onMinimize: () => void;
  onRestore: () => void;
  onClose: () => void;
}

const CALC_WIDTH = 324;
const CALC_ESTIMATED_HEIGHT = 516;

function getDisplayFontClass(text: string, isError: boolean): string {
  if (isError) return 'text-xl';
  const len = text.length;
  if (len <= 11) return 'text-4xl';
  if (len <= 14) return 'text-3xl';
  if (len <= 18) return 'text-2xl';
  return 'text-xl';
}

export const FloatingCalculator: React.FC<FloatingCalculatorProps> = ({
  isOpen,
  isMinimized,
  state,
  onStateChange,
  onMinimize,
  onRestore,
  onClose,
}) => {
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [copiedFeedback, setCopiedFeedback] = useState<boolean>(false);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const windowRef = useRef<HTMLDivElement | null>(null);
  const dragOffsetRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const copyTimerRef = useRef<number | null>(null);

  // Clear drag position if viewport becomes mobile so it re-centers cleanly
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setPosition(null);
        return;
      }
      setPosition((prev) => {
        if (!prev) return null;
        const maxX = Math.max(8, window.innerWidth - CALC_WIDTH - 8);
        const maxY = Math.max(8, window.innerHeight - 80);
        return {
          x: Math.min(Math.max(8, prev.x), maxX),
          y: Math.min(Math.max(8, prev.y), maxY),
        };
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Drag listeners on window
  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e: PointerEvent) => {
      const elWidth = windowRef.current?.offsetWidth || CALC_WIDTH;
      const elHeight = windowRef.current?.offsetHeight || CALC_ESTIMATED_HEIGHT;
      const maxX = Math.max(8, window.innerWidth - elWidth - 8);
      const maxY = Math.max(8, window.innerHeight - Math.min(elHeight, 120));

      const nextX = Math.min(Math.max(8, e.clientX - dragOffsetRef.current.dx), maxX);
      const nextY = Math.min(Math.max(8, e.clientY - dragOffsetRef.current.dy), maxY);
      setPosition({ x: nextX, y: nextY });
    };

    const handlePointerUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging]);

  // Cleanup copy feedback timer
  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  // Physical keyboard support when calculator is open & focus is not in a form field
  useEffect(() => {
    if (!isOpen || isMinimized) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null;
      if (activeEl) {
        const tag = activeEl.tagName;
        if (
          tag === 'INPUT' ||
          tag === 'TEXTAREA' ||
          tag === 'SELECT' ||
          activeEl.isContentEditable
        ) {
          return;
        }
      }

      // Do not intercept browser shortcuts with Ctrl/Meta/Alt
      if (e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      const key = e.key;
      if (/^[0-9]$/.test(key)) {
        e.preventDefault();
        onStateChange((prev) => inputDigit(prev, key));
      } else if (key === '.') {
        e.preventDefault();
        onStateChange((prev) => inputDecimal(prev));
      } else if (key === '+' || key === '-' || key === '*' || key === '/') {
        e.preventDefault();
        onStateChange((prev) => inputOperator(prev, key as CalcOperator));
      } else if (key === 'Enter' || key === '=') {
        e.preventDefault();
        onStateChange((prev) => evaluateEquals(prev));
      } else if (key === 'Backspace') {
        e.preventDefault();
        onStateChange((prev) => backspace(prev));
      } else if (key === 'Escape') {
        e.preventDefault();
        onStateChange((prev) => clearAll(prev));
      } else if (key === '%') {
        e.preventDefault();
        onStateChange((prev) => applyPercent(prev));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isMinimized, onStateChange]);

  const handleTitleBarPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only drag with primary button on desktop/tablet screens, ignoring clicks on title bar buttons
    if (e.button !== 0 || window.innerWidth < 640) return;
    if ((e.target as HTMLElement).closest('button')) return;

    const rect = windowRef.current?.getBoundingClientRect();
    if (!rect) return;

    dragOffsetRef.current = {
      dx: e.clientX - rect.left,
      dy: e.clientY - rect.top,
    };
    setPosition({ x: rect.left, y: rect.top });
    setIsDragging(true);
  };

  const handleCopyDisplay = useCallback(async () => {
    const raw = getRawCopyValue(state);
    if (!raw) return;

    let copied = false;
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(raw);
        copied = true;
      }
    } catch {
      copied = false;
    }

    if (!copied) {
      try {
        const temp = document.createElement('textarea');
        temp.value = raw;
        temp.setAttribute('readonly', 'true');
        temp.style.position = 'fixed';
        temp.style.opacity = '0';
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        document.body.removeChild(temp);
        copied = true;
      } catch {
        copied = false;
      }
    }

    if (copied) {
      setCopiedFeedback(true);
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
      copyTimerRef.current = window.setTimeout(() => {
        setCopiedFeedback(false);
      }, 1500);
    }
  }, [state]);

  if (!isOpen) return null;

  const formattedMain = state.error
    ? state.error
    : formatDisplayNumber(state.displayValue);
  const displayFontClass = getDisplayFontClass(formattedMain, Boolean(state.error));
  const hasMemory = state.memory !== null;

  // Minimized floating bar in bottom-right (desktop) / bottom-center (mobile)
  if (isMinimized) {
    return (
      <div
        data-testid="floating-calculator-minimized"
        className="print:hidden no-print fixed bottom-4 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:bottom-6 sm:right-6 z-50 flex items-center gap-2.5 pl-3 pr-2 py-2 rounded-xl bg-[#213448] text-white border border-[#94B4C1]/40 shadow-2xl select-none"
      >
        <button
          type="button"
          onClick={onRestore}
          aria-label="Pulihkan Kalkulator"
          className="flex items-center gap-2.5 pr-2 text-left cursor-pointer hover:opacity-90 transition-opacity"
        >
          <span className="w-6 h-6 rounded-md bg-[#547792] flex items-center justify-center shrink-0">
            <Calculator className="w-3.5 h-3.5 text-white" />
          </span>
          <span className="text-xs font-semibold text-[#EAE0CF] whitespace-nowrap">
            Calculator
          </span>
          <span className="text-xs font-mono font-bold text-white bg-[#182736] px-2 py-0.5 rounded border border-[#94B4C1]/30 max-w-[120px] truncate tabular-nums">
            {formattedMain}
          </span>
          <Maximize2 className="w-3.5 h-3.5 text-[#94B4C1] shrink-0" />
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup Kalkulator"
          title="Tutup"
          className="p-1.5 rounded-md text-[#94B4C1] hover:text-white hover:bg-red-600/80 transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  const handleDigit = (d: string) => onStateChange((prev) => inputDigit(prev, d));
  const handleDecimal = () => onStateChange((prev) => inputDecimal(prev));
  const handleOperator = (op: CalcOperator) =>
    onStateChange((prev) => inputOperator(prev, op));
  const handleEquals = () => onStateChange((prev) => evaluateEquals(prev));
  const handleClearAll = () => onStateChange((prev) => clearAll(prev));
  const handleClearEntry = () => onStateChange((prev) => clearEntry(prev));
  const handleBackspace = () => onStateChange((prev) => backspace(prev));
  const handleToggleSign = () => onStateChange((prev) => toggleSign(prev));
  const handlePercent = () => onStateChange((prev) => applyPercent(prev));
  const handleUnary = (op: UnaryOp) => onStateChange((prev) => applyUnary(prev, op));
  const handleMemory = (op: MemoryOp) => onStateChange((prev) => applyMemory(prev, op));
  const handleSelectHistory = (item: CalcHistoryItem) => {
    onStateChange((prev) => loadHistoryItem(prev, item));
    setIsHistoryOpen(false);
  };
  const handleClearHistory = () => onStateChange((prev) => clearHistory(prev));

  const numberBtnClass =
    'h-12 rounded-md bg-white hover:bg-[#F9F9F9] active:bg-[#EAE0CF]/40 border border-[#94B4C1]/30 shadow-[0_1px_1px_rgba(33,52,72,0.05)] text-[15px] font-semibold text-[#213448] flex items-center justify-center transition-colors cursor-pointer tabular-nums';
  const funcBtnClass =
    'h-12 rounded-md bg-[#F9F9F9] hover:bg-[#EAE0CF]/45 active:bg-[#EAE0CF]/70 border border-[#94B4C1]/30 shadow-[0_1px_1px_rgba(33,52,72,0.04)] text-[13px] font-medium text-[#213448] flex items-center justify-center transition-colors cursor-pointer';
  const opBtnClass =
    'h-12 rounded-md bg-[#F9F9F9] hover:bg-[#EAE0CF]/45 active:bg-[#EAE0CF]/70 border border-[#94B4C1]/30 shadow-[0_1px_1px_rgba(33,52,72,0.04)] text-lg font-medium text-[#213448] flex items-center justify-center transition-colors cursor-pointer';
  const equalsBtnClass =
    'h-12 rounded-md bg-[#547792] hover:bg-[#213448] active:bg-[#182736] text-white text-lg font-semibold flex items-center justify-center shadow-xs transition-colors cursor-pointer';

  const positionedStyle: React.CSSProperties | undefined = position
    ? { left: `${position.x}px`, top: `${position.y}px` }
    : undefined;

  return (
    <div
      ref={windowRef}
      data-testid="floating-calculator"
      role="region"
      aria-label="Kalkulator Standar"
      style={positionedStyle}
      className={`print:hidden no-print fixed z-50 w-[calc(100vw-24px)] max-w-[324px] rounded-xl bg-[#F3F3F3] border border-[#94B4C1]/65 shadow-[0_18px_45px_rgba(33,52,72,0.22)] overflow-hidden select-none flex flex-col ${
        position
          ? ''
          : 'bottom-4 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:bottom-6 sm:right-6'
      }`}
    >
      {/* 1. Title Bar (Draggable on Desktop) */}
      <div
        data-testid="calculator-titlebar"
        onPointerDown={handleTitleBarPointerDown}
        className={`flex items-center justify-between px-3 py-2 bg-[#F3F3F3] border-b border-[#94B4C1]/25 ${
          isDragging ? 'sm:cursor-grabbing' : 'sm:cursor-grab'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Calculator className="w-3.5 h-3.5 text-[#547792] shrink-0" />
          <span className="text-xs font-medium text-[#213448] truncate">
            Calculator
          </span>
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={onMinimize}
            aria-label="Minimize Kalkulator"
            title="Minimize"
            className="w-7 h-6 rounded flex items-center justify-center text-[#213448] hover:bg-[#EAE0CF]/70 transition-colors cursor-pointer"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Kalkulator"
            title="Tutup"
            className="w-7 h-6 rounded flex items-center justify-center text-[#213448] hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Sub-Header Mode (Standard + History Toggle) */}
      <div className="flex items-center justify-between px-3.5 pt-2.5 pb-1">
        <div className="flex items-center gap-2.5">
          <Menu className="w-4 h-4 text-[#547792] shrink-0" aria-hidden="true" />
          <h3 className="text-base font-bold text-[#213448] tracking-tight">
            Standard
          </h3>
        </div>
        <button
          type="button"
          onClick={() => setIsHistoryOpen((prev) => !prev)}
          aria-label="Riwayat Perhitungan"
          aria-expanded={isHistoryOpen}
          title="Riwayat Perhitungan"
          data-testid="calculator-history-toggle"
          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
            isHistoryOpen
              ? 'bg-[#547792] text-white'
              : 'text-[#213448] hover:bg-[#EAE0CF]/60'
          }`}
        >
          <History className="w-4 h-4" />
        </button>
      </div>

      {/* 3. Display Area (Right Aligned + Copy) */}
      <div className="px-4 pt-2 pb-3 text-right">
        <div
          data-testid="calculator-expression"
          className="text-xs text-[#64748b] min-h-[18px] truncate tabular-nums"
          title={state.expression}
        >
          {state.expression || '\u00A0'}
        </div>

        <div className="mt-1 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleCopyDisplay}
            disabled={Boolean(state.error)}
            aria-label="Salin angka kalkulator"
            title="Salin angka mentah ke clipboard"
            data-testid="calculator-copy-btn"
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors shrink-0 cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed ${
              copiedFeedback
                ? 'bg-[#547792] text-white'
                : 'text-[#547792] hover:text-[#213448] hover:bg-[#EAE0CF]/60'
            }`}
          >
            {copiedFeedback ? (
              <>
                <Check className="w-3 h-3" />
                <span>Tersalin</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Salin</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleCopyDisplay}
            disabled={Boolean(state.error)}
            title={state.error ? state.error : 'Klik untuk menyalin angka'}
            data-testid="calculator-display"
            className={`flex-1 text-right font-semibold text-[#213448] leading-tight truncate tabular-nums cursor-pointer disabled:cursor-default ${displayFontClass}`}
          >
            {formattedMain}
          </button>
        </div>
      </div>

      {/* 4. Memory Row (MC, MR, M+, M-, MS) */}
      <div className="grid grid-cols-5 gap-1 px-2 pb-1.5">
        {(['MC', 'MR', 'M+', 'M-', 'MS'] as MemoryOp[]).map((memOp) => {
          const isDisabled = !hasMemory && (memOp === 'MC' || memOp === 'MR');
          return (
            <button
              key={memOp}
              type="button"
              disabled={isDisabled}
              onClick={() => handleMemory(memOp)}
              aria-label={`Memori ${memOp}`}
              className={`h-8 rounded-md text-[11px] font-semibold transition-colors ${
                isDisabled
                  ? 'text-[#94B4C1] opacity-45 cursor-not-allowed'
                  : 'text-[#213448] hover:bg-[#EAE0CF]/60 active:bg-[#EAE0CF] cursor-pointer'
              }`}
            >
              {memOp}
            </button>
          );
        })}
      </div>

      {/* 5. Keypad + Optional Slide-Over History Panel */}
      <div className="relative px-1.5 pb-2">
        <div className="grid grid-cols-4 gap-[3px]">
          {/* Baris 1: %, CE, C, Backspace */}
          <button
            type="button"
            onClick={handlePercent}
            aria-label="Persen"
            className={funcBtnClass}
          >
            %
          </button>
          <button
            type="button"
            onClick={handleClearEntry}
            aria-label="Clear Entry"
            className={funcBtnClass}
          >
            CE
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            aria-label="Clear All"
            className={funcBtnClass}
          >
            C
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            aria-label="Backspace"
            title="Hapus 1 digit"
            className={funcBtnClass}
          >
            <Delete className="w-4 h-4" />
          </button>

          {/* Baris 2: 1/x, x², ²√x, ÷ */}
          <button
            type="button"
            onClick={() => handleUnary('reciprocal')}
            aria-label="Kebalikan satu per x"
            className={funcBtnClass}
          >
            <span className="italic">
              <sup className="text-[10px]">1</sup>/
              <sub className="text-[11px]">x</sub>
            </span>
          </button>
          <button
            type="button"
            onClick={() => handleUnary('square')}
            aria-label="Kuadrat"
            className={funcBtnClass}
          >
            <span className="italic">
              x<sup className="text-[10px] not-italic">2</sup>
            </span>
          </button>
          <button
            type="button"
            onClick={() => handleUnary('sqrt')}
            aria-label="Akar Kuadrat"
            className={funcBtnClass}
          >
            <span>
              <sup className="text-[9px]">2</sup>√<span className="italic">x</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => handleOperator('/')}
            aria-label="Bagi"
            className={opBtnClass}
          >
            ÷
          </button>

          {/* Baris 3: 7, 8, 9, × */}
          <button type="button" onClick={() => handleDigit('7')} className={numberBtnClass}>
            7
          </button>
          <button type="button" onClick={() => handleDigit('8')} className={numberBtnClass}>
            8
          </button>
          <button type="button" onClick={() => handleDigit('9')} className={numberBtnClass}>
            9
          </button>
          <button
            type="button"
            onClick={() => handleOperator('*')}
            aria-label="Kali"
            className={opBtnClass}
          >
            ×
          </button>

          {/* Baris 4: 4, 5, 6, − */}
          <button type="button" onClick={() => handleDigit('4')} className={numberBtnClass}>
            4
          </button>
          <button type="button" onClick={() => handleDigit('5')} className={numberBtnClass}>
            5
          </button>
          <button type="button" onClick={() => handleDigit('6')} className={numberBtnClass}>
            6
          </button>
          <button
            type="button"
            onClick={() => handleOperator('-')}
            aria-label="Kurang"
            className={opBtnClass}
          >
            −
          </button>

          {/* Baris 5: 1, 2, 3, + */}
          <button type="button" onClick={() => handleDigit('1')} className={numberBtnClass}>
            1
          </button>
          <button type="button" onClick={() => handleDigit('2')} className={numberBtnClass}>
            2
          </button>
          <button type="button" onClick={() => handleDigit('3')} className={numberBtnClass}>
            3
          </button>
          <button
            type="button"
            onClick={() => handleOperator('+')}
            aria-label="Tambah"
            className={opBtnClass}
          >
            +
          </button>

          {/* Baris 6: +/-, 0, ., = */}
          <button
            type="button"
            onClick={handleToggleSign}
            aria-label="Positif Negatif"
            className={numberBtnClass}
          >
            +/−
          </button>
          <button type="button" onClick={() => handleDigit('0')} className={numberBtnClass}>
            0
          </button>
          <button
            type="button"
            onClick={handleDecimal}
            aria-label="Titik Desimal"
            className={numberBtnClass}
          >
            .
          </button>
          <button
            type="button"
            onClick={handleEquals}
            aria-label="Sama Dengan"
            className={equalsBtnClass}
          >
            =
          </button>
        </div>

        {/* History Panel Overlay inside Calculator Window */}
        {isHistoryOpen && (
          <div
            data-testid="calculator-history-panel"
            className="absolute inset-0 bg-[#F9F9F9] border-t border-[#94B4C1]/40 flex flex-col justify-between p-3"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#EAE0CF]">
              <span className="text-xs font-bold text-[#213448]">
                Riwayat Perhitungan
              </span>
              {state.history.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearHistory}
                  aria-label="Hapus Semua Riwayat"
                  title="Hapus Riwayat"
                  className="p-1 rounded text-[#547792] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto py-2 space-y-1.5">
              {state.history.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center px-4">
                  <p className="text-xs text-[#64748b]">
                    Belum ada riwayat perhitungan pada sesi ini.
                  </p>
                </div>
              ) : (
                state.history.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectHistory(item)}
                    className="w-full text-right px-2.5 py-2 rounded-lg hover:bg-[#EAE0CF]/55 transition-colors cursor-pointer"
                  >
                    <div className="text-[11px] text-[#64748b] truncate tabular-nums">
                      {item.expression}
                    </div>
                    <div className="text-base font-bold text-[#213448] tabular-nums">
                      {item.result}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
