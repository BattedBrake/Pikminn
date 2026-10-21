import { LIBS } from "../../../shared/libs.js";
import { PI, JUMLAH_RUAS, PANJANG_RUAS, SUDUT_AWAL, SUDUT_AKHIR, RUAS_SIKU } from "../config.js";

export function tutupMata(pikmin, sudutBahu, sudutSiku) {
    if (sudutBahu === undefined) sudutBahu = 2 * PI / 3;
    if (sudutSiku === undefined) sudutSiku = PI / 4;
    pikmin.lengan.forEach(function (l) {
        var bahu = l.ruas[0].MOVE_MATRIX;
        LIBS.set_I4(bahu);
        LIBS.rotateX(bahu, -sudutBahu);
        LIBS.set_position(bahu, l.sx * 0.55, 0.8, 0);
        RUAS_SIKU.forEach(function (i) {
            var m = l.ruas[i].MOVE_MATRIX;
            LIBS.set_I4(m);
            LIBS.translateY(m, -PANJANG_RUAS);
            LIBS.rotateZ(m, l.sx * (SUDUT_AKHIR - SUDUT_AWAL) / JUMLAH_RUAS * PI / 180);
            LIBS.rotateX(m, -sudutSiku / RUAS_SIKU.length);
        });
    });
}
