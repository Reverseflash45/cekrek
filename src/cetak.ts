/* Menyusun foto-foto jadi satu cetakan di kanvas. */
import { type Saring, acak, terapkan } from "./saring";
import { type Kotak, type Tata, potongTengah, tanggalPendek } from "./tata";
import { campur, rgba, sahHeks } from "./warna";

export const SKALA = 2;

export type NamaBingkai =
  | "putih" | "hitam" | "pink" | "mint" | "langit" | "ungu" | "tirai"
  | "piknik" | "polkadot" | "permen" | "malam" | "senja" | "struk" | "karcis";

type Pola = "lipatan" | "kotak" | "titik" | "garis" | "bintang" | "gradasi";

/** Warna yang bisa diubah pengguna. */
export type Warna = { latar: string; tinta: string; aksen: string[] };

type Resep = Warna & {
  label: string;
  pola?: Pola;
  /** papan polos di belakang tulisan supaya tetap terbaca di atas motif */
  plat?: "latar" | "aksen";
  /** tepi sobek transparan → simpan sebagai PNG */
  tembus?: boolean;
};

/** Bingkai siap gambar: warna turunan sudah dihitung. */
type Bingkai = Resep & { redup: string; kosong: string; warnaPlat?: string };

const RESEP: Record<NamaBingkai, Resep> = {
  putih: { label: "putih", latar: "#fffdf8", tinta: "#1c1b22", aksen: [] },
  hitam: { label: "hitam", latar: "#18171c", tinta: "#f6f1e7", aksen: [] },
  pink: { label: "pink", latar: "#ffc9dc", tinta: "#5c1430", aksen: [] },
  mint: { label: "mint", latar: "#bfead8", tinta: "#0f3d2c", aksen: [] },
  langit: { label: "langit", latar: "#bcd6ff", tinta: "#132a55", aksen: [] },
  ungu: { label: "ungu", latar: "#d8c9ff", tinta: "#2a1858", aksen: [] },
  tirai: { label: "tirai", latar: "#b3172b", tinta: "#fff6ea", aksen: [], pola: "lipatan" },
  piknik: { label: "piknik", latar: "#fff6f3", tinta: "#7a1020", aksen: ["#d62839"], pola: "kotak", plat: "latar" },
  polkadot: { label: "polkadot", latar: "#1f3a93", tinta: "#1f3a93", aksen: ["#fffdf8"], pola: "titik", plat: "aksen" },
  permen: { label: "permen", latar: "#fffdf8", tinta: "#7a1d45", aksen: ["#ff8fb8"], pola: "garis", plat: "latar" },
  malam: { label: "malam", latar: "#0f1636", tinta: "#fff6d6", aksen: ["#ffd23f"], pola: "bintang", plat: "latar" },
  senja: { label: "senja", latar: "#7b4bd1", tinta: "#ffffff", aksen: ["#ffb86b", "#ff6f91", "#7b4bd1"], pola: "gradasi" },
  struk: { label: "struk", latar: "#f7f6f1", tinta: "#26252b", aksen: [], tembus: true },
  karcis: { label: "karcis", latar: "#ffd23f", tinta: "#1f1a0e", aksen: [], tembus: true },
};

export const labelBingkai = (n: NamaBingkai) => RESEP[n].label;

export function warnaAwal(n: NamaBingkai): Warna {
  const r = RESEP[n];
  return { latar: r.latar, tinta: r.tinta, aksen: [...r.aksen] };
}

/** Kolom warna yang bisa diubah untuk tiap bingkai. */
export function kolomWarna(n: NamaBingkai): { kunci: "latar" | "tinta" | number; label: string }[] {
  const r = RESEP[n];
  if (r.pola === "gradasi")
    return [
      { kunci: 0, label: "atas" },
      { kunci: 1, label: "tengah" },
      { kunci: 2, label: "bawah" },
      { kunci: "tinta", label: "tulisan" },
    ];
  const k: ReturnType<typeof kolomWarna> = [{ kunci: "latar", label: "latar" }];
  if (r.aksen.length) k.push({ kunci: 0, label: r.pola === "bintang" ? "bintang" : "motif" });
  k.push({ kunci: "tinta", label: "tulisan" });
  return k;
}

export function rakit(n: NamaBingkai, ubah?: Partial<Warna>): Bingkai {
  const r = RESEP[n];
  const aksen = r.aksen.map((a, i) => {
    const u = ubah?.aksen?.[i];
    return sahHeks(u) ? u : a;
  });
  const latar = sahHeks(ubah?.latar) ? ubah?.latar : r.latar;
  const tinta = sahHeks(ubah?.tinta) ? ubah?.tinta : r.tinta;
  const warnaPlat = r.plat === "latar" ? latar : r.plat === "aksen" ? aksen[0] : undefined;
  // gradasi: kaki ada di warna paling bawah, jadi itu yang jadi "latar"
  const dasar = r.pola === "gradasi" ? aksen[aksen.length - 1] : latar;
  return {
    ...r,
    latar,
    tinta,
    aksen,
    // tanggal duduk di atas plat bila ada, jadi pudarnya dihitung terhadap plat
    redup: campur(tinta, warnaPlat ?? dasar, 0.42),
    kosong: campur(dasar, tinta, 0.09),
    warnaPlat,
  };
}

/** Latar CSS untuk contoh kecil di tombol pilihan bingkai. */
export function contohCss(n: NamaBingkai, ubah?: Partial<Warna>) {
  const b = rakit(n, ubah);
  const [a1] = b.aksen;
  switch (b.pola) {
    case "lipatan":
      return `repeating-linear-gradient(90deg, ${campur(b.latar, "#000000", 0.25)} 0 3px, ${b.latar} 3px 7px)`;
    case "kotak":
      return `repeating-linear-gradient(0deg, ${rgba(a1, 0.4)} 0 4px, transparent 4px 8px), repeating-linear-gradient(90deg, ${rgba(a1, 0.4)} 0 4px, ${b.latar} 4px 8px)`;
    case "titik":
      return `radial-gradient(${a1} 1.6px, transparent 2.1px) 0 0 / 6px 6px, ${b.latar}`;
    case "garis":
      return `repeating-linear-gradient(45deg, ${a1} 0 3px, ${b.latar} 3px 6px)`;
    case "bintang":
      return `radial-gradient(${a1} 1px, transparent 1.6px) 0 0 / 7px 7px, ${b.latar}`;
    case "gradasi":
      return `linear-gradient(${b.aksen.join(", ")})`;
    default:
      return b.latar;
  }
}

export const DAFTAR_BINGKAI = Object.keys(RESEP) as NamaBingkai[];

/** Kelompok di tombol pilihan: warna polos, bermotif, lalu bentuk khusus. */
export const GRUP_BINGKAI: NamaBingkai[][] = [
  ["putih", "hitam", "pink", "mint", "langit", "ungu"],
  ["tirai", "piknik", "polkadot", "permen", "malam", "senja"],
  ["struk", "karcis"],
];

export type Pesanan = {
  tata: Tata;
  foto: (CanvasImageSource & { width: number; height: number } | null)[];
  saring: Saring;
  bingkai: NamaBingkai;
  tulisan: string;
  waktu: Date;
  /** warna bingkai yang diubah pengguna */
  warna?: Partial<Warna>;
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

/** Motif latar bingkai. Digambar sebelum foto, jadi hanya terlihat di tepi dan kaki. */
function motif(ctx: CanvasRenderingContext2D, b: Bingkai, W: number, H: number, benih: number) {
  const S = SKALA;
  const [a1 = "#000000", a2 = a1, a3 = a2] = b.aksen;
  switch (b.pola) {
    case "lipatan":
      lipatan(ctx, W, H);
      break;
    case "kotak": {
      // kain piknik: pita mendatar dan tegak yang tumpang tindih
      const t = 22 * S;
      ctx.fillStyle = rgba(a1, 0.4);
      for (let y = 0; y < H; y += t * 2) ctx.fillRect(0, y, W, t);
      for (let x = 0; x < W; x += t * 2) ctx.fillRect(x, 0, t, H);
      break;
    }
    case "titik": {
      const jarak = 38 * S;
      ctx.fillStyle = a1;
      for (let y = 0, baris = 0; y < H + jarak; y += jarak / 2, baris++)
        for (let x = baris % 2 ? jarak / 2 : 0; x < W + jarak; x += jarak) {
          ctx.beginPath();
          ctx.arc(x, y, 7 * S, 0, Math.PI * 2);
          ctx.fill();
        }
      break;
    }
    case "garis": {
      const t = 20 * S;
      ctx.save();
      ctx.fillStyle = a1;
      ctx.translate(W / 2, H / 2);
      ctx.rotate(-Math.PI / 4);
      const d = Math.hypot(W, H);
      for (let x = -d; x < d; x += t * 2) ctx.fillRect(x, -d, t, d * 2);
      ctx.restore();
      break;
    }
    case "bintang": {
      const rnd = acak(benih);
      const n = Math.round((W * H) / (90 * S) ** 2);
      for (let i = 0; i < n; i++) {
        const x = rnd() * W;
        const y = rnd() * H;
        const besar = rnd() < 0.12;
        ctx.fillStyle = besar ? a1 : campur(a1, "#ffffff", 0.85);
        ctx.globalAlpha = besar ? 1 : 0.35 + rnd() * 0.5;
        if (besar) kilauan(ctx, x, y, (6 + rnd() * 6) * S);
        else {
          ctx.beginPath();
          ctx.arc(x, y, (0.8 + rnd() * 1.6) * S, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      break;
    }
    case "gradasi": {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, a1);
      g.addColorStop(0.55, a2);
      g.addColorStop(1, a3);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      break;
    }
  }
}

/** Bintang bersudut empat. */
function kilauan(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  const k = r * 0.28;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x + k, y - k, x + r, y);
  ctx.quadraticCurveTo(x + k, y + k, x, y + r);
  ctx.quadraticCurveTo(x - k, y + k, x - r, y);
  ctx.quadraticCurveTo(x - k, y - k, x, y - r);
  ctx.fill();
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
  if (b.warnaPlat) {
    ctx.font = `${u}px ${HURUF_PAPAN}`;
    const lebar = Math.min(k.w * S, ctx.measureText(teks).width + 40 * S);
    const pad = 12 * S;
    ctx.fillStyle = b.warnaPlat;
    ctx.beginPath();
    ctx.roundRect(cx - lebar / 2, atas - pad, lebar, total + pad * 1.6, 10 * S);
    ctx.fill();
  }
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
  const b = rakit(p.bingkai, p.warna);
  kanvas.width = W;
  kanvas.height = H;
  const ctx = kanvas.getContext("2d")!;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = b.latar;
  ctx.fillRect(0, 0, W, H);
  motif(ctx, b, W, H, p.nomor);

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

export const tembus = (n: NamaBingkai) => Boolean(RESEP[n].tembus);
