import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyClientPreset,
  calculateInvoiceTotals,
  calculatePkbTotals,
  createInitialInvoiceData,
  createInitialPkbData,
  formatCurrencyComma,
  formatDateIndonesian,
  formatNoPolisiSpaced,
  generateAutoPkbNo,
  generateAutoSpk,
  getTargetPdfFilename,
  getTargetPkbFilename,
  NEW_GEN_WORKSHOP_INFO,
  parseTemplateStyle,
  PKB_WORKSHOP_INFO,
  resolveSpoToInvoiceAndPkb,
  syncPkbNoFromInvoice,
  updateNoInvoice,
} from './invoiceLogic';
import { convertGoFleetDateToDmy, parseSpoTextLocally } from './spoParser';

test('generateAutoSpk and generateAutoPkbNo extract last 4 characters accurately', () => {
  assert.equal(generateAutoSpk('PMP20266922'), 'SPK/PMP/GR/6922');
  assert.equal(generateAutoSpk('SJM202602446'), 'SPK/PMP/GR/2446');
  assert.equal(generateAutoSpk(''), 'SPK/PMP/GR/-');

  assert.equal(generateAutoPkbNo('PMP20266909'), 'PMP6909');
  assert.equal(generateAutoPkbNo('PMP20266922'), 'PMP6922');
  assert.equal(generateAutoPkbNo(''), '');
});

test('formatNoPolisiSpaced and getTargetPkbFilename format PKB license plate and filename', () => {
  assert.equal(formatNoPolisiSpaced('B1550DOC'), 'B 1550 DOC');
  assert.equal(formatNoPolisiSpaced('B 1071 DOJ'), 'B 1071 DOJ');
  assert.equal(
    getTargetPkbFilename('PMP6909', 'B 1550 DOC'),
    'PKB_PMP6909_B1550DOC.pdf'
  );
});

test('convertGoFleetDateToDmy converts MM/DD/YYYY to DD/MM/YYYY and ISO', () => {
  assert.deepEqual(convertGoFleetDateToDmy('11/04/2026'), {
    dmy: '04/11/2026',
    iso: '2026-11-04',
  });
});

test('applyClientPreset switches between GoFleet and OLXMobbi accurately', () => {
  const initial = createInitialInvoiceData('2026-11-10');
  const withInv = updateNoInvoice(initial, 'PMP20266922');

  assert.equal(withInv.namaKlien, 'SOLUSI MOBILITAS BANGSA');
  assert.equal(withInv.includeSpk, true);
  assert.equal(withInv.noSpk, 'SPK/PMP/GR/6922');
  assert.equal(withInv.kategoriPekerjaan, 'SERVICE BERKALA');
  assert.equal(withInv.labelSubtotalSparepart, 'Sub. Total (Sparepart)');
  assert.equal(withInv.namaPenandatangan, 'Jesica Prameswari');
  assert.equal(withInv.jabatanPenandatangan, '(Kepala Administrasi)');

  const olxState = applyClientPreset(withInv, 'OLX');
  assert.equal(olxState.namaKlien, 'PT. SERASI MITRA MOBIL - OLXMOBBI');
  assert.equal(olxState.alamatBaris1, 'JL. TB SIMATUPANG NO. 25');
  assert.equal(olxState.alamatBaris2, 'CILANDAK BARAT, JAKARTA SELATAN');
  assert.equal(olxState.kategoriPekerjaan, 'GENERAL REPAIR CAR');
  assert.equal(olxState.includeSpk, false);
  assert.equal(olxState.labelSubtotalSparepart, 'Sub. Total (Part)');
  assert.equal(olxState.namaPenandatangan, '(Adi Bram Suryana)');
  assert.equal(olxState.jabatanPenandatangan, '');
});

test('formatDateIndonesian and formatCurrencyComma format accurately', () => {
  assert.equal(formatDateIndonesian('2026-11-10'), '10 November 2026');
  assert.equal(formatDateIndonesian('2026-01-05'), '5 Januari 2026');
  assert.equal(formatCurrencyComma(100000), '100,000');
  assert.equal(formatCurrencyComma(1250000), '1,250,000');
  assert.equal(
    getTargetPdfFilename('PMP20266922', 'B1071DOJ'),
    'Invoice_PMP20266922_B1071DOJ.pdf'
  );
});

test('calculateInvoiceTotals and calculatePkbTotals calculate subtotals accurately', () => {
  const totalsNoTax = calculateInvoiceTotals({
    jasaList: [{ id: '1', nama: 'JASA OLI', hargaSatuan: 100000, qty: 1 }],
    sparepartList: [
      { id: '2', nama: 'GASKET', hargaSatuan: 6000, qty: 1 },
      { id: '3', nama: 'OLI WIN', hargaSatuan: 60000, qty: 4 },
    ],
    enablePpn: false,
    ppnRate: 11,
    enablePph: false,
    pphRate: 2,
  });

  assert.equal(totalsNoTax.subTotalJasa, 100000);
  assert.equal(totalsNoTax.subTotalSparepart, 246000);
  assert.equal(totalsNoTax.grandTotal, 346000);

  const pkbTotals = calculatePkbTotals({
    jasaList: [{ id: '1', nama: 'JASA SERVICE KECIL', hargaSatuan: 20000, qty: 1 }],
    sparepartList: [
      { id: '2', nama: 'GASKET - CALYA/SIGRA', hargaSatuan: 6000, qty: 1 },
      { id: '3', nama: 'OIL FILTER CALYA SIGRA', hargaSatuan: 24000, qty: 1 },
      { id: '4', nama: 'OLI WIN 10W-30', hargaSatuan: 60000, qty: 4 },
    ],
  });
  assert.equal(pkbTotals.subTotalJasa, 20000);
  assert.equal(pkbTotals.subTotalPart, 270000);
  assert.equal(pkbTotals.grandTotal, 290000);
});

test('parseSpoTextLocally parses GoFleet SPO with Tanggal SPO, KM Unit, and items for PKB & Invoice', () => {
  const sampleGoFleetPkbSpo = `
    PT SOLUSI MOBILITAS BANGSA (gofleet)
    Nomor SPO : PO-SMB-2611-008836
    Tanggal SPO : 11/04/2026
    Nomor SPK : PR-SMB-2611-015696
    Keterangan Unit : B1550DOC / DAIHATSU/SIGRA/1.2 R MT/2023
    Jenis Service : CH. 220000 KM Unit : 220162
    1 MMD-001297 GASKET - CALYA/SIGRA 1 Units 6.000 6.000
    2 MMD-001332 OIL FILTER CALYA SIGRA 1 Units 24.000 24.000
    3 MMD-001054 OLI WIN 10W-30 4 Units 60.000 240.000
    4 MMD-001382 JASA SERVICE KECIL 1 Units 20.000 20.000
  `;

  const parsed = parseSpoTextLocally(sampleGoFleetPkbSpo);
  assert.equal(parsed.presetId, 'GOFLEET');
  assert.equal(parsed.nomorSpo, 'PO-SMB-2611-008836');
  assert.equal(parsed.tanggalSpoDmy, '04/11/2026');
  assert.equal(parsed.tanggalSpoIso, '2026-11-04');
  assert.equal(parsed.noPolisi, 'B1550DOC');
  assert.equal(parsed.model, 'DAIHATSU SIGRA');
  assert.equal(parsed.tahun, '2023');
  assert.equal(parsed.kmUnit, '220162');

  assert.equal(parsed.jasaList.length, 1);
  assert.deepEqual(parsed.jasaList[0], {
    nama: 'JASA SERVICE KECIL',
    qty: 1,
    hargaSatuan: 20000,
  });

  assert.equal(parsed.sparepartList.length, 3);
  assert.deepEqual(parsed.sparepartList[0], {
    nama: 'GASKET - CALYA/SIGRA',
    qty: 1,
    hargaSatuan: 6000,
  });
  assert.deepEqual(parsed.sparepartList[1], {
    nama: 'OIL FILTER CALYA SIGRA',
    qty: 1,
    hargaSatuan: 24000,
  });
  assert.deepEqual(parsed.sparepartList[2], {
    nama: 'OLI WIN 10W-30',
    qty: 4,
    hargaSatuan: 60000,
  });
});

test('parseSpoTextLocally parses Format B (SPO OLXMobbi) with split M88- codes and JS- codes accurately', () => {
  const sampleOlxSpo = `
    PT. SERASI MITRA MOBIL - OLXMOBBI
    Nomor PO : PO/B2C27/26/10/000002
    Tanggal Cetak : 28 Oktober 2026
    Keterangan Unit : B1640DFM MG ZS 1.5 Magnify Bensin-AT
    Kode Pekerjaan dan Pergantian Part/Bahan Qty Harga Satuan (Rp) Tax (Rp) Jumlah (Rp)
    JS-000737JASA SERVICE STEERING RACK 1.0 850,000.00 0.00 850,000.00
    JS-000461JASA SPOORING 1.0 180,000.00 0.00 180,000.00
    M88-
    SPRI016-0000ROTOR DISC BRAKE 2.0 1,250,000.00 0.00 2,500,000.00
    M88-
    SPRI001-0002BRAKE PAD FR 1.0 1,250,000.00 0.00 1,250,000.00
  `;

  const parsed = parseSpoTextLocally(sampleOlxSpo);
  assert.equal(parsed.presetId, 'OLX');
  assert.equal(parsed.nomorSpo, 'PO/B2C27/26/10/000002');
  assert.equal(parsed.noPolisi, 'B1640DFM');
  assert.equal(parsed.model, 'MG ZS');
  assert.equal(parsed.tahun, '');

  assert.equal(parsed.jasaList.length, 2);
  assert.deepEqual(parsed.jasaList[0], {
    nama: 'JASA SERVICE STEERING RACK',
    qty: 1,
    hargaSatuan: 850000,
  });
  assert.deepEqual(parsed.jasaList[1], {
    nama: 'JASA SPOORING',
    qty: 1,
    hargaSatuan: 180000,
  });

  assert.equal(parsed.sparepartList.length, 2);
  assert.deepEqual(parsed.sparepartList[0], {
    nama: 'ROTOR DISC BRAKE',
    qty: 2,
    hargaSatuan: 1250000,
  });
  assert.deepEqual(parsed.sparepartList[1], {
    nama: 'BRAKE PAD FR',
    qty: 1,
    hargaSatuan: 1250000,
  });
});

test('parseTemplateStyle defaults safely and NEW_GEN_WORKSHOP_INFO has official contact info', () => {
  assert.equal(parseTemplateStyle(null), 'default');
  assert.equal(parseTemplateStyle(''), 'default');
  assert.equal(parseTemplateStyle('invalid'), 'default');
  assert.equal(parseTemplateStyle('default'), 'default');
  assert.equal(parseTemplateStyle('newgen'), 'newgen');

  assert.equal(NEW_GEN_WORKSHOP_INFO.phone, '081314456911');
  assert.equal(NEW_GEN_WORKSHOP_INFO.email, 'putramandiriperkasa97@gmail.com');
  assert.equal(NEW_GEN_WORKSHOP_INFO.npwp, '76.435.446.0-452.000');
  assert.equal(PKB_WORKSHOP_INFO.addressLine1, 'Jl. Balai Rakyat No. 101,');
});

test('syncPkbNoFromInvoice syncs No PKB only when active preset is GoFleet', () => {
  const emptyPkb = createInitialPkbData('2026-11-17');

  // When OLXMobbi is active, typing SJM202602446 MUST NOT fill No PKB
  const afterOlxInv = syncPkbNoFromInvoice(emptyPkb, 'OLX', 'SJM202602446');
  assert.equal(afterOlxInv.noPkb, '');

  // When GoFleet is active, typing PMP20266909 auto-fills PMP6909
  const afterGoFleetInv = syncPkbNoFromInvoice(emptyPkb, 'GOFLEET', 'PMP20266909');
  assert.equal(afterGoFleetInv.noPkb, 'PMP6909');

  // Switching to OLX when PKB had only auto-synced noPkb (no GoFleet vehicle/items) keeps PKB clean
  const switchedToOlx = syncPkbNoFromInvoice(afterGoFleetInv, 'OLX', 'SJM202602446');
  assert.equal(switchedToOlx.noPkb, '');
});

test('resolveSpoToInvoiceAndPkb isolates OLXMobbi SPO to Invoice only and syncs GoFleet SPO to both', () => {
  const initialInv = createInitialInvoiceData('2026-11-17');
  const initialPkb = createInitialPkbData('2026-11-17');

  // 1. OLXMobbi SPO extracted while on PKB page -> fills Invoice ONLY, keeps PKB empty, returns GoFleet-only toast
  const olxExtracted = parseSpoTextLocally(`
    PT. SERASI MITRA MOBIL - OLXMOBBI
    Nomor PO : PO/B2C27/26/10/000002
    Keterangan Unit : B1640DFM MG ZS 1.5 Magnify Bensin-AT
    JS-000737JASA SERVICE STEERING RACK 1.0 850,000.00 0.00 850,000.00
    M88-SPRI001-0002BRAKE PAD FR 1.0 1,250,000.00 0.00 1,250,000.00
  `);

  const olxPlan = resolveSpoToInvoiceAndPkb({
    currentInvoice: initialInv,
    currentPkb: initialPkb,
    extracted: olxExtracted,
    activePage: 'PKB',
  });

  assert.equal(olxPlan.syncedToPkb, false);
  assert.equal(olxPlan.nextInvoice.presetId, 'OLX');
  assert.equal(olxPlan.nextInvoice.noPolisi, 'B1640DFM');
  assert.equal(olxPlan.nextInvoice.jasaList.length, 1);
  assert.equal(olxPlan.nextInvoice.sparepartList.length, 1);

  // PKB remains completely empty (no OLX vehicle/items/No PKB)
  assert.equal(olxPlan.nextPkb.noPkb, '');
  assert.equal(olxPlan.nextPkb.noPolisi, '');
  assert.equal(olxPlan.nextPkb.typeModel, '');
  assert.equal(olxPlan.nextPkb.km, '');
  assert.equal(olxPlan.nextPkb.jasaList.length, 0);
  assert.equal(olxPlan.nextPkb.sparepartList.length, 0);
  assert.match(olxPlan.toastMessage, /hanya berlaku untuk klien GoFleet/i);

  // 2. GoFleet SPO extracted -> fills BOTH Invoice and PKB
  const goFleetInv = updateNoInvoice(initialInv, 'PMP20266909');
  const goFleetExtracted = parseSpoTextLocally(`
    PT SOLUSI MOBILITAS BANGSA (gofleet)
    Nomor SPO : PO-SMB-2611-008836
    Tanggal SPO : 11/04/2026
    Keterangan Unit : B1550DOC / DAIHATSU/SIGRA/1.2 R MT/2023
    KM Unit : 220162
    1 MMD-001297 GASKET - CALYA/SIGRA 1 Units 6.000 6.000
    2 MMD-001382 JASA SERVICE KECIL 1 Units 20.000 20.000
  `);

  const goFleetPlan = resolveSpoToInvoiceAndPkb({
    currentInvoice: goFleetInv,
    currentPkb: initialPkb,
    extracted: goFleetExtracted,
    activePage: 'INVOICE',
  });

  assert.equal(goFleetPlan.syncedToPkb, true);
  assert.equal(goFleetPlan.nextInvoice.presetId, 'GOFLEET');
  assert.equal(goFleetPlan.nextInvoice.noPolisi, 'B1550DOC');
  assert.equal(goFleetPlan.nextPkb.noPkb, 'PMP6909');
  assert.equal(goFleetPlan.nextPkb.tanggalPkb, '04/11/2026');
  assert.equal(goFleetPlan.nextPkb.noPolisi, 'B 1550 DOC');
  assert.equal(goFleetPlan.nextPkb.typeModel, 'DAIHATSU SIGRA');
  assert.equal(goFleetPlan.nextPkb.km, '220162');
  assert.equal(goFleetPlan.nextPkb.jasaList.length, 1);
  assert.equal(goFleetPlan.nextPkb.sparepartList.length, 1);

  // 3. If GoFleet PKB already exists and user later extracts OLX SPO, existing GoFleet PKB is NOT overwritten by OLX data
  const olxAfterGoFleet = resolveSpoToInvoiceAndPkb({
    currentInvoice: goFleetPlan.nextInvoice,
    currentPkb: goFleetPlan.nextPkb,
    extracted: olxExtracted,
    activePage: 'PKB',
  });
  assert.equal(olxAfterGoFleet.syncedToPkb, false);
  assert.equal(olxAfterGoFleet.nextPkb.noPolisi, 'B 1550 DOC');
  assert.equal(olxAfterGoFleet.nextPkb.typeModel, 'DAIHATSU SIGRA');
});
