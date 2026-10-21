// Jalan.js
// Animasi berjalan: badan bergoyang, lengan berayun, kaki melangkah. t = waktu.
import { LIBS } from "../../../shared/libs.js";
import {
    PI, JUMLAH_RUAS, PANJANG_RUAS, SUDUT_AWAL, SUDUT_AKHIR,
    PANJANG_PAHA, PANJANG_BETIS, LUTUT_MAKS, RUAS_SIKU, SIKU_MAKS,
} from "../config.js";

export function jalan(pikmin, t) {
    var w = t * 2.0, s = Math.sin(w);
    var m = pikmin.badan.MOVE_MATRIX;
    LIBS.set_I4(m);
    LIBS.rotateZ(m, Math.sin(w) * 0.03);
    LIBS.rotateY(m, Math.sin(w * 0.5) * 0.2);
    LIBS.set_position(m, 0, s * 0.06, 0);

    pikmin.lengan.forEach(function (l) {
        var sudutAwal = l.sx * (SUDUT_AWAL + (SUDUT_AKHIR - SUDUT_AWAL) * 0.5 / JUMLAH_RUAS) * PI / 180;
        var bahu = l.ruas[0].MOVE_MATRIX;
        LIBS.set_I4(bahu);
        LIBS.rotateZ(bahu, sudutAwal);
        LIBS.rotateX(bahu, l.sx * s * 0.5);
        LIBS.set_position(bahu, l.sx * 0.55, 0.8, 0);

        var tekukSiku = SIKU_MAKS * Math.max(0, -l.sx * s);
        RUAS_SIKU.forEach(function (i) {
            var m = l.ruas[i].MOVE_MATRIX;
            LIBS.set_I4(m);
            LIBS.translateY(m, -PANJANG_RUAS);
            LIBS.rotateZ(m, l.sx * (SUDUT_AKHIR - SUDUT_AWAL) / JUMLAH_RUAS * PI / 180);
            LIBS.rotateX(m, -tekukSiku / RUAS_SIKU.length);
        });
    });

    pikmin.kaki.forEach(function (k) {
        var ayun = -k.sx * s * 0.5;                           
        var tekukLutut = LUTUT_MAKS * Math.max(0, -k.sx * s);

        var pinggul = k.paha.MOVE_MATRIX;
        LIBS.set_I4(pinggul);
        LIBS.rotateX(pinggul, ayun);
        LIBS.set_position(pinggul, k.sx * 0.34, -0.9, 0);

        var lutut = k.betis.MOVE_MATRIX;
        LIBS.set_I4(lutut);
        LIBS.rotateX(lutut, tekukLutut);
        LIBS.set_position(lutut, 0, -PANJANG_PAHA, 0);

        var pergelangan = k.telapak.MOVE_MATRIX;
        LIBS.set_I4(pergelangan);
        LIBS.rotateX(pergelangan, -(ayun + tekukLutut));
        LIBS.set_position(pergelangan, 0, -PANJANG_BETIS, 0);
    });
}
