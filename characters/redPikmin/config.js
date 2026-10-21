// config.js
// Angka-angka Red Pikmin yang dipakai bersama oleh bodyParts/ dan animation/.

export const PI = Math.PI;

export const MERAH = [0.9, 0.1, 0.1], MERAH_TUA = [0.8, 0.05, 0.05], HIJAU = [0.55, 0.82, 0.22];
export const PUTIH = [1.0, 1.0, 1.0], HITAM = [0.1, 0.1, 0.1];

// Pengaturan lengan (12 cylinder kecil yang disusun LURUS)
export const JUMLAH_RUAS = 12, PANJANG_RUAS = 0.15;
export const RADIUS_BAHU = 0.11, RADIUS_UJUNG = 0.045;
export const SUDUT_AWAL = 20, SUDUT_AKHIR = 20;   // derajat dari arah bawah. Awal = akhir -> lengan LURUS miring 20 derajat ke luar
                                                   // (kalau mau melengkung lagi: SUDUT_AWAL = 70, SUDUT_AKHIR = 5)
// Pengaturan kaki
export const PANJANG_PAHA = 0.6, PANJANG_BETIS = 0.6;           // pinggul -> lutut, lutut -> pergelangan
export const RADIUS_PAHA = 0.24, RADIUS_LUTUT = 0.10, RADIUS_BETIS = 0.09;
export const LUTUT_MAKS = PI / 3;                              // tekukan lutut terbesar saat berjalan (60 derajat)

// Pengaturan siku: 3 ruas di tengah lengan menekuk bersama supaya sikunya membulat
export const RUAS_SIKU = [5, 6, 7];
export const SIKU_MAKS = PI / 3;                               // tekukan siku terbesar saat berjalan (60 derajat)
