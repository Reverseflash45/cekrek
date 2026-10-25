import "@fontsource/bungee";
import "@fontsource-variable/onest";
import "./gaya.css";
import { type NamaBingkai, type Warna, DAFTAR_BINGKAI, cetak, contohCss, kolomWarna, labelBingkai, rakit, tembus, warnaAwal } from "./cetak";
import { type NamaSaring, DAFTAR_SARING, SARING, keCss } from "./saring";
import { bip, rana } from "./suara";
import { kontras, sahHeks } from "./warna";
import { type NamaTata, DAFTAR_TATA, namaBerkas, potongTengah, tata } from "./tata";

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const video = $<HTMLVideoElement>("video");
const jendela = $("jendela");
const ajak = $("ajak");
const galat = $("galat");
const hitung = $("hitung");
const kilat = $("kilat");
const jepretan = $("jepretan");
const tombolJepret = $<HTMLButtonElement>("jepret");
const bisik = $("bisik");
const tadah = $("tadah");
const hasil = $<HTMLImageElement>("hasil");
const tunggu = $("tunggu");
const bayangStrip = $("bayang-strip");
const atur = $("atur");
const tulisan = $<HTMLInputElement>("tulisan");
const simpan = $<HTMLAnchorElement>("simpan");
const bagikan = $<HTMLButtonElement>("bagikan");
const umum = $("umum");
const lampu = document.querySelector<HTMLElement>(".lampu")!;

const geraklah = () => !matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- pilihan, diingat di peramban ---------- */
type Pilihan = {
  tata: NamaTata;
  saring: NamaSaring;
  bingkai: NamaBingkai;
  timer: number;
  cermin: boolean;
  suara: boolean;
  tulisan: string;
  /** warna yang diubah, per bingkai */
  warna: Partial<Record<NamaBingkai, Partial<Warna>>>;
};
const AWAL: Pilihan = { tata: "strip4", saring: "asli", bingkai: "putih", timer: 3, cermin: true, suara: true, tulisan: "", warna: {} };
const KUNCI = "cekrek:pilihan";

function muat(): Pilihan {
  try {
    const p = { ...AWAL, ...JSON.parse(localStorage.getItem(KUNCI) ?? "{}") } as Pilihan;
    if (!DAFTAR_TATA.includes(p.tata)) p.tata = AWAL.tata;
    if (!DAFTAR_SARING.includes(p.saring)) p.saring = AWAL.saring;
    if (!DAFTAR_BINGKAI.includes(p.bingkai)) p.bingkai = AWAL.bingkai;
    if (![3, 5, 10].includes(p.timer)) p.timer = AWAL.timer;
    if (typeof p.warna !== "object" || p.warna === null || Array.isArray(p.warna)) p.warna = {};
    return p;
  } catch {
    return { ...AWAL };
  }
}
const pil = muat();
function ingat() {
  try {
    localStorage.setItem(KUNCI, JSON.stringify(pil));
  } catch {
    /* mode privat: tidak apa-apa */
  }
}

/* ---------- keadaan ---------- */
type Foto = HTMLCanvasElement;
let aliran: MediaStream | null = null;
/* semua jepretan disimpan; susunan dengan slot lebih sedikit memakai yang awal-awal saja */
let simpanan: (Foto | null)[] = Array(Math.max(...DAFTAR_TATA.map((n) => tata(n).slot.length))).fill(null);
let sibuk = false;
let batal: (() => void) | null = null;
let tercetak = false;
let nomor = acakNomor();
let urlHasil: string | null = null;
let waktuCetak = new Date();

function acakNomor() {
  return 1 + Math.floor(Math.random() * 999998);
}
const tataKini = () => tata(pil.tata);
const foto = () => simpanan.slice(0, tataKini().slot.length);
const penuh = () => foto().every(Boolean);


/* ---------- tombol pilihan ---------- */
function ikonTata(n: NamaTata) {
  const t = tata(n);
  const s = 34 / t.tinggi;
  const w = t.lebar * s;
  const kotak = t.slot.map((k) => `<rect x="${(k.x * s).toFixed(1)}" y="${(k.y * s).toFixed(1)}" width="${(k.w * s).toFixed(1)}" height="${(k.h * s).toFixed(1)}" rx="0.6"/>`).join("");
  return `<svg viewBox="0 0 ${w.toFixed(1)} 34" width="${w.toFixed(1)}" height="34" aria-hidden="true"><rect class="kertas" width="${w.toFixed(1)}" height="34" rx="1.5"/>${kotak}</svg>`;
}

function buatPil<T extends string | number>(wadah: HTMLElement, nama: string, opsi: { nilai: T; label: string; isi?: string }[], kini: T, ubah: (v: T) => void) {
  wadah.innerHTML = opsi
    .map(
      (o) =>
        `<label class="${o.isi ? "berikon" : ""}"><input type="radio" name="${nama}" value="${o.nilai}"${o.nilai === kini ? " checked" : ""} />${o.isi ?? ""}<span>${o.label}</span></label>`,
    )
    .join("");
  wadah.addEventListener("change", (e) => {
    const v = (e.target as HTMLInputElement).value;
    const o = opsi.find((x) => String(x.nilai) === v);
    if (o) ubah(o.nilai);
  });
}

buatPil($("pil-tata"), "tata", DAFTAR_TATA.map((n) => ({ nilai: n, label: tata(n).label, isi: ikonTata(n) })), pil.tata, (v) => {
  pil.tata = v;
  ingat();
  terapkanTata();
  if (penuh()) gambarHasil(false);
  else sembunyikanHasil();
});
buatPil($("pil-saring"), "saring", DAFTAR_SARING.map((n) => ({ nilai: n, label: SARING[n].label })), pil.saring, (v) => {
  pil.saring = v;
  ingat();
  terapkanSaring();
  gambarJepretan();
  if (tercetak) gambarHasil(false);
});
buatPil($("pil-timer"), "timer", [3, 5, 10].map((n) => ({ nilai: n, label: `${n} detik` })), pil.timer, (v) => {
  pil.timer = v;
  ingat();
});
buatPil(
  $("pil-bingkai"),
  "bingkai",
  DAFTAR_BINGKAI.map((n) => ({ nilai: n, label: labelBingkai(n), isi: `<i class="contoh" style="background:${contohCss(n, pil.warna[n])}"></i>` })),
  pil.bingkai,
  (v) => {
    pil.bingkai = v;
    ingat();
    buatKolomWarna();
    if (tercetak) gambarHasil(false);
  },
);

/* ---------- warna bingkai, bebas diubah ---------- */
const pilWarna = $("pil-warna");
const awasWarna = $("awas-warna");
const tombolWarnaAwal = $<HTMLButtonElement>("warna-awal");

function warnaKini(n: NamaBingkai): Warna {
  const a = warnaAwal(n);
  const u = pil.warna[n] ?? {};
  return {
    latar: sahHeks(u.latar) ? u.latar : a.latar,
    tinta: sahHeks(u.tinta) ? u.tinta : a.tinta,
    aksen: a.aksen.map((x, i) => {
      const y = u.aksen?.[i];
      return sahHeks(y) ? y : x;
    }),
  };
}

function buatKolomWarna() {
  const n = pil.bingkai;
  const w = warnaKini(n);
  pilWarna.innerHTML = kolomWarna(n)
    .map(({ kunci, label }) => {
      const nilai = typeof kunci === "number" ? w.aksen[kunci] : w[kunci];
      return `<label class="cat"><input type="color" data-kunci="${kunci}" value="${nilai}" /><span>${label}</span></label>`;
    })
    .join("");
  perbaruiWarna();
}

/** Contoh di tombol bingkai, peringatan kontras, dan tombol balikin. */
function perbaruiWarna() {
  const n = pil.bingkai;
  const contoh = document.querySelector<HTMLElement>(`#pil-bingkai input[value="${n}"] + .contoh`);
  if (contoh) contoh.style.background = contohCss(n, pil.warna[n]);
  const b = rakit(n, pil.warna[n]);
  const dasar = b.warnaPlat ?? (b.pola === "gradasi" ? b.aksen[b.aksen.length - 1] : b.latar);
  awasWarna.textContent = kontras(b.tinta, dasar) < 3 ? "tulisannya bakal susah kebaca. coba warna tulisan yang lebih beda dari latarnya." : "";
  tombolWarnaAwal.hidden = !pil.warna[n];
}

let jedaWarna = 0;
pilWarna.addEventListener("input", (e) => {
  const el = e.target as HTMLInputElement;
  if (!sahHeks(el.value)) return;
  const n = pil.bingkai;
  const w = warnaKini(n);
  const k = el.dataset.kunci!;
  if (k === "latar" || k === "tinta") w[k] = el.value;
  else w.aksen[Number(k)] = el.value;
  pil.warna[n] = w;
  ingat();
  perbaruiWarna();
  clearTimeout(jedaWarna);
  jedaWarna = window.setTimeout(() => tercetak && gambarHasil(false), 140);
});

tombolWarnaAwal.addEventListener("click", () => {
  delete pil.warna[pil.bingkai];
  ingat();
  buatKolomWarna();
  if (tercetak) gambarHasil(false);
});

buatKolomWarna();

const cbCermin = $<HTMLInputElement>("cermin");
const cbSuara = $<HTMLInputElement>("suara");
cbCermin.checked = pil.cermin;
cbSuara.checked = pil.suara;
cbCermin.addEventListener("change", () => {
  pil.cermin = cbCermin.checked;
  ingat();
  video.classList.toggle("cermin", pil.cermin);
});
cbSuara.addEventListener("change", () => {
  pil.suara = cbSuara.checked;
  ingat();
});
tulisan.value = pil.tulisan;
let jedaTulis = 0;
tulisan.addEventListener("input", () => {
  pil.tulisan = tulisan.value;
  ingat();
  clearTimeout(jedaTulis);
  jedaTulis = window.setTimeout(() => tercetak && gambarHasil(false), 160);
});

/* lampu papan nama */
lampu.innerHTML = Array.from({ length: 22 }, (_, i) => `<i style="--i:${i}"></i>`).join("");

/* ---------- tampilan jendela & jepretan ---------- */
function terapkanTata() {
  const t = tataKini();
  jendela.style.setProperty("--aspek", String(t.aspek));
  // bayangan strip di tadah: kotak foto bernomor sesuai susunan
  bayangStrip.style.aspectRatio = `${t.lebar} / ${t.tinggi}`;
  tadah.style.setProperty("--rasio", String(t.lebar / t.tinggi));
  bayangStrip.innerHTML = t.slot
    .map(
      (k, i) =>
        `<span style="left:${(k.x / t.lebar) * 100}%;top:${(k.y / t.tinggi) * 100}%;width:${(k.w / t.lebar) * 100}%;height:${(k.h / t.tinggi) * 100}%">${i + 1}</span>`,
    )
    .join("");
  gambarJepretan();
}

function terapkanSaring() {
  const s = SARING[pil.saring];
  video.style.filter = keCss(s);
  jendela.style.setProperty("--vinyet", String(s.vinyet));
}

function gambarJepretan(aktif = -1) {
  const t = tataKini();
  jepretan.style.setProperty("--aspek", String(t.aspek));
  jepretan.style.setProperty("--kolom", String(Math.min(4, t.slot.length)));
  jepretan.innerHTML = foto()
    .map((f, i) => {
      const cls = [f ? "isi" : "", i === aktif ? "aktif" : ""].join(" ").trim();
      const label = f ? `ulang foto ${i + 1}` : `foto ${i + 1} belum ada`;
      return `<li class="${cls}"><button type="button" data-i="${i}" aria-label="${label}"${f && !sibuk ? "" : " disabled"}><span>${i + 1}</span></button></li>`;
    })
    .join("");
  foto().forEach((f, i) => {
    if (!f) return;
    const k = document.createElement("canvas");
    const b = jepretan.querySelectorAll("button")[i];
    const lebar = 120;
    k.width = lebar;
    k.height = Math.round(lebar / t.aspek);
    const c = k.getContext("2d")!;
    const p = potongTengah(f.width, f.height, t.aspek);
    c.filter = keCss(SARING[pil.saring]);
    c.drawImage(f, p.x, p.y, p.w, p.h, 0, 0, k.width, k.height);
    b.prepend(k);
  });
}

jepretan.addEventListener("click", (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>("button[data-i]");
  if (!b || b.disabled) return;
  void ulangSatu(Number(b.dataset.i));
});

/* ---------- kamera ---------- */
function tampilGalat(teks: string) {
  galat.textContent = teks;
}

async function nyalakan(): Promise<boolean> {
  if (aliran) return true;
  tampilGalat("");
  if (!navigator.mediaDevices?.getUserMedia) {
    tampilGalat("browser ini nggak bisa buka kamera. pakai foto dari galeri aja ya.");
    return false;
  }
  const tombol = $<HTMLButtonElement>("tombol-kamera");
  tombol.disabled = true;
  tombol.textContent = "lagi buka kamera…";
  try {
    aliran = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 1920 }, height: { ideal: 1080 } },
      audio: false,
    });
    video.srcObject = aliran;
    await video.play();
    jendela.classList.add("hidup");
    ajak.hidden = true;
    perbaruiTombol();
    return true;
  } catch (e) {
    const n = (e as DOMException).name;
    tampilGalat(
      n === "NotAllowedError"
        ? "izin kameranya ditolak. buka pengaturan situs di browser, izinkan kamera, lalu coba lagi. atau pakai foto dari galeri."
        : n === "NotFoundError" || n === "OverconstrainedError"
          ? "kameranya nggak ketemu. pakai foto dari galeri aja ya."
          : n === "NotReadableError"
            ? "kameranya lagi dipakai aplikasi lain. tutup dulu aplikasinya, lalu coba lagi."
            : "kameranya gagal dibuka. coba muat ulang halaman, atau pakai foto dari galeri.",
    );
    return false;
  } finally {
    tombol.disabled = false;
    tombol.textContent = "nyalakan kamera";
  }
}

$("tombol-kamera").addEventListener("click", () => void nyalakan());

function ambilBingkai(): Foto {
  const MAKS = 1600;
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  const s = Math.min(1, MAKS / Math.max(vw, vh));
  const k = document.createElement("canvas");
  k.width = Math.round(vw * s);
  k.height = Math.round(vh * s);
  const c = k.getContext("2d")!;
  if (pil.cermin) {
    c.translate(k.width, 0);
    c.scale(-1, 1);
  }
  c.drawImage(video, 0, 0, k.width, k.height);
  return k;
}

/* ---------- hitung mundur ---------- */
class Batal extends Error {}

function tidur(ms: number) {
  return new Promise<void>((ok, gagal) => {
    const t = setTimeout(() => {
      batal = null;
      ok();
    }, ms);
    batal = () => {
      clearTimeout(t);
      batal = null;
      gagal(new Batal());
    };
  });
}

function umumkan(t: string) {
  umum.textContent = t;
}

async function hitungMundur(detik: number) {
  lampu.classList.add("kejar");
  for (let n = detik; n >= 1; n--) {
    hitung.textContent = String(n);
    hitung.classList.remove("detak");
    void hitung.offsetWidth;
    hitung.classList.add("detak");
    umumkan(String(n));
    if (pil.suara) bip(n === 1);
    await tidur(1000);
  }
  hitung.textContent = "";
}

function kilatan() {
  kilat.classList.remove("nyala");
  void kilat.offsetWidth;
  kilat.classList.add("nyala");
  if (pil.suara) rana();
}

async function jepretSatu(i: number) {
  gambarJepretan(i);
  await hitungMundur(pil.timer);
  kilatan();
  simpanan[i] = ambilBingkai();
  umumkan(`cekrek! foto ${i + 1} dari ${foto().length}`);
  gambarJepretan();
}

const POSE = ["pose lagi!", "ganti gaya!", "satu lagi!", "yang aneh dong!", "senyum lebar!"];

async function jalankan(urutan: number[]) {
  if (!(await nyalakan())) return;
  sibuk = true;
  perbaruiTombol();
  jendela.scrollIntoView({ behavior: geraklah() ? "smooth" : "auto", block: "nearest" });
  try {
    for (const [j, i] of urutan.entries()) {
      bisik.textContent = j === 0 ? "siap-siap…" : POSE[(j - 1) % POSE.length];
      await jepretSatu(i);
      if (j < urutan.length - 1) {
        bisik.textContent = POSE[j % POSE.length];
        await tidur(1100);
      }
    }
    bisik.textContent = "";
    if (penuh()) await gambarHasil(true);
  } catch (e) {
    if (!(e instanceof Batal)) throw e;
    hitung.textContent = "";
    bisik.textContent = "oke, berhenti dulu.";
  } finally {
    sibuk = false;
    lampu.classList.remove("kejar");
    gambarJepretan();
    perbaruiTombol();
  }
}

tombolJepret.addEventListener("click", () => {
  if (sibuk) {
    batal?.();
    return;
  }
  if (penuh()) mulaiBaru();
  const kosong = foto().map((f, i) => (f ? -1 : i)).filter((i) => i >= 0);
  void jalankan(kosong);
});

async function ulangSatu(i: number) {
  if (sibuk) return;
  await jalankan([i]);
}

function mulaiBaru() {
  simpanan = simpanan.map(() => null);
  nomor = acakNomor();
  sembunyikanHasil();
  gambarJepretan();
}

$("ulang").addEventListener("click", () => {
  mulaiBaru();
  bisik.textContent = "";
  perbaruiTombol();
  jendela.scrollIntoView({ behavior: geraklah() ? "smooth" : "auto", block: "center" });
});

function perbaruiTombol() {
  tombolJepret.textContent = sibuk ? "stop!" : penuh() ? "jepret lagi!" : foto().some(Boolean) ? "lanjut!" : "jepret!";
  tombolJepret.classList.toggle("berhenti", sibuk);
  document.querySelectorAll<HTMLInputElement>("#pil-tata input").forEach((r) => (r.disabled = sibuk));
}

/* ---------- galeri ---------- */
const galeri = $<HTMLInputElement>("galeri");
galeri.addEventListener("change", async () => {
  const berkas = [...(galeri.files ?? [])].filter((f) => f.type.startsWith("image/"));
  galeri.value = "";
  if (!berkas.length || sibuk) return;
  if (penuh()) mulaiBaru();
  tampilGalat("");
  for (const b of berkas) {
    const i = foto().findIndex((f) => !f);
    if (i < 0) break;
    try {
      simpanan[i] = await dariBerkas(b);
    } catch {
      tampilGalat(`"${b.name}" nggak bisa dibuka. coba foto lain.`);
    }
  }
  gambarJepretan();
  perbaruiTombol();
  const sisa = foto().filter((f) => !f).length;
  if (sisa) bisik.textContent = `kurang ${sisa} foto lagi. pilih lagi dari galeri, atau jepret pakai kamera.`;
  else {
    bisik.textContent = "";
    await gambarHasil(true);
  }
});

async function dariBerkas(b: File): Promise<Foto> {
  const bmp = await createImageBitmap(b);
  const MAKS = 1600;
  const s = Math.min(1, MAKS / Math.max(bmp.width, bmp.height));
  const k = document.createElement("canvas");
  k.width = Math.round(bmp.width * s);
  k.height = Math.round(bmp.height * s);
  k.getContext("2d")!.drawImage(bmp, 0, 0, k.width, k.height);
  bmp.close();
  return k;
}

/* ---------- cetak ---------- */
function sembunyikanHasil() {
  tercetak = false;
  hasil.hidden = true;
  hasil.removeAttribute("src");
  tadah.classList.remove("ada", "mencetak");
  atur.hidden = true;
  if (urlHasil) URL.revokeObjectURL(urlHasil);
  urlHasil = null;
}

let antre = Promise.resolve();
function gambarHasil(animasi: boolean) {
  antre = antre.then(() => gambarHasilSekarang(animasi));
  return antre;
}

async function gambarHasilSekarang(animasi: boolean) {
  if (!penuh()) return;
  atur.setAttribute("aria-busy", "true");
  try {
    await susunHasil(animasi);
  } finally {
    atur.removeAttribute("aria-busy");
  }
}

async function susunHasil(animasi: boolean) {
  await Promise.all([document.fonts.load('40px "Bungee"'), document.fonts.load('500 20px "Onest Variable"')]);
  if (animasi) waktuCetak = new Date();
  const kanvas = cetak({
    tata: tataKini(),
    foto: foto(),
    saring: SARING[pil.saring],
    bingkai: pil.bingkai,
    warna: pil.warna[pil.bingkai],
    tulisan: pil.tulisan,
    waktu: waktuCetak,
    nomor,
  });
  const jenis = tembus(pil.bingkai) ? "image/png" : "image/jpeg";
  const blob = await new Promise<Blob | null>((ok) => kanvas.toBlob(ok, jenis, 0.92));
  if (!blob) return;
  if (urlHasil) URL.revokeObjectURL(urlHasil);
  urlHasil = URL.createObjectURL(blob);
  hasil.src = urlHasil;
  await hasil.decode().catch(() => {});
  hasil.alt = `strip foto ${foto().length} jepretan, bingkai ${labelBingkai(pil.bingkai)}, filter ${SARING[pil.saring].label}`;
  hasil.hidden = false;
  tadah.classList.add("ada");
  const ekor = jenis === "image/png" ? ".png" : ".jpg";
  simpan.href = urlHasil;
  simpan.download = namaBerkas(waktuCetak).replace(/\.jpg$/, ekor);
  const file = new File([blob], simpan.download, { type: jenis });
  bagikan.hidden = !(navigator.canShare && navigator.canShare({ files: [file] }));
  bagikan.onclick = () => void navigator.share({ files: [file], title: "cekrek!" }).catch(() => {});
  atur.hidden = false;
  tercetak = true;
  if (animasi) {
    umumkan("fotomu sudah tercetak.");
    if (geraklah()) {
      tadah.classList.remove("mencetak");
      void tadah.offsetWidth;
      tadah.classList.add("mencetak");
      lampu.classList.add("kejar");
      setTimeout(() => lampu.classList.remove("kejar"), 2600);
    }
    if (matchMedia("(max-width: 899px)").matches) tadah.scrollIntoView({ behavior: geraklah() ? "smooth" : "auto", block: "start" });
  }
}

/* ---------- mulai ---------- */
video.classList.toggle("cermin", pil.cermin);
terapkanTata();
terapkanSaring();
perbaruiTombol();
tunggu.hidden = false;
