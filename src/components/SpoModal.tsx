import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  FileUp,
  Loader2,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { SpoExtractionResult } from '../types/invoice';
import { dmyToIso, formatCurrencyComma } from '../utils/invoiceLogic';
import { extractTextFromPdfFile, fileToBase64 } from '../utils/pdfReader';
import { parseSpoTextLocally } from '../utils/spoParser';

interface SpoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyExtraction: (extracted: SpoExtractionResult) => void;
}

/**
 * Modal "Ekstraksi Otomatis Dokumen SPO / PO"
 * Strictly adheres to rules:
 * - No word "Contoh" anywhere in this modal
 * - No hardcoded fallback data
 * - Resets state cleanly on open/close/file change using useRef on <input type="file">
 */
export const SpoModal: React.FC<SpoModalProps> = ({
  isOpen,
  onClose,
  onApplyExtraction,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [fileBase64, setFileBase64] = useState<string>('');
  const [fileMimeType, setFileMimeType] = useState<string>('');
  const [rawText, setRawText] = useState<string>('');
  const [parsedResult, setParsedResult] = useState<SpoExtractionResult | null>(null);
  const [isReadingPdf, setIsReadingPdf] = useState<boolean>(false);
  const [isExtractingAi, setIsExtractingAi] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const resetModalState = () => {
    setSelectedFileName('');
    setFileBase64('');
    setFileMimeType('');
    setRawText('');
    setParsedResult(null);
    setIsReadingPdf(false);
    setIsExtractingAi(false);
    setErrorMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (isOpen) {
      resetModalState();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const runGeminiExtraction = async (
    textToProcess: string,
    b64Data: string,
    mime: string
  ) => {
    setIsExtractingAi(true);
    setErrorMessage('');
    try {
      const response = await fetch('/api/extract-spo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: textToProcess,
          fileBase64: b64Data || undefined,
          mimeType: mime || undefined,
        }),
      });
      const payload = await response.json();
      if (!response.ok || payload.error) {
        throw new Error(payload.error || 'Gagal mengekstrak dokumen menggunakan AI.');
      }
      if (payload.result) {
        const aiRes = payload.result;
        const tanggalDmy = typeof aiRes.tanggalSpo === 'string' ? aiRes.tanggalSpo : '';
        setParsedResult({
          presetId:
            aiRes.presetId === 'GOFLEET' || aiRes.presetId === 'OLX'
              ? aiRes.presetId
              : null,
          nomorSpo: aiRes.nomorSpo || '',
          tanggalSpoDmy: tanggalDmy,
          tanggalSpoIso: dmyToIso(tanggalDmy),
          noPolisi: aiRes.noPolisi || '',
          model: aiRes.model || '',
          tahun: aiRes.tahun || '',
          kmUnit: aiRes.kmUnit ? String(aiRes.kmUnit).replace(/[.,\s]/g, '') : '',
          jasaList: Array.isArray(aiRes.jasaList) ? aiRes.jasaList : [],
          sparepartList: Array.isArray(aiRes.sparepartList) ? aiRes.sparepartList : [],
        });
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan saat mengekstrak dengan Gemini API.';
      setErrorMessage(msg);
    } finally {
      setIsExtractingAi(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Clean previous state immediately before reading new file
    setSelectedFileName(file.name);
    setFileBase64('');
    setFileMimeType(file.type || 'application/pdf');
    setRawText('');
    setParsedResult(null);
    setErrorMessage('');

    try {
      setIsReadingPdf(true);
      const b64 = await fileToBase64(file);
      setFileBase64(b64);

      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        const extractedText = await extractTextFromPdfFile(file);
        setRawText(extractedText);

        const localParsed = parseSpoTextLocally(extractedText);
        const hasLocalItems =
          localParsed.jasaList.length > 0 || localParsed.sparepartList.length > 0;

        if (hasLocalItems || localParsed.nomorSpo || localParsed.noPolisi) {
          setParsedResult(localParsed);
        }

        // Automatically invoke Gemini API fallback if local parser finds no line items
        if (!hasLocalItems) {
          setIsReadingPdf(false);
          await runGeminiExtraction(extractedText, b64, 'application/pdf');
          return;
        }
      } else {
        // Image/scan uploaded: immediately extract using multimodal Gemini API
        setIsReadingPdf(false);
        await runGeminiExtraction('', b64, file.type || 'image/png');
        return;
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Gagal membaca file dokumen SPO/PO.';
      setErrorMessage(msg);
    } finally {
      setIsReadingPdf(false);
    }
  };

  const handleRawTextChange = (newText: string) => {
    setRawText(newText);
    setErrorMessage('');
    if (!newText.trim()) {
      setParsedResult(null);
      return;
    }
    const localParsed = parseSpoTextLocally(newText);
    setParsedResult(localParsed);
  };

  const handleApply = () => {
    if (!parsedResult) return;
    onApplyExtraction(parsedResult);
    onClose();
  };

  const hasValidExtraction =
    parsedResult &&
    (parsedResult.nomorSpo ||
      parsedResult.noPolisi ||
      parsedResult.jasaList.length > 0 ||
      parsedResult.sparepartList.length > 0);

  return (
    <div
      className="no-print fixed inset-0 z-50 bg-[#1F2E4A]/55 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="spo-modal-title"
    >
      <div className="bg-white rounded-2xl border border-[#CED4DA] shadow-xl w-full max-w-3xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#1F2E4A] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-[#CED4DA]" />
            <h2 id="spo-modal-title" className="text-base font-bold text-white">
              Ekstraksi Otomatis Dokumen SPO / PO
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Modal Ekstraksi SPO"
            className="p-1.5 rounded-lg text-[#CED4DA] hover:text-white hover:bg-[#2B3F64] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* File Upload Dropzone */}
          <div className="p-4 rounded-xl bg-[#F8F9FA] border border-dashed border-[#CED4DA] hover:border-[#1F2E4A] transition-colors flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#CED4DA]/50 text-[#1F2E4A] flex items-center justify-center shrink-0">
                <FileUp className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-[#343A40]">
                  Unggah File PDF atau Gambar SPO / PO
                </div>
                <p className="text-xs text-[#343A40]/75 mt-0.5">
                  Mendukung format dokumen SPO GoFleet (PT Solusi Mobilitas Bangsa) &
                  SPO OLXMobbi (PT. Serasi Mitra Mobil)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/*"
                onChange={handleFileChange}
                className="hidden"
                id="spo-file-upload"
              />
              <label
                htmlFor="spo-file-upload"
                className="px-4 py-2 text-xs font-semibold text-white bg-[#1F2E4A] hover:bg-[#2A3E63] rounded-lg cursor-pointer transition-colors whitespace-nowrap"
              >
                Pilih File SPO
              </label>
              {(selectedFileName || rawText) && (
                <button
                  type="button"
                  onClick={resetModalState}
                  aria-label="Bersihkan File SPO"
                  className="p-2 text-[#343A40] hover:text-red-600 hover:bg-red-50 rounded-lg border border-[#CED4DA] transition-colors cursor-pointer"
                  title="Bersihkan File & Teks"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {selectedFileName && (
            <div className="flex items-center justify-between px-3.5 py-2 rounded-lg bg-[#F8F9FA] border border-[#CED4DA] text-xs text-[#343A40]">
              <span className="font-medium truncate">
                File terpilih: <strong>{selectedFileName}</strong>
              </span>
              {(isReadingPdf || isExtractingAi) && (
                <span className="inline-flex items-center gap-1.5 text-[#1F2E4A] font-semibold">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {isReadingPdf ? 'Membaca baris PDF...' : 'Mengekstrak dengan AI...'}
                </span>
              )}
            </div>
          )}

          {/* Raw Text Area for Instant Local Parsing or Inspection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="spo-raw-textarea"
                className="text-xs font-semibold text-[#343A40]"
              >
                Teks Dokumen SPO / PO (Otomatis dari PDF atau Tempel Teks SPO)
              </label>
              <button
                type="button"
                disabled={isExtractingAi || (!rawText.trim() && !fileBase64)}
                onClick={() => runGeminiExtraction(rawText, fileBase64, fileMimeType)}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-[#1F2E4A] bg-[#F8F9FA] hover:bg-[#CED4DA]/45 border border-[#CED4DA] rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {isExtractingAi ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>Ekstrak Cerdas AI</span>
              </button>
            </div>
            <textarea
              id="spo-raw-textarea"
              rows={5}
              value={rawText}
              onChange={(e) => handleRawTextChange(e.target.value)}
              placeholder="Tempelkan teks dari dokumen SPO GoFleet atau OLXMobbi di sini, atau unggah file PDF di atas..."
              className="w-full p-3 text-xs font-mono text-[#343A40] bg-[#F8F9FA] border border-[#CED4DA] rounded-lg focus:bg-white focus:outline-none focus:border-[#1F2E4A] focus:ring-2 focus:ring-[#1F2E4A]/15"
            />
          </div>

          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Preview Hasil Pembacaan SPO */}
          {hasValidExtraction && parsedResult && (
            <div
              className="p-4 rounded-xl bg-[#F8F9FA] border border-[#CED4DA] space-y-4"
              data-testid="spo-extraction-preview"
            >
              <div className="flex items-center justify-between border-b border-[#CED4DA] pb-2.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-[#343A40]">
                    Hasil Pembacaan Dokumen SPO
                  </span>
                </div>
                <span className="text-xs font-semibold text-[#1F2E4A]">
                  Preset Terdeteksi:{' '}
                  {parsedResult.presetId === 'GOFLEET'
                    ? 'SOLUSI MOBILITAS BANGSA (GoFleet)'
                    : parsedResult.presetId === 'OLX'
                    ? 'PT. SERASI MITRA MOBIL - OLXMOBBI'
                    : 'Belum Terdeteksi'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 bg-white rounded-lg border border-[#CED4DA]">
                  <div className="text-[10px] text-[#343A40]/70">No. Polisi</div>
                  <div className="font-bold text-[#343A40] mt-0.5">
                    {parsedResult.noPolisi || '-'}
                  </div>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-[#CED4DA]">
                  <div className="text-[10px] text-[#343A40]/70">Model Kendaraan</div>
                  <div className="font-bold text-[#343A40] mt-0.5">
                    {parsedResult.model || '-'}
                  </div>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-[#CED4DA]">
                  <div className="text-[10px] text-[#343A40]/70">Tahun</div>
                  <div className="font-bold text-[#343A40] mt-0.5">
                    {parsedResult.tahun || '(Diisi Manual)'}
                  </div>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-[#CED4DA]">
                  <div className="text-[10px] text-[#343A40]/70">Nomor SPO</div>
                  <div className="font-bold text-[#343A40] mt-0.5 break-all">
                    {parsedResult.nomorSpo || '-'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Jasa Preview */}
                <div className="p-3 bg-white rounded-lg border border-[#CED4DA]">
                  <div className="font-bold text-[#343A40] mb-2">
                    List Jasa ({parsedResult.jasaList.length} item)
                  </div>
                  {parsedResult.jasaList.length === 0 ? (
                    <div className="text-[#343A40]/55">Tidak ada item jasa</div>
                  ) : (
                    <ul className="space-y-1.5">
                      {parsedResult.jasaList.map((it, idx) => (
                        <li
                          key={idx}
                          className="flex items-center justify-between gap-2 text-[11px] text-[#343A40]"
                        >
                          <span className="truncate">{it.nama}</span>
                          <span className="font-mono shrink-0 tabular-nums">
                            {it.qty}x Rp {formatCurrencyComma(it.hargaSatuan)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Sparepart Preview */}
                <div className="p-3 bg-white rounded-lg border border-[#CED4DA]">
                  <div className="font-bold text-[#343A40] mb-2">
                    List Sparepart ({parsedResult.sparepartList.length} item)
                  </div>
                  {parsedResult.sparepartList.length === 0 ? (
                    <div className="text-[#343A40]/55">Tidak ada item sparepart</div>
                  ) : (
                    <ul className="space-y-1.5">
                      {parsedResult.sparepartList.map((it, idx) => (
                        <li
                          key={idx}
                          className="flex items-center justify-between gap-2 text-[11px] text-[#343A40]"
                        >
                          <span className="truncate">{it.nama}</span>
                          <span className="font-mono shrink-0 tabular-nums">
                            {it.qty}x Rp {formatCurrencyComma(it.hargaSatuan)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[#F8F9FA] border-t border-[#CED4DA] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#343A40] bg-white hover:bg-[#CED4DA]/35 border border-[#CED4DA] rounded-lg transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={!hasValidExtraction}
            onClick={handleApply}
            className="px-5 py-2 text-xs font-semibold text-white bg-[#1F2E4A] hover:bg-[#2A3E63] disabled:bg-[#CED4DA] disabled:text-[#343A40]/50 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer"
          >
            Terapkan ke Form Invoice
          </button>
        </div>
      </div>
    </div>
  );
};
