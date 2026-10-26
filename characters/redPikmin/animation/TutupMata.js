// TutupMata.js
// Pose petak umpet: kedua lengan diangkat ke depan, siku ditekuk, tangan menutup mata.
// Pengaturan tambahan di urutan (opsional):
//   sudutBahu = seberapa jauh lengan diangkat dari posisi menjuntai (default 120 derajat = 2 * PI / 3)
//   sudutSiku = tekukan siku (default 45 derajat = PI / 4)
import { PI } from "../config.js";

export function tutupMata(pikmin, progres, waktu, langkah) {
    var sudutBahu = (langkah && langkah.sudutBahu !== undefined) ? langkah.sudutBahu : 2 * PI / 3;
    var sudutSiku = (langkah && langkah.sudutSiku !== undefined) ? langkah.sudutSiku : PI / 4;
    ["kiri", "kanan"].forEach(function (sisi) {
        pikmin.pose.lengan[sisi].bahuZ = 0;
        pikmin.pose.lengan[sisi].bahuX = -sudutBahu;   // sudut negatif = ke depan
        pikmin.pose.lengan[sisi].siku = sudutSiku;
    });
}
