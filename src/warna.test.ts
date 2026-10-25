import { describe, expect, it } from "vitest";
import { DAFTAR_BINGKAI, GRUP_BINGKAI, contohCss, kolomWarna, rakit, warnaAwal } from "./cetak";
import { campur, kontras, rgba, sahHeks } from "./warna";

describe("bantuan warna", () => {
  it("campur di ujung dan tengah", () => {
    expect(campur("#000000", "#ffffff", 0)).toBe("#000000");
    expect(campur("#000000", "#ffffff", 1)).toBe("#ffffff");
    expect(campur("#000000", "#ffffff", 0.5)).toBe("#808080");
  });
  it("rgba dari heks", () => expect(rgba("#d62839", 0.4)).toBe("rgba(214,40,57,0.4)"));
  it("kontras hitam-putih 21:1", () => expect(kontras("#000000", "#ffffff")).toBeCloseTo(21, 1));
  it("hanya menerima #rrggbb", () => {
    expect(sahHeks("#a1B2c3")).toBe(true);
    for (const x of ["red", "#fff", "#12345g", "", null, 3, "url(x)"]) expect(sahHeks(x)).toBe(false);
  });
});

describe("warna bingkai bisa diubah", () => {
  it("tanpa ubahan memakai warna asli", () => {
    for (const n of DAFTAR_BINGKAI) {
      const b = rakit(n);
      const a = warnaAwal(n);
      expect([b.latar, b.tinta, ...b.aksen]).toEqual([a.latar, a.tinta, ...a.aksen]);
    }
  });

  it("ubahan dipakai, nilai tidak sah diabaikan", () => {
    const b = rakit("polkadot", { latar: "#123456", tinta: "javascript:", aksen: ["#ff0000"] });
    expect(b.latar).toBe("#123456");
    expect(b.tinta).toBe(warnaAwal("polkadot").tinta);
    expect(b.aksen[0]).toBe("#ff0000");
    expect(b.warnaPlat).toBe("#ff0000");
  });

  it("warna tulisan pudar ikut warna baru", () => {
    expect(rakit("putih", { tinta: "#ff0000" }).redup).not.toBe(rakit("putih").redup);
  });

  it("setiap kolom warna menunjuk warna yang ada", () => {
    for (const n of DAFTAR_BINGKAI) {
      const w = warnaAwal(n);
      for (const { kunci } of kolomWarna(n)) {
        const v = typeof kunci === "number" ? w.aksen[kunci] : w[kunci];
        expect(sahHeks(v)).toBe(true);
      }
    }
  });

  it("contoh di tombol memakai warna ubahan", () => {
    expect(contohCss("permen", { aksen: ["#00ff00"] })).toContain("#00ff00");
    expect(contohCss("senja", { aksen: ["#111111", "#222222", "#333333"] })).toBe("linear-gradient(#111111, #222222, #333333)");
  });
});

it("setiap bingkai muncul tepat sekali di kelompok tombol", () => {
  expect(GRUP_BINGKAI.flat().sort()).toEqual([...DAFTAR_BINGKAI].sort());
});
