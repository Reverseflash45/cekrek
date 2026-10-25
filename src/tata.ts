/* Tata letak cetakan. Satuan piksel pada skala 1; cetak.ts mengalikan SKALA.
   Strip 2×6 inci di 300 dpi = 600×1800, 4R (4×6 inci) = 1200×1800. */

export type NamaTata = "strip4" | "strip3" | "kisi" | "polaroid";

export type Kotak = { x: number; y: number; w: number; h: number };

export type Tata = {
  nama: NamaTata;
  label: string;
  lebar: number;
  tinggi: number;
  /** lebar ÷ tinggi tiap foto */
  aspek: number;
  slot: Kotak[];
  /** sisa ruang di bawah foto untuk tulisan */
  kaki: Kotak;
};

type Resep = { lebar: number; tinggi: number; kolom: number; baris: number; tepi: number; sela: number; aspek: number };

const RESEP: Record<NamaTata, Resep & { label: string }> = {
  strip4: { label: "strip 4", lebar: 600, tinggi: 1800, kolom: 1, baris: 4, tepi: 36, sela: 20, aspek: 4 / 3 },
  strip3: { label: "strip 3", lebar: 600, tinggi: 1800, kolom: 1, baris: 3, tepi: 36, sela: 20, aspek: 1 },
  kisi: { label: "4 kotak", lebar: 1200, tinggi: 1800, kolom: 2, baris: 2, tepi: 48, sela: 24, aspek: 3 / 4 },
  polaroid: { label: "polaroid", lebar: 1080, tinggi: 1320, kolom: 1, baris: 1, tepi: 60, sela: 0, aspek: 1 },
};

export const DAFTAR_TATA = Object.keys(RESEP) as NamaTata[];

export function tata(nama: NamaTata): Tata {
  const r = RESEP[nama];
  const w = Math.round((r.lebar - 2 * r.tepi - (r.kolom - 1) * r.sela) / r.kolom);
  const h = Math.round(w / r.aspek);
  const slot: Kotak[] = [];
  for (let b = 0; b < r.baris; b++)
    for (let k = 0; k < r.kolom; k++) slot.push({ x: r.tepi + k * (w + r.sela), y: r.tepi + b * (h + r.sela), w, h });
  const bawahFoto = r.tepi + r.baris * h + (r.baris - 1) * r.sela;
  return {
    nama,
    label: r.label,
    lebar: r.lebar,
    tinggi: r.tinggi,
    aspek: r.aspek,
    slot,
    kaki: { x: r.tepi, y: bawahFoto, w: r.lebar - 2 * r.tepi, h: r.tinggi - bawahFoto },
  };
}

/** Potongan tengah dari gambar sw×sh agar pas dengan aspek tujuan (seperti object-fit: cover). */
export function potongTengah(sw: number, sh: number, aspek: number): Kotak {
  if (sw / sh > aspek) {
    const w = sh * aspek;
    return { x: (sw - w) / 2, y: 0, w, h: sh };
  }
  const h = sw / aspek;
  return { x: 0, y: (sh - h) / 2, w: sw, h };
}

/** Nama berkas unduhan, mis. cekrek-2026-10-25-1530.jpg (waktu lokal). */
export function namaBerkas(t: Date): string {
  const d = (n: number) => String(n).padStart(2, "0");
  return `cekrek-${t.getFullYear()}-${d(t.getMonth() + 1)}-${d(t.getDate())}-${d(t.getHours())}${d(t.getMinutes())}.jpg`;
}

const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
export const tanggalPendek = (t: Date) => `${t.getDate()} ${BULAN[t.getMonth()]} ${t.getFullYear()}`;
