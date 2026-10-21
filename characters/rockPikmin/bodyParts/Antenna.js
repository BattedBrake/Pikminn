// Antenna.js
//   BADAN
//    +-- TANGKAI = BADAN x T(puncak batu)       kurva Bezier, dibangun ulang tiap frame agar bergoyang
//          +-- DAUN = TANGKAI x basis(T, N, B)   pangkal daun = ujung kurva
import * as B from "../../../shared/buildersRock.js";
import { drawMesh } from "../draw.js";
import { T, mul } from "../matrix.js";
import { BODY_TOP_X, MATERIAL } from "../config.js";

export class Antenna {
    // top = tinggi puncak batu (dari Body), tempat pangkal tangkai
    constructor(GL, top) {
        this.gl = GL;
        this.top = top;
        this.leafMesh = B.buildMesh(B.leaf, 28, 12, function (p, u, v) {
            var rib = Math.max(0, 1 - Math.abs(p[2]) / 0.05);                     // tulang daun lebih terang
            return [0.5 + 0.2 * v + 0.1 * rib, 0.8 + 0.1 * v + 0.06 * rib, 0.2 + 0.1 * v];
        });
        this.stalkMesh = { data: new Float32Array(0), count: 0, dirty: true };   // diisi ulang tiap frame
    }

    // sway = goyang kiri-kanan, swayZ = goyang depan-belakang (lihat animation/Idle.js)
    render(shaderVars, bodyF, sway, swayZ) {
        const GL = this.gl;

        // ---- TANGKAI: kurva Bezier kubik P0..P3, titik kontrol bergoyang, mesh dibangun ulang ----
        var P0 = [0, -0.05, 0];
        var P1 = [0.05 * sway, 0.45, 0.03 * swayZ];
        var P2 = [0.05 + 0.2 * sway, 0.9, 0.07 * swayZ];
        var P3 = [0.4 + 0.4 * sway, 1.2 - 0.08 * Math.abs(sway), 0.1 * swayZ];
        var curve = [];
        for (var k = 0; k <= 22; k++) {          // B(t) = (1-t)^3 P0 + 3(1-t)^2 t P1 + 3(1-t) t^2 P2 + t^3 P3
            var u = k / 22, w = 1 - u, point = [0, 0, 0];
            for (var axis = 0; axis < 3; axis++) {
                point[axis] = w * w * w * P0[axis] + 3 * w * w * u * P1[axis] + 3 * w * u * u * P2[axis] + u * u * u * P3[axis];
            }
            curve.push(point);
        }
        B.buildTube(this.stalkMesh, curve, 0.1, 0.055, 9, function (v) { return [0.66 - 0.2 * v, 0.69, 0.7 - 0.3 * v]; });
        var stalkF = mul(bodyF, T(BODY_TOP_X, this.top, 0));                     // TANGKAI = BADAN x T(puncak)
        drawMesh(GL, shaderVars, this.stalkMesh, stalkF, MATERIAL.tangkai);

        // ---- DAUN: anak TANGKAI. Basis (Tn, Nn, Wn) = arah singgung di ujung kurva, jadi daun ikut arah kurva ----
        var Tn = B.norm3([P3[0] - P2[0], P3[1] - P2[1], P3[2] - P2[2]]);        // singgung di t = 1 searah (P3 - P2)
        var perp = B.norm3([-Tn[1], Tn[0], 0]);
        var raw = B.norm3([perp[0] * 0.55, perp[1] * 0.55, 0.85]);
        var d = B.dot3(raw, Tn);
        var Nn = B.norm3([raw[0] - Tn[0] * d, raw[1] - Tn[1] * d, raw[2] - Tn[2] * d]);   // tegak lurus Tn
        var Wn = B.cross3(Tn, Nn);
        var leafOrigin = [                                                        // pangkal daun = ujung kurva (masuk 0.04 ke tangkai)
            P3[0] + Tn[0] * (B.LEAF.a - 0.04) - Nn[0] * B.LEAF.h,
            P3[1] + Tn[1] * (B.LEAF.a - 0.04) - Nn[1] * B.LEAF.h,
            P3[2] + Tn[2] * (B.LEAF.a - 0.04) - Nn[2] * B.LEAF.h,
        ];
        drawMesh(GL, shaderVars, this.leafMesh, mul(stalkF, B.basis(Tn, Nn, Wn, leafOrigin)), MATERIAL.daun);
    }
}
