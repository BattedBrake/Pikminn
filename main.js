import { createScene, place } from "./shared/renderer.js";
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
// PENGATURAN ADEGAN: posisi awal, ukuran, dan urutan gerakan tiap pikmin
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
//   red    : normal, jalan, tutupMata, melambai            (characters/redPikmin/RedPikmin.js)
//   winged : normal, terbang, melambai, mengangguk         (characters/wingedPikmin/WingedPikmin.js)
//   rock   : normal, jalan, melambai                       (characters/rockPikmin/RockPikmin.js)
//
// Kalau ulang = true, posisi kembali ke awal saat urutan diulang: buat langkah terakhir kembali ke posisi awal.
// Sumbu: x = kiri(-)/kanan(+), z = jauh(-)/dekat kamera(+).
const ADEGAN = {
    red: {
        posisi: [5, 0, 2], skala: 0.75, arahAwal: 0, ulang: false,
        urutan: [
            { animasi: "jalan",     durasi: 10, ke: [42, 0, 3] },
            { animasi: "tutupMata", durasi: 8, hadap: 90 },
            { animasi: "normal",    durasi: 5 },
            { animasi: ["normal" , "melambai"],    durasi: 4 , hadap : -90 },
            { animasi: "jalan",     durasi: 3, ke: [-11, 0, 14] }, 
            { animasi: "melambai",    durasi: 3 },    
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
            { animasi: ["normal", "melambai"],  durasi: 10, hadap: 0 , miring : 60},
    
    
        ],
    },
    rock: {
        posisi: [0, 0, 1.5], skala: 1.5, arahAwal: 0, ulang: false,
        urutan: [
            { animasi: "jalan",    durasi: 10, ke: [35, 0, 4] },
            { animasi: "normal",   durasi: 3 },
            { animasi: "jalan",    durasi: 3, ke: [-15, 0, 15] },
            { animasi: "normal",   durasi: 15, miring : 90 },
            { animasi: "normal",   durasi: 2, miring : 0 , hadap : 90 },
            { animasi: "jalan",   durasi: 3, miring : 0, hadap : 90, ke: [-20,0,15]},
        ],
    },
};

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

    // Petunjuk tombol + koordinat kamera (berguna untuk mengisi posisi/ke di ADEGAN)
    var petunjuk = document.querySelector("#petunjuk span");

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

    // Rumput: helai dari tabung Bezier (seperti tangkai pikmin), dikelompokkan per rumpun
    var rumput = new Rumput(scene.GL, {
        jumlah: 5000,             // banyak rumpun
        helaiPerRumpun: 10,        // helai per rumpun
        seed: 3,                  // ganti angka untuk susunan yang berbeda
        area: { xMin: -1000, xMax: 1000, zMin: -1000, zMax: 1000 },   // kotak sebaran rumput
        tinggiMin: 1,           // panjang helai terpendek
        tinggiMax: 1.8,           // panjang helai terpanjang
        condong: 0.5,    
       
        // warnaBawah: [0.13, 0.35, 0.08], warnaAtas: [0.55, 0.85, 0.25],   // warna pangkal & ujung helai
    });


    scene.run(function (shaderVars, root, time) {
        sun.render(shaderVars, root, time);        
        environment.render(shaderVars, root);  
        hutan.render(shaderVars, root);
        rumput.render(shaderVars, root);

        // Item environment: place(root, x, y, z, skala), y = tinggiTanah(x, z) supaya menempel di pasir
        kopdes.render(shaderVars, place(root, 50, tinggiTanah(0, -14), -300, 2.8));
        chest.render(shaderVars, place(root, -7, tinggiTanah(-7, 1), 1, 2.5));
        kunci.render(shaderVars, place(root, 7, tinggiTanah(7, 1), 1, 2.5));

        // Pikmin: posisi & gerakan diatur oleh ADEGAN di atas
        wingedPikmin.render(shaderVars, root, time);
        redPikmin.render(shaderVars, root, time);
        rockPikmin.render(shaderVars, root, time);

        if (petunjuk) {
            var p = scene.posisiKamera();
            petunjuk.textContent ="kamera: [" + p[0].toFixed(1) + ", " + p[1].toFixed(1) + ", " + p[2].toFixed(1) + "]";
        }
    });
}

window.addEventListener("load", main);
