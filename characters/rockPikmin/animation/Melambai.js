// Melambai.js
// Kedua lengan terangkat tinggi dan melambai.
// Pengaturan tambahan di urutan (opsional): kecepatan (default 8)

export function melambai(pikmin, progres, waktu, langkah) {
    var kecepatan = (langkah && langkah.kecepatan) || 8;
    pikmin.pose.lengan.buka = 2.3 + Math.sin(waktu * kecepatan) * 0.3;
    pikmin.pose.lengan.ayun = 0;
}
