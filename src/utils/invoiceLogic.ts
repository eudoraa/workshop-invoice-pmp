import {
  ActivePage,
  ClientPresetConfig,
  ClientPresetId,
  InvoiceData,
  LineItem,
  PkbData,
  SpoExtractionResult,
  TemplateStyle,
} from '../types/invoice';

export const WORKSHOP_INFO = {
  name: 'CV PERKASA MANDIRI PUTRA',
  addressLine1: 'JL. BALAI RAKYAT NO. 101, RT 012 RW 001 KEL. CAKUNG TIMUR,',
  addressLine2: 'KEC. CAKUNG, KOTA JAKARTA TIMUR, DKI JAKARTA - 13910',
  phone: 'Telp 081314456911',
  email: 'putramandiriperkasa97@gmail.com',
  npwp: '76.435.446.0-452.000',
  bankName: 'BANK MANDIRI',
  bankAccount: '1270012686075',
  bankHolder: 'a.n CV. PERKASA MANDIRI PUTRA',
  bankCity: 'JAKARTA',
} as const;

export const PKB_WORKSHOP_INFO = {
  name: 'CV. PERKASA MANDIRI PUTRA',
  addressLine1: 'Jl. Balai Rakyat No. 101,',
  addressLine2: 'RT 012, RW 001, Cakung Timur, Cakung, Jakarta',
  titleLine1: 'Perintah Kerja Bengkel',
  titleLine2: 'Service',
} as const;

export const NEW_GEN_WORKSHOP_INFO = {
  invoiceName: 'CV PERKASA MANDIRI PUTRA',
  pkbName: 'CV. PERKASA MANDIRI PUTRA',
  addressLine1: 'Jl. Balai Rakyat No. 101, RT 012/RW 001, Kel. Cakung Timur,',
  addressLine2: 'Kec. Cakung, Kota Jakarta Timur, DKI Jakarta 13910',
  phone: '081314456911',
  email: 'putramandiriperkasa97@gmail.com',
  npwp: '76.435.446.0-452.000',
} as const;

export function parseTemplateStyle(raw: string | null | undefined): TemplateStyle {
  return raw === 'newgen' ? 'newgen' : 'default';
}

export const CLIENT_PRESETS: Record<ClientPresetId, ClientPresetConfig> = {
  GOFLEET: {
    id: 'GOFLEET',
    shortLabel: 'GoFleet (PT Solusi Mobilitas Bangsa)',
    badgeText: 'GoFleet',
    namaKlien: 'SOLUSI MOBILITAS BANGSA',
    alamatBaris1: 'GEDUNG PASARAYA BLOK M GEDUNG B LT. 4, JL. ISKANDARSYAH II',
    alamatBaris2: 'NO. 02 RT 02 RW 01, MELAWAI KEBAYORAN BARU',
    kategoriPekerjaan: 'SERVICE BERKALA',
    includeSpk: true,
    labelSubtotalSparepart: 'Sub. Total (Sparepart)',
    namaPenandatangan: 'Jesica Prameswari',
    jabatanPenandatangan: '(Kepala Administrasi)',
  },
  OLX: {
    id: 'OLX',
    shortLabel: 'OLXMobbi (PT. Serasi Mitra Mobil)',
    badgeText: 'OLXMobbi',
    namaKlien: 'PT. SERASI MITRA MOBIL - OLXMOBBI',
    alamatBaris1: 'JL. TB SIMATUPANG NO. 25',
    alamatBaris2: 'CILANDAK BARAT, JAKARTA SELATAN',
    kategoriPekerjaan: 'GENERAL REPAIR CAR',
    includeSpk: false,
    labelSubtotalSparepart: 'Sub. Total (Part)',
    namaPenandatangan: '(Adi Bram Suryana)',
    jabatanPenandatangan: '',
  },
};

const INDONESIAN_MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

/**
 * Converts an ISO date string (YYYY-MM-DD) into Indonesian date format (e.g., "10 November 2026").
 */
export function formatDateIndonesian(isoDate: string): string {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate.trim())) {
    return '';
  }
  const [yearStr, monthStr, dayStr] = isoDate.trim().split('-');
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;
  const day = Number(dayStr);

  if (
    Number.isNaN(year) ||
    Number.isNaN(monthIndex) ||
    Number.isNaN(day) ||
    monthIndex < 0 ||
    monthIndex > 11 ||
    day < 1 ||
    day > 31
  ) {
    return '';
  }

  return `${day} ${INDONESIAN_MONTHS[monthIndex]} ${year}`;
}

/**
 * Converts an ISO date string (YYYY-MM-DD) into DD/MM/YYYY format (e.g., "04/11/2026").
 */
export function formatDateDmy(isoDate: string): string {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate.trim())) {
    return '';
  }
  const [yearStr, monthStr, dayStr] = isoDate.trim().split('-');
  return `${dayStr}/${monthStr}/${yearStr}`;
}

/**
 * Converts DD/MM/YYYY string into ISO YYYY-MM-DD for <input type="date"> if valid.
 */
export function dmyToIso(dmy: string): string {
  const m = (dmy || '').trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return '';
  const dd = m[1].padStart(2, '0');
  const mm = m[2].padStart(2, '0');
  const yyyy = m[3];
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Generates automatic No. SPK following pattern: SPK/PMP/GR/[4 digit terakhir No. Invoice]
 * Defaults to SPK/PMP/GR/- when No. Invoice is empty.
 */
export function generateAutoSpk(noInv: string): string {
  const cleaned = (noInv || '').trim();
  if (!cleaned) {
    return 'SPK/PMP/GR/-';
  }
  const last4 = cleaned.slice(-4);
  return `SPK/PMP/GR/${last4}`;
}

/**
 * Generates automatic No PKB following pattern: PMP[4 digit terakhir No. Invoice]
 * Example: PMP20266909 -> PMP6909
 */
export function generateAutoPkbNo(noInv: string): string {
  const cleaned = (noInv || '').trim();
  if (!cleaned) {
    return '';
  }
  const last4 = cleaned.slice(-4);
  return `PMP${last4}`;
}

/**
 * Formats license plate with spaces for PKB display:
 * Example: "B1550DOC" -> "B 1550 DOC"
 */
export function formatNoPolisiSpaced(rawPlate: string): string {
  const compact = (rawPlate || '').replace(/\s+/g, '').toUpperCase().trim();
  if (!compact) return '';
  const match = compact.match(/^([A-Z]{1,2})\s*(\d{1,4})\s*([A-Z]{1,3})$/);
  if (match) {
    return `${match[1]} ${match[2]} ${match[3]}`;
  }
  return (rawPlate || '').toUpperCase().trim();
}

/**
 * Strips spaces and non-alphanumeric characters from license plate for filenames.
 */
export function formatNoPolisiCompact(rawPlate: string): string {
  return (rawPlate || '').replace(/\s+/g, '').toUpperCase().trim();
}

/**
 * Ensures No. SPK always displays a valid string (falling back to SPK/PMP/GR/- when empty).
 */
export function resolveDisplaySpk(noSpk: string, noInv: string): string {
  const trimmed = (noSpk || '').trim();
  if (!trimmed || trimmed === 'SPK/PMP/GR/') {
    return generateAutoSpk(noInv);
  }
  return trimmed;
}

/**
 * Formats integer nominal using comma thousand separators (e.g., 100000 -> "100,000").
 */
export function formatCurrencyComma(value: number): string {
  const rounded = Math.round(Number.isFinite(value) ? value : 0);
  return rounded.toLocaleString('en-US');
}

/**
 * Creates a new blank line item.
 */
export function createEmptyLineItem(): LineItem {
  const randomSuffix = Math.random().toString(36).substring(2, 9);
  return {
    id: `item_${Date.now()}_${randomSuffix}`,
    nama: '',
    hargaSatuan: 0,
    qty: 1,
  };
}

/**
 * Builds the initial clean InvoiceData state without locking the system to dummy data.
 */
export function createInitialInvoiceData(todayIso?: string): InvoiceData {
  const now = new Date();
  const defaultIso =
    todayIso ||
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const preset = CLIENT_PRESETS.GOFLEET;

  return {
    presetId: 'GOFLEET',
    noInv: '',
    noSpk: 'SPK/PMP/GR/-',
    includeSpk: preset.includeSpk,
    spkManualOverride: false,
    tglInv: formatDateIndonesian(defaultIso),
    tglInvIso: defaultIso,
    kategoriPekerjaan: preset.kategoriPekerjaan,
    hal: '1',
    noPolisi: '',
    model: '',
    tahun: '',
    nomorSpo: '',
    namaKlien: preset.namaKlien,
    alamatBaris1: preset.alamatBaris1,
    alamatBaris2: preset.alamatBaris2,
    labelSubtotalSparepart: preset.labelSubtotalSparepart,
    namaPenandatangan: preset.namaPenandatangan,
    jabatanPenandatangan: preset.jabatanPenandatangan,
    jasaList: [],
    sparepartList: [],
    enablePpn: false,
    ppnRate: 11,
    enablePph: false,
    pphRate: 2,
  };
}

/**
 * Builds the initial clean PkbData state.
 */
export function createInitialPkbData(todayIso?: string): PkbData {
  const now = new Date();
  const defaultIso =
    todayIso ||
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  return {
    noPkb: '',
    pkbManualOverride: false,
    tanggalPkb: formatDateDmy(defaultIso),
    tanggalPkbIso: defaultIso,
    noPolisi: '',
    typeModel: '',
    km: '',
    jasaList: [],
    sparepartList: [],
  };
}

/**
 * Applies a client preset (GOFLEET or OLX) and updates all locked client & signatory fields.
 */
export function applyClientPreset(current: InvoiceData, presetId: ClientPresetId): InvoiceData {
  const preset = CLIENT_PRESETS[presetId];
  const nextNoSpk =
    preset.includeSpk && !current.spkManualOverride
      ? generateAutoSpk(current.noInv)
      : current.noSpk;

  return {
    ...current,
    presetId: preset.id,
    namaKlien: preset.namaKlien,
    alamatBaris1: preset.alamatBaris1,
    alamatBaris2: preset.alamatBaris2,
    kategoriPekerjaan: preset.kategoriPekerjaan,
    includeSpk: preset.includeSpk,
    noSpk: nextNoSpk,
    labelSubtotalSparepart: preset.labelSubtotalSparepart,
    namaPenandatangan: preset.namaPenandatangan,
    jabatanPenandatangan: preset.jabatanPenandatangan,
  };
}

/**
 * Updates No. Invoice and automatically syncs No. SPK if includeSpk is active and not manually overridden.
 */
export function updateNoInvoice(current: InvoiceData, newNoInv: string): InvoiceData {
  const nextSpk =
    current.includeSpk && !current.spkManualOverride
      ? generateAutoSpk(newNoInv)
      : current.noSpk;

  return {
    ...current,
    noInv: newNoInv,
    noSpk: nextSpk,
  };
}

export interface InvoiceTotals {
  subTotalJasa: number;
  subTotalSparepart: number;
  dpp: number;
  ppnAmount: number;
  pphAmount: number;
  grandTotal: number;
}

/**
 * Calculates subtotals, optional PPN & PPh 23 taxes, and Grand Total.
 */
export function calculateInvoiceTotals(data: Pick<
  InvoiceData,
  'jasaList' | 'sparepartList' | 'enablePpn' | 'ppnRate' | 'enablePph' | 'pphRate'
>): InvoiceTotals {
  const subTotalJasa = data.jasaList.reduce((acc, item) => {
    const price = Math.round(Number(item.hargaSatuan) || 0);
    const qty = Math.round(Number(item.qty) || 0);
    return acc + price * qty;
  }, 0);

  const subTotalSparepart = data.sparepartList.reduce((acc, item) => {
    const price = Math.round(Number(item.hargaSatuan) || 0);
    const qty = Math.round(Number(item.qty) || 0);
    return acc + price * qty;
  }, 0);

  const dpp = subTotalJasa + subTotalSparepart;
  const ppnAmount = data.enablePpn ? Math.round(dpp * ((Number(data.ppnRate) || 0) / 100)) : 0;
  const pphAmount = data.enablePph ? Math.round(dpp * ((Number(data.pphRate) || 0) / 100)) : 0;
  const grandTotal = dpp + ppnAmount - pphAmount;

  return {
    subTotalJasa,
    subTotalSparepart,
    dpp,
    ppnAmount,
    pphAmount,
    grandTotal,
  };
}

export interface PkbTotals {
  subTotalJasa: number;
  subTotalPart: number;
  grandTotal: number;
}

/**
 * Calculates PKB subtotals and grand total.
 */
export function calculatePkbTotals(data: Pick<PkbData, 'jasaList' | 'sparepartList'>): PkbTotals {
  const subTotalJasa = data.jasaList.reduce((acc, item) => {
    const price = Math.round(Number(item.hargaSatuan) || 0);
    const qty = Math.round(Number(item.qty) || 0);
    return acc + price * qty;
  }, 0);

  const subTotalPart = data.sparepartList.reduce((acc, item) => {
    const price = Math.round(Number(item.hargaSatuan) || 0);
    const qty = Math.round(Number(item.qty) || 0);
    return acc + price * qty;
  }, 0);

  return {
    subTotalJasa,
    subTotalPart,
    grandTotal: subTotalJasa + subTotalPart,
  };
}

/**
 * Builds target Invoice PDF filename: Invoice_[NoInv]_[NoPolisi].pdf
 */
export function getTargetPdfFilename(noInv: string, noPolisi: string): string {
  const cleanInv = (noInv || '').trim().replace(/[^a-zA-Z0-9_-]/g, '') || 'DRAFT';
  const cleanPol = (noPolisi || '').trim().replace(/[^a-zA-Z0-9_-]/g, '') || 'UNIT';
  return `Invoice_${cleanInv}_${cleanPol}.pdf`;
}

/**
 * Builds target PKB PDF filename: PKB_[NoPKB]_[NoPolisiTanpaSpasi].pdf
 */
export function getTargetPkbFilename(noPkb: string, noPolisi: string): string {
  const cleanPkb = (noPkb || '').trim().replace(/[^a-zA-Z0-9_-]/g, '') || 'DRAFT';
  const cleanPol = formatNoPolisiCompact(noPolisi).replace(/[^a-zA-Z0-9_-]/g, '') || 'UNIT';
  return `PKB_${cleanPkb}_${cleanPol}.pdf`;
}

/**
 * Strips trailing .pdf from a target filename for temporary document.title during window.print().
 */
export function getPrintDocumentTitle(targetFilename: string): string {
  return (targetFilename || '').replace(/\.pdf$/i, '') || 'Dokumen_PMP';
}

/**
 * Normalizes legacy GoFleet address typo ("INSKANDARSYAH" -> "ISKANDARSYAH").
 */
export function normalizeAddressText(text: string): string {
  return (text || '').replace(/INSKANDARSYAH/gi, (match) => {
    if (match === match.toUpperCase()) return 'ISKANDARSYAH';
    if (match === match.toLowerCase()) return 'iskandarsyah';
    return 'Iskandarsyah';
  });
}

/**
 * Normalizes loaded InvoiceData (e.g., from localStorage) to fix legacy address typos.
 */
export function normalizeInvoiceData(data: InvoiceData): InvoiceData {
  const normalizedBaris1 = normalizeAddressText(data.alamatBaris1);
  const normalizedBaris2 = normalizeAddressText(data.alamatBaris2);
  if (
    normalizedBaris1 === data.alamatBaris1 &&
    normalizedBaris2 === data.alamatBaris2
  ) {
    return data;
  }
  return {
    ...data,
    alamatBaris1: normalizedBaris1,
    alamatBaris2: normalizedBaris2,
  };
}

/**
 * Determines the client preset from extracted SPO metadata.
 */
export function detectSpoClientPreset(
  extracted: Pick<SpoExtractionResult, 'presetId' | 'nomorSpo'>
): ClientPresetId | null {
  if (extracted.presetId === 'GOFLEET') return 'GOFLEET';
  if (extracted.presetId === 'OLX') return 'OLX';
  const spo = (extracted.nomorSpo || '').trim().toUpperCase();
  if (spo.startsWith('PO-SMB-')) return 'GOFLEET';
  if (spo.startsWith('PO/')) return 'OLX';
  return null;
}

/**
 * Returns true if PKB already holds real vehicle/service/part data or manual override.
 */
export function hasExistingGoFleetPkbData(pkb: PkbData): boolean {
  return (
    pkb.pkbManualOverride ||
    pkb.noPolisi.trim() !== '' ||
    pkb.typeModel.trim() !== '' ||
    pkb.km.trim() !== '' ||
    pkb.jasaList.length > 0 ||
    pkb.sparepartList.length > 0
  );
}

/**
 * Syncs No PKB from No. Invoice ONLY when the active Invoice client preset is GoFleet.
 * If OLXMobbi is active, invoice number changes never populate No PKB.
 */
export function syncPkbNoFromInvoice(
  currentPkb: PkbData,
  invoicePresetId: ClientPresetId,
  noInv: string
): PkbData {
  if (invoicePresetId !== 'GOFLEET') {
    if (!hasExistingGoFleetPkbData(currentPkb) && currentPkb.noPkb !== '') {
      return {
        ...currentPkb,
        noPkb: '',
      };
    }
    return currentPkb;
  }

  if (currentPkb.pkbManualOverride) {
    return currentPkb;
  }

  const syncedNoPkb = generateAutoPkbNo(noInv);
  if (currentPkb.noPkb === syncedNoPkb) {
    return currentPkb;
  }

  return {
    ...currentPkb,
    noPkb: syncedNoPkb,
  };
}

export interface ApplySpoPlanResult {
  nextInvoice: InvoiceData;
  nextPkb: PkbData;
  syncedToPkb: boolean;
  toastMessage: string;
}

/**
 * Separates SPO extraction updates by client:
 * - GoFleet -> updates both Invoice & PKB states.
 * - OLXMobbi -> updates ONLY Invoice state; never copies OLX data into PKB.
 */
export function resolveSpoToInvoiceAndPkb(params: {
  currentInvoice: InvoiceData;
  currentPkb: PkbData;
  extracted: SpoExtractionResult;
  activePage: ActivePage;
}): ApplySpoPlanResult {
  const { currentInvoice, currentPkb, extracted, activePage } = params;

  const createClonedJasa = (): LineItem[] =>
    extracted.jasaList.map((item) => ({
      ...createEmptyLineItem(),
      nama: item.nama,
      hargaSatuan: Math.round(Number(item.hargaSatuan) || 0),
      qty: Math.max(1, Math.round(Number(item.qty) || 1)),
    }));

  const createClonedSparepart = (): LineItem[] =>
    extracted.sparepartList.map((item) => ({
      ...createEmptyLineItem(),
      nama: item.nama,
      hargaSatuan: Math.round(Number(item.hargaSatuan) || 0),
      qty: Math.max(1, Math.round(Number(item.qty) || 1)),
    }));

  const detectedPreset = detectSpoClientPreset(extracted);
  const nextPresetId = detectedPreset || currentInvoice.presetId;
  const withPreset = applyClientPreset(currentInvoice, nextPresetId);

  const nextInvoice: InvoiceData = {
    ...withPreset,
    nomorSpo: extracted.nomorSpo || withPreset.nomorSpo,
    noPolisi: extracted.noPolisi || withPreset.noPolisi,
    model: extracted.model || withPreset.model,
    tahun: extracted.tahun,
    jasaList: createClonedJasa(),
    sparepartList: createClonedSparepart(),
  };

  if (detectedPreset === 'GOFLEET') {
    const nextPkb: PkbData = {
      ...currentPkb,
      noPkb: currentPkb.pkbManualOverride
        ? currentPkb.noPkb
        : generateAutoPkbNo(currentInvoice.noInv),
      tanggalPkb: extracted.tanggalSpoDmy || currentPkb.tanggalPkb,
      tanggalPkbIso: extracted.tanggalSpoIso || currentPkb.tanggalPkbIso,
      noPolisi: extracted.noPolisi
        ? formatNoPolisiSpaced(extracted.noPolisi)
        : currentPkb.noPolisi,
      typeModel: extracted.model || currentPkb.typeModel,
      km: extracted.kmUnit || currentPkb.km,
      jasaList: createClonedJasa(),
      sparepartList: createClonedSparepart(),
    };

    return {
      nextInvoice,
      nextPkb,
      syncedToPkb: true,
      toastMessage:
        'Data SPO GoFleet berhasil diekstrak dan disinkronkan ke form Invoice & PKB.',
    };
  }

  // OLXMobbi or non-GoFleet SPO: NEVER populate PKB with OLX data.
  // If PKB had no prior GoFleet data, ensure PKB remains cleanly at initial empty values.
  const nextPkb = hasExistingGoFleetPkbData(currentPkb)
    ? currentPkb
    : createInitialPkbData(currentPkb.tanggalPkbIso);

  const toastMessage =
    activePage === 'PKB'
      ? 'SPO OLXMobbi diisikan ke form Buat Invoice. Dokumen PKB hanya berlaku untuk klien GoFleet.'
      : 'Data SPO OLXMobbi berhasil diekstrak ke form Invoice (PKB khusus GoFleet tidak diisi).';

  return {
    nextInvoice,
    nextPkb,
    syncedToPkb: false,
    toastMessage,
  };
}
