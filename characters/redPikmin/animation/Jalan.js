// Jalan.js
// Animasi berjalan: badan bergoyang, lengan berayun, kaki melangkah bergantian.
// Hanya mengisi pikmin.pose (lihat RedPikmin.js untuk arti tiap angka).
// Pengaturan tambahan di urutan (opsional): kecepatan (default 6 = sekitar satu langkah per detik)
import { PI, SUDUT_AWAL, LUTUT_MAKS, SIKU_MAKS } from "../config.js";

export function jalan(pikmin, progres, waktu, langkah) {
    var pose = pikmin.pose;
    var kecepatan = (langkah && langkah.kecepatan) || 6;
    var w = waktu * kecepatan, s = Math.sin(w);

    // Badan: bergoyang pelan, naik-turun, dan menoleh
    pose.badan.miring = Math.sin(w) * 0.03;
    pose.badan.toleh = Math.sin(w * 0.5) * 0.2;
    pose.badan.naik = s * 0.06;

    [["kiri", -1], ["kanan", 1]].forEach(function (p) {
        var sisi = p[0], sx = p[1];

        // Lengan: berayun bergantian di bahu. Siku menekuk saat lengan berada di depan (s * sx < 0).
        pose.lengan[sisi].bahuZ = SUDUT_AWAL * PI / 180;
        pose.lengan[sisi].bahuX = sx * s * 0.5;
        pose.lengan[sisi].siku = SIKU_MAKS * Math.max(0, -sx * s);

        // Kaki: melangkah bergantian di pinggul. Lutut menekuk saat kaki berada di belakang (s * sx < 0).
        pose.kaki[sisi].pinggul = -sx * s * 0.5;
        pose.kaki[sisi].lutut = LUTUT_MAKS * Math.max(0, -sx * s);
    });
}
