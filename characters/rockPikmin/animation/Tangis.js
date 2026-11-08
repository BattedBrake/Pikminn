// Tangis.js
// Badan melebar lalu kembali ke semula beberapa kali, seperti kartun yang sedang terisak.
// Dipakai bersama animasi lain: animasi: ["normal", "tangis"]. Hanya mengisi pose.badan.lebar;
// bentuk badan tidak diubah (lihat Body.js: lebar menjadi skala matriks saat menggambar).
// Pengaturan tambahan di urutan (opsional):
//   kali    = berapa kali melebar (default 3)
//   periode = detik untuk satu kali melebar lalu kembali (default 1.2)
//   mulai   = detik sejak langkah dimulai sampai isakan pertama (default 1)
//   lebar   = tambahan lebar badan saat paling lebar (default 0.22 = 22% lebih lebar)
export function tangis(pikmin, progres, waktu, langkah) {
    var l = langkah || {};
    var kali = l.kali !== undefined ? l.kali : 3;
    var periode = l.periode !== undefined ? l.periode : 1.2;
    var mulai = l.mulai !== undefined ? l.mulai : 1;
    var lebar = l.lebar !== undefined ? l.lebar : 0.22;

    var u = (waktu - mulai) / periode;
    var w = 0;
    if (u >= 0 && u < kali) {
        var s = Math.sin(Math.PI * (u % 1));
        w = s * s;                          // 0 -> 1 -> 0 dengan halus
    }
    pikmin.pose.badan.lebar = lebar * w;
}
