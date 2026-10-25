/* Bantuan warna heksadesimal untuk bingkai yang warnanya bisa diubah. */

export const sahHeks = (s: unknown): s is string => typeof s === "string" && /^#[0-9a-f]{6}$/i.test(s);

function urai(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const keHeks = (r: number, g: number, b: number) => "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");

/** Campur a ke arah b sebanyak t (0 = a, 1 = b). */
export function campur(a: string, b: string, t: number) {
  const x = urai(a);
  const y = urai(b);
  return keHeks(x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t);
}

export function rgba(h: string, alfa: number) {
  const [r, g, b] = urai(h);
  return `rgba(${r},${g},${b},${alfa})`;
}

/** Luminans relatif WCAG. */
export function terang(h: string) {
  const c = urai(h).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

export function kontras(a: string, b: string) {
  const [x, y] = [terang(a), terang(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
