import * as builder from "../../shared/buildersWinged.js";

// Import Komponen Modul OOP
import { HeadAndBody } from "./bodyParts/HeadAndBody.js";
import { Limbs } from "./bodyParts/Limbs.js";
import { Antenna } from "./bodyParts/Antenna.js";
import { Wings } from "./bodyParts/Wings.js";

/*
 * Winged Pikmin: gabungan semua bodyParts jadi satu karakter.
 *
 * Interface wajib setiap karakter (supaya bisa digabung di index.html terluar):
 *   constructor(GL)
 *   render(shaderVars, parentMatrix, time)
 */
export class WingedPikmin {
    constructor(GL) {
        var sphereMesh = builder.generateEllipsoid(1.2, 1.0, 1.2, 30, 20, 1.0, 0.41, 0.71);
        var curvedConeMesh = builder.generateCurvedCone(0.25, 1.8, 20, 16, 0.9, 0.2, 0.5);
        var handMesh = builder.generateCurvedConeHand(0.2, 0.8, 20, 16, 1.0, 0.41, 0.71);

        // Jari berbentuk pengait
        var fingerMesh = builder.generateHookFinger(0.15, 0.7, 20, 12, 1.0, 0.41, 0.71);

        var wingMesh = builder.generateParaboloidWing(2.5, 4.0, 1.2, 40, 32);
        var leafMesh = builder.generateLeaf(1.4, 0.8, 35);

        this.headAndBody = new HeadAndBody(GL, sphereMesh);
        this.limbs = new Limbs(GL, handMesh, sphereMesh, fingerMesh);
        this.antenna = new Antenna(GL, curvedConeMesh, sphereMesh, leafMesh);
        this.wing = new Wings(GL, wingMesh);
    }

    render(shaderVars, parentMatrix, time) {
        var wobbleFactor = Math.sin(time) * 0.1;

        this.headAndBody.render(shaderVars, parentMatrix);
        this.limbs.render(shaderVars, parentMatrix);
        this.antenna.render(shaderVars, parentMatrix, wobbleFactor);
        this.wing.render(shaderVars, parentMatrix, time);
    }
}
