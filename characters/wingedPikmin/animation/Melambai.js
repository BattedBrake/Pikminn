// Melambai.js
// Kedua tangan terangkat ke samping dan melambai naik-turun.
// Tangan Winged pendek dan kepalanya besar: kalau diangkat terlalu tinggi (> ~1 radian) tangan masuk ke kepala.
// Pengaturan tambahan di urutan (opsional): kecepatan (default 6), lebar (default 0.35 radian)

export function melambai(pikmin, progres, waktu, langkah) {
    var pose = pikmin.pose;
    var kecepatan = (langkah && langkah.kecepatan) || 6;
    var lebar = (langkah && langkah.lebar) || 0.35;

    pose.lengan.angkat = 0.6 + Math.sin(waktu * kecepatan) * lebar;             // naik-turun di bahu
    pose.lengan.ayun = 0.3;                                                      // sedikit ke depan supaya terlihat
    pose.lengan.siku = Math.PI / 6 + Math.sin(waktu * kecepatan + 1) * 0.2;     // siku ikut menekuk
}
