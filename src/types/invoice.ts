export type ClientPresetId = 'GOFLEET' | 'OLX';

export type ActivePage = 'INVOICE' | 'PKB';

export type TemplateStyle = 'default' | 'newgen';

export interface LineItem {
  id: string;
  nama: string;
  hargaSatuan: number;
  qty: number;
}

export interface ClientPresetConfig {
  id: ClientPresetId;
  shortLabel: string;
  badgeText: string;
  namaKlien: string;
  alamatBaris1: string;
  alamatBaris2: string;
  kategoriPekerjaan: string;
  includeSpk: boolean;
  labelSubtotalSparepart: string;
  namaPenandatangan: string;
  jabatanPenandatangan: string;
}

export interface InvoiceData {
  presetId: ClientPresetId;
  noInv: string;
  noSpk: string;
  includeSpk: boolean;
  spkManualOverride: boolean;
  tglInv: string;
  tglInvIso: string;
  kategoriPekerjaan: string;
  hal: string;
  noPolisi: string;
  model: string;
  tahun: string;
  nomorSpo: string;
  namaKlien: string;
  alamatBaris1: string;
  alamatBaris2: string;
  labelSubtotalSparepart: string;
  namaPenandatangan: string;
  jabatanPenandatangan: string;
  jasaList: LineItem[];
  sparepartList: LineItem[];
  enablePpn: boolean;
  ppnRate: number;
  enablePph: boolean;
  pphRate: number;
}

export interface PkbData {
  noPkb: string;
  pkbManualOverride: boolean;
  tanggalPkb: string;
  tanggalPkbIso: string;
  noPolisi: string;
  typeModel: string;
  km: string;
  jasaList: LineItem[];
  sparepartList: LineItem[];
}

export interface SpoExtractedItem {
  nama: string;
  hargaSatuan: number;
  qty: number;
}

export interface SpoExtractionResult {
  presetId: ClientPresetId | null;
  nomorSpo: string;
  tanggalSpoDmy: string;
  tanggalSpoIso: string;
  noPolisi: string;
  model: string;
  tahun: string;
  kmUnit: string;
  jasaList: SpoExtractedItem[];
  sparepartList: SpoExtractedItem[];
}
