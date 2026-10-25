/* Menyusun foto-foto jadi satu cetakan di kanvas. */
import { type Saring, terapkan } from "./saring";
import { type Kotak, type Tata, potongTengah, tanggalPendek } from "./tata";

export const SKALA = 2;

export type NamaBingkai = "putih" | "hitam" | "tirai" | "struk" | "karcis";

type Bingkai = { nama: NamaBingkai; label: string; latar: string; tinta: string; redup: string; kosong: string; tembus: boolean };

export const BINGKAI: Record<NamaBingkai, Bingkai> = {
  putih: { nama: "putih", label: "putih", latar: "#fffdf8", tinta: "#1c1b22", redup: "#77737f", kosong: "#ece8df", tembus: false },
  hitam: { nama: "hitam", label: "hitam", latar: "#18171c", tinta: "#f6f1e7", redup: "#9a95a3", kosong: "#2a2830", tembus: false },
  tirai: { nama: "tirai", label: "tirai", latar: "#b3172b", tinta: "#fff6ea", redup: "#f4b7b9", kosong: "#951226", tembus: false },
  struk: { nama: "struk", label: "struk", latar: "#f7f6f1", tinta: "#26252b", redup: "#7b7983", kosong: "#e6e4dd", tembus: true },
  karcis: { nama: "karcis", label: "karcis", latar: "#ffd23f", tinta: "#1f1a0e", redup: "#6e5a17", kosong: "#f0c02c", tembus: true },
};

export const DAFTAR_BINGKAI = Object.keys(BINGKAI) as NamaBingkai[];

export type Pesanan = {
  tata: Tata;
  foto: (CanvasImageSource & { width: number; height: number } | null)[];
  saring: Saring;
  bingkai: NamaBingkai;
  tulisan: string;
  waktu: Date;
  /** nomor karcis & benih bintik film */
  nomor: number;
};

const HURUF_PAPAN = '"Bungee", "Arial Black", sans-serif';
const HURUF_BIASA = '"Onest Variable", system-ui, sans-serif';
const HURUF_STRUK = '"Courier New", ui-monospace, monospace';

/** Ukuran huruf terbesar (≤ maks) yang membuat teks muat di lebar. */
function pasUkuran(ctx: CanvasRenderingContext2D, teks: string, huruf: string, maks: number, lebar: number) {
  let u = maks;
  ctx.font = `${u}px ${huruf}`;
  const w = ctx.measureText(teks).width;
  if (w > lebar) u = Math.floor((u * lebar) / w);
  return Math.max(8, u);
}

function gambarFoto(ctx: CanvasRenderingContext2D, sumber: NonNullable<Pesanan["foto"][number]>, k: Kotak, s: Saring, benih: number) {
  const w = Math.round(k.w * SKALA);
  const h = Math.round(k.h * SKALA);
  const sem = document.createElement("canvas");
  sem.width = w;
  sem.height = h;
  const c = sem.getContext("2d", { willReadFrequently: true })!;
  const p = potongTengah(sumber.width, sumber.height, k.w / k.h);
  c.imageSmoothingQuality = "high";
  c.drawImage(sumber, p.x, p.y, p.w, p.h, 0, 0, w, h);
  if (s.langkah.length || s.butir || s.vinyet) {
    const data = c.getImageData(0, 0, w, h);
    terapkan(data.data, w, h, s, benih);
    c.putImageData(data, 0, 0);
  }
  ctx.drawImage(sem, k.x * SKALA, k.y * SKALA);
}

function gambarKosong(ctx: CanvasRenderingContext2D, k: Kotak, b: Bingkai, i: number) {
  const S = SKALA;
  ctx.fillStyle = b.kosong;
  ctx.fillRect(k.x * S, k.y * S, k.w * S, k.h * S);
  ctx.fillStyle = b.redup;
  ctx.font = `${Math.round(Math.min(k.w, k.h) * 0.22 * S)}px ${HURUF_PAPAN}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(i + 1), (k.x + k.w / 2) * S, (k.y + k.h / 2) * S);
}

/** Lipatan tirai: pita gelap-terang tegak di latar merah. */
function lipatan(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const n = 9;
  const g = ctx.createLinearGradient(0, 0, W, 0);
  for (let i = 0; i <= n; i++) {
    g.addColorStop(i / n, "rgba(0,0,0,0.16)");
    if (i < n) g.addColorStop((i + 0.5) / n, "rgba(255,255,255,0.05)");
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

/** Tepi bergerigi atas dan bawah, seperti struk yang disobek. */
function gerigi(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const t = 7 * SKALA;
  const n = Math.round(W / (t * 2));
  const lang = W / n;
  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    ctx.moveTo(i * lang, 0);
    ctx.lineTo(i * lang + lang / 2, t);
    ctx.lineTo((i + 1) * lang, 0);
    ctx.moveTo(i * lang, H);
    ctx.lineTo(i * lang + lang / 2, H - t);
    ctx.lineTo((i + 1) * lang, H);
  }
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";
}

function garisPutus(ctx: CanvasRenderingContext2D, x1: number, x2: number, y: number, warna: string) {
  ctx.save();
  ctx.strokeStyle = warna;
  ctx.lineWidth = 2 * SKALA;
  ctx.setLineDash([6 * SKALA, 5 * SKALA]);
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.stroke();
  ctx.restore();
}

const jam = (t: Date) => `${String(t.getHours()).padStart(2, "0")}.${String(t.getMinutes()).padStart(2, "0")}`;

function kakiBiasa(ctx: CanvasRenderingContext2D, p: Pesanan, b: Bingkai) {
  const S = SKALA;
  const k = p.tata.kaki;
  const cx = (k.x + k.w / 2) * S;
  const besar = p.tata.kaki.h > 200;
  const teks = p.tulisan.trim() || "cekrek!";
  const u = pasUkuran(ctx, teks, HURUF_PAPAN, (besar ? 64 : 34) * S, k.w * S);
  const uKecil = (besar ? 22 : 15) * S;
  const total = u + uKecil * 1.6;
  const atas = (k.y + k.h / 2) * S - total / 2;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = b.tinta;
  ctx.font = `${u}px ${HURUF_PAPAN}`;
  ctx.fillText(teks, cx, atas);
  ctx.fillStyle = b.redup;
  ctx.font = `500 ${uKecil}px ${HURUF_BIASA}`;
  ctx.fillText(tanggalPendek(p.waktu), cx, atas + u + uKecil * 0.6);
}

function kakiStruk(ctx: CanvasRenderingContext2D, p: Pesanan, b: Bingkai) {
  const S = SKALA;
  const k = p.tata.kaki;
  const x1 = k.x * S;
  const x2 = (k.x + k.w) * S;
  const n = p.foto.filter(Boolean).length;
  const besar = k.h > 200;
  const baris: [string, string][] = [
    [(p.tulisan.trim() || "cekrek!").toUpperCase(), ""],
    [`FOTO x${p.tata.slot.length}`, "GRATIS"],
    ["TOTAL SENYUM", String(n)],
    [`${tanggalPendek(p.waktu)} ${jam(p.waktu)}`, `#${String(p.nomor).padStart(6, "0")}`],
  ];
  if (besar) baris.push(["terima kasih, senyum lagi ya", ""]);
  const tinggiBaris = Math.min((k.h - 22) / (baris.length + 0.6), besar ? 44 : 26) * S;
  const u = Math.round(tinggiBaris * 0.72);
  let y = k.y * S + 10 * S;
  garisPutus(ctx, x1, x2, y, b.redup);
  y += tinggiBaris * 0.45;
  ctx.textBaseline = "top";
  baris.forEach(([kiri, kanan], i) => {
    ctx.fillStyle = i === 0 ? b.tinta : b.redup;
    ctx.font = `${i === 0 ? "bold " : ""}${i === 0 ? pasUkuran(ctx, kiri, HURUF_STRUK, Math.round(u * 1.15), x2 - x1) : u}px ${HURUF_STRUK}`;
    if (!kanan) {
      ctx.textAlign = "center";
      ctx.fillText(kiri, (x1 + x2) / 2, y);
    } else {
      ctx.textAlign = "left";
      ctx.fillText(kiri, x1, y);
      ctx.textAlign = "right";
      ctx.fillText(kanan, x2, y);
      // titik-titik pengisi di antara label dan nilai, gaya struk
      const wKiri = ctx.measureText(kiri).width;
      const wKanan = ctx.measureText(kanan).width;
      const titik = ctx.measureText(".").width;
      const muat = Math.max(0, Math.floor((x2 - x1 - wKiri - wKanan - titik * 2) / titik));
      ctx.textAlign = "left";
      ctx.fillText(".".repeat(muat), x1 + wKiri + titik, y);
    }
    y += tinggiBaris;
  });
}

function kakiKarcis(ctx: CanvasRenderingContext2D, p: Pesanan, b: Bingkai) {
  const S = SKALA;
  const k = p.tata.kaki;
  const W = p.tata.lebar * S;
  const yPotong = (k.y + 12) * S;
  garisPutus(ctx, 0, W, yPotong, b.redup);
  // takik setengah lingkaran di kedua ujung garis sobek
  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.arc(0, yPotong, 14 * S, 0, Math.PI * 2);
  ctx.arc(W, yPotong, 14 * S, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";

  const besar = k.h > 200;
  const atas = yPotong + (besar ? 34 : 14) * S;
  const bawah = (k.y + k.h) * S - (besar ? 30 : 12) * S;
  const x1 = k.x * S;
  const x2 = (k.x + k.w) * S;
  const teks = p.tulisan.trim() || "cekrek!";
  const uJudul = pasUkuran(ctx, teks, HURUF_PAPAN, (besar ? 60 : 30) * S, (x2 - x1) * 0.66);
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.fillStyle = b.tinta;
  ctx.font = `${uJudul}px ${HURUF_PAPAN}`;
  ctx.fillText(teks, x1, atas);
  const uKecil = (besar ? 20 : 13) * S;
  ctx.fillStyle = b.redup;
  ctx.font = `600 ${uKecil}px ${HURUF_BIASA}`;
  ctx.textBaseline = "bottom";
  ctx.fillText("berlaku untuk sekali senyum", x1, bawah);
  ctx.textAlign = "right";
  ctx.fillText(tanggalPendek(p.waktu), x2, bawah);
  ctx.textBaseline = "top";
  ctx.fillStyle = b.tinta;
  ctx.font = `${(besar ? 18 : 12) * S}px ${HURUF_PAPAN}`;
  ctx.fillText("No.", x2, atas);
  ctx.font = `${(besar ? 34 : 19) * S}px ${HURUF_STRUK}`;
  ctx.fillText(String(p.nomor).padStart(6, "0"), x2, atas + (besar ? 22 : 14) * S);
}

export function cetak(p: Pesanan, kanvas = document.createElement("canvas")) {
  const S = SKALA;
  const W = p.tata.lebar * S;
  const H = p.tata.tinggi * S;
  const b = BINGKAI[p.bingkai];
  kanvas.width = W;
  kanvas.height = H;
  const ctx = kanvas.getContext("2d")!;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = b.latar;
  ctx.fillRect(0, 0, W, H);
  if (p.bingkai === "tirai") lipatan(ctx, W, H);

  p.tata.slot.forEach((k, i) => {
    const f = p.foto[i];
    if (f) gambarFoto(ctx, f, k, p.saring, p.nomor * 31 + i);
    else gambarKosong(ctx, k, b, i);
  });

  if (p.bingkai === "struk") {
    kakiStruk(ctx, p, b);
    gerigi(ctx, W, H);
  } else if (p.bingkai === "karcis") kakiKarcis(ctx, p, b);
  else kakiBiasa(ctx, p, b);
  return kanvas;
}

export const tembus = (n: NamaBingkai) => BINGKAI[n].tembus;
