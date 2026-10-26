// Mengangguk.js
// Kepala mengangguk naik-turun.
// Pengaturan tambahan di urutan (opsional): kecepatan (default 5), dalam (default 0.25 radian)

export function mengangguk(pikmin, progres, waktu, langkah) {
    var kecepatan = (langkah && langkah.kecepatan) || 5;
    var dalam = (langkah && langkah.dalam) || 0.25;

    pikmin.pose.kepala = Math.max(0, Math.sin(waktu * kecepatan)) * dalam;     // hanya menunduk, lalu kembali tegak
}
