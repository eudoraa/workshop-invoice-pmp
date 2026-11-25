import React from 'react';
import {
  Calendar,
  Car,
  Info,
  RefreshCw,
  Trash2,
  Wrench,
} from 'lucide-react';
import { ClientPresetId, LineItem, PkbData } from '../types/invoice';
import {
  calculatePkbTotals,
  createEmptyLineItem,
  formatCurrencyComma,
  formatDateDmy,
  formatNoPolisiSpaced,
  generateAutoPkbNo,
} from '../utils/invoiceLogic';

interface PkbFormPanelProps {
  data: PkbData;
  linkedNoInv: string;
  activeInvoicePreset: ClientPresetId;
  onChange: React.Dispatch<React.SetStateAction<PkbData>>;
}

export const PkbFormPanel: React.FC<PkbFormPanelProps> = ({
  data,
  linkedNoInv,
  activeInvoicePreset,
  onChange,
}) => {
  const totals = calculatePkbTotals(data);

  const handleNoPkbManualChange = (value: string) => {
    onChange((prev) => ({
      ...prev,
      noPkb: value,
      pkbManualOverride: true,
    }));
  };

  const handleResetPkbAutoSync = () => {
    if (activeInvoicePreset !== 'GOFLEET') return;
    onChange((prev) => ({
      ...prev,
      pkbManualOverride: false,
      noPkb: generateAutoPkbNo(linkedNoInv),
    }));
  };

  const handleDatePickerChange = (isoValue: string) => {
    const formatted = formatDateDmy(isoValue);
    onChange((prev) => ({
      ...prev,
      tanggalPkbIso: isoValue,
      tanggalPkb: formatted || prev.tanggalPkb,
    }));
  };

  const handleNoPolisiBlur = () => {
    onChange((prev) => ({
      ...prev,
      noPolisi: formatNoPolisiSpaced(prev.noPolisi),
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
      {/* Info Banner if user previously had OLXMobbi selected in Invoice */}
      {activeInvoicePreset === 'OLX' && (
        <div
          data-testid="pkb-gofleet-info-badge"
          className="p-3.5 rounded-xl bg-[#EAE0CF]/45 border border-[#94B4C1]/60 flex items-start gap-2.5 text-xs text-[#213448]"
        >
          <Info className="w-4 h-4 text-[#547792] shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Dokumen Khusus GoFleet:</span> Pembuatan PKB
            (Perintah Kerja Bengkel) dikhususkan untuk unit klien{' '}
            <strong>SOLUSI MOBILITAS BANGSA (GoFleet)</strong>.
          </div>
        </div>
      )}

      {/* SECTION: Informasi PKB & Kendaraan */}
      <section className="bg-white rounded-xl border border-[#94B4C1]/40 p-5 shadow-sm">
        <div className="flex items-center gap-2.5 pb-3.5 mb-4 border-b border-[#EAE0CF]">
          <Car className="w-4 h-4 text-[#547792] shrink-0" />
          <h2 className="text-sm font-bold text-[#213448]">
            Informasi PKB & Kendaraan
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* No PKB */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="input-no-pkb"
                className="text-xs font-semibold text-[#213448]"
              >
                No PKB
              </label>
              {activeInvoicePreset === 'GOFLEET' && data.pkbManualOverride && (
                <button
                  type="button"
                  onClick={handleResetPkbAutoSync}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-[#547792] hover:text-[#213448] cursor-pointer"
                  title="Sinkronkan ulang dari No. Invoice (PMP + 4 digit terakhir)"
                >
                  <RefreshCw className="w-3 h-3" />
                  Sinkron No. Inv
                </button>
              )}
            </div>
            <input
              id="input-no-pkb"
              type="text"
              value={data.noPkb}
              onChange={(e) => handleNoPkbManualChange(e.target.value)}
              placeholder="PMP6909"
              className={inputClass}
            />
          </div>

          {/* KM */}
          <div>
            <label
              htmlFor="input-pkb-km"
              className="block text-xs font-semibold text-[#213448] mb-1"
            >
              KM
            </label>
            <input
              id="input-pkb-km"
              type="text"
              value={data.km}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  km: e.target.value.replace(/[^0-9]/g, ''),
                }))
              }
              placeholder="220162"
              className={`${inputClass} tabular-nums`}
            />
          </div>

          {/* Tanggal PKB (DD/MM/YYYY + Calendar Picker) */}
          <div className="sm:col-span-2">
            <label
              htmlFor="input-tgl-pkb"
              className="block text-xs font-semibold text-[#213448] mb-1"
            >
              Tanggal PKB (DD/MM/YYYY)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-7">
                <input
                  id="input-tgl-pkb"
                  type="text"
                  value={data.tanggalPkb}
                  onChange={(e) =>
                    onChange((prev) => ({ ...prev, tanggalPkb: e.target.value }))
                  }
                  placeholder="04/11/2026"
                  className={`${inputClass} tabular-nums`}
                />
              </div>
              <div className="sm:col-span-5 relative flex items-center">
                <Calendar className="w-4 h-4 text-[#547792] absolute left-3 pointer-events-none" />
                <input
                  type="date"
                  aria-label="Pilih Tanggal PKB"
                  value={data.tanggalPkbIso}
                  onChange={(e) => handleDatePickerChange(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-[#F7F5F0] border border-[#94B4C1]/60 rounded-lg text-[#213448] focus:outline-none focus:border-[#547792] focus:ring-2 focus:ring-[#94B4C1]/40"
                />
              </div>
            </div>
          </div>

          {/* No Polisi (Spaced format e.g. B 1550 DOC) */}
          <div>
            <label
              htmlFor="input-pkb-nopol"
              className="block text-xs font-semibold text-[#213448] mb-1"
            >
              No Polisi
            </label>
            <input
              id="input-pkb-nopol"
              type="text"
              value={data.noPolisi}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  noPolisi: e.target.value.toUpperCase(),
                }))
              }
              onBlur={handleNoPolisiBlur}
              placeholder="B 1550 DOC"
              className={`${inputClass} uppercase`}
            />
          </div>

          {/* Type / Model Kendaraan */}
          <div>
            <label
              htmlFor="input-pkb-type"
              className="block text-xs font-semibold text-[#213448] mb-1"
            >
              Type / Model Kendaraan
            </label>
            <input
              id="input-pkb-type"
              type="text"
              value={data.typeModel}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  typeModel: e.target.value.toUpperCase(),
                }))
              }
              placeholder="DAIHATSU SIGRA"
              className={`${inputClass} uppercase`}
            />
          </div>
        </div>
      </section>

      {/* SECTION: Tabel Rincian Jasa */}
      <section className="bg-white rounded-xl border border-[#94B4C1]/40 p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[#EAE0CF]">
          <div className="flex items-center gap-2.5">
            <Wrench className="w-4 h-4 text-[#547792] shrink-0" />
            <h2 className="text-sm font-bold text-[#213448]">Tabel Rincian Jasa</h2>
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
              Belum ada rincian jasa. Klik <strong>+ Tambah Jasa</strong> atau gunakan{' '}
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
                      aria-label={`Nama Jasa PKB ${index + 1}`}
                      value={item.nama}
                      onChange={(e) =>
                        handleUpdateLineItem('jasaList', item.id, 'nama', e.target.value)
                      }
                      placeholder="Nama Jasa (misal: JASA SERVICE KECIL)"
                      className={`flex-1 ${itemInputClass}`}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveLineItem('jasaList', item.id)}
                      aria-label={`Hapus Jasa PKB ${index + 1}`}
                      className="p-1.5 text-[#94B4C1] hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-12 gap-2 items-center pl-7">
                    <div className="col-span-3">
                      <label className="block text-[10px] font-medium text-[#547792] mb-0.5">
                        Qty
                      </label>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        aria-label={`Qty Jasa PKB ${index + 1}`}
                        value={item.qty}
                        onChange={(e) =>
                          handleUpdateLineItem('jasaList', item.id, 'qty', e.target.value)
                        }
                        className="w-full px-2.5 py-1 text-xs text-[#213448] bg-white border border-[#94B4C1]/60 rounded-md tabular-nums focus:outline-none focus:border-[#547792] focus:ring-2 focus:ring-[#94B4C1]/40"
                      />
                    </div>
                    <div className="col-span-5">
                      <label className="block text-[10px] font-medium text-[#547792] mb-0.5">
                        Harga Satuan (Rp)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        aria-label={`Harga Satuan Jasa PKB ${index + 1}`}
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
                    <div className="col-span-4 text-right">
                      <div className="text-[10px] font-medium text-[#547792] mb-0.5">
                        Biaya Jasa
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
          <span className="font-semibold text-[#547792]">Sub. Total Jasa</span>
          <span className="font-bold text-[#213448] tabular-nums">
            Rp {formatCurrencyComma(totals.subTotalJasa)}
          </span>
        </div>
      </section>

      {/* SECTION: Tabel Rincian Part */}
      <section className="bg-white rounded-xl border border-[#94B4C1]/40 p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[#EAE0CF]">
          <div className="flex items-center gap-2.5">
            <Wrench className="w-4 h-4 text-[#547792] shrink-0" />
            <h2 className="text-sm font-bold text-[#213448]">Tabel Rincian Part</h2>
          </div>
          <button
            type="button"
            onClick={() => handleAddLineItem('sparepartList')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#213448] bg-[#94B4C1]/20 hover:bg-[#94B4C1]/35 border border-[#94B4C1]/60 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <span>+ Tambah Part</span>
          </button>
        </div>

        {data.sparepartList.length === 0 ? (
          <div className="text-center py-6 px-4 bg-[#F7F5F0] rounded-lg border border-dashed border-[#94B4C1]/60">
            <p className="text-xs text-[#547792]">
              Belum ada rincian part. Klik <strong>+ Tambah Part</strong> atau gunakan{' '}
              <strong>Ekstrak SPO</strong>.
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
                      aria-label={`Nama Part PKB ${index + 1}`}
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
                      aria-label={`Hapus Part PKB ${index + 1}`}
                      className="p-1.5 text-[#94B4C1] hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-12 gap-2 items-center pl-7">
                    <div className="col-span-3">
                      <label className="block text-[10px] font-medium text-[#547792] mb-0.5">
                        Qty
                      </label>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        aria-label={`Qty Part PKB ${index + 1}`}
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
                    <div className="col-span-5">
                      <label className="block text-[10px] font-medium text-[#547792] mb-0.5">
                        Harga Satuan (Rp)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        aria-label={`Harga Satuan Part PKB ${index + 1}`}
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
                    <div className="col-span-4 text-right">
                      <div className="text-[10px] font-medium text-[#547792] mb-0.5">
                        Biaya Part
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
          <span className="font-semibold text-[#547792]">Sub. Total Part</span>
          <span className="font-bold text-[#213448] tabular-nums">
            Rp {formatCurrencyComma(totals.subTotalPart)}
          </span>
        </div>

        <div className="mt-3 pt-3 border-t border-[#94B4C1]/40 flex items-center justify-between">
          <span className="text-xs font-bold text-[#213448] uppercase">Total PKB</span>
          <span className="text-base font-bold text-[#547792] tabular-nums">
            Rp {formatCurrencyComma(totals.grandTotal)}
          </span>
        </div>
      </section>
    </div>
  );
};
