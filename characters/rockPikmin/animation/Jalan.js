// Jalan.js
// Rock Pikmin berjalan: kaki melangkah bergantian, lengan berayun berlawanan dengan kaki di sisi yang sama.
// Telapak tetap datar berkat rotasi balik di pergelangan (lihat bodyParts/Limbs.js).
// Pengaturan tambahan di urutan (opsional): kecepatan (default 6)

export function jalan(pikmin, progres, waktu, langkah) {
    var kecepatan = (langkah && langkah.kecepatan) || 6;
    var s = Math.sin(waktu * kecepatan);
    pikmin.pose.lengan.buka = 0.95;
    pikmin.pose.lengan.ayun = s * 0.6;
    pikmin.pose.kaki.ayun = -s * 0.4;
}
