import { ClientPresetId, SpoExtractedItem, SpoExtractionResult } from '../types/invoice';

const SERVICE_KEYWORDS_REGEX =
  /\b(JASA|SERVICE|SERVIS|SPOORING|BALANCING|TUNE\s*UP|PERBAIKAN|ONGKOS|LABOR|PASANG|BONGKAR|OVERHAUL|INSTALL|INSTALASI|KURAS|FLUSHING|SCANNER|SCANNING| KALIBRASI|PENGGANTIAN\s+JASA|PERGANTIAN\s+OLI\s+MESIN)\b/i;

/**
 * Determines whether an item name or item code belongs to LIST JASA.
 */
export function isServiceItem(name: string, codePrefix = ''): boolean {
  const upperCode = codePrefix.trim().toUpperCase();
  const upperName = name.trim().toUpperCase();

  if (upperCode.startsWith('JS-')) {
    return true;
  }
  if (upperCode.startsWith('M88-') || upperCode.startsWith('SPRI')) {
    return false;
  }
  if (upperName.startsWith('JASA ')) {
    return true;
  }
  return SERVICE_KEYWORDS_REGEX.test(upperName);
}

/**
 * Parses Indonesian/dot thousand format ("6.000", "100.000") or international decimal ("850,000.00", "1,250,000.00")
 * into a rounded integer.
 */
export function parseFlexibleNumber(raw: string): number {
  const s = (raw || '').trim();
  if (!s) return 0;

  // Format with comma thousands and dot decimals: e.g. "1,250,000.00" or "850,000.00" or "1.0"
  if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) {
    return Math.round( parseFloat(s.replace(/,/g, '')) );
  }

  // Format with dot thousands and comma decimals: e.g. "1.250.000,00" or "100.000"
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) {
    const withoutDots = s.replace(/\./g, '').replace(',', '.');
    return Math.round(parseFloat(withoutDots));
  }

  // Simple decimal like "1.0" or "2.0" or "0.00"
  if (/^\d+\.\d{1,2}$/.test(s)) {
    return Math.round(parseFloat(s));
  }

  // Fallback digits
  const cleaned = s.replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleaned);
  return Number.isFinite(parsed) ? Math.round(parsed) : 0;
}

/**
 * Extracts only Brand + Main Model (first 2 words) for OLXMobbi vehicle description after license plate.
 * Example: "MG ZS 1.5 Magnify Bensin-AT" -> "MG ZS"
 * Example: "TOYOTA AVANZA 1.3 G MT" -> "TOYOTA AVANZA"
 */
export function extractMainModelTwoWords(rawModelText: string): string {
  const cleaned = rawModelText
    .replace(/^[\s/:-]+/, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return '';
  const tokens = cleaned.split(' ').filter(Boolean);
  return tokens.slice(0, 2).join(' ').toUpperCase();
}

export function convertGoFleetDateToDmy(rawDate: string): {
  dmy: string;
  iso: string;
} {
  const m = (rawDate || '').trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return { dmy: '', iso: '' };
  const first = Number(m[1]);
  const second = Number(m[2]);
  const year = m[3];

  // GoFleet Tanggal SPO uses MM/DD/YYYY (e.g. 11/04/2026 -> 04/11/2026)
  let dayNum = second;
  let monthNum = first;
  if (first > 12 && second <= 12) {
    // Already DD/MM/YYYY
    dayNum = first;
    monthNum = second;
  }

  if (monthNum < 1 || monthNum > 12 || dayNum < 1 || dayNum > 31) {
    return { dmy: '', iso: '' };
  }

  const dd = String(dayNum).padStart(2, '0');
  const mm = String(monthNum).padStart(2, '0');
  return {
    dmy: `${dd}/${mm}/${year}`,
    iso: `${year}-${mm}-${dd}`,
  };
}

/**
 * Local multi-format Regex parser for SPO GoFleet (PT SOLUSI MOBILITAS BANGSA)
 * and SPO OLXMobbi (PT. SERASI MITRA MOBIL).
 * Never returns static/dummy fallback data.
 */
export function parseSpoTextLocally(rawText: string): SpoExtractionResult {
  const result: SpoExtractionResult = {
    presetId: null,
    nomorSpo: '',
    tanggalSpoDmy: '',
    tanggalSpoIso: '',
    noPolisi: '',
    model: '',
    tahun: '',
    kmUnit: '',
    jasaList: [],
    sparepartList: [],
  };

  if (!rawText || !rawText.trim()) {
    return result;
  }

  const normalizedText = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // 1. Detect Format A (GoFleet) vs Format B (OLXMobbi)
  const isGoFleet =
    /gofleet/i.test(normalizedText) ||
    /SOLUSI\s+MOBILITAS\s+BANGSA/i.test(normalizedText) ||
    /PO-SMB-\d+/i.test(normalizedText) ||
    /MMD-\d{4,}/i.test(normalizedText);

  const isOlx =
    /SERASI\s+MITRA\s+MOBIL/i.test(normalizedText) ||
    /OLXMOBBI/i.test(normalizedText) ||
    /PO\/[A-Z0-9]+\//i.test(normalizedText) ||
    /JS-\d{4,}/i.test(normalizedText) ||
    /M88-\s*SPRI/i.test(normalizedText);

  let detectedPreset: ClientPresetId | null = null;
  if (isGoFleet) {
    detectedPreset = 'GOFLEET';
  } else if (isOlx) {
    detectedPreset = 'OLX';
  }
  result.presetId = detectedPreset;

  // =========================================================================
  // FORMAT A: SPO GoFleet (PT SOLUSI MOBILITAS BANGSA)
  // =========================================================================
  if (detectedPreset === 'GOFLEET') {
    // Nomor SPO: PO-SMB-\d{4}-\d+ (ignore PR-SMB-...)
    const spoMatch = normalizedText.match(/\b(PO-SMB-\d{4}-\d+)\b/i);
    if (spoMatch) {
      result.nomorSpo = spoMatch[1].toUpperCase();
    }

    // Tanggal SPO: Tanggal SPO : 11/04/2026 (MM/DD/YYYY -> DD/MM/YYYY)
    const tglSpoMatch = normalizedText.match(
      /Tanggal\s*SPO\s*:\s*(\d{1,2}\/\d{1,2}\/\d{4})/i
    );
    if (tglSpoMatch) {
      const converted = convertGoFleetDateToDmy(tglSpoMatch[1]);
      result.tanggalSpoDmy = converted.dmy;
      result.tanggalSpoIso = converted.iso;
    }

    // KM Unit: KM Unit : 220162
    const kmMatch = normalizedText.match(/KM\s*Unit\s*:\s*([0-9.,]+)/i);
    if (kmMatch) {
      result.kmUnit = kmMatch[1].replace(/[.,\s]/g, '');
    }

    // Data Kendaraan: Keterangan Unit : B1071DOJ / DAIHATSU/SIGRA/1.2 R MT/2023
    const ketUnitMatch = normalizedText.match(/Keterangan\s*Unit\s*:\s*([^\n]+)/i);
    if (ketUnitMatch) {
      const unitLine = ketUnitMatch[1].trim();
      const segments = unitLine
        .split('/')
        .map((s) => s.trim())
        .filter(Boolean);

      if (segments.length >= 1) {
        result.noPolisi = segments[0].replace(/\s+/g, '').toUpperCase();
      }
      if (segments.length >= 3) {
        // Combine 2nd and 3rd segments: Merk + Tipe Utama (e.g. DAIHATSU SIGRA)
        result.model = `${segments[1]} ${segments[2]}`.replace(/\s+/g, ' ').trim().toUpperCase();
      } else if (segments.length === 2) {
        result.model = extractMainModelTwoWords(segments[1]);
      }

      if (segments.length >= 4) {
        const lastSeg = segments[segments.length - 1];
        const yearMatch = lastSeg.match(/\b(19\d{2}|20\d{2})\b/);
        if (yearMatch) {
          result.tahun = yearMatch[1];
        }
      }
    }

    // Tabel Item GoFleet:
    // Structure: [No] [Kode MMD-xxxxxx] [Description] [Qty] [Units] [Price/Unit (titik ribuan)] [Net Price (titik ribuan)]
    // Example: 1 MMD-001297 GASKET - CALYA/SIGRA 1 Units 6.000 6.000
    // Example: 4 MMD-001507 JASA PERGANTIAN OLI MESIN 1 Units 100.000 100.000
    const lines = normalizedText.split('\n');
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      const mmdRegex =
        /^(?:\d+\s+)?(MMD-\d+)\s+(.+?)\s+(\d+(?:[.,]\d+)?)\s+(?:Units?|Pcs|Ltr|Liter|Set|Bh|Botol|Galon|Kaleng|Dus|Box|Lot|Paket)\s+([\d.,]+)\s+([\d.,]+)$/i;
      const match = line.match(mmdRegex);
      if (match) {
        const code = match[1];
        const description = match[2].replace(/\s+/g, ' ').trim();
        const qty = parseFlexibleNumber(match[3]);
        const pricePerUnit = parseFlexibleNumber(match[4]);

        const item: SpoExtractedItem = {
          nama: description,
          qty: qty > 0 ? qty : 1,
          hargaSatuan: pricePerUnit,
        };

        if (isServiceItem(description, code)) {
          result.jasaList.push(item);
        } else {
          result.sparepartList.push(item);
        }
      }
    }

    return result;
  }

  // =========================================================================
  // FORMAT B: SPO OLXMobbi (PT. SERASI MITRA MOBIL) or General PO
  // =========================================================================
  // Nomor SPO: PO/B2C27/26/10/000002
  const olxSpoMatch = normalizedText.match(/\b(PO\/[A-Z0-9/-]+)\b/i);
  if (olxSpoMatch) {
    result.nomorSpo = olxSpoMatch[1].toUpperCase();
  } else {
    const genericPoMatch = normalizedText.match(/\b(PO-[A-Z0-9-]+)\b/i);
    if (genericPoMatch) {
      result.nomorSpo = genericPoMatch[1].toUpperCase();
    }
  }

  // Data Kendaraan OLXMobbi:
  // Example: Keterangan Unit : B1640DFM MG ZS 1.5 Magnify Bensin-AT
  const olxKetMatch = normalizedText.match(/Keterangan\s*Unit\s*:\s*([^\n]+)/i);
  if (olxKetMatch) {
    const unitLine = olxKetMatch[1].trim();
    if (unitLine.includes('/')) {
      const segments = unitLine
        .split('/')
        .map((s) => s.trim())
        .filter(Boolean);
      if (segments.length >= 1) {
        result.noPolisi = segments[0].replace(/\s+/g, '').toUpperCase();
      }
      if (segments.length >= 3) {
        result.model = `${segments[1]} ${segments[2]}`.replace(/\s+/g, ' ').trim().toUpperCase();
      } else if (segments.length === 2) {
        result.model = extractMainModelTwoWords(segments[1]);
      }
      const lastSeg = segments[segments.length - 1] || '';
      const yearMatch = lastSeg.match(/\b(19\d{2}|20\d{2})\b/);
      if (yearMatch) {
        result.tahun = yearMatch[1];
      }
    } else {
      // Match license plate at start: e.g. B1640DFM or B 1640 DFM
      const plateMatch = unitLine.match(/^([A-Z]{1,2}\s*\d{1,4}\s*[A-Z]{1,3})\b\s*(.*)$/i);
      if (plateMatch) {
        result.noPolisi = plateMatch[1].replace(/\s+/g, '').toUpperCase();
        const restOfUnit = plateMatch[2].trim();
        result.model = extractMainModelTwoWords(restOfUnit);
        // Only set tahun if a 4-digit year is explicitly present in Keterangan Unit
        const yearInUnit = restOfUnit.match(/\b(19\d{2}|20\d{2})\b/);
        result.tahun = yearInUnit ? yearInUnit[1] : '';
      }
    }
  }

  // Pre-process OLXMobbi combined table lines:
  // Join broken multi-line codes such as:
  // "M88-\nSPRI016-0000ROTOR DISC BRAKE 2.0 1,250,000.00 0.00 2,500,000.00"
  // or standalone code lines followed by item lines.
  const rawLines = normalizedText.split('\n').map((l) => l.trim()).filter(Boolean);
  const mergedLines: string[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    const current = rawLines[i];
    // If line ends with hyphenated code fragment like "M88-" or "JS-" or is just a code prefix
    if (/^(?:M88-|JS-|SPRI[A-Z0-9-]*-)$/i.test(current) && i + 1 < rawLines.length) {
      mergedLines.push(`${current}${rawLines[i + 1]}`);
      i++;
    } else if (
      /^(?:M88-[A-Z0-9-]+|JS-\d+|SPRI[A-Z0-9-]+)$/i.test(current) &&
      i + 1 < rawLines.length &&
      /\d+\.\d+\s+[\d,]+\.\d{2}/.test(rawLines[i + 1])
    ) {
      mergedLines.push(`${current}${rawLines[i + 1]}`);
      i++;
    } else {
      mergedLines.push(current);
    }
  }

  // Match OLXMobbi item rows:
  // Examples:
  // JS-000737JASA SERVICE STEERING RACK 1.0 850,000.00 0.00 850,000.00
  // JS-000461JASA SPOORING 1.0 180,000.00 0.00 180,000.00
  // M88-SPRI016-0000ROTOR DISC BRAKE 2.0 1,250,000.00 0.00 2,500,000.00
  // M88-SPRI001-0002BRAKE PAD FR 1.0 1,250,000.00 0.00 1,250,000.00
  for (const line of mergedLines) {
    // Pattern with Qty, Harga Satuan, Tax, Jumlah (or Qty, Harga Satuan, Jumlah)
    const olxRowRegex =
      /^(?:(\d+)\s+)?(JS-\d+|M88-\s*SPRI\d+-\d+|SPRI\d+-\d+|MMD-\d+)?\s*(.+?)\s+(\d+(?:\.\d+)?)\s+([\d,]+(?:\.\d+)?)(?:\s+[\d,]+(?:\.\d+)?)?\s+([\d,]+(?:\.\d+)?)$/i;

    const match = line.match(olxRowRegex);
    if (!match) continue;

    let codePrefix = (match[2] || '').replace(/\s+/g, '');
    let itemName = (match[3] || '').trim();

    // Also strip any glued code at the beginning of itemName if not captured in group 2
    const gluedCodeMatch = itemName.match(
      /^(JS-\d+|M88-\s*SPRI\d+-\d+|SPRI\d+-\d+|MMD-\d+)\s*(.+)$/i
    );
    if (gluedCodeMatch) {
      codePrefix = codePrefix || gluedCodeMatch[1];
      itemName = gluedCodeMatch[2].trim();
    }

    // Ignore table header or summary rows
    if (
      !itemName ||
      /^(Kode|Pekerjaan|Sub\s*Total|Total|DPP|PPN|Grand\s*Total)/i.test(itemName)
    ) {
      continue;
    }

    const qty = parseFlexibleNumber(match[4]);
    const hargaSatuan = parseFlexibleNumber(match[5]);

    if (hargaSatuan <= 0 && qty <= 0) continue;

    const extractedItem: SpoExtractedItem = {
      nama: itemName.replace(/\s+/g, ' ').trim(),
      qty: qty > 0 ? qty : 1,
      hargaSatuan,
    };

    if (isServiceItem(extractedItem.nama, codePrefix)) {
      result.jasaList.push(extractedItem);
    } else {
      result.sparepartList.push(extractedItem);
    }
  }

  return result;
}
