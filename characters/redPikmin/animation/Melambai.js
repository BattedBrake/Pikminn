// Melambai.js
// Tangan kanan diangkat tinggi dan melambai ke kiri-kanan, tangan kiri tetap menjuntai.
// Pengaturan tambahan di urutan (opsional): kecepatan (default 8), sisi ("kanan" atau "kiri", default "kanan")
import { PI } from "../config.js";

export function melambai(pikmin, progres, waktu, langkah) {
    var kecepatan = (langkah && langkah.kecepatan) || 8;
    var sisi = (langkah && langkah.sisi) || "kanan";
    var lengan = pikmin.pose.lengan[sisi];

    lengan.bahuZ = 2.6 + Math.sin(waktu * kecepatan) * 0.35;   // terangkat ke atas, bergoyang kiri-kanan
    lengan.bahuX = 0;
    lengan.siku = PI / 8;
}
