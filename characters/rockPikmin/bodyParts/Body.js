// Body.js
//   BADAN (batu bersegi, akar hierarki)
//    |-- MATA (kiri, kanan) = BADAN x frame permukaan depan
//          +-- PUPIL        = MATA x T(0, 0, 0.05)
import * as B from "../../../shared/buildersRock.js";
import { drawMesh } from "../draw.js";
import { T, S, mul } from "../matrix.js";
import { EYE_X, EYE_Y, BODY_TOP_X, MATERIAL } from "../config.js";

export class Body {
    constructor(GL) {
        this.gl = GL;
        this.mesh = B.rockBody();
        this.eyeWhite = B.buildMesh(B.ellipsoid(1, 1, 1), 22, 14, [0.98, 0.98, 0.98]);
        this.eyePupil = B.buildMesh(B.ellipsoid(1, 1, 1), 22, 14, [0.03, 0.03, 0.04]);

        var bd = this.mesh.data, count = this.mesh.count;

        // (a) MATA: tembakkan sinar searah -Z pada (x, y) tertentu, ambil permukaan terdepan (z terbesar).
        //     Frame mata = sumbu X, Y di bidang permukaan + sumbu Z = normal permukaan (mata menempel rata).
        this.eyeFrame = {};
        [-1, 1].forEach((s) => {
            var x = s * EYE_X, y = EYE_Y, best = null;
            for (var t = 0; t < count; t += 3) {
                var a = t * 9, b = (t + 1) * 9, c = (t + 2) * 9;
                var den = (bd[b + 1] - bd[c + 1]) * (bd[a] - bd[c]) + (bd[c] - bd[b]) * (bd[a + 1] - bd[c + 1]);
                if (Math.abs(den) < 1e-9) continue;
                var l1 = ((bd[b + 1] - bd[c + 1]) * (x - bd[c]) + (bd[c] - bd[b]) * (y - bd[c + 1])) / den;
                var l2 = ((bd[c + 1] - bd[a + 1]) * (x - bd[c]) + (bd[a] - bd[c]) * (y - bd[c + 1])) / den;
                var l3 = 1 - l1 - l2;
                if (l1 < -1e-6 || l2 < -1e-6 || l3 < -1e-6) continue;             // titik di luar segitiga
                var z = l1 * bd[a + 2] + l2 * bd[b + 2] + l3 * bd[c + 2];
                if (!best || z > best.z) {
                    var n = [bd[a + 3], bd[a + 4], bd[a + 5]];
                    if (n[2] < 0) n = [-n[0], -n[1], -n[2]];                          // normal menghadap keluar
                    best = { z: z, n: n };
                }
            }
            var axisX = B.norm3(B.cross3([0, 1, 0], best.n)), axisY = B.cross3(best.n, axisX);
            var origin = [x + best.n[0] * 0.015, y + best.n[1] * 0.015, best.z + best.n[2] * 0.015];   // sedikit di atas permukaan
            this.eyeFrame[s] = B.basis(axisX, axisY, best.n, origin);
        });

        // (b) PANGKAL TANGKAI: tembakkan sinar searah -Y pada (BODY_TOP_X, 0), ambil permukaan tertinggi.
        var top = -9;
        for (var t = 0; t < count; t += 3) {
            var a = t * 9, b = (t + 1) * 9, c = (t + 2) * 9;
            var den = (bd[b + 2] - bd[c + 2]) * (bd[a] - bd[c]) + (bd[c] - bd[b]) * (bd[a + 2] - bd[c + 2]);
            if (Math.abs(den) < 1e-9) continue;
            var l1 = ((bd[b + 2] - bd[c + 2]) * (BODY_TOP_X - bd[c]) + (bd[c] - bd[b]) * (0 - bd[c + 2])) / den;
            var l2 = ((bd[c + 2] - bd[a + 2]) * (BODY_TOP_X - bd[c]) + (bd[a] - bd[c]) * (0 - bd[c + 2])) / den;
            var l3 = 1 - l1 - l2;
            if (l1 < -1e-6 || l2 < -1e-6 || l3 < -1e-6) continue;
            top = Math.max(top, l1 * bd[a + 1] + l2 * bd[b + 1] + l3 * bd[c + 1]);
        }
        this.top = top - 0.04;                                                       // sedikit tenggelam ke batu
    }

    render(shaderVars, bodyF) {
        const GL = this.gl;

        // ---- BADAN (batu bersegi) ----
        drawMesh(GL, shaderVars, this.mesh, bodyF, MATERIAL.badan);

        // ---- MATA & PUPIL: anak dari BADAN. Pupil anak dari mata. ----
        [-1, 1].forEach((s) => {
            var eyeF = mul(bodyF, this.eyeFrame[s]);                                  // MATA = BADAN x frame permukaan
            drawMesh(GL, shaderVars, this.eyeWhite, mul(eyeF, S(0.125, 0.14, 0.055)), MATERIAL.mata);
            var pupilF = mul(eyeF, T(0, 0, 0.05));                                    // PUPIL = MATA x T
            drawMesh(GL, shaderVars, this.eyePupil, mul(pupilF, S(0.085, 0.1, 0.035)), MATERIAL.pupil);
        });
    }
}
