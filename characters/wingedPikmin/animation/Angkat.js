// Angkat.js
// Kedua tangan menjulur ke depan lalu memegang sisi kiri & kanan benda yang diangkat (misalnya peti).
// Hanya mengisi angka sendi di pikmin.pose (tidak menambah bentuk apa pun).
//
// Karena badan Winged condong ke depan (miring di urutan), "depan" badan mengarah ke bawah-depan,
// jadi tangan cukup dijulurkan ke depan badan dan sedikit membuka ke samping supaya mengenai sisi peti.
// Sudut dihitung dari posisi telapak tangan di kanan-kiri peti (lebar peti 2.1 pada skala 1.5):
// telapak berada sekitar 1 ke samping dan 1.4 di bawah titik asal Pikmin (di sisi peti, sedikit di bawah tepi atasnya).
//
// Pengaturan tambahan di urutan (opsional):
//   menuju : true = tangan bergerak halus dari pose biasa ke pose memegang selama langkah itu
//            (dipakai saat pikmin baru turun mendekati peti); default false = langsung memegang.
//   lebar  : seberapa lebar tangan membuka ke samping (default 0.45 radian; kecil = menyempit, besar = melebar)
//   cengkram : seberapa menekuk siku (default 0.2 radian)

function halus(k) {   // mulai & berhenti pelan
    return k * k * (3 - 2 * k);
}

export function angkat(pikmin, progres, waktu, langkah) {
    var pose = pikmin.pose;
    var lebar = (langkah && langkah.lebar !== undefined) ? langkah.lebar : 0.45;
    var cengkram = (langkah && langkah.cengkram !== undefined) ? langkah.cengkram : 0.2;
    var k = (langkah && langkah.menuju) ? halus(Math.min(1, progres)) : 1;

    // pose memegang: lengan turun & ke depan (ayun negatif = ke depan), siku sedikit menekuk
    pose.lengan.angkat = -lebar * k;
    pose.lengan.ayun = -1.5 * k;
    pose.lengan.siku = cengkram * k;
}
