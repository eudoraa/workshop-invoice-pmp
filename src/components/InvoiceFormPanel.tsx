import React from 'react';
import {
  Building2,
  Calendar,
  Car,
  FileText,
  RefreshCw,
  Settings2,
  Trash2,
  Wrench,
} from 'lucide-react';
import { ClientPresetId, InvoiceData, LineItem } from '../types/invoice';
import {
  applyClientPreset,
  calculateInvoiceTotals,
  createEmptyLineItem,
  formatCurrencyComma,
  formatDateIndonesian,
  generateAutoSpk,
  updateNoInvoice,
} from '../utils/invoiceLogic';

interface InvoiceFormPanelProps {
  data: InvoiceData;
  onChange: React.Dispatch<React.SetStateAction<InvoiceData>>;
}

const COMPACT_PRESET_LABELS: Record<ClientPresetId, string> = {
  GOFLEET: 'Gofleet (PT SOLUSI MOBILITAS BANGSA)',
  OLX: 'OLXMOBBI (PT SERASI MITRA MOBIL)',
};

export const InvoiceFormPanel: React.FC<InvoiceFormPanelProps> = ({ data, onChange }) => {
  const totals = calculateInvoiceTotals(data);

  const handlePresetSelect = (presetId: ClientPresetId) => {
    onChange((prev) => applyClientPreset(prev, presetId));
  };

  const handleNoInvChange = (value: string) => {
    onChange((prev) => updateNoInvoice(prev, value));
  };

  const handleToggleIncludeSpk = (checked: boolean) => {
    onChange((prev) => ({
      ...prev,
      includeSpk: checked,
      noSpk:
        checked && !prev.spkManualOverride ? generateAutoSpk(prev.noInv) : prev.noSpk,
    }));
  };

  const handleSpkManualChange = (value: string) => {
    onChange((prev) => ({
      ...prev,
      noSpk: value,
      spkManualOverride: true,
    }));
  };

  const handleResetSpkAutoSync = () => {
    onChange((prev) => ({
      ...prev,
      spkManualOverride: false,
      noSpk: generateAutoSpk(prev.noInv),
    }));
  };

  const handleDatePickerChange = (isoValue: string) => {
    const formatted = formatDateIndonesian(isoValue);
    onChange((prev) => ({
      ...prev,
      tglInvIso: isoValue,
      tglInv: formatted || prev.tglInv,
    }));
  };

  const handleAddLineItem = (listKey: 'jasaList' | 'sparepartList') => {
    onChange((prev) => ({
      ...prev,
      [listKey]: [...prev[listKey], createEmptyLineItem()],
    }));
  };

  const handleUpdateLineItem = (
    listKey: 'jasaList' | 'sparepartList',
    id: string,
    field: keyof Omit<LineItem, 'id'>,
    value: string | number
  ) => {
    onChange((prev) => ({
      ...prev,
      [listKey]: prev[listKey].map((item) => {
        if (item.id !== id) return item;
        if (field === 'nama') {
          return { ...item, nama: String(value) };
        }
        const numeric = Math.max(0, Math.round(Number(value) || 0));
        return { ...item, [field]: numeric };
      }),
    }));
  };

  const handleRemoveLineItem = (listKey: 'jasaList' | 'sparepartList', id: string) => {
    onChange((prev) => ({
      ...prev,
      [listKey]: prev[listKey].filter((item) => item.id !== id),
    }));
  };

  const inputClass =
    'w-full px-3 py-2 text-sm text-[#213448] bg-white border border-[#94B4C1]/60 rounded-lg focus:outline-none focus:border-[#547792] focus:ring-2 focus:ring-[#94B4C1]/40';
  const itemInputClass =
    'px-3 py-1.5 text-xs text-[#213448] bg-white border border-[#94B4C1]/60 rounded-md focus:outline-none focus:border-[#547792] focus:ring-2 focus:ring-[#94B4C1]/40';

  return (
    <div className="space-y-5">
      {/* SECTION 1 (TOP): Informasi Klien (Kepada Yth) */}
      <section className="bg-white rounded-xl border border-[#94B4C1]/40 p-5 shadow-sm">
        <div className="flex items-center gap-2.5 pb-3.5 mb-4 border-b border-[#EAE0CF]">
          <Building2 className="w-4 h-4 text-[#547792] shrink-0" />
          <h2 className="text-sm font-bold text-[#213448]">
            Informasi Klien (Kepada Yth)
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(['GOFLEET', 'OLX'] as ClientPresetId[]).map((presetKey) => {
            const isSelected = data.presetId === presetKey;
            return (
              <button
                key={presetKey}
                type="button"
                aria-pressed={isSelected}
                onClick={() => handlePresetSelect(presetKey)}
                data-testid={`preset-card-${presetKey}`}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs leading-snug transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#547792]/10 border-2 border-[#547792] text-[#213448] font-semibold'
                    : 'bg-white border border-[#94B4C1]/50 text-[#475569] hover:border-[#547792] font-medium'
                }`}
              >
                {COMPACT_PRESET_LABELS[presetKey]}
              </button>
            );
          })}
        </div>
      </section>

      {/* SECTION: Penomoran & Informasi Bengkel */}
      <section className="bg-white rounded-xl border border-[#94B4C1]/40 p-5 shadow-sm">
        <div className="flex items-center gap-2.5 pb-3.5 mb-4 border-b border-[#EAE0CF]">
          <FileText className="w-4 h-4 text-[#547792] shrink-0" />
          <h2 className="text-sm font-bold text-[#213448]">
            Penomoran & Informasi Bengkel
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* No. Invoice */}
          <div>
            <label
              htmlFor="input-no-inv"
              className="block text-xs font-semibold text-[#213448] mb-1"
            >
              No. Invoice
            </label>
            <input
              id="input-no-inv"
              type="text"
              value={data.noInv}
              onChange={(e) => handleNoInvChange(e.target.value)}
              placeholder="PMP20266922 / SJM202602446"
              className={inputClass}
            />
          </div>

          {/* Hal */}
          <div>
            <label
              htmlFor="input-hal"
              className="block text-xs font-semibold text-[#213448] mb-1"
            >
              Hal
            </label>
            <input
              id="input-hal"
              type="text"
              value={data.hal}
              onChange={(e) => onChange((prev) => ({ ...prev, hal: e.target.value }))}
              placeholder="1"
              className={inputClass}
            />
          </div>

          {/* No. SPK + Checkbox Sertakan No. SPK */}
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="input-no-spk"
                className="text-xs font-semibold text-[#213448]"
              >
                No. SPK
              </label>
              <div className="flex items-center gap-3">
                {data.spkManualOverride && data.includeSpk && (
                  <button
                    type="button"
                    onClick={handleResetSpkAutoSync}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-[#547792] hover:text-[#213448] cursor-pointer"
                    title="Kembalikan ke pola otomatis SPK/PMP/GR/[4 digit terakhir No. Inv]"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Sinkron Otomatis
                  </button>
                )}
                <label className="inline-flex items-center gap-1.5 text-xs font-medium text-[#213448] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={data.includeSpk}
                    onChange={(e) => handleToggleIncludeSpk(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-[#94B4C1] accent-[#547792] text-[#547792] focus:ring-[#94B4C1]/40"
                  />
                  <span>Sertakan No. SPK</span>
                </label>
              </div>
            </div>
            <input
              id="input-no-spk"
              type="text"
              value={data.noSpk}
              disabled={!data.includeSpk}
              onChange={(e) => handleSpkManualChange(e.target.value)}
              placeholder="SPK/PMP/GR/6922"
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:border-[#547792] focus:ring-2 focus:ring-[#94B4C1]/40 ${
                data.includeSpk
                  ? 'bg-white border-[#94B4C1]/60 text-[#213448]'
                  : 'bg-[#F7F5F0] border-[#94B4C1]/30 text-[#94B4C1] cursor-not-allowed'
              }`}
            />
          </div>

          {/* Tanggal Invoice (Teks Indonesia + Pemilih Kalender) */}
          <div className="sm:col-span-2">
            <label
              htmlFor="input-tgl-inv"
              className="block text-xs font-semibold text-[#213448] mb-1"
            >
              Tanggal Invoice
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-7">
                <input
                  id="input-tgl-inv"
                  type="text"
                  value={data.tglInv}
                  onChange={(e) =>
                    onChange((prev) => ({ ...prev, tglInv: e.target.value }))
                  }
                  placeholder="10 November 2026"
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-5 relative flex items-center">
                <Calendar className="w-4 h-4 text-[#547792] absolute left-3 pointer-events-none" />
                <input
                  type="date"
                  aria-label="Pilih Tanggal Kalender"
                  value={data.tglInvIso}
                  onChange={(e) => handleDatePickerChange(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-[#F7F5F0] border border-[#94B4C1]/60 rounded-lg text-[#213448] focus:outline-none focus:border-[#547792] focus:ring-2 focus:ring-[#94B4C1]/40"
                />
              </div>
            </div>
          </div>

          {/* Kategori Pekerjaan */}
          <div className="sm:col-span-2">
            <label
              htmlFor="input-kategori"
              className="block text-xs font-semibold text-[#213448] mb-1"
            >
              Kategori Pekerjaan
            </label>
            <input
              id="input-kategori"
              type="text"
              value={data.kategoriPekerjaan}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  kategoriPekerjaan: e.target.value.toUpperCase(),
                }))
              }
              placeholder="SERVICE BERKALA / GENERAL REPAIR CAR"
              className={`${inputClass} uppercase`}
            />
          </div>
        </div>
      </section>

      {/* SECTION: Data Kendaraan & SPO */}
      <section className="bg-white rounded-xl border border-[#94B4C1]/40 p-5 shadow-sm">
        <div className="flex items-center gap-2.5 pb-3.5 mb-4 border-b border-[#EAE0CF]">
          <Car className="w-4 h-4 text-[#547792] shrink-0" />
          <h2 className="text-sm font-bold text-[#213448]">Data Kendaraan & SPO</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="input-no-polisi"
              className="block text-xs font-semibold text-[#213448] mb-1"
            >
              No. Polisi
            </label>
            <input
              id="input-no-polisi"
              type="text"
              value={data.noPolisi}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  noPolisi: e.target.value.toUpperCase(),
                }))
              }
              placeholder="B1071DOJ / B1640DFM"
              className={`${inputClass} uppercase`}
            />
          </div>

          <div>
            <label
              htmlFor="input-model"
              className="block text-xs font-semibold text-[#213448] mb-1"
            >
              Model Kendaraan
            </label>
            <input
              id="input-model"
              type="text"
              value={data.model}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  model: e.target.value.toUpperCase(),
                }))
              }
              placeholder="DAIHATSU SIGRA / MG ZS"
              className={`${inputClass} uppercase`}
            />
          </div>

          <div>
            <label
              htmlFor="input-tahun"
              className="block text-xs font-semibold text-[#213448] mb-1"
            >
              Tahun
            </label>
            <input
              id="input-tahun"
              type="text"
              value={data.tahun}
              onChange={(e) =>
                onChange((prev) => ({ ...prev, tahun: e.target.value }))
              }
              placeholder="2023"
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="input-nomor-spo"
              className="block text-xs font-semibold text-[#213448] mb-1"
            >
              Nomor SPO
            </label>
            <input
              id="input-nomor-spo"
              type="text"
              value={data.nomorSpo}
              onChange={(e) =>
                onChange((prev) => ({ ...prev, nomorSpo: e.target.value }))
              }
              placeholder="PO-SMB-2611-009173 / PO/B2C27/26/10/000002"
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* SECTION: Tabel List Jasa */}
      <section className="bg-white rounded-xl border border-[#94B4C1]/40 p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[#EAE0CF]">
          <div className="flex items-center gap-2.5">
            <Wrench className="w-4 h-4 text-[#547792] shrink-0" />
            <h2 className="text-sm font-bold text-[#213448]">Tabel List Jasa</h2>
          </div>
          <button
            type="button"
            onClick={() => handleAddLineItem('jasaList')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#213448] bg-[#94B4C1]/20 hover:bg-[#94B4C1]/35 border border-[#94B4C1]/60 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <span>+ Tambah Jasa</span>
          </button>
        </div>

        {data.jasaList.length === 0 ? (
          <div className="text-center py-6 px-4 bg-[#F7F5F0] rounded-lg border border-dashed border-[#94B4C1]/60">
            <p className="text-xs text-[#547792]">
              Belum ada item jasa. Klik <strong>+ Tambah Jasa</strong> atau gunakan{' '}
              <strong>Ekstrak SPO</strong>.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.jasaList.map((item, index) => {
              const rowTotal =
                Math.round(Number(item.hargaSatuan) || 0) *
                Math.round(Number(item.qty) || 0);
              return (
                <div
                  key={item.id}
                  className="p-3 bg-[#F7F5F0]/80 rounded-lg border border-[#94B4C1]/40 space-y-2.5"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#547792] w-5 shrink-0 tabular-nums">
                      {index + 1}.
                    </span>
                    <input
                      type="text"
                      aria-label={`Nama Jasa ${index + 1}`}
                      value={item.nama}
                      onChange={(e) =>
                        handleUpdateLineItem('jasaList', item.id, 'nama', e.target.value)
                      }
                      placeholder="Nama Jasa (misal: JASA PERGANTIAN OLI MESIN)"
                      className={`flex-1 ${itemInputClass}`}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveLineItem('jasaList', item.id)}
                      aria-label={`Hapus Jasa ${index + 1}`}
                      className="p-1.5 text-[#94B4C1] hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-12 gap-2 items-center pl-7">
                    <div className="col-span-5">
                      <label className="block text-[10px] font-medium text-[#547792] mb-0.5">
                        Harga Satuan (Rp)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        aria-label={`Harga Satuan Jasa ${index + 1}`}
                        value={item.hargaSatuan}
                        onChange={(e) =>
                          handleUpdateLineItem(
                            'jasaList',
                            item.id,
                            'hargaSatuan',
                            e.target.value
                          )
                        }
                        className="w-full px-2.5 py-1 text-xs text-[#213448] bg-white border border-[#94B4C1]/60 rounded-md tabular-nums focus:outline-none focus:border-[#547792] focus:ring-2 focus:ring-[#94B4C1]/40"
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="block text-[10px] font-medium text-[#547792] mb-0.5">
                        Qty
                      </label>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        aria-label={`Qty Jasa ${index + 1}`}
                        value={item.qty}
                        onChange={(e) =>
                          handleUpdateLineItem('jasaList', item.id, 'qty', e.target.value)
                        }
                        className="w-full px-2.5 py-1 text-xs text-[#213448] bg-white border border-[#94B4C1]/60 rounded-md tabular-nums focus:outline-none focus:border-[#547792] focus:ring-2 focus:ring-[#94B4C1]/40"
                      />
                    </div>
                    <div className="col-span-4 text-right">
                      <div className="text-[10px] font-medium text-[#547792] mb-0.5">
                        Jumlah
                      </div>
                      <div className="text-xs font-bold text-[#213448] tabular-nums">
                        Rp {formatCurrencyComma(rowTotal)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-[#EAE0CF] flex items-center justify-between text-xs">
          <span className="font-semibold text-[#547792]">Sub. Total (Jasa)</span>
          <span className="font-bold text-[#213448] tabular-nums">
            Rp {formatCurrencyComma(totals.subTotalJasa)}
          </span>
        </div>
      </section>

      {/* SECTION: Tabel List Sparepart */}
      <section className="bg-white rounded-xl border border-[#94B4C1]/40 p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[#EAE0CF]">
          <div className="flex items-center gap-2.5">
            <Wrench className="w-4 h-4 text-[#547792] shrink-0" />
            <h2 className="text-sm font-bold text-[#213448]">Tabel List Sparepart</h2>
          </div>
          <button
            type="button"
            onClick={() => handleAddLineItem('sparepartList')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#213448] bg-[#94B4C1]/20 hover:bg-[#94B4C1]/35 border border-[#94B4C1]/60 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <span>+ Tambah Sparepart</span>
          </button>
        </div>

        {data.sparepartList.length === 0 ? (
          <div className="text-center py-6 px-4 bg-[#F7F5F0] rounded-lg border border-dashed border-[#94B4C1]/60">
            <p className="text-xs text-[#547792]">
              Belum ada item sparepart/part. Klik <strong>+ Tambah Sparepart</strong> atau
              gunakan <strong>Ekstrak SPO</strong>.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.sparepartList.map((item, index) => {
              const rowTotal =
                Math.round(Number(item.hargaSatuan) || 0) *
                Math.round(Number(item.qty) || 0);
              return (
                <div
                  key={item.id}
                  className="p-3 bg-[#F7F5F0]/80 rounded-lg border border-[#94B4C1]/40 space-y-2.5"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#547792] w-5 shrink-0 tabular-nums">
                      {index + 1}.
                    </span>
                    <input
                      type="text"
                      aria-label={`Nama Part ${index + 1}`}
                      value={item.nama}
                      onChange={(e) =>
                        handleUpdateLineItem(
                          'sparepartList',
                          item.id,
                          'nama',
                          e.target.value
                        )
                      }
                      placeholder="Nama Part (misal: OIL FILTER CALYA SIGRA)"
                      className={`flex-1 ${itemInputClass}`}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveLineItem('sparepartList', item.id)}
                      aria-label={`Hapus Part ${index + 1}`}
                      className="p-1.5 text-[#94B4C1] hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-12 gap-2 items-center pl-7">
                    <div className="col-span-5">
                      <label className="block text-[10px] font-medium text-[#547792] mb-0.5">
                        Harga Satuan (Rp)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        aria-label={`Harga Satuan Part ${index + 1}`}
                        value={item.hargaSatuan}
                        onChange={(e) =>
                          handleUpdateLineItem(
                            'sparepartList',
                            item.id,
                            'hargaSatuan',
                            e.target.value
                          )
                        }
                        className="w-full px-2.5 py-1 text-xs text-[#213448] bg-white border border-[#94B4C1]/60 rounded-md tabular-nums focus:outline-none focus:border-[#547792] focus:ring-2 focus:ring-[#94B4C1]/40"
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="block text-[10px] font-medium text-[#547792] mb-0.5">
                        Qty
                      </label>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        aria-label={`Qty Part ${index + 1}`}
                        value={item.qty}
                        onChange={(e) =>
                          handleUpdateLineItem(
                            'sparepartList',
                            item.id,
                            'qty',
                            e.target.value
                          )
                        }
                        className="w-full px-2.5 py-1 text-xs text-[#213448] bg-white border border-[#94B4C1]/60 rounded-md tabular-nums focus:outline-none focus:border-[#547792] focus:ring-2 focus:ring-[#94B4C1]/40"
                      />
                    </div>
                    <div className="col-span-4 text-right">
                      <div className="text-[10px] font-medium text-[#547792] mb-0.5">
                        Jumlah
                      </div>
                      <div className="text-xs font-bold text-[#213448] tabular-nums">
                        Rp {formatCurrencyComma(rowTotal)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-[#EAE0CF] flex items-center justify-between text-xs">
          <span className="font-semibold text-[#547792]">
            {data.labelSubtotalSparepart}
          </span>
          <span className="font-bold text-[#213448] tabular-nums">
            Rp {formatCurrencyComma(totals.subTotalSparepart)}
          </span>
        </div>
      </section>

      {/* SECTION: Pengaturan Pajak & Penandatangan */}
      <section className="bg-white rounded-xl border border-[#94B4C1]/40 p-5 shadow-sm">
        <div className="flex items-center gap-2.5 pb-3.5 mb-4 border-b border-[#EAE0CF]">
          <Settings2 className="w-4 h-4 text-[#547792] shrink-0" />
          <h2 className="text-sm font-bold text-[#213448]">
            Pengaturan Pajak & Penandatangan
          </h2>
        </div>

        <div className="space-y-4">
          {/* Opsi Toggle Pajak (PPN & PPh 23) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* PPN Toggle */}
            <div className="p-3 rounded-lg bg-[#F7F5F0] border border-[#94B4C1]/40 flex items-center justify-between gap-2">
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#213448] cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.enablePpn}
                  onChange={(e) =>
                    onChange((prev) => ({ ...prev, enablePpn: e.target.checked }))
                  }
                  className="w-4 h-4 rounded border-[#94B4C1] accent-[#547792] text-[#547792] focus:ring-[#94B4C1]/40"
                />
                <span>Aktifkan PPN (%)</span>
              </label>
              <input
                type="number"
                min={0}
                max={100}
                aria-label="Persentase PPN"
                value={data.ppnRate}
                disabled={!data.enablePpn}
                onChange={(e) =>
                  onChange((prev) => ({
                    ...prev,
                    ppnRate: Number(e.target.value) || 0,
                  }))
                }
                className="w-16 px-2 py-1 text-xs text-right text-[#213448] bg-white border border-[#94B4C1]/60 rounded-md tabular-nums focus:outline-none focus:border-[#547792] focus:ring-2 focus:ring-[#94B4C1]/40 disabled:bg-[#EAE0CF]/40 disabled:text-[#94B4C1]"
              />
            </div>

            {/* PPh 23 Toggle */}
            <div className="p-3 rounded-lg bg-[#F7F5F0] border border-[#94B4C1]/40 flex items-center justify-between gap-2">
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#213448] cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.enablePph}
                  onChange={(e) =>
                    onChange((prev) => ({ ...prev, enablePph: e.target.checked }))
                  }
                  className="w-4 h-4 rounded border-[#94B4C1] accent-[#547792] text-[#547792] focus:ring-[#94B4C1]/40"
                />
                <span>Aktifkan PPh 23 (%)</span>
              </label>
              <input
                type="number"
                min={0}
                max={100}
                aria-label="Persentase PPh 23"
                value={data.pphRate}
                disabled={!data.enablePph}
                onChange={(e) =>
                  onChange((prev) => ({
                    ...prev,
                    pphRate: Number(e.target.value) || 0,
                  }))
                }
                className="w-16 px-2 py-1 text-xs text-right text-[#213448] bg-white border border-[#94B4C1]/60 rounded-md tabular-nums focus:outline-none focus:border-[#547792] focus:ring-2 focus:ring-[#94B4C1]/40 disabled:bg-[#EAE0CF]/40 disabled:text-[#94B4C1]"
              />
            </div>
          </div>

          {/* Penandatangan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label
                htmlFor="input-penandatangan"
                className="block text-xs font-semibold text-[#213448] mb-1"
              >
                Nama Penandatangan
              </label>
              <input
                id="input-penandatangan"
                type="text"
                value={data.namaPenandatangan}
                onChange={(e) =>
                  onChange((prev) => ({
                    ...prev,
                    namaPenandatangan: e.target.value,
                  }))
                }
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="input-jabatan"
                className="block text-xs font-semibold text-[#213448] mb-1"
              >
                Jabatan Penandatangan
              </label>
              <input
                id="input-jabatan"
                type="text"
                value={data.jabatanPenandatangan}
                onChange={(e) =>
                  onChange((prev) => ({
                    ...prev,
                    jabatanPenandatangan: e.target.value,
                  }))
                }
                placeholder="Kosongkan jika tanpa jabatan"
                className={inputClass}
              />
            </div>
          </div>

          {/* Ringkasan Total */}
          <div className="pt-3 border-t border-[#94B4C1]/40 flex items-center justify-between">
            <span className="text-xs font-bold text-[#213448] uppercase">
              Total Invoice
            </span>
            <span className="text-base font-bold text-[#547792] tabular-nums">
              Rp {formatCurrencyComma(totals.grandTotal)}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};
