# Animasi Winged Pikmin

## Mengatur urutan animasi

Buka **`urutan.js`**, lalu susun, tukar, tambah, atau hapus baris di `URUTAN`:

```js
export const URUTAN = [
    { animasi: "normal",                durasi: 1.5 },
    { animasi: "melambai",              durasi: 2.5 },
    { animasi: "terbang",               durasi: 2, dari: [0, 0, 0], ke: [0, 2, 0] },  // sambil pindah posisi
    { animasi: ["terbang", "melambai"], durasi: 2.5 },                               // gabungan
];
```

- `animasi`: nama dari `DAFTAR_ANIMASI` di `WingedPikmin.js`, atau array untuk menggabungkan beberapa animasi
  (dijalankan berurutan, yang belakang menimpa bagian yang sama).
- `durasi`: lama langkah dalam detik.
- `dari` / `ke` (opsional): pindah posisi `[x, y, z]` selama langkah. Langkah tanpa ini tetap di posisi terakhir.
- Pengaturan tambahan untuk animasi tertentu, misalnya `kecepatan` dan `lebar` untuk `melambai`.

`OPSI_URUTAN` mengatur `ulang` (loop) dan `transisi` (detik campuran halus saat berganti animasi).

Di halaman tes (`characters/wingedPikmin/`), klik **Putar urutan**. Tombol Normal / Terbang menghentikan urutan.
Di kode: `wingedPikmin.mainkanUrutan(URUTAN, OPSI_URUTAN)`.

## Animasi yang tersedia

| nama         | file           | isi                                                  |
| ------------ | -------------- | ---------------------------------------------------- |
| `normal`     | Berdiri.js     | semua sendi 0 (pose berdiri asli)                    |
| `terbang`    | Terbang.js     | kepala ke depan, badan condong ke belakang           |
| `melambai`   | Melambai.js    | kedua tangan terangkat ke samping, naik-turun        |
| `mengangguk` | Mengangguk.js  | kepala menunduk lalu tegak lagi                      |

Antena bergoyang dan sayap mengepak selalu aktif, terpisah dari urutan.

## Membuat animasi baru

1. Buat file baru di folder ini, misalnya `Berputar.js`:
   ```js
   // progres = 0..1 sepanjang durasi langkah, waktu = detik sejak langkah dimulai,
   // langkah = objek langkah dari urutan (untuk pengaturan tambahan)
   export function berputar(pikmin, progres, waktu, langkah) {
       pikmin.pose.kepala = Math.sin(waktu * 4) * 0.3;
   }
   ```
2. Daftarkan di `DAFTAR_ANIMASI` dalam `WingedPikmin.js`: `berputar: berputar,`
3. Pakai namanya di `urutan.js`.

Animasi **hanya mengisi angka di `pikmin.pose`** (jangan menulis matriks langsung),
supaya pemutar bisa mencampur dua animasi untuk transisi halus.

```js
pikmin.pose = {
    kepala: 0,                                // putar kepala (positif = menunduk)
    badan: 0,                                 // condong badan dari leher (positif = ke belakang)
    lengan: { angkat: 0, ayun: 0, siku: 0 },  // bahu & siku, kedua tangan sama
    kaki: { ayun: 0 },                        // pinggul (positif = ke belakang)
};
```

Pemutarnya ada di `shared/timeline.js` dan bisa dipakai karakter lain dengan pola yang sama.
