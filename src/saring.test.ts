import { describe, expect, it } from "vitest";
import { DAFTAR_SARING, SARING, acak, gabung, keCss, matriksSaring, terapkan } from "./saring";

const piksel = (r: number, g: number, b: number) => new Uint8ClampedArray([r, g, b, 255]);

describe("filter", () => {
  it("asli tidak mengubah piksel", () => {
    const d = piksel(12, 200, 99);
    terapkan(d, 1, 1, SARING.asli);
    expect([...d]).toEqual([12, 200, 99, 255]);
    expect(keCss(SARING.asli)).toBe("none");
  });

  it("hitam putih menghasilkan kanal yang sama", () => {
    const s = { ...SARING.hitamputih, butir: 0, vinyet: 0 };
    const d = piksel(220, 40, 90);
    terapkan(d, 1, 1, s);
    expect(d[0]).toBe(d[1]);
    expect(d[1]).toBe(d[2]);
  });

  it("matriks grayscale(1) sama dengan bobot luminans Rec.709", () => {
    const m = gabung(matriksSaring({ ...SARING.asli, langkah: [["grayscale", 1]] }));
    expect(m.slice(0, 3).map((v) => +v.toFixed(4))).toEqual([0.2126, 0.7152, 0.0722]);
  });

  it("contrast(c) mempertahankan abu-abu tengah", () => {
    const d = piksel(127.5, 127.5, 127.5);
    terapkan(d, 1, 1, { ...SARING.asli, langkah: [["contrast", 1.6]] });
    expect(Math.abs(d[0] - 128)).toBeLessThanOrEqual(1);
  });

  it("string CSS mengikuti urutan langkah", () => {
    expect(keCss(SARING.jadul)).toBe("sepia(0.5) saturate(0.85) contrast(0.9) brightness(1.06)");
  });

  it("bintik film sama untuk benih yang sama", () => {
    const a = new Uint8ClampedArray(64 * 4).fill(128);
    const b = new Uint8ClampedArray(64 * 4).fill(128);
    terapkan(a, 8, 8, SARING.jadul, 7);
    terapkan(b, 8, 8, SARING.jadul, 7);
    expect([...a]).toEqual([...b]);
    const r = acak(3);
    for (let i = 0; i < 100; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("vinyet menggelapkan pojok, bukan tengah", () => {
    const n = 21;
    const d = new Uint8ClampedArray(n * n * 4).fill(200);
    terapkan(d, n, n, { ...SARING.asli, vinyet: 0.5 });
    const tengah = d[(10 * n + 10) * 4];
    const pojok = d[0];
    expect(tengah).toBe(200);
    expect(pojok).toBeLessThan(150);
  });

  it("semua filter punya label", () => {
    for (const n of DAFTAR_SARING) expect(SARING[n].label.length).toBeGreaterThan(0);
  });
});
