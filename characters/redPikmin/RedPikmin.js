// RedPikmin.js
// Menyusun karakter Red Pikmin sebagai hierarki objek (parent -> child).
//
//   badan (root)                                      -> bodyParts/HeadAndBody.js
//    |-- kepala --- hidung, mata (-> pupil)            -> bodyParts/HeadAndBody.js
//    |       |---- tangkai (gradasi merah-hijau), daun -> bodyParts/Antenna.js
//    |-- lengan kiri & kanan, kaki kiri & kanan        -> bodyParts/Limbs.js
//
// Gerakan ada di folder animation/. Animasi hanya mengisi angka di this.pose,
// lalu terapkanPose() mengubah angka itu menjadi matriks sendi.
//
// Interface wajib setiap karakter (supaya bisa digabung di index.html terluar):
//   constructor(GL)
//   render(shaderVars, parentMatrix, time)
//
// Pilih gerakan: new RedPikmin(GL, "jalan") atau redPikmin.setPose("tutupMata")
// Putar urutan:  redPikmin.mainkanUrutan(urutan, opsi)   (lihat shared/timeline.js)
import { LIBS } from "../../shared/libs.js";
import { Timeline } from "../../shared/timeline.js";
import { HeadAndBody } from "./bodyParts/HeadAndBody.js";
import { Antenna } from "./bodyParts/Antenna.js";
import { Limbs } from "./bodyParts/Limbs.js";
import { PI, JUMLAH_RUAS, PANJANG_RUAS, SUDUT_AWAL, SUDUT_AKHIR, PANJANG_PAHA, PANJANG_BETIS, RUAS_SIKU } from "./config.js";

import { poseBerdiri } from "./animation/Berdiri.js";
import { jalan } from "./animation/Jalan.js";
import { tutupMata } from "./animation/TutupMata.js";
import { melambai } from "./animation/Melambai.js";
import { goyangTangkai } from "./animation/GoyangTangkai.js";

// Daftar animasi: dipakai setPose(nama) dan urutan.
// Animasi baru: buat file di animation/, lalu daftarkan namanya di sini.
export const DAFTAR_ANIMASI = {
    normal: poseBerdiri,
    jalan: jalan,
    tutupMata: tutupMata,
    melambai: melambai,
};

// Pose dasar. Semua sudut dalam radian.
//   badan.miring = goyang kiri-kanan, badan.toleh = menoleh, badan.naik = naik-turun
//   lengan.kiri/kanan: bahuZ = membuka ke samping (positif = ke luar), bahuX = ayun depan-belakang
//                      (negatif = ke depan), siku = tekukan siku
//   kaki.kiri/kanan:   pinggul = ayun di pinggul, lutut = tekukan lutut (telapak otomatis tetap datar)
function poseKosong() {
    var pose = {
        badan: { miring: 0, toleh: 0, naik: 0 },
        lengan: { kiri: { bahuZ: 0, bahuX: 0, siku: 0 }, kanan: { bahuZ: 0, bahuX: 0, siku: 0 } },
        kaki: { kiri: { pinggul: 0, lutut: 0 }, kanan: { pinggul: 0, lutut: 0 } },
    };
    poseBerdiri({ pose: pose });
    return pose;
}

export class RedPikmin {
    // Jarak dari pusat badan ke telapak kaki (dipakai supaya kaki pas menginjak tanah)
    static TINGGI_KAKI = 2.2;

    constructor(GL, namaPose = "jalan") {
        var headAndBody = new HeadAndBody(GL);
        this.badan = headAndBody.badan;
        this.kepala = headAndBody.kepala;

        this.antenna = new Antenna(GL, this.kepala);

        var limbs = new Limbs(GL, this.badan);
        this.lengan = limbs.lengan;
        this.kaki = limbs.kaki;

        this.pose = poseKosong();
        this.timeline = null;
        this.setPose(namaPose);
    }

    // Gerakan terus-menerus tanpa urutan. nama = salah satu isi DAFTAR_ANIMASI. Menghentikan urutan.
    setPose(nama) {
        if (!DAFTAR_ANIMASI[nama]) {
            console.warn("Pose tidak dikenal: " + nama);
            return;
        }
        this.timeline = null;
        this.namaPose = nama;
    }

    // Putar urutan animasi
    mainkanUrutan(urutan, opsi = {}) {
        this.timeline = new Timeline(DAFTAR_ANIMASI, urutan, Object.assign({ poseDasar: poseKosong() }, opsi));
        this.namaPose = "urutan";
    }

    // Ubah angka di this.pose menjadi matriks sendi
    terapkanPose() {
        var p = this.pose;

        var m = this.badan.MOVE_MATRIX;
        LIBS.set_I4(m);
        LIBS.rotateZ(m, p.badan.miring);
        LIBS.rotateY(m, p.badan.toleh);
        LIBS.set_position(m, 0, p.badan.naik, 0);

        this.lengan.forEach(function (l) {
            var q = p.lengan[l.sx < 0 ? "kiri" : "kanan"];
            var bahu = l.ruas[0].MOVE_MATRIX;
            LIBS.set_I4(bahu);
            LIBS.rotateZ(bahu, l.sx * q.bahuZ);
            LIBS.rotateX(bahu, q.bahuX);
            LIBS.set_position(bahu, l.sx * 0.55, 0.8, 0);

            // Siku: tekukan dibagi rata ke beberapa ruas di tengah lengan supaya sikunya membulat
            RUAS_SIKU.forEach(function (i) {
                var r = l.ruas[i].MOVE_MATRIX;
                LIBS.set_I4(r);
                LIBS.translateY(r, -PANJANG_RUAS);
                LIBS.rotateZ(r, l.sx * (SUDUT_AKHIR - SUDUT_AWAL) / JUMLAH_RUAS * PI / 180);
                LIBS.rotateX(r, -q.siku / RUAS_SIKU.length);
            });
        });

        this.kaki.forEach(function (k) {
            var q = p.kaki[k.sx < 0 ? "kiri" : "kanan"];

            var pinggul = k.paha.MOVE_MATRIX;
            LIBS.set_I4(pinggul);
            LIBS.rotateX(pinggul, q.pinggul);
            LIBS.set_position(pinggul, k.sx * 0.34, -0.9, 0);

            var lutut = k.betis.MOVE_MATRIX;
            LIBS.set_I4(lutut);
            LIBS.rotateX(lutut, q.lutut);
            LIBS.set_position(lutut, 0, -PANJANG_PAHA, 0);

            // Telapak diputar balik sebesar (ayun + tekuk) supaya tetap datar
            var pergelangan = k.telapak.MOVE_MATRIX;
            LIBS.set_I4(pergelangan);
            LIBS.rotateX(pergelangan, -(q.pinggul + q.lutut));
            LIBS.set_position(pergelangan, 0, -PANJANG_BETIS, 0);
        });
    }

    render(shaderVars, parentMatrix, time) {
        if (this.timeline) {
            // Urutan: timeline mengisi this.pose dan menggeser/menghadapkan karakter
            parentMatrix = this.timeline.terapkan(this, parentMatrix);
        } else {
            // Tanpa urutan: animasi pilihan setPose berjalan terus
            this.pose = poseKosong();
            DAFTAR_ANIMASI[this.namaPose](this, 1, performance.now() / 1000, {});
        }
        this.terapkanPose();

        // Tangkai selalu bergoyang, terpisah dari urutan
        goyangTangkai(this, time);

        var GL = this.badan.GL;
        GL.uniform1f(shaderVars.uIsRough, 0.0);
        GL.uniform1f(shaderVars.uUseVertexColor, 1.0);   // Red Pikmin memakai warna per-vertex (gradasi tangkai)
        this.badan.render(shaderVars, parentMatrix);
        GL.uniform1f(shaderVars.uUseVertexColor, 0.0);
    }
}
