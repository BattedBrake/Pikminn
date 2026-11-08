// Kaget.js
// Pupil membesar (kaget). Dipakai bersama animasi lain: animasi: ["normal", "kaget"].
// Pupil membesar pelan-pelan mengikuti jalannya langkah ini (bukan langsung), supaya selaras dengan kunci yang naik.
// Pengaturan tambahan di urutan (opsional):
//   pupil = ukuran pupil saat paling besar (default 1.35 = 1.35x ukuran normal)
//   mulai = bagian langkah (0 - 1) yang dilewati dulu sebelum pupil mulai membesar (default 0.45).
//           Pupil baru penuh di akhir langkah. Makin besar angkanya, makin lambat/terlambat membesarnya.
//   tahan = true: pupil langsung dipertahankan di ukuran paling besar sepanjang langkah (tanpa membesar lagi).
//           Pakai di langkah lanjutan setelah langkah kaget pertama supaya pupil tetap besar.
// Saat langkah berikutnya tidak memakai "kaget", pupil kembali ke 1 dengan halus (transisi timeline).
export function kaget(pikmin, progres, waktu, langkah) {
    var l = langkah || {};
    var target = l.pupil !== undefined ? l.pupil : 1.35;
    var mulai = l.mulai !== undefined ? l.mulai : 0.45;
    var u = l.tahan ? 1 : Math.min(1, Math.max(0, (progres - mulai) / (1 - mulai)));
    u = u * u * (3 - 2 * u);                 // mulai & berhenti pelan
    pikmin.pose.mata.pupil = 1 + (target - 1) * u;
}
