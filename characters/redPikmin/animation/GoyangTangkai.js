import { LIBS } from "../../../shared/libs.js";

export function goyangTangkai(pikmin, t) {
    var antenna = pikmin.antenna;
    var goyang = Math.sin(t * 2.1) * 0.2;
    var p = antenna.titikTangkai;
    p[2][0] = 0.1 + goyang;
    p[3][0] = 0.8 + goyang * 1.5;
    p[3][1] = 4.3 + goyang * 0.2;
    antenna.updateTangkai();

    var sudutDaun = Math.atan2(p[3][1] - p[2][1], p[3][0] - p[2][0]) - 0.2;
    var d = antenna.daun.MOVE_MATRIX;
    LIBS.set_I4(d);
    LIBS.rotateX(d, 0.25 * Math.sin(t * 2.6));
    LIBS.rotateZ(d, sudutDaun);
    LIBS.set_position(d, p[3][0] + Math.cos(sudutDaun) * 0.75, p[3][1] + Math.sin(sudutDaun) * 0.75, 0);
}
