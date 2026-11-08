import { createScene, place } from "./shared/renderer.js";
import { LIBS } from "./shared/libs.js";
import { Sun } from "./environment/sun.js";
import { Environment, tinggiTanah } from "./environment/Environment.js";

import { WingedPikmin } from "./characters/wingedPikmin/WingedPikmin.js";
import { RedPikmin } from "./characters/redPikmin/RedPikmin.js";
import { RockPikmin } from "./characters/rockPikmin/RockPikmin.js";

import { Chest } from "./environment/chest.js";
import { SkeletonKey } from "./environment/skeletonKey.js";
import { Kopdes } from "./environment/kopdes.js";
import { Hutan } from "./environment/pohon.js";
import { Rumput } from "./environment/rumput.js";
import { melambai } from "./characters/wingedPikmin/animation/Melambai.js";

// =====================================================================================
// PENGATURAN ADEGAN: posisi awal, ukuran, dan urutan gerakan tiap pikmin, chest, dan kunci
// =====================================================================================
//   posisi   : posisi awal [x, y, z]. y = tinggi DI ATAS TANAH (0 = kaki menginjak pasir)
//   skala    : ukuran karakter
//   arahAwal : arah hadap awal dalam derajat (0 = menghadap kamera, 90 = kanan, -90 = kiri, 180 = membelakangi)
//   ulang    : true = urutan diulang terus dari awal
//   urutan   : daftar langkah, dijalankan berurutan:
//     animasi : nama animasi (lihat daftar di bawah), atau array untuk menggabungkan, misalnya ["terbang", "melambai"]
//     durasi  : lama langkah dalam detik
//     ke      : (opsional) tujuan [x, y, z], bergerak lurus dari posisi sebelumnya selama langkah ini
//               karakter otomatis menghadap ke arah ia berjalan
//     hadap   : (opsional) paksa arah hadap dalam derajat selama langkah ini
//     miring  : (opsional) condong badan dalam derajat: 90 = tengkurap menghadap tanah (seperti jatuh),
//               -90 = telentang menghadap langit, 180 = terbalik (kepala di bawah)
//     guling  : (opsional) miring ke samping dalam derajat: positif = ke kanan karakter, negatif = ke kiri,
//               360 = berguling satu putaran penuh
//               miring & guling kembali tegak (0) di langkah yang tidak menulisnya, dan berubah halus antar langkah
//     lainnya : pengaturan tambahan animasi, misalnya kecepatan
//
// Animasi yang tersedia:
//   red    : normal, jalan, tutupMata, melambai, kaget     (characters/redPikmin/RedPikmin.js)
//   winged : normal, terbang, melambai, mengangguk, angkat, mataBergantian (characters/wingedPikmin/WingedPikmin.js)
//   rock   : normal, jalan, melambai, kaget, tangis, putar (characters/rockPikmin/RockPikmin.js)
//   kaget  : pupil membesar. Pakai bersama animasi lain, misalnya ["normal", "kaget"].
//            Pengaturan: pupil = ukuran pupil (default red 1.6, rock 1.35)
//   putar  : Rock berputar mengelilingi garis MIRING di sampingnya (rotasi sumbu bebas, sumbu & pivot di config.js PUTAR).
//            Pengaturan: kali (default 1), periode (detik per putaran, default 7), mulai (detik, default 1)
//   tangis : badan Rock melebar lalu kembali beberapa kali, misalnya ["normal", "tangis"].
//            Pengaturan: kali (default 3), periode (detik, default 1.2), mulai (detik, default 1), lebar (default 0.22)
//   mataBergantian : mata Winged membesar-mengecil bergantian (kiri besar saat kanan kecil, lalu sebaliknya).
//            Pakai bersama animasi lain, misalnya ["terbang", "mataBergantian"].
//            Pengaturan: kecepatan (default 4), besar (default 0.25 = 1.25x .. 0.75x)
//   lompat : (opsional, per langkah) naik-turun berkali-kali selama langkah itu, misalnya
//            lompat: { tinggi: 1.2, kali: 12 }   (animasi seperti melambai tetap berjalan mulus)
//   orbit  : (opsional, per langkah) diputar mengelilingi sumbu sembarang, misalnya
//            orbit: { pusat: [x, z], putaran: 360, miring: 20 }   (lihat shared/timeline.js)
//   angkat : tangan Winged memegang benda (peti). Pengaturan: menuju: true = tangan bergerak halus ke posisi memegang,
//            lebar (default 0.45), cengkram (default 0.2)
//   chest  : tertutup, buka, terbuka, tutup                (environment/chest.js)
//   kunci  : diam, putar, melayang                         (environment/skeletonKey.js)
//   Chest & kunci tidak berbelok otomatis saat dipindah (pakai hadap kalau ingin memutarnya).
//   Langkah tanpa animasi kembali ke pose awal: setelah "buka", pakai "terbuka" supaya tutup tetap terbuka.
//
// Kalau ulang = true, posisi kembali ke awal saat urutan diulang: buat langkah terakhir kembali ke posisi awal.
// Sumbu: x = kiri(-)/kanan(+), z = jauh(-)/dekat kamera(+).
// =====================================================================================
// POSISI RUMAH (KOPDES) & PINTU
// =====================================================================================
// Kopdes aslinya menghadap +z (arah menjauhi pikmin yang datang dari z kecil), jadi pikmin & kunci
// sampai di DINDING BELAKANG. Sekarang rumah diputar 180 derajat supaya pintunya menghadap -z
// (ke arah datangnya pikmin & kunci), dan x rumah disamakan dengan x kunci (-14).
//   x, z   : posisi tengah rumah.   skala : ukuran rumah.   (pintu ada di 2.51 * skala di depan tengah rumah)
const KOPDES = { x: -14, z: 152, skala: 2.8 };
// Dasar rumah diturunkan ke titik tanah TERENDAH di bawah alasnya supaya tidak ada celah melayang
// di sisi yang tanahnya lebih rendah (tanah bergelombang sekitar 0.6).
var DASAR_KOPDES = (function () {
    var rendah = Infinity;
    for (var dx = -14.7; dx <= 14.7; dx += 1.05) {
        for (var dz = -13.4; dz <= 13.4; dz += 1.05) {
            rendah = Math.min(rendah, tinggiTanah(KOPDES.x + dx, KOPDES.z + dz));
        }
    }
    return rendah - 0.05;
})();
// Titik pintu di dunia (setelah diputar 180 derajat): tepat di tengah-depan rumah
const PINTU = {
    x: KOPDES.x,
    z: KOPDES.z - 2.51 * KOPDES.skala,       // bidang pintu (z = 144.97)
    tinggi: 1.55 * KOPDES.skala,             // tengah pintu di atas dasar rumah (pintu kayu di y = 1.55 lokal)
};
const DEPAN_TANGGA = KOPDES.z - 4.8 * KOPDES.skala;   // ujung tangga depan (z = 138.56)
// Titik akhir di depan rumah (sudah ditulis langsung sebagai angka di ADEGAN):
//   red    [-12.2, 0, 137.06]   rock [-15.8, 0, 137.06]   : sejajar di depan tangga, kiri-kanan pintu
//   winged [-9, 3.5, 135.56]                               : melayang di sisi kanan supaya tidak menutupi pintu & kunci
//          (lalu di penutup naik ke [-14, 10, 133.06] dan mengelilingi titik tengah Red & Rock [-14, 137.06] dengan sumbu miring)
//   kunci  [-14, 4.1, 144.07]                              : setinggi tengah pintu, 0.9 di depan daun pintu
// Kalau KOPDES dipindah, titik-titik ini perlu disesuaikan juga.

// Winged menunggu di belakang peti (peti di z = 15, engselnya di sisi belakang z = 13.95).
// Tutup peti yang terbuka berdiri tegak di sisi belakang sampai z = 13.2, jadi z winged harus cukup kecil
// supaya badannya (radius sekitar 1.2) tidak tertabrak tutup. Makin kecil = makin jauh dari peti.
const JARAK_WINGED_Z = 10;

// =====================================================================================
// ORBIT RED SAAT MELOMPAT DI DEPAN KOPDES (ROTASI SUMBU BEBAS / ARBITRARY AXIS)
// =====================================================================================
// Red melompat sambil memutari sebuah garis yang DIMIRINGKAN (sumbunya tidak sejajar X/Y/Z), memakai
// T(pusat) x R(sumbu, sudut) x T(-pusat) (LIBS.rotasiSumbu, rumus Rodrigues) lewat opsi orbit di shared/timeline.js.
// Supaya Red tidak tenggelam ke tanah karena sumbunya miring, sumbu dicondongkan ke arah jari-jari awal dan
// pusat dinaikkan setinggi jari-jari x tan(miring). Hasilnya titik TERENDAH lintasan = titik awal Red (di tanah),
// lalu naik pelan sampai sekitar 2 x jari-jari x tan(miring) di sisi seberang. Red menghadap ke dalam lingkaran
// dan ikut condong seperti membelok. Lintasan sengaja digeser ke sisi kanan-depan (menjauhi Rock di x = -15.8 dan
// tangga rumah di z = 138.56). Kalau titik akhir Red berubah, awal & pusat di bawah ini ikut disesuaikan.
const ORBIT_RED = (function () {
    var awal = [-12.2, 137.06];      // posisi Red di depan tangga (akhir langkah jalan)
    var pusat = [-10.5, 134.6];      // titik yang dilewati sumbu, [x, z]
    var miring = 12 * Math.PI / 180; // condong sumbu dari tegak (12 derajat)
    var rx = awal[0] - pusat[0], rz = awal[1] - pusat[1];
    var r = Math.hypot(rx, rz);      // jari-jari lintasan (sekitar 3)
    return {
        // y pusat = jari-jari x tan(miring), dikoreksi selisih tinggi tanah antara titik awal dan pusat
        pusat: [pusat[0], r * Math.tan(miring) + tinggiTanah(awal[0], awal[1]) - tinggiTanah(pusat[0], pusat[1]), pusat[1]],
        sumbu: [Math.sin(miring) * rx / r, Math.cos(miring), Math.sin(miring) * rz / r],
        putaran: 720,                // 2 putaran penuh selama 12 detik (kelipatan 360 supaya kembali ke titik awal)
    };
})();

const ADEGAN = {
    red: {
        posisi: [5, 0, 2], skala: 0.75, arahAwal: 0, ulang: false,
        urutan: [
            { animasi: "jalan",     durasi: 10, ke: [42, 0, 3] },
            // durasi 13 = 8 detik tutup mata + 5 detik (dulu dipakai Red memutari pohon) supaya jadwal adegan lain tidak bergeser
            { animasi: "tutupMata", durasi: 13, hadap: 90 },
            { animasi: ["normal" , "melambai"],    durasi: 4 , hadap : -90 },
            { animasi: "jalan",     durasi: 3, ke: [-11, 0, 14] }, 
            { animasi: "melambai",    durasi: 3 },    
            { animasi: "normal",    durasi: 10 },
            { animasi: "normal", durasi: 13 },
            { animasi: ["normal", "kaget"],    durasi: 3, miring : -30,},
            { animasi: "normal",    durasi: 2, miring : 0,},
            { animasi: "normal",    durasi: 1},
            { animasi: "normal",    durasi: 1.6, hadap :0},
            { animasi: ["normal", "kaget"],    durasi: 0.1, ke: [-11, 1, 14]},
            { animasi: "normal",    durasi: 0.1, ke: [-11, 0, 14]},
            { animasi: "normal",    durasi: 2},
            { animasi: "jalan",    durasi: 40, ke: [-12.2, 0, 137.06] },
            // penutup: berbalik, lalu melompat-lompat sambil melambai
            { animasi: "normal",   durasi: 1, hadap: 180 },
            // ARBITRARY AXIS: sambil melompat & melambai, Red mengorbit sumbu miring (lihat ORBIT_RED di atas)
            { animasi: ["normal", "melambai"], durasi: 14, hadap: 180, lompat: { tinggi: 1.2, kali: 16 }, orbit: ORBIT_RED },
            { animasi: ["normal", "melambai"], durasi: 3, hadap: 180 },
        ],
    },
    winged: {
        posisi: [-5, 4, 5], skala: 1, arahAwal: 0, ulang: false,
        urutan: [
            { animasi: "terbang",                durasi: 10, ke: [35, 3, 0] },
            { animasi: "normal",                 durasi: 3 },
            { animasi: "terbang",                durasi: 5, ke: [-28, 4, -15] },   // terbang ke belakang-kanan
            { animasi: ["terbang", "melambai"],  durasi: 2, hadap: 0 },
            { animasi: "terbang",                durasi: 3, ke: [-15, 4, 12] }, 
            { animasi: ["normal", "melambai"],  durasi: 15, hadap: 0 , miring : 60},
            { animasi: ["normal", "angkat"],  durasi: 3, hadap: 0 , miring : 60, ke: [-14,-1,15], menuju: true },
            { animasi: ["normal", "angkat"],  durasi: 2, hadap: 0 , miring : 60},
            { animasi: ["normal", "angkat","mataBergantian"],  durasi: 1, hadap: 0 , miring : 60, ke: [-14,0,15]},
            { animasi: ["normal", "angkat"],  durasi: 2, hadap: 0 , miring : 60, ke: [-14,-1,15]},
            { animasi: ["normal", "angkat"],  durasi: 2, hadap: 0 , miring : 60},
            { animasi: ["normal", "angkat","mataBergantian"],  durasi: 3, hadap: 0 , miring : 60, ke: [-14,3,15]},
            { animasi: ["normal", "melambai"],  durasi: 2, hadap: 0 , miring : 30, ke: [-14,1,JARAK_WINGED_Z]},
            { animasi: ["normal", "melambai"],  durasi: 3, hadap: 0 , miring : 30},
            { animasi: ["normal", "kaget"],  durasi: 3, hadap: 0 , miring : -30, ke: [-14,1,JARAK_WINGED_Z]},
            { animasi: "normal",    durasi: 2, miring : 0,},
            { animasi: ["normal", "melambai"],  durasi: 1, ke: [-14,3,JARAK_WINGED_Z]},
            { animasi: "normal",                 durasi: 2.2 },
            { animasi: "terbang",                durasi: 40, ke: [-9, 3.5, 135.56] },
            { animasi: "terbang",                durasi: 1.6 },
            { animasi: "terbang",                durasi: 1, ke: [-14, 10, 133.06] },
            { animasi: ["terbang", "melambai", "mataBergantian"], durasi: 14, guling: -20,orbit: { pusat: [-14, 137.06], putaran: 1440, miring: 25 } },
            { animasi: ["terbang", "melambai"],  durasi: 3, hadap: 180 },

        ],
    },
    rock: {
        posisi: [0, 0, 1.5], skala: 1.5, arahAwal: 0, ulang: false,
        urutan: [
            { animasi: "jalan",    durasi: 10, ke: [35, 0, 4] },
            { animasi: "normal",   durasi: 3 },
            // titik jatuh digeser ke x = -17 (sebelumnya -15 = tepat di tepi chest di x = -14, lebar 2.1),
            // supaya saat bangkit & berdiri menghadap chest, kaki/badan Rock tidak menembus peti
            { animasi: "jalan",    durasi: 3, ke: [-17, 0, 15] },
            // menangis saat berbaring: badan melebar lalu kembali, 3 kali (atur: kali, periode, mulai, lebar)
            { animasi: ["normal", "tangis"], durasi: 15, miring : 90, kali: 3, periode: 1.2, mulai: 1, lebar: 0.22 },
            { animasi: "normal",   durasi: 2, miring : 0 , hadap : 90 },
            { animasi: "jalan",   durasi: 3, miring : 0, hadap : 90, ke: [-18,0,15]},
            // ROTASI SUMBU BEBAS: Rock berputar 1 kali mengelilingi garis miring (detik ke-38 sampai 46, lihat Putar.js).
            // Durasi langkah tetap 19 detik supaya jadwal adegan lain tidak bergeser.
            { animasi: ["normal", "putar"], durasi: 19, mulai: 2, periode: 8, kali: 1 },
            // kaget: pupil membesar mengikuti kunci yang muncul dari peti (detik ke-55 sampai ke-56),
            // tetap besar sampai kunci mulai maju (detik ke-59), lalu kembali ke ukuran normal. Ukuran bisa diubah lewat pupil: 1.35
            { animasi: ["normal", "kaget"], durasi: 1 },
            { animasi: ["normal", "kaget"], durasi: 3, miring : -30, tahan: true},
            { animasi: "normal",    durasi: 2, miring : 0,},
            { animasi: "normal",    durasi: 1},
            { animasi: "normal",    durasi: 1.6, hadap :0},
            { animasi: "normal",    durasi: 0.1, ke: [-18,1,15]},
            { animasi: "normal",    durasi: 0.1, ke: [-18,0,15]},
            { animasi: "normal",    durasi: 2},
            { animasi: "jalan",    durasi: 40, ke: [-15.8, 0, 137.06] },
            // penutup: berbalik, lalu melompat-lompat sambil melambai (sedikit lebih lambat dari Red supaya tidak seragam)
            { animasi: "normal",   durasi: 1, hadap: 180 },
            { animasi: ["normal", "melambai","putar"], durasi: 14,periode: 8, hadap: 180, lompat: { tinggi: 1, kali: 14 } },
            { animasi: ["normal", "melambai"], durasi: 3, hadap: 180 },

        ],
    },
    chest: {
        posisi: [-14, -1.5, 15], skala: 1.5, ulang: false,
        urutan: [
            { animasi: "tertutup", durasi : 43 },
            { animasi: "tertutup", ke: [-14, -0.5, 15], durasi : 1 },
            { animasi: "tertutup", ke: [-14, -1.5, 15], durasi : 2 },
            { animasi: "tertutup", ke: [-14, -1.5, 15], durasi : 2 },
            { animasi: "tertutup", ke: [-14, 2, 15], durasi : 3 },
            { animasi: "tertutup", ke: [-14, 0, 15], durasi : 0.5 },
            // tutup peti terbuka dulu (detik 53 - 55), baru kunci keluar (detik 55 - 56, lihat "kunci")
            { animasi: "tertutup", durasi : 1.5 },
            { animasi: "buka",     durasi : 2 },
            { animasi: "terbuka",  durasi : 6 },    // tetap terbuka sampai kunci menjauh (detik 55 - 61)
            { animasi: "tutup",    durasi : 1.5 },  // lalu menutup lagi supaya winged yang terbang lewat nanti tidak menabrak tutup
        ],
    },
    kunci: {
        posisi: [-14, -2.5, 15], skala: 1, ulang: false,
        urutan: [
            { animasi: "diam",     durasi: 55 },
            { animasi: "diam", durasi: 1, ke: [-14, 4, 15] },
            { animasi: "diam", durasi: 3},
            { animasi: "diam", durasi: 1, ke: [-14, 2.4, 17] },
            { animasi: "diam", durasi: 1, miring : -90},
            { animasi: "diam", durasi: 40, miring : -90, ke: [-14, 4.1, 144.07] },
        ],
    },
};

// Matriks rumah: diletakkan di KOPDES, diputar 180 derajat (pintu menghadap -z).
function matriksKopdes(root) {
    var m = place(root, KOPDES.x, DASAR_KOPDES, KOPDES.z, KOPDES.skala);
    var putar = LIBS.get_I4();
    LIBS.rotateY(putar, Math.PI);
    var hasil = LIBS.get_I4();
    LIBS.multiply(hasil, m, putar);
    return hasil;
}

// Pasang urutan ke karakter. y posisi otomatis ditambah tinggi pasir & tinggi kaki karakter.
function pasangAdegan(karakter, Kelas, atur) {
    karakter.mainkanUrutan(atur.urutan, {
        posisiAwal: atur.posisi,
        skala: atur.skala,
        arahAwal: atur.arahAwal,
        ulang: atur.ulang,
        tanah: function (x, z) { return tinggiTanah(x, z) + Kelas.TINGGI_KAKI * atur.skala; },
    });
}

function main() {
    // Kamera bebas: WASD gerak, Space/Q naik, Ctrl/E turun, Shift cepat, drag mouse untuk melihat sekeliling.
    // Ganti kamera: "bebas" jadi dihapus kalau mau kembali ke kamera putar.
    var scene = createScene(document.getElementById("mycanvas"), {
        kamera: "bebas",
        posisiAwal: [0, 0, 20],   // posisi awal kamera [x, y, z]
        arahAwal: 0,              // arah hadap awal (derajat). 0 = melihat ke depan (ke arah -z)
        kecepatan: 8,             // satuan per detik (tahan Shift = 3x lebih cepat)
        kunciMouse: false,        // true = klik canvas lalu mouse langsung jadi arah pandang (Esc untuk lepas)
        tinggiMin: function (x, z) { return tinggiTanah(x, z) + 1; },   // kamera tidak bisa menembus tanah
    });
    if (!scene) return;

    var environment = new Environment(scene.GL);
    var wingedPikmin = new WingedPikmin(scene.GL);
    var redPikmin = new RedPikmin(scene.GL);
    var rockPikmin = new RockPikmin(scene.GL);

    pasangAdegan(redPikmin, RedPikmin, ADEGAN.red);
    pasangAdegan(wingedPikmin, WingedPikmin, ADEGAN.winged);
    pasangAdegan(rockPikmin, RockPikmin, ADEGAN.rock);

    var sun = new Sun(scene.GL); 
    var chest = new Chest(scene.GL);
    var kunci = new SkeletonKey(scene.GL);
    var kopdes = new Kopdes(scene.GL);

    pasangAdegan(chest, Chest, ADEGAN.chest);
    pasangAdegan(kunci, SkeletonKey, ADEGAN.kunci);

    // Pohon tersebar acak (tetap sama tiap dibuka). Atur jumlah, seed, area, dan area kosong di sini.
    var hutan = new Hutan(scene.GL, {
        jumlah: 300,
        seed: 10,          // ganti angka untuk susunan pohon yang berbeda
        jenis: ["cemara"],
        skalaMin: 10,    
        skalaMax: 20,    
        jarakMin: 10,   
        celah: 0.2,         
        tepi: 1200,
    });

    // Rumput: helai pipih mengikuti kurva Bezier, dikelompokkan per rumpun.
    // Dibuat 2 lapis: lapis RAPAT hanya di area tempat adegan berlangsung (x -60..60, z -30..175), dan lapis JARANG
    // yang tipis untuk mengisi sisa tanah yang luas. Sebelumnya 50.000 helai disebar di tanah 1000 x 1000
    // sehingga hanya tampak jarum-jarum terpisah. Rumah tidak ditembus rumput berkat kotak "kosong".
    var kosongRumah = [{
        xMin: KOPDES.x - 17, xMax: KOPDES.x + 17,
        zMin: DEPAN_TANGGA - 4, zMax: KOPDES.z + 16,
    }];
    var rumput = new Rumput(scene.GL, {
        jumlah: 4500,
        helaiPerRumpun: 9,
        seed: 3,
        area: { xMin: -60, xMax: 60, zMin: -30, zMax: 175 },
        kosong: kosongRumah,
        tinggiMin: 1,
        tinggiMax: 1.8,
        condong: 0.5,
    });
    var rumputJauh = new Rumput(scene.GL, {
        jumlah: 2500,
        helaiPerRumpun: 7,
        seed: 11,
        area: { xMin: -300, xMax: 300, zMin: -300, zMax: 300 },
        kosong: kosongRumah.concat([{ xMin: -60, xMax: 60, zMin: -30, zMax: 175 }]),   // area rapat sudah terisi lapis pertama
        tinggiMin: 1,
        tinggiMax: 1.8,
        condong: 0.5,
        lebarRumpun: 1.0,
    });

    scene.run(function (shaderVars, root, time) {
        sun.render(shaderVars, root, time);        
        environment.render(shaderVars, root);  
        hutan.render(shaderVars, root);
        rumput.render(shaderVars, root);
        rumputJauh.render(shaderVars, root);

        // Item environment: place(root, x, y, z, skala), y = tinggiTanah(x, z) supaya menempel di pasir
        kopdes.render(shaderVars, matriksKopdes(root));

        // Chest & kunci: posisi & gerakan diatur oleh ADEGAN di atas
        chest.render(shaderVars, root);
        kunci.render(shaderVars, root);

        // Pikmin: posisi & gerakan diatur oleh ADEGAN di atas
        wingedPikmin.render(shaderVars, root, time);
        redPikmin.render(shaderVars, root, time);
        rockPikmin.render(shaderVars, root, time);
    });
}

window.addEventListener("load", main);