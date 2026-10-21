import { LIBS } from "../../../shared/libs.js";
import * as S from "../../../shared/buildersRed.js";
import { MyObject } from "../MyObject.js";
import {
    PI, MERAH,
    JUMLAH_RUAS, PANJANG_RUAS, RADIUS_BAHU, RADIUS_UJUNG, SUDUT_AWAL, SUDUT_AKHIR,
    PANJANG_PAHA, PANJANG_BETIS, RADIUS_PAHA, RADIUS_LUTUT, RADIUS_BETIS,
} from "../config.js";

export class Limbs {
    constructor(GL, badan) {
        // ---------- LENGAN : 12 cylinder kecil + bola di tiap sambungan, 3 jari = elliptic paraboloid ----------
        this.lengan = [];
        for (var sx of [-1, 1]) {
            var ruasLengan = [];
            var induk = badan;
            for (var i = 0; i < JUMLAH_RUAS; i++) {
                var r0 = RADIUS_BAHU + (RADIUS_UJUNG - RADIUS_BAHU) * i / JUMLAH_RUAS;
                var r1 = RADIUS_BAHU + (RADIUS_UJUNG - RADIUS_BAHU) * (i + 1) / JUMLAH_RUAS;
                // cylinder dibalik (putarZ PI) supaya menghadap ke bawah, bola kecil menutup sambungan di ujungnya
                var silinder = S.putarZ(S.cylinder(r0, r1, PANJANG_RUAS, MERAH), PI);
                var bola = S.geser(S.ellipsoid(r1, r1, r1, MERAH), 0, -PANJANG_RUAS, 0);
                var ruas = new MyObject(GL, S.gabung(silinder, bola));
                if (i > 0) {
                    // ruas ini mulai di ujung ruas sebelumnya, dan miring sedikit lebih tegak
                    LIBS.translateY(ruas.MOVE_MATRIX, -PANJANG_RUAS);
                    LIBS.rotateZ(ruas.MOVE_MATRIX, sx * (SUDUT_AKHIR - SUDUT_AWAL) / JUMLAH_RUAS * PI / 180);
                }
                induk.childs.push(ruas);
                ruasLengan.push(ruas);
                induk = ruas;
            }
            // 3 jari di ujung ruas terakhir, membuka seperti kipas
            for (var ang of [-0.5, 0, 0.5]) {
                var jari = new MyObject(GL, S.elipticParaboloid(0.035, 0.025, 0.34, MERAH));
                LIBS.translateY(jari.MOVE_MATRIX, -PANJANG_RUAS);
                LIBS.rotateZ(jari.MOVE_MATRIX, PI + ang * 0.9);
                induk.childs.push(jari);
            }
            this.lengan.push({ sx: sx, ruas: ruasLengan });
        }

        // ---------- KAKI : paha (cone) -> lutut (sphere) -> betis (cylinder) -> pergelangan (sphere) -> telapak (3 elliptic paraboloid) ----------
        this.kaki = [];
        // Cone paha dipotong supaya radius di ujung bawahnya sama dengan radius lutut (sphere), jadi paha tersambung mulus ke lutut
        var tinggiKerucut = PANJANG_PAHA / (1 - RADIUS_LUTUT / RADIUS_PAHA);
        for (var sx of [-1, 1]) {
            // Paha + sphere lutut di ujung bawahnya (dibalik dengan putarZ PI supaya menghadap ke bawah)
            var bentukPaha = S.putarZ(S.gabung(
                S.cone(RADIUS_PAHA, tinggiKerucut, MERAH, PANJANG_PAHA / tinggiKerucut),
                S.geser(S.ellipsoid(RADIUS_LUTUT, RADIUS_LUTUT, RADIUS_LUTUT, MERAH), 0, PANJANG_PAHA, 0)
            ), PI);
            var paha = new MyObject(GL, bentukPaha);
            badan.childs.push(paha);

            // Betis: cylinder murni, anak dari paha. Sendi lutut = titik awal betis.
            var betis = new MyObject(GL, S.putarZ(S.cylinder(RADIUS_BETIS, RADIUS_BETIS, PANJANG_BETIS, MERAH), PI));
            paha.childs.push(betis);

            var jariKaki = [];
            for (var ang of [-0.5, 0, 0.5]) {
                var j = S.elipticParaboloid(0.07, 0.03, 0.5, MERAH);   
                j = S.putarX(j, PI / 2);                              
                j = S.putarY(j, ang);                                
                jariKaki.push(S.geser(j, 0, -0.07, 0));
            }
            // Telapak = sphere pergelangan + 3 jari kaki, anak dari betis
            var telapak = new MyObject(GL, S.gabung(S.ellipsoid(0.10, 0.10, 0.10, MERAH), ...jariKaki));
            betis.childs.push(telapak);
            this.kaki.push({ sx: sx, paha: paha, betis: betis, telapak: telapak });
        }
    }
}
