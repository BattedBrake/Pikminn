// kopdes.js
// Model bangunan KOPDES (Koperasi Desa): pondasi, dinding, teras bertiang, atap limasan,
// papan nama, pintu, jendela, foto di dinding teras, dan bendera merah putih.
// Alas pondasi di y = 0. Lebar sekitar 10.5, dalam 8.5, tinggi sampai bubungan sekitar 6.
//
// Catatan: versi Three.js memakai tekstur gambar (canvas) untuk papan nama, foto, dan bendera.
// Shader proyek ini belum mendukung tekstur, jadi bagian itu dibuat dari bentuk berwarna polos.
//
//   var kopdes = new Kopdes(GL);
//   kopdes.render(shaderVars, parentMatrix);
import * as B from "../shared/buildersEnv.js";
import { EnvModel, T, S, RX, mul } from "./EnvModel.js";

const DINDING = B.hex(0xF5F5F5);
const HIJAU = B.hex(0x2E7D32);
const KAYU = B.hex(0x5D4037);
const GENTENG = B.hex(0xB71C1C);
const BETON = B.hex(0x9E9E9E);
const KACA = B.hex(0x81D4FA);
const EMAS = B.hex(0xFFB300);
const TIANG_BENDERA = B.hex(0xCCCCCC);
const MERAH = B.hex(0xD32F2F);
const PUTIH = B.hex(0xFFFFFF);
const HIJAU_PAPAN = B.hex(0x1E5E20);
const KUNING = B.hex(0xFBC02D);
const ABU_TEKS = B.hex(0x333333);
const HITAM = B.hex(0x111111);
const KULIT = B.hex(0xE0AC69);

export class Kopdes {
    constructor(GL) {
        var m = this.model = new EnvModel(GL);

        // 1. Pondasi & tangga depan
        m.addPart(B.box(10.5, 0.4, 8.5), BETON, T(0, 0.2, 0));
        m.addPart(B.box(3.5, 0.2, 1.2), BETON, T(0, 0.1, 4.2));

        // 2. Dinding utama
        m.addPart(B.box(9, 3.2, 6), DINDING, T(0, 2, -0.5));

        // 3. Tiang teras (satu mesh dipakai 4 kali)
        var tiang = B.cylinder(0.18, 0.18, 3, 16);
        [-3.8, -1.3, 1.3, 3.8].forEach(function (x) {
            m.addPart(tiang, HIJAU, T(x, 1.9, 2.2));
        });

        // 4. Atap teras depan
        m.addPart(B.box(9.6, 0.25, 2.8), HIJAU, T(0, 3.5, 1.6));

        // 5. Atap utama limasan
        m.addPart(B.limasanRoof(10.2, 7.2, 2.4, 5.0), GENTENG, T(0, 3.6, -0.5));

        // 6. Papan nama di atas teras (pengganti tekstur: papan, logo, dan garis teks)
        m.addGroup("papan", T(0, 4.2, 2.85));
        m.addPart(B.box(4.2, 1.05, 0.04), HIJAU_PAPAN, T(0, 0, 0), "papan");               // bingkai hijau
        m.addPart(B.box(4.0, 0.85, 0.04), PUTIH, T(0, 0, 0.005), "papan");                  // isi putih
        m.addPart(B.cylinder(0.31, 0.31, 0.02, 32), HIJAU_PAPAN, mul(T(-1.6, 0, 0.03), RX(Math.PI / 2)), "papan");   // logo luar
        m.addPart(B.cylinder(0.18, 0.18, 0.02, 32), KUNING, mul(T(-1.6, 0, 0.04), RX(Math.PI / 2)), "papan");        // logo dalam
        m.addPart(B.box(2.45, 0.2, 0.02), HIJAU_PAPAN, T(0.11, 0.2, 0.03), "papan");        // "KOPERASI DESA"
        m.addPart(B.box(2.35, 0.15, 0.02), ABU_TEKS, T(0.06, -0.16, 0.03), "papan");        // "KOPDES MEKAR JAYA"

        // 7. Pintu kayu
        m.addPart(B.box(1.7, 2.3, 0.1), KAYU, T(0, 1.55, 2.51));

        // 8. Jendela kaca kiri & kanan
        var jendela = B.box(1.4, 1.4, 0.08);
        [-2.6, 2.6].forEach(function (x) {
            m.addPart(jendela, KACA, T(x, 1.9, 2.51));
        });

        // 9. Foto di dinding teras samping pintu (pengganti tekstur: latar merah putih + siluet sederhana)
        m.addGroup("foto", T(1.4, 2.1, 2.5));
        m.addPart(B.box(0.66, 0.81, 0.03), EMAS, T(0, 0, 0.005), "foto");                   // bingkai
        m.addPart(B.plane(0.6, 0.375), MERAH, T(0, 0.1875, 0.025), "foto");                 // latar atas
        m.addPart(B.plane(0.6, 0.375), PUTIH, T(0, -0.1875, 0.025), "foto");                // latar bawah
        m.addPart(B.box(0.42, 0.12, 0.005), HITAM, T(0, -0.31, 0.03), "foto");  
        m.addPart(B.box(0.35, 0.2, 0.005), HITAM, T(0, -0.15, 0.035), "foto");                // jas
        m.addPart(B.box(0.05, 0.1, 0.015), PUTIH, T(0, -0.10, 0.035), "foto");
        m.addPart(B.sphere(1, 16, 12), KULIT, mul(T(0, 0.035, 0.03), S(0.105, 0.129, 0.005)), "foto");   // wajah
        m.addPart(B.box(0.215, 0.098, 0.005), HITAM, T(0, 0.161, 0.035), "foto");           // peci
        m.addPart(B.box(0.3, 0.2, 0.005), HITAM, T(0, -0.15, 0.035), "foto");         


        // 10. Bendera merah putih & tiang
        m.addPart(B.cylinder(0.04, 0.05, 5.5, 12), TIANG_BENDERA, T(-4.3, 2.75, 3.8));
        m.addPart(B.plane(1.5, 0.45), MERAH, T(-3.55, 5.025, 3.8));
        m.addPart(B.plane(1.5, 0.45), PUTIH, T(-3.55, 4.575, 3.8));
    }

    render(shaderVars, parentMatrix) {
        this.model.render(shaderVars, parentMatrix);
    }
}
