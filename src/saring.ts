/* Filter foto. Satu definisi dipakai dua kali: sebagai string CSS untuk
   pratinjau kamera, dan sebagai matriks warna untuk cetakan di kanvas.
   Matriksnya mengikuti definisi fungsi filter CSS (Filter Effects Level 1),
   jadi hasil cetak sama dengan yang terlihat di jendela kamera. */

export type Fungsi = "grayscale" | "sepia" | "saturate" | "contrast" | "brightness";
export type NamaSaring = "asli" | "hitamputih" | "jadul" | "hangat" | "nyala";

export type Saring = {
  nama: NamaSaring;
  label: string;
  langkah: [Fungsi, number][];
  /** bintik film + pinggir gelap */
  butir: number;
  vinyet: number;
};

export const SARING: Record<NamaSaring, Saring> = {
  asli: { nama: "asli", label: "asli", langkah: [], butir: 0, vinyet: 0 },
  hitamputih: { nama: "hitamputih", label: "hitam putih", langkah: [["grayscale", 1], ["contrast", 1.15], ["brightness", 1.03]], butir: 10, vinyet: 0.25 },
  jadul: { nama: "jadul", label: "jadul", langkah: [["sepia", 0.5], ["saturate", 0.85], ["contrast", 0.9], ["brightness", 1.06]], butir: 16, vinyet: 0.45 },
  hangat: { nama: "hangat", label: "hangat", langkah: [["sepia", 0.18], ["saturate", 1.2], ["brightness", 1.04]], butir: 0, vinyet: 0.15 },
  nyala: { nama: "nyala", label: "nyala", langkah: [["contrast", 1.18], ["saturate", 1.45]], butir: 0, vinyet: 0 },
};

export const DAFTAR_SARING = Object.keys(SARING) as NamaSaring[];

export const keCss = (s: Saring) => s.langkah.map(([f, v]) => `${f}(${v})`).join(" ") || "none";

/** Matriks 3×4 baris-utama: [r_r r_g r_b r_0, g_r … g_0, b_r … b_0]; offset dalam satuan 0–255. */
export type Matriks = number[];

const IDENTITAS: Matriks = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0];

function matriksFungsi(f: Fungsi, a: number): Matriks {
  switch (f) {
    case "grayscale": {
      const s = 1 - Math.min(1, a);
      return [
        0.2126 + 0.7874 * s, 0.7152 - 0.7152 * s, 0.0722 - 0.0722 * s, 0,
        0.2126 - 0.2126 * s, 0.7152 + 0.2848 * s, 0.0722 - 0.0722 * s, 0,
        0.2126 - 0.2126 * s, 0.7152 - 0.7152 * s, 0.0722 + 0.9278 * s, 0,
      ];
    }
    case "sepia": {
      const s = 1 - Math.min(1, a);
      return [
        0.393 + 0.607 * s, 0.769 - 0.769 * s, 0.189 - 0.189 * s, 0,
        0.349 - 0.349 * s, 0.686 + 0.314 * s, 0.168 - 0.168 * s, 0,
        0.272 - 0.272 * s, 0.534 - 0.534 * s, 0.131 + 0.869 * s, 0,
      ];
    }
    case "saturate":
      return [
        0.213 + 0.787 * a, 0.715 - 0.715 * a, 0.072 - 0.072 * a, 0,
        0.213 - 0.213 * a, 0.715 + 0.285 * a, 0.072 - 0.072 * a, 0,
        0.213 - 0.213 * a, 0.715 - 0.715 * a, 0.072 + 0.928 * a, 0,
      ];
    case "contrast": {
      const o = 255 * (0.5 - 0.5 * a);
      return [a, 0, 0, o, 0, a, 0, o, 0, 0, a, o];
    }
    case "brightness":
      return [a, 0, 0, 0, 0, a, 0, 0, 0, 0, a, 0];
  }
}

/** Hasil = b setelah a (a diterapkan lebih dulu). */
function kali(b: Matriks, a: Matriks): Matriks {
  const m: Matriks = [];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) m.push(b[i * 4] * a[j] + b[i * 4 + 1] * a[4 + j] + b[i * 4 + 2] * a[8 + j]);
    m.push(b[i * 4] * a[3] + b[i * 4 + 1] * a[7] + b[i * 4 + 2] * a[11] + b[i * 4 + 3]);
  }
  return m;
}

/* CSS menjepit nilai ke 0–255 setelah tiap fungsi, jadi rantai matriks yang
   digabung bisa sedikit berbeda dari peramban saat ada warna yang terpotong.
   Karena itu matriks diterapkan satu per satu. */
export const matriksSaring = (s: Saring): Matriks[] => s.langkah.map(([f, v]) => matriksFungsi(f, v));
export const gabung = (daftar: Matriks[]): Matriks => daftar.reduce((acc, m) => kali(m, acc), IDENTITAS);

const jepit = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : v);

/** PRNG kecil supaya bintik film sama tiap kali cetakan digambar ulang. */
export function acak(benih: number) {
  let a = benih >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Terapkan filter ke data piksel RGBA (di tempat). */
export function terapkan(data: Uint8ClampedArray, lebar: number, tinggi: number, s: Saring, benih = 1) {
  const daftar = matriksSaring(s);
  const rnd = acak(benih);
  const cx = lebar / 2;
  const cy = tinggi / 2;
  const rMaks = Math.hypot(cx, cy);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];
    for (const m of daftar) {
      const r2 = jepit(m[0] * r + m[1] * g + m[2] * b + m[3]);
      const g2 = jepit(m[4] * r + m[5] * g + m[6] * b + m[7]);
      const b2 = jepit(m[8] * r + m[9] * g + m[10] * b + m[11]);
      r = r2;
      g = g2;
      b = b2;
    }
    if (s.vinyet) {
      const x = (p % lebar) - cx;
      const y = Math.floor(p / lebar) - cy;
      const d = Math.hypot(x, y) / rMaks;
      // gelap hanya di sepertiga luar, landai
      const k = 1 - s.vinyet * Math.max(0, (d - 0.55) / 0.45) ** 2;
      r *= k;
      g *= k;
      b *= k;
    }
    if (s.butir) {
      const n = (rnd() - 0.5) * s.butir * 2;
      r += n;
      g += n;
      b += n;
    }
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }
}
