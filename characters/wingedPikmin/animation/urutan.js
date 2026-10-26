// urutan.js
// URUTAN ANIMASI Winged Pikmin. Tinggal susun, tukar, tambah, atau hapus baris di bawah.
//
// Setiap langkah:
//   animasi : nama animasi (lihat DAFTAR_ANIMASI di WingedPikmin.js), atau array untuk menggabungkan,
//             misalnya ["terbang", "melambai"] = terbang sambil melambai
//   durasi  : lama langkah dalam detik
//   dari/ke : (opsional) pindah posisi [x, y, z] selama langkah, relatif dari posisi karakter di scene
//   lainnya : pengaturan tambahan untuk animasi tertentu (misalnya kecepatan untuk melambai)
//
// Langkah tanpa dari/ke tetap di posisi terakhir. Kalau urutan diulang, posisi kembali ke awal,
// jadi sebaiknya langkah terakhir kembali ke posisi awal supaya tidak meloncat.

export const URUTAN = [
    { animasi: "normal",                 durasi: 1.5 },
    { animasi: "melambai",               durasi: 2.5 },
    { animasi: "terbang",                durasi: 2,   dari: [0, 0, 0],  ke: [0, 2, 0] },   // lepas landas
    { animasi: "terbang",                durasi: 3,   dari: [0, 2, 0],  ke: [0, 2, 4] },  // terbang ke kiri
    { animasi: ["terbang", "melambai"],  durasi: 2.5 },                                     // melambai sambil terbang
    { animasi: "terbang",                durasi: 3,   dari: [0, 2, 4], ke: [0, 0, 4] },   // kembali & mendarat
    { animasi: ["normal", "mengangguk"], durasi: 2 },
];

// Pengaturan pemutar
export const OPSI_URUTAN = {
    ulang: true,      // true = diulang terus dari awal
    transisi: 0.4,    // detik campuran halus saat berganti animasi
};
