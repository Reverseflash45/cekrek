# Cekrek

Photobooth di browser. Nyalakan kamera, tekan **jepret!**, lalu tunggu hitung mundur 3, 2, 1. Setelah jepretan terakhir, strip fotonya keluar dari slot seperti di mesin photobooth.

**Coba:** https://cekrek.raffstw.my.id

- 4 susunan: strip 4 (2×6 inci), strip 3, 4 kotak (4R), polaroid
- 5 filter: asli, hitam putih, jadul, hangat, nyala
- 5 bingkai: putih, hitam, tirai, struk ("TOTAL SENYUM: 4"), karcis
- tulisan di bawah foto bisa diganti
- hitung mundur 3, 5, atau 10 detik
- foto yang kurang pas bisa diulang satu per satu
- nggak punya kamera? pakai foto dari galeri
- hasil 1200×3600 piksel (300 dpi untuk strip 2×6 inci), bisa disimpan atau dibagikan

Semua diproses di perangkatmu. Fotonya tidak diunggah ke server mana pun.

## Cara kerja singkat

- Kamera dibuka lewat `getUserMedia`. Tiap jepretan menyimpan bingkai video utuh (maks. 1600 px), jadi susunan bisa diganti setelah memotret tanpa mengulang.
- Filter didefinisikan sekali di [`src/saring.ts`](src/saring.ts). Pratinjau kamera memakai filter CSS, sedangkan cetakan memakai matriks warna yang sama dengan definisi fungsi filter CSS. Hasil cetak jadi sama dengan yang terlihat di layar.
- Cetakan disusun di kanvas ([`src/cetak.ts`](src/cetak.ts)). Bingkai struk dan karcis punya tepi sobek transparan, jadi disimpan sebagai PNG. Bingkai lain disimpan sebagai JPEG.
- Bunyi bip dan rana disintesis dengan Web Audio, tanpa berkas audio.

## Jalankan sendiri

```bash
npm install
npm run dev    # http://localhost:5173
npm test       # tes tata letak & filter
npm run build
```

Kamera hanya bisa dibuka di `localhost` atau HTTPS.

---

Dibikin iseng sama [Rafi](https://www.raffstw.my.id).
