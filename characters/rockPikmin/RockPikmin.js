// RockPikmin.js
// Rock Pikmin (Pikmin 3): badan batu bersegi, tangkai kurva Bezier + daun, lengan tube melengkung, kaki cone + cylinder.
//
// HIERARKI TRANSFORMASI (parent -> child), setiap anak:  M_anak = M_induk x T(pivot) x R(sudut)
//   BADAN (akar) = parent x T(0, tinggi, 0)        telapak kaki tepat di y = 0
//    |-- MATA, PUPIL                               -> bodyParts/Body.js
//    |-- TANGKAI, DAUN                             -> bodyParts/Antenna.js
//    +-- LENGAN, TANGAN, KAKI, PERGELANGAN         -> bodyParts/Limbs.js
//
// Gerakan ada di folder animation/. Animasi hanya mengisi angka di this.pose.
//
// Pilih gerakan: new RockPikmin(GL, "jalan") atau rockPikmin.setPose("normal")
// Putar urutan:  rockPikmin.mainkanUrutan(urutan, opsi)   (lihat shared/timeline.js)
//
// Interface wajib setiap karakter (supaya bisa digabung di index.html terluar):
//   constructor(GL)
//   render(shaderVars, parentMatrix, time)
import { Body } from "./bodyParts/Body.js";
import { Antenna } from "./bodyParts/Antenna.js";
import { Limbs } from "./bodyParts/Limbs.js";
import { T, mul } from "./matrix.js";
import { resetMaterial } from "../../shared/renderer.js";
import { Timeline } from "../../shared/timeline.js";
import { L_LEG, FOOT_H, HIP_Y, SPLAY } from "./config.js";

import { goyangTangkai, poseIdle } from "./animation/Idle.js";
import { jalan } from "./animation/Jalan.js";
import { melambai } from "./animation/Melambai.js";

// Daftar animasi: dipakai setPose(nama) dan urutan.
// Animasi baru: buat file di animation/, lalu daftarkan namanya di sini.
export const DAFTAR_ANIMASI = {
    normal: poseIdle,
    jalan: jalan,
    melambai: melambai,
};

// Pose dasar (radian): lengan.buka = membuka ke samping, lengan.ayun = ayun depan-belakang,
// kaki.ayun = ayun di pinggul (telapak otomatis tetap datar)
function poseKosong() {
    var pose = { lengan: { buka: 0, ayun: 0 }, kaki: { ayun: 0 } };
    poseIdle({ pose: pose });
    return pose;
}

export class RockPikmin {
    // Jarak dari titik asal model ke telapak kaki (telapak Rock tepat di y = 0)
    static TINGGI_KAKI = 0;

    constructor(GL, namaPose = "normal") {
        this.gl = GL;
        this.body = new Body(GL);
        this.antenna = new Antenna(GL, this.body.top);
        this.limbs = new Limbs(GL);

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

    render(shaderVars, parentMatrix, time) {
        const GL = this.gl;
        // time dari renderer naik sekitar 3 per detik; versi asli memakai detik, jadi dibagi 3
        var t = time / 3;
        var goyang = goyangTangkai(t);

        if (this.timeline) {
            // Urutan: timeline mengisi this.pose dan menggeser/menghadapkan karakter
            parentMatrix = this.timeline.terapkan(this, parentMatrix);
        } else {
            // Tanpa urutan: animasi pilihan setPose berjalan terus
            this.pose = poseKosong();
            DAFTAR_ANIMASI[this.namaPose](this, 1, performance.now() / 1000, {});
        }

        // tinggi pusat badan supaya telapak kaki tepat di y = 0
        var bodyY = -HIP_Y + L_LEG * Math.cos(SPLAY) * Math.cos(this.pose.kaki.ayun) + FOOT_H;
        var bodyF = mul(parentMatrix, T(0, bodyY, 0));                       // BADAN = parent x T(tinggi)

        GL.uniform1f(shaderVars.uIsRough, 0.0);
        GL.uniform1f(shaderVars.uUseVertexColor, 1.0);   // Rock Pikmin memakai warna per-vertex (segi batu, daun)
        this.body.render(shaderVars, bodyF);
        this.antenna.render(shaderVars, bodyF, goyang.sway, goyang.swayZ);
        this.limbs.render(shaderVars, bodyF, this.pose);
        GL.uniform1f(shaderVars.uUseVertexColor, 0.0);
        resetMaterial(GL, shaderVars);   // supaya objek berikutnya tidak ikut memakai material Rock
    }
}
