// Limbs.js
//   BADAN
//    |-- LENGAN (kiri, kanan) = BADAN x T(bahu) x RZ(buka) x RX(ayun)
//    |     +-- TANGAN         = LENGAN x basis(ujung lengan)
//    |           +-- 3 JARI   = TANGAN x RZ(sebar) x RX(miring)
//    +-- KAKI  (kiri, kanan)  = BADAN x T(pinggul) x RZ(splay) x RX(ayun pinggul)
//          +-- PERGELANGAN    = KAKI x T(0, -panjang, 0) x RX(-ayun) x RZ(-splay)
//                +-- 3 JARI KAKI = PERGELANGAN x T(0, -0.06, 0) x RY(kipas)
//
// Pergelangan memutar BALIK rotasi pinggul (RX(-ayun) x RZ(-splay)) supaya telapak tetap datar
// walaupun kaki miring: dua rotasi yang saling meniadakan di sepanjang rantai hierarki.
import * as B from "../../../shared/buildersRock.js";
import { drawMesh } from "../draw.js";
import { T, S, RX, RY, RZ, mul } from "../matrix.js";
import { GRAY, L_LEG, FOOT_BALL, TOE_DROP, HIP_X, HIP_Y, SPLAY, ARM_LEN, ARM_STEPS, ELBOW, MATERIAL } from "../config.js";

export class Limbs {
    constructor(GL) {
        this.gl = GL;

        this.ballGray = B.buildMesh(B.ellipsoid(1, 1, 1), 22, 14, GRAY);            // sendi (diskalakan saat digambar)

        // KAKI: paha = CONE besar di atas & runcing ke bawah, betis = CYLINDER (r0 = r1), ditumpuk.
        // Telapak = bola + 3 jari pipih.
        this.legCone = B.buildMesh(B.cone(0.19, 0.0, L_LEG, 1.0), 20, 1, GRAY);
        this.legCylinder = B.buildMesh(B.cone(0.07, 0.07, L_LEG, 1.0), 20, 1, GRAY);
        this.footToe = B.buildMesh(B.toe(0.065, 0.025, 0.36), 16, 10, GRAY);       // lebar 0.065, tebal 0.025, panjang 0.36

        this.handFinger = B.buildMesh(B.cone(0.026, 0.003, 0.2, 1.0), 10, 1, GRAY); // jari tangan = elliptic cone runcing

        // LENGAN: tube melengkung ke dalam & sedikit ke depan, dibangun SEKALI per sisi (bentuknya tetap).
        // Titik-titik lengan ada di sistem koordinat BAHU (pangkal lengan = titik asal).
        this.arm = {};
        [-1, 1].forEach((s) => {
            var bend = 0.45 + 0.7 * ELBOW, forward = 0.5 * ELBOW;
            var x = 0, y = 0, z = 0, pts = [[0, 0, 0]];
            for (var k = 1; k <= ARM_STEPS; k++) {
                var f = (k - 0.5) / ARM_STEPS, ang = -s * bend * f;
                var d = B.norm3([Math.sin(ang), -Math.cos(ang), Math.sin(forward * f)]);
                x += d[0] * ARM_LEN / ARM_STEPS; y += d[1] * ARM_LEN / ARM_STEPS; z += d[2] * ARM_LEN / ARM_STEPS;
                pts.push([x, y, z]);
            }
            var mesh = { data: null, count: 0, dirty: true };
            B.buildTube(mesh, pts, 0.07, 0.032, 12, GRAY);
            // frame TANGAN di ujung lengan: sumbu -Y searah lengan, supaya jari keluar mengikuti arah lengan
            var tip = pts[ARM_STEPS], prev = pts[ARM_STEPS - 1];
            var down = B.norm3([prev[0] - tip[0], prev[1] - tip[1], prev[2] - tip[2]]);
            var side = B.norm3(B.cross3(down, [0, 0, 1]));
            this.arm[s] = { mesh: mesh, hand: B.basis(side, down, B.cross3(side, down), tip) };
        });
    }

    // pose.lengan = { buka, ayun }, pose.kaki = { ayun }  (radian)
    render(shaderVars, bodyF, pose) {
        const GL = this.gl;

        [-1, 1].forEach((s) => {
            // LENGAN = BADAN x T(bahu) x RZ(buka) x RX(ayun). Semua berputar di bahu.
            var armF = mul(bodyF, T(s * 0.64, 0.3, 0), RZ(s * pose.lengan.buka), RX(s * pose.lengan.ayun));
            drawMesh(GL, shaderVars, this.arm[s].mesh, armF, MATERIAL.kaki);

            // TANGAN = LENGAN x basis(ujung lengan): bola kecil + 3 jari menyebar seperti kipas
            var handF = mul(armF, this.arm[s].hand);
            drawMesh(GL, shaderVars, this.ballGray, mul(handF, S(0.03, 0.03, 0.03)));
            for (var c = -1; c <= 1; c++) {
                drawMesh(GL, shaderVars, this.handFinger, mul(handF, RZ(c * 0.5), RX(-0.2)));
            }

            // KAKI = BADAN x T(pinggul) x RZ(splay) x RX(ayun). Kaki = cone (paha) + cylinder (betis).
            var legF = mul(bodyF, T(s * HIP_X, HIP_Y, 0.02), RZ(s * SPLAY), RX(s * pose.kaki.ayun));
            drawMesh(GL, shaderVars, this.legCone, legF, MATERIAL.kaki);
            drawMesh(GL, shaderVars, this.legCylinder, legF);

            // PERGELANGAN = KAKI x T(0, -panjang, 0) x RX(-ayun) x RZ(-splay) -> telapak selalu datar
            var ankleF = mul(legF, T(0, -L_LEG, 0), RX(-s * pose.kaki.ayun), RZ(-s * SPLAY));
            drawMesh(GL, shaderVars, this.ballGray, mul(ankleF, S(FOOT_BALL, FOOT_BALL, FOOT_BALL)), MATERIAL.kaki);
            for (var f = -1; f <= 1; f++) {
                drawMesh(GL, shaderVars, this.footToe, mul(ankleF, T(0, -TOE_DROP, 0), RY(f * 0.5)), MATERIAL.jariKaki);
            }
        });
    }
}
