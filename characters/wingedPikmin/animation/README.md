# Animasi Winged Pikmin

Satu file per gerakan/pose. Setiap file mengubah `pikmin.pose`:

```js
pikmin.pose = {
    kepala: 0,                                // putar kepala (sumbu x)
    badan: 0,                                 // condong badan dari leher (positif = ke belakang)
    lengan: { angkat: 0, ayun: 0, siku: 0 },  // bahu & siku
    kaki: { ayun: 0 },                        // pinggul (positif = ke belakang)
};
```

Semua 0 = pose berdiri asli.

- `Berdiri.js`: pose normal (semua 0).
- `Terbang.js`: pose terbang (kepala ke depan, badan condong ke belakang).

Pilih pose lewat `new WingedPikmin(GL, "normal")` / `new WingedPikmin(GL, "terbang")`,
atau saat berjalan dengan `pikmin.setPose("normal")`. Di halaman tes
(`characters/wingedPikmin/`) ada tombol **Normal / Terbang** di pojok kiri atas.
Pose baru didaftarkan di `DAFTAR_POSE` dalam `WingedPikmin.js`.

Antena bergoyang dan sayap mengepak selalu aktif (mengikuti `time`).
Untuk gerakan lain, ubah nilai pose berdasarkan waktu, misalnya
`pose.lengan.ayun = Math.sin(time) * 0.3`, lalu panggil dari `render()` di `WingedPikmin.js`.
