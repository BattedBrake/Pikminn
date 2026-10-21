// RockPikmin.js
// Rock Pikmin (Pikmin 3): badan batu bersegi, tangkai kurva Bezier + daun, lengan tube melengkung, kaki cone + cylinder.
//
// HIERARKI TRANSFORMASI (parent -> child), setiap anak:  M_anak = M_induk x T(pivot) x R(sudut)
//   BADAN (akar) = parent x T(0, tinggi, 0)        telapak kaki tepat di y = 0
//    |-- MATA, PUPIL                               -> bodyParts/Body.js
//    |-- TANGKAI, DAUN                             -> bodyParts/Antenna.js
//    +-- LENGAN, TANGAN, KAKI, PERGELANGAN         -> bodyParts/Limbs.js
//
// Gerakan ada di folder animation/.
//
// Interface wajib setiap karakter (supaya bisa digabung di index.html terluar):
//   constructor(GL)
//   render(shaderVars, parentMatrix, time)
import { Body } from "./bodyParts/Body.js";
import { Antenna } from "./bodyParts/Antenna.js";
import { Limbs } from "./bodyParts/Limbs.js";
import { T, mul } from "./matrix.js";
import { resetMaterial } from "../../shared/renderer.js";
import { L_LEG, FOOT_H, HIP_Y, SPLAY } from "./config.js";

import { goyangTangkai, poseIdle } from "./animation/Idle.js";

export class RockPikmin {
    constructor(GL) {
        this.gl = GL;
        this.body = new Body(GL);
        this.antenna = new Antenna(GL, this.body.top);
        this.limbs = new Limbs(GL);

        this.pose = { lengan: { buka: 0, ayun: 0 }, kaki: { ayun: 0 } };
        poseIdle(this);
    }

    render(shaderVars, parentMatrix, time) {
        const GL = this.gl;
        // time dari renderer naik sekitar 3 per detik; versi asli memakai detik, jadi dibagi 3
        var t = time / 3;
        var goyang = goyangTangkai(t);

        // tinggi pusat badan supaya telapak kaki tepat di y = 0
        var bodyY = -HIP_Y + L_LEG * Math.cos(SPLAY) * Math.cos(this.pose.kaki.ayun) + FOOT_H;
        var bodyF = mul(parentMatrix, T(0, bodyY, 0));                       // BADAN = parent x T(tinggi)

        GL.uniform1f(shaderVars.uIsRough, 0.0);
        GL.uniform1f(shaderVars.uUseVertexColor, 1.0);   // Rock Pikmin memakai warna per-vertex (segi batu, daun)
        this.body.render(shaderVars, bodyF);
        this.antenna.render(shaderVars, bodyF, goyang.sway, goyang.swayZ);
        this.limbs.render(shaderVars, bodyF, this.pose);
        GL.uniform1f(shaderVars.uUseVertexColor, 0.0);
        resetMaterial(GL, shaderVars);   // supaya objek berikutnya tidak ikut memakai material Rock
    }
}
