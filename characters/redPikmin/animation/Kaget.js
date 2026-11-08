// Kaget.js
// Pupil membesar (kaget). Dipakai bersama animasi lain: animasi: ["normal", "kaget"].
// Pengaturan tambahan di urutan (opsional): pupil = ukuran pupil (default 1.6 = 1.6x ukuran normal)
// Saat langkah berikutnya tidak memakai "kaget", pupil kembali ke 1 dengan halus (transisi timeline).
export function kaget(pikmin, progres, waktu, langkah) {
    pikmin.pose.mata.pupil = (langkah && langkah.pupil !== undefined) ? langkah.pupil : 1.6;
}
