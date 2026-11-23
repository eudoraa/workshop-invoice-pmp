import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SYSTEM_INSTRUCTION = `Anda adalah sistem ekstraksi dokumen SPO (Surat Perintah Order / Purchase Order) bengkel resmi CV PERKASA MANDIRI PUTRA.
Tugas Anda adalah mengekstrak data dari dokumen SPO GoFleet (PT SOLUSI MOBILITAS BANGSA) atau SPO OLXMobbi (PT. SERASI MITRA MOBIL) menjadi struktur JSON yang presisi.

ATURAN EKSTRAKSI WAJIB:
1. Deteksi Klien (presetId):
   - Jika dokumen mengandung "gofleet", "SOLUSI MOBILITAS BANGSA", atau "PO-SMB-", set presetId = "GOFLEET".
   - Jika dokumen mengandung "SERASI MITRA MOBIL", "OLXMOBBI", atau "PO/", set presetId = "OLX".
2. Nomor & Tanggal SPO:
   - nomorSpo:
     * Untuk GoFleet: tangkap pola PO-SMB-xxxx-xxxxxx (contoh: "PO-SMB-2611-009173"). Abaikan Nomor SPK PR-SMB-... dari SPO.
     * Untuk OLXMobbi: tangkap pola PO/... (contoh: "PO/B2C27/26/10/000002").
   - tanggalSpo: Tanggal SPO dalam format DD/MM/YYYY. Jika tertulis format MM/DD/YYYY pada GoFleet (contoh: "Tanggal SPO : 11/04/2026" artinya 4 November 2026), konversi menjadi "04/11/2026". Jika tidak ditemukan, string kosong "".
3. Data Kendaraan:
   - noPolisi: Plat nomor kendaraan tanpa spasi (contoh: "B1071DOJ" atau "B1640DFM").
   - model: HANYA ambil Merk + Tipe Utama saja (2 kata utama), buang varian detail.
     * Contoh GoFleet: "B1071DOJ / DAIHATSU/SIGRA/1.2 R MT/2023" -> model = "DAIHATSU SIGRA" (buang "1.2 R MT").
     * Contoh OLXMobbi: "B1640DFM MG ZS 1.5 Magnify Bensin-AT" -> model = "MG ZS" (buang "1.5 Magnify Bensin-AT").
   - tahun: Tahun pembuatan kendaraan 4 digit pada baris Keterangan Unit (contoh: "2023"). Jika pada Keterangan Unit tidak ada tahun kendaraan, biarkan string kosong "" (JANGAN mengambil tahun dari tanggal cetak SPO).
   - kmUnit: Angka kilometer kendaraan setelah "KM Unit :" tanpa pemisah titik/koma (contoh: "220162"). Jika tidak ada, string kosong "".
4. Pemisahan dan Pembersihan Item (jasaList & sparepartList):
   - HAPUS seluruh kode item awalan seperti "MMD-001297", "MMD-001507", "JS-000737", "JS-000461", "M88-SPRI016-0000", "M88-SPRI001-0002", atau nomor urut baris.
   - Ambil nama item apa adanya sesuai teks tabel setelah kode dihapus (contoh: "JASA PERGANTIAN OLI MESIN", "JASA SERVICE KECIL", "GASKET - CALYA/SIGRA", "OIL FILTER CALYA SIGRA", "OLI WIN 10W-30", "JASA SERVICE STEERING RACK", "JASA SPOORING", "ROTOR DISC BRAKE", "BRAKE PAD FR").
   - Bulatkan qty menjadi angka bulat (contoh: 1.0 -> 1, 2.0 -> 2).
   - Bulatkan hargaSatuan menjadi angka bulat Rupiah tanpa titik/koma desimal (contoh: 6.000 -> 6000, 100.000 -> 100000, 850,000.00 -> 850000, 1,250,000.00 -> 1250000).
   - Klasifikasi:
     * jasaList: Semua item dengan kode berawalan "JS-" atau yang namanya mengandung kata JASA, SERVICE, SERVIS, SPOORING, BALANCING, TUNE UP, PERBAIKAN, ONGKOS, LABOR, PASANG, BONGKAR.
     * sparepartList: Semua item dengan kode "M88-" / "SPRI" / "MMD-" (yang bukan jasa) atau pergantian sparepart/oli/bahan lainnya.`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    presetId: {
      type: Type.STRING,
      description: 'GOFLEET atau OLX berdasarkan identitas dokumen SPO',
    },
    nomorSpo: {
      type: Type.STRING,
      description: 'Nomor SPO / PO (contoh: PO-SMB-2611-009173 atau PO/B2C27/26/10/000002)',
    },
    tanggalSpo: {
      type: Type.STRING,
      description: 'Tanggal SPO format DD/MM/YYYY (contoh: 04/11/2026)',
    },
    noPolisi: {
      type: Type.STRING,
      description: 'Nomor polisi kendaraan tanpa spasi (contoh: B1071DOJ atau B1640DFM)',
    },
    model: {
      type: Type.STRING,
      description: 'Merk dan Tipe Utama kendaraan saja (contoh: DAIHATSU SIGRA atau MG ZS)',
    },
    tahun: {
      type: Type.STRING,
      description: 'Tahun kendaraan 4 digit jika tertera pada Keterangan Unit, atau string kosong "" jika tidak ada',
    },
    kmUnit: {
      type: Type.STRING,
      description: 'Angka kilometer dari KM Unit tanpa titik/koma (contoh: 220162)',
    },
    jasaList: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          nama: { type: Type.STRING },
          hargaSatuan: { type: Type.INTEGER },
          qty: { type: Type.INTEGER },
        },
        required: ['nama', 'hargaSatuan', 'qty'],
      },
    },
    sparepartList: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          nama: { type: Type.STRING },
          hargaSatuan: { type: Type.INTEGER },
          qty: { type: Type.INTEGER },
        },
        required: ['nama', 'hargaSatuan', 'qty'],
      },
    },
  },
  required: [
    'presetId',
    'nomorSpo',
    'tanggalSpo',
    'noPolisi',
    'model',
    'tahun',
    'kmUnit',
    'jasaList',
    'sparepartList',
  ],
};

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '25mb' }));

  app.post('/api/extract-spo', async (req: Request, res: Response) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({
          error: 'GEMINI_API_KEY belum dikonfigurasi pada server.',
        });
        return;
      }

      const { rawText, fileBase64, mimeType } = req.body as {
        rawText?: string;
        fileBase64?: string;
        mimeType?: string;
      };

      if (!rawText && !fileBase64) {
        res.status(400).json({
          error: 'Teks SPO atau file dokumen harus disertakan untuk ekstraksi.',
        });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

      if (fileBase64 && mimeType) {
        parts.push({
          inlineData: {
            mimeType,
            data: fileBase64,
          },
        });
      }

      if (rawText && rawText.trim().length > 0) {
        parts.push({
          text: `Berikut adalah teks yang diekstrak dari dokumen SPO/PO:\n\n${rawText}`,
        });
      } else {
        parts.push({
          text: 'Ekstrak seluruh informasi SPO/PO (Klien, Nomor SPO, No Polisi, Model Utama, Tahun, List Jasa, dan List Sparepart) dari dokumen terlampir sesuai aturan sistem.',
        });
      }

      let responseText: string | undefined;

      try {
        // Try gemini-2.5-flash with thinkingBudget: 0 as requested in specification
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: { parts },
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
            responseSchema: RESPONSE_SCHEMA,
            thinkingConfig: { thinkingBudget: 0 },
          },
        });
        responseText = response.text;
      } catch {
        // Fallback to gemini-4-hydrogen with ThinkingLevel.LOW
        const fallbackResponse = await ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: { parts },
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
            responseSchema: RESPONSE_SCHEMA,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          },
        });
        responseText = fallbackResponse.text;
      }

      const parsed = JSON.parse((responseText ?? '{}').trim());
      res.json({ result: parsed });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Gagal mengekstrak dokumen dengan AI.';
      res.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Workshop Invoice System server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
