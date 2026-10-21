import * as builder from "../../shared/buildersWinged.js";
import { T, RX, mul } from "./matrix.js";

// Import Komponen Modul OOP
import { HeadAndBody } from "./bodyParts/HeadAndBody.js";
import { Limbs } from "./bodyParts/Limbs.js";
import { Antenna } from "./bodyParts/Antenna.js";
import { Wings } from "./bodyParts/Wings.js";

import { poseBerdiri } from "./animation/Berdiri.js";
import { poseTerbang } from "./animation/Terbang.js";

// Daftar pose yang bisa dipilih lewat setPose(nama)
const DAFTAR_POSE = {
    normal: poseBerdiri,
    terbang: poseTerbang,
};

const LEHER_Y = -0.5;

export class WingedPikmin {
    constructor(GL, namaPose = "terbang") {
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

        // Pose diatur oleh file di folder animation/
        this.pose = {
            kepala: 0,
            badan: 0,
            lengan: { angkat: 0, ayun: 0, siku: 0 },
            kaki: { ayun: 0 },
        };
        this.setPose(namaPose);
    }

    // nama = "normal" atau "terbang"
    setPose(nama) {
        if (!DAFTAR_POSE[nama]) {
            console.warn("Pose tidak dikenal: " + nama);
            return;
        }
        DAFTAR_POSE[nama](this);
        this.namaPose = nama;
    }

    render(shaderVars, parentMatrix, time) {
        // Antena bergoyang dan sayap mengepak mengikuti waktu
        var wobbleFactor = Math.sin(time) * 0.1;

        var pose = this.pose;
        var HEAD = mul(parentMatrix, RX(pose.kepala));
        var BODY = mul(parentMatrix, T(0, LEHER_Y, 0), RX(pose.badan), T(0, -LEHER_Y, 0));

        this.headAndBody.render(shaderVars, HEAD, BODY);
        this.limbs.render(shaderVars, BODY, pose);
        this.antenna.render(shaderVars, HEAD, wobbleFactor);
        this.wing.render(shaderVars, BODY, time);
    }
}
