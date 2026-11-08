// Putar.js
// ROTASI SUMBU BEBAS: seluruh Rock Pikmin berputar mengelilingi sebuah garis MIRING yang tidak lewat pusat badan
// (garis ditentukan oleh PUTAR.sumbu dan PUTAR.pivot di config.js). Rumus matriksnya ada di
// shared/libs.js (LIBS.get_rotationArbitrary, rumus Rodrigues), dipakai di RockPikmin.js lewat RA().
// Animasi ini hanya mengisi pose.putar.sudut (radian). Dipakai bersama animasi lain: animasi: ["normal", "putar"].
// Pengaturan tambahan di urutan (opsional):
//   kali    = berapa putaran penuh (default 1)
//   periode = detik untuk satu putaran penuh (default 7)
//   mulai   = detik sejak langkah dimulai sampai mulai berputar (default 1)
// Setelah putaran selesai sudut kembali 0 (360 derajat sama dengan posisi awal), jadi karakter berhenti di tempat semula.
export function putar(pikmin, progres, waktu, langkah) {
    var l = langkah || {};
    var kali = l.kali !== undefined ? l.kali : 1;
    var periode = l.periode !== undefined ? l.periode : 7;
    var mulai = l.mulai !== undefined ? l.mulai : 1;

    var u = (waktu - mulai) / periode;
    var sudut = 0;
    if (u >= 0 && u < kali) {
        var f = u % 1;
        sudut = 2 * Math.PI * (Math.floor(u) + f * f * (3 - 2 * f));   // mulai & berhenti pelan tiap putaran
    }
    pikmin.pose.putar.sudut = sudut;
}
