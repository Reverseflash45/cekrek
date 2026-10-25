import { describe, expect, it } from "vitest";
import { DAFTAR_TATA, namaBerkas, potongTengah, tanggalPendek, tata } from "./tata";

describe("tata letak", () => {
  it.each(DAFTAR_TATA)("%s: semua foto di dalam kertas, tidak bertumpuk, aspek sama", (n) => {
    const t = tata(n);
    for (const k of t.slot) {
      expect(k.x).toBeGreaterThanOrEqual(0);
      expect(k.y).toBeGreaterThanOrEqual(0);
      expect(k.x + k.w).toBeLessThanOrEqual(t.lebar);
      expect(k.y + k.h).toBeLessThanOrEqual(t.kaki.y);
      expect(k.w / k.h).toBeCloseTo(t.aspek, 2);
    }
    for (let i = 0; i < t.slot.length; i++)
      for (let j = i + 1; j < t.slot.length; j++) {
        const a = t.slot[i];
        const b = t.slot[j];
        const pisah = a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y;
        expect(pisah).toBe(true);
      }
    // ruang tulisan cukup untuk satu baris + tanggal
    expect(t.kaki.h).toBeGreaterThanOrEqual(110);
    expect(t.kaki.y + t.kaki.h).toBe(t.tinggi);
  });

  it("strip 4 sesuai ukuran 2×6 inci di 300 dpi", () => {
    const t = tata("strip4");
    expect([t.lebar, t.tinggi]).toEqual([600, 1800]);
    expect(t.slot).toHaveLength(4);
  });

  it("kisi berisi 2×2 dan simetris", () => {
    const t = tata("kisi");
    expect(t.slot).toHaveLength(4);
    expect(t.slot[0].x).toBe(t.lebar - (t.slot[1].x + t.slot[1].w));
  });
});

describe("susunan banyak foto", () => {
  it.each([["kisi6", 6], ["kisi8", 8]] as const)("%s berisi %i foto dalam 2 kolom", (n, jumlah) => {
    const t = tata(n);
    expect(t.slot).toHaveLength(jumlah);
    expect(new Set(t.slot.map((k) => k.x)).size).toBe(2);
  });
  it("maksimal 8 foto per cetakan", () => {
    expect(Math.max(...DAFTAR_TATA.map((n) => tata(n).slot.length))).toBe(8);
  });
});

describe("potong tengah", () => {
  it("memotong sisi kiri-kanan untuk video lebar", () => {
    const p = potongTengah(1920, 1080, 1);
    expect(p).toEqual({ x: 420, y: 0, w: 1080, h: 1080 });
  });
  it("memotong atas-bawah untuk foto tegak", () => {
    const p = potongTengah(1000, 2000, 4 / 3);
    expect(p.w).toBe(1000);
    expect(p.h).toBe(750);
    expect(p.y).toBe(625);
  });
});

describe("nama & tanggal", () => {
  const t = new Date(2026, 9, 5, 9, 7);
  it("nama berkas memakai waktu lokal", () => expect(namaBerkas(t)).toBe("cekrek-2026-10-05-0907.jpg"));
  it("tanggal pendek bahasa Indonesia", () => expect(tanggalPendek(t)).toBe("5 Okt 2026"));
});
