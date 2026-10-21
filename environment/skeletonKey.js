// skeletonKey.js
// Model Skeleton Key (kunci antik kuningan) dengan gagang koin pipih.
// Ujung bawah kunci di y = 0, gagang di atas.
//
//   var kunci = new SkeletonKey(GL);
//   kunci.render(shaderVars, parentMatrix);
import * as B from "../shared/buildersEnv.js";
import { EnvModel, T, RX } from "./EnvModel.js";

const KUNINGAN = B.hex(0xC5A059);

export class SkeletonKey {
    constructor(GL) {
        var m = this.model = new EnvModel(GL);

        // --- 1. BATANG UTAMA (STEM) ---
        m.addPart(B.cylinder(0.06, 0.06, 1.2, 20), KUNINGAN, T(0, 0.6, 0));
        m.addPart(B.sphere(0.08, 16, 16), KUNINGAN, T(0, 0, 0));                  // ujung bawah
        m.addPart(B.cylinder(0.11, 0.11, 0.06, 20), KUNINGAN, T(0, 1.15, 0));     // ring leher

        // --- 2. GAGANG KOIN (COIN BOW) ---
        m.addGroup("gagang", T(0, 1.6, 0));
        m.addPart(B.cylinder(0.42, 0.42, 0.06, 32), KUNINGAN, RX(Math.PI / 2), "gagang");   // badan koin
        m.addPart(B.torus(0.42, 0.04, 32, 16), KUNINGAN, T(0, 0, 0), "gagang");              // pinggiran koin
        m.addPart(B.torus(0.15, 0.035, 24, 16), KUNINGAN, T(0, 0.52, 0), "gagang");          // ring gantungan

        // --- 3. GIGI KUNCI (BIT) ---
        m.addGroup("gigi", T(0, 0.25, 0));
        m.addPart(B.box(0.05, 0.38, 0.26), KUNINGAN, T(0, 0, 0.13), "gigi");        // pelat utama
        m.addPart(B.box(0.05, 0.09, 0.35), KUNINGAN, T(0, -0.12, 0.175), "gigi");   // gigi bawah
        m.addPart(B.box(0.05, 0.09, 0.31), KUNINGAN, T(0, 0.12, 0.155), "gigi");    // gigi atas
    }

    render(shaderVars, parentMatrix) {
        this.model.render(shaderVars, parentMatrix);
    }
}
