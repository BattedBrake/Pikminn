import { HeadAndBody } from "./bodyParts/HeadAndBody.js";
import { Antenna } from "./bodyParts/Antenna.js";
import { Limbs } from "./bodyParts/Limbs.js";

import { jalan } from "./animation/Jalan.js";
import { goyangTangkai } from "./animation/GoyangTangkai.js";
import { tutupMata } from "./animation/TutupMata.js";

export class RedPikmin {
    constructor(GL) {
        var headAndBody = new HeadAndBody(GL);
        this.badan = headAndBody.badan;
        this.kepala = headAndBody.kepala;

        this.antenna = new Antenna(GL, this.kepala);

        var limbs = new Limbs(GL, this.badan);
        this.lengan = limbs.lengan;
        this.kaki = limbs.kaki;

        // Pose diam: waktu dibuat tetap 0, jadi tidak ada gerakan
        jalan(this, 0);
        goyangTangkai(this, 5);
        tutupMata(this);   // lengan menutup mata (ubah sudutnya lewat parameter: tutupMata(this, sudutBahu, sudutSiku))
    }

    render(shaderVars, parentMatrix, time) {
        // Aktifkan baris ini kalau ingin karakter bergerak:
        jalan(this, time);
        goyangTangkai(this, time);

        var GL = this.badan.GL;
        GL.uniform1f(shaderVars.uIsRough, 0.0);
        GL.uniform1f(shaderVars.uUseVertexColor, 1.0);   // Red Pikmin memakai warna per-vertex (gradasi tangkai)
        this.badan.render(shaderVars, parentMatrix);
        GL.uniform1f(shaderVars.uUseVertexColor, 0.0);
    }
}
