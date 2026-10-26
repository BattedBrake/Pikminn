// rumput.js
// Rumput dari helai-helai kecil. Konsepnya sama dengan tangkai pikmin: setiap helai adalah TABUNG yang
// mengikuti KURVA BEZIER kubik (4 titik kontrol) dan meruncing ke ujung, dengan gradasi warna
// hijau tua di pangkal -> hijau muda di ujung (warna per-vertex).
//
// Helai dikelompokkan per RUMPUN (beberapa helai berdekatan, condong ke arah acak) supaya terlihat alami.
// Semua helai digabung ke beberapa mesh besar, jadi ribuan helai tetap ringan (hanya beberapa kali gambar per frame).
// Susunannya acak tapi TETAP (pakai seed). Pangkal helai menempel di permukaan tanah (tinggiTanah).
//
//   var rumput = new Rumput(GL, { jumlah: 1000 });
//   rumput.render(shaderVars, root);   // tiap frame
import { tinggiTanah, UKURAN_TANAH } from "./Environment.js";
import { setMaterial, resetMaterial } from "../shared/renderer.js";

// Angka acak yang selalu sama untuk seed yang sama (mulberry32)
function acak(seed) {
    return function () {
        seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
        var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const SEGMEN = 5;   // ruas sepanjang helai
const SISI = 5;     // sisi penampang tabung

// Tambahkan satu helai ke array vertices & faces.
//   (bx, by, bz) = pangkal, tinggi = panjang helai, condong = 0 (tegak) .. 1 (melengkung jauh),
//   putar = arah condong (radian), jari = radius pangkal, warnaBawah/warnaAtas = [r, g, b]
function tambahHelai(vertices, faces, bx, by, bz, tinggi, condong, putar, jari, warnaBawah, warnaAtas) {
    // Kurva Bezier di bidang lokal x-y: naik dulu, lalu melengkung ke samping (seperti tangkai pikmin)
    var P = [[0, 0], [0, 0.45 * tinggi], [condong * 0.35 * tinggi, 0.8 * tinggi], [condong * 0.75 * tinggi, 0.95 * tinggi]];
    var cp = Math.cos(putar), sp = Math.sin(putar);
    var awal = vertices.length / 9;

    for (var i = 0; i <= SEGMEN; i++) {
        var t = i / SEGMEN, w = 1 - t;
        // titik kurva B(t) dan arah singgungnya B'(t)
        var cx = w * w * w * P[0][0] + 3 * w * w * t * P[1][0] + 3 * w * t * t * P[2][0] + t * t * t * P[3][0];
        var cy = w * w * w * P[0][1] + 3 * w * w * t * P[1][1] + 3 * w * t * t * P[2][1] + t * t * t * P[3][1];
        var tx = 3 * w * w * (P[1][0] - P[0][0]) + 6 * w * t * (P[2][0] - P[1][0]) + 3 * t * t * (P[3][0] - P[2][0]);
        var ty = 3 * w * w * (P[1][1] - P[0][1]) + 6 * w * t * (P[2][1] - P[1][1]) + 3 * t * t * (P[3][1] - P[2][1]);
        var tl = Math.hypot(tx, ty) || 1;
        var s1x = ty / tl, s1y = -tx / tl;           // sumbu tegak lurus kurva (di bidang x-y); sumbu kedua = z
        var r = jari * (1 - t) + 0.002;              // meruncing ke ujung
        var warna = [
            warnaBawah[0] + (warnaAtas[0] - warnaBawah[0]) * t,
            warnaBawah[1] + (warnaAtas[1] - warnaBawah[1]) * t,
            warnaBawah[2] + (warnaAtas[2] - warnaBawah[2]) * t,
        ];

        for (var j = 0; j <= SISI; j++) {
            var a = j / SISI * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
            // normal lokal & posisi lokal di keliling tabung
            var nx = ca * s1x, ny = ca * s1y, nz = sa;
            var px = cx + r * nx, py = cy + r * ny, pz = r * nz;
            // putar ke arah condong (sumbu y), lalu geser ke pangkal
            vertices.push(
                bx + px * cp + pz * sp, by + py, bz - px * sp + pz * cp,
                nx * cp + nz * sp, ny, -nx * sp + nz * cp,
                warna[0], warna[1], warna[2]
            );
        }
    }
    for (var i = 0; i < SEGMEN; i++) {
        for (var j = 0; j < SISI; j++) {
            var k0 = awal + i * (SISI + 1) + j, k1 = k0 + SISI + 1;
            faces.push(k0, k1, k0 + 1, k0 + 1, k1, k1 + 1);
        }
    }
}

export class Rumput {
    // opsi (semua opsional):
    //   jumlah          : banyak rumpun (default 1000)
    //   helaiPerRumpun  : helai per rumpun (default 5)
    //   seed            : ganti angka untuk susunan yang berbeda (default 3)
    //   area            : batas sebaran { xMin, xMax, zMin, zMax } (default kotak -40..40 di sekitar tengah;
    //                     tanah ukuran penuh terlalu luas untuk ditutup rumput rapat)
    //   kosong          : daftar kotak tanpa rumput, [{ xMin, xMax, zMin, zMax }, ...] (default tidak ada)
    //   tinggiMin/tinggiMax : rentang panjang helai (default 0.5 .. 1.3)
    //   lebarRumpun     : seberapa menyebar helai dalam satu rumpun (default 0.35)
    //   condong         : seberapa melengkung helai, 0 = tegak .. 1 = melengkung jauh (default 0.5)
    //   jari            : radius pangkal helai (default 0.04)
    //   warnaBawah/warnaAtas : warna pangkal & ujung helai (default hijau tua -> hijau muda)
    //   material        : kilap rumput, format setMaterial (default kilap lembut & lemah)
    constructor(GL, opsi = {}) {
        this.gl = GL;
        var jumlah = opsi.jumlah !== undefined ? opsi.jumlah : 1000;
        var perRumpun = opsi.helaiPerRumpun || 5;
        var area = opsi.area || { xMin: -40, xMax: 40, zMin: -40, zMax: 40 };
        var kosong = opsi.kosong || [];
        var tinggiMin = opsi.tinggiMin || 0.5, tinggiMax = opsi.tinggiMax || 1.3;
        var lebar = opsi.lebarRumpun !== undefined ? opsi.lebarRumpun : 0.35;
        var condong = opsi.condong !== undefined ? opsi.condong : 0.5;
        var jari = opsi.jari || 0.04;
        var warnaBawah = opsi.warnaBawah || [0.13, 0.35, 0.08];
        var warnaAtas = opsi.warnaAtas || [0.55, 0.85, 0.25];
        this.material = opsi.material || { kilap: 10, kekuatanKilap: 0.1 };
        var rnd = acak(opsi.seed !== undefined ? opsi.seed : 3);

        // Batasi area supaya tidak keluar dari tanah
        var batas = UKURAN_TANAH / 2;
        area = {
            xMin: Math.max(area.xMin, -batas), xMax: Math.min(area.xMax, batas),
            zMin: Math.max(area.zMin, -batas), zMax: Math.min(area.zMax, batas),
        };
        var diKosong = function (x, z) {
            return kosong.some(function (k) { return x > k.xMin && x < k.xMax && z > k.zMin && z < k.zMax; });
        };

        // Kumpulkan helai ke beberapa potongan mesh (maksimal ~65000 titik per potongan karena index 16-bit)
        var batasTitik = 65000 - (SEGMEN + 1) * (SISI + 1);
        this.potongan = [];
        var vertices = [], faces = [];
        var simpan = () => {
            if (faces.length === 0) return;
            var vb = GL.createBuffer();
            GL.bindBuffer(GL.ARRAY_BUFFER, vb);
            GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(vertices), GL.STATIC_DRAW);
            var ib = GL.createBuffer();
            GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, ib);
            GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(faces), GL.STATIC_DRAW);
            this.potongan.push({ vb: vb, ib: ib, count: faces.length });
            vertices = []; faces = [];
        };

        this.jumlahHelai = 0;
        for (var n = 0; n < jumlah; n++) {
            var rx = area.xMin + rnd() * (area.xMax - area.xMin);
            var rz = area.zMin + rnd() * (area.zMax - area.zMin);
            if (diKosong(rx, rz)) continue;
            var arahRumpun = rnd() * Math.PI * 2;
            for (var h = 0; h < perRumpun; h++) {
                var sudut = rnd() * Math.PI * 2, jarak = rnd() * lebar;
                var x = rx + Math.cos(sudut) * jarak, z = rz + Math.sin(sudut) * jarak;
                var terang = 0.85 + rnd() * 0.3;           // variasi warna kecil antar helai
                var atas = [warnaAtas[0] * terang, warnaAtas[1] * terang, warnaAtas[2] * terang];
                tambahHelai(vertices, faces,
                    x, tinggiTanah(x, z) - 0.05, z,          // sedikit ditanam supaya pangkal tidak melayang
                    tinggiMin + rnd() * (tinggiMax - tinggiMin),
                    condong * (0.4 + rnd() * 0.6),
                    arahRumpun + (rnd() - 0.5) * 1.2,        // helai serumpun condong ke arah yang mirip
                    jari, warnaBawah, atas);
                this.jumlahHelai++;
                if (vertices.length / 9 > batasTitik) simpan();
            }
        }
        simpan();
    }

    render(shaderVars, parentMatrix) {
        const GL = this.gl;
        const STRIDE = 4 * 9;

        GL.uniform1f(shaderVars.uIsRough, 0.0);
        GL.uniform1f(shaderVars.uUseVertexColor, 1.0);   // warna gradasi per helai
        setMaterial(GL, shaderVars, this.material);
        GL.uniformMatrix4fv(shaderVars.mMmatrix, false, parentMatrix);

        this.potongan.forEach(function (p) {
            GL.bindBuffer(GL.ARRAY_BUFFER, p.vb);
            GL.vertexAttribPointer(shaderVars.position, 3, GL.FLOAT, false, STRIDE, 0);
            GL.vertexAttribPointer(shaderVars.normal, 3, GL.FLOAT, false, STRIDE, 4 * 3);
            GL.vertexAttribPointer(shaderVars.color, 3, GL.FLOAT, false, STRIDE, 4 * 6);
            GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, p.ib);
            GL.drawElements(GL.TRIANGLES, p.count, GL.UNSIGNED_SHORT, 0);
        });

        GL.uniform1f(shaderVars.uUseVertexColor, 0.0);
        resetMaterial(GL, shaderVars);
    }
}
