// MataBergantian.js
// Kedua mata membesar-mengecil BERGANTIAN: saat mata kiri membesar, mata kanan mengecil, lalu sebaliknya.
// Hanya mengisi pikmin.pose.mata (skala tiap mata di bidang wajah; tebalnya tetap).
// Dipakai sendiri atau bersama animasi lain, misalnya ["terbang", "mataBergantian"].
//
// Pengaturan tambahan di urutan (opsional):
//   kecepatan = laju bergantian (default 4; makin besar makin cepat)
//   besar     = seberapa jauh membesar/mengecil (default 0.25 = paling besar 1.25x, paling kecil 0.75x)

export function mataBergantian(pikmin, progres, waktu, langkah) {
    var kecepatan = (langkah && langkah.kecepatan) || 4;
    var besar = (langkah && langkah.besar !== undefined) ? langkah.besar : 0.25;
    var s = Math.sin(waktu * kecepatan);
    pikmin.pose.mata.kiri = 1 + besar * s;
    pikmin.pose.mata.kanan = 1 - besar * s;
}
