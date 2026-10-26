// pohon.js
// Pohon sederhana + penyebar pohon (hutan kecil) di atas pasir.
//
//   Pohon : satu pohon. Jenis "bulat" (batang + 3 bola daun) atau "cemara" (batang + 3 kerucut bertumpuk).
//           Pangkal batang di y = 0.
//   Hutan : menyebar banyak pohon secara acak tapi TETAP (pakai seed), jadi susunannya sama setiap dibuka
//           dan sama di laptop semua anggota kelompok. Area tempat pikmin bergerak dikosongkan.
//
//   var hutan = new Hutan(GL, { jumlah: 40 });
//   hutan.render(shaderVars, root);   // tiap frame
import * as B from "../shared/buildersEnv.js";
import { EnvModel, T, S, RY, mul } from "./EnvModel.js";
import { tinggiTanah, UKURAN_TANAH } from "./Environment.js";

const BATANG = B.hex(0x6D4C2F);
const DAUN = { bulat: B.hex(0x4CAF50), bulatTua: B.hex(0x2E7D32), cemara: B.hex(0x1B5E20) };

// Jari-jari daun terlebar tiap jenis pada skala 1 (dipakai supaya pohon tidak saling menembus)
const JARI_DAUN = { bulat: 1.7, bulatTua: 1.7, cemara: 1.6 };

export class Pohon {
    // jenis = "bulat", "bulatTua" (bulat dengan daun lebih gelap), atau "cemara"
    constructor(GL, jenis = "bulat") {
        var m = this.model = new EnvModel(GL);

        if (jenis === "cemara") {
            // Batang pendek + 3 kerucut bertumpuk, makin ke atas makin kecil
            m.addPart(B.cylinder(0.2, 0.28, 1.4, 12), BATANG, T(0, 0.7, 0));
            m.addPart(B.cylinder(0, 1.6, 2.2, 16), DAUN.cemara, T(0, 2.2, 0));
            m.addPart(B.cylinder(0, 1.25, 1.9, 16), DAUN.cemara, T(0, 3.2, 0));
            m.addPart(B.cylinder(0, 0.9, 1.6, 16), DAUN.cemara, T(0, 4.1, 0));
        } else {
            // Batang + gerombol 3 bola daun di atasnya
            var warna = jenis === "bulatTua" ? DAUN.bulatTua : DAUN.bulat;
            var bola = B.sphere(1, 16, 12);
            m.addPart(B.cylinder(0.22, 0.32, 2.6, 12), BATANG, T(0, 1.3, 0));
            m.addPart(bola, warna, mul(T(0, 3.3, 0), S(1.4, 1.2, 1.4)));
            m.addPart(bola, warna, mul(T(0.7, 2.9, 0.3), S(0.9, 0.8, 0.9)));
            m.addPart(bola, warna, mul(T(-0.6, 3.0, -0.4), S(1.0, 0.85, 1.0)));
        }
    }

    render(shaderVars, parentMatrix) {
        this.model.render(shaderVars, parentMatrix);
    }
}

// Angka acak yang selalu sama untuk seed yang sama (mulberry32)
function acak(seed) {
    return function () {
        seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
        var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export class Hutan {
    // opsi (semua opsional):
    //   jumlah     : banyak pohon (default 40)
    //   seed       : ganti angka ini untuk susunan pohon yang berbeda (default 7)
    //   area       : batas sebaran { xMin, xMax, zMin, zMax }
    //                (default: seluruh tanah, mengikuti UKURAN_TANAH di Environment.js, dikurangi tepi)
    //   tepi       : jarak dari pinggir tanah yang dibiarkan kosong kalau area tidak diisi (default 10)
    //   kosong     : daftar kotak yang tidak boleh ada pohon, [{ xMin, xMax, zMin, zMax }, ...]
    //                (default: area tengah tempat pikmin bergerak & item di depan kamera)
    //   skalaMin/skalaMax : rentang ukuran pohon (default 0.8 .. 1.6)
    //   jenis      : jenis pohon yang dipakai, misalnya ["cemara"] (default semua: bulat, bulatTua, cemara)
    //   jarakMin   : jarak minimal antar pusat pohon (default 3)
    //   celah      : jarak minimal antar tepi daun, otomatis menyesuaikan ukuran pohon (default 1).
    //                Jarak yang dipakai = yang lebih besar antara jarakMin dan (jari daun kedua pohon + celah).
    //   Kalau area terlalu sempit untuk jumlah pohon yang diminta, pohon yang muat saja yang dipasang.
    constructor(GL, opsi = {}) {
        var jumlah = opsi.jumlah || 40;
        var tepi = opsi.tepi !== undefined ? opsi.tepi : 10;
        var batas = UKURAN_TANAH / 2 - tepi;
        var area = opsi.area || { xMin: -batas, xMax: batas, zMin: -batas, zMax: batas };
        var kosong = opsi.kosong || [{ xMin: -10, xMax: 10, zMin: -8, zMax: 20 }];
        var skalaMin = opsi.skalaMin || 0.8, skalaMax = opsi.skalaMax || 1.6;
        var jarakMin = opsi.jarakMin || 3;
        var celah = opsi.celah !== undefined ? opsi.celah : 1;
        var rnd = acak(opsi.seed !== undefined ? opsi.seed : 7);

        // Satu model per jenis, dipakai ulang untuk semua pohon jenis itu
        this.jenis = {
            bulat: new Pohon(GL, "bulat"),
            bulatTua: new Pohon(GL, "bulatTua"),
            cemara: new Pohon(GL, "cemara"),
        };
        var namaJenis = (opsi.jenis || Object.keys(this.jenis)).filter((n) => {
            if (!this.jenis[n]) console.warn("Jenis pohon tidak dikenal: " + n + " (pilihan: bulat, bulatTua, cemara)");
            return !!this.jenis[n];
        });

        // Pohon ditolak kalau daunnya (bukan hanya batangnya) masuk ke kotak kosong
        var diKosong = function (x, z, jari) {
            return kosong.some(function (k) {
                return x > k.xMin - jari && x < k.xMax + jari && z > k.zMin - jari && z < k.zMax + jari;
            });
        };

        this.pohon = [];
        var percobaan = 0;
        while (this.pohon.length < jumlah && percobaan < jumlah * 50) {
            percobaan++;
            var x = area.xMin + rnd() * (area.xMax - area.xMin);
            var z = area.zMin + rnd() * (area.zMax - area.zMin);
            var jenis = namaJenis[Math.floor(rnd() * namaJenis.length)];
            var skala = skalaMin + rnd() * (skalaMax - skalaMin);
            var jari = JARI_DAUN[jenis] * skala;
            if (diKosong(x, z, jari)) continue;
            var terlaluDekat = this.pohon.some(function (p) {
                return Math.hypot(p.x - x, p.z - z) < Math.max(jarakMin, p.jari + jari + celah);
            });
            if (terlaluDekat) continue;
            this.pohon.push({
                jenis: jenis, x: x, z: z, skala: skala, jari: jari,
                putar: rnd() * Math.PI * 2,          // diputar acak supaya gerombol daunnya tidak seragam
            });
        }
    }

    render(shaderVars, parentMatrix) {
        this.pohon.forEach((p) => {
            // Sedikit ditanam (-0.15) supaya pangkal batang tidak terlihat melayang di pasir bergelombang
            var M = mul(parentMatrix, T(p.x, tinggiTanah(p.x, p.z) - 0.15, p.z), RY(p.putar), S(p.skala, p.skala, p.skala));
            this.jenis[p.jenis].render(shaderVars, M);
        });
    }
}
