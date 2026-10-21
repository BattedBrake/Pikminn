// chest.js
// Model Minecraft Chest (low-poly, warna solid tanpa tekstur).
// Alas peti tepat di y = 0, jadi tinggal diletakkan di permukaan tanah.
//
//   var peti = new Chest(GL);
//   peti.bukaTutup(Math.PI / 3);   // opsional: buka tutup 60 derajat (0 = tertutup)
//   peti.render(shaderVars, parentMatrix);
import * as B from "../shared/buildersEnv.js";
import { EnvModel, T, RX, mul } from "./EnvModel.js";

const KAYU = B.hex(0xF9801D);    // kayu oak cokelat
const PERAK = B.hex(0xD0D0D0);
const LINE = B.hex(0x0000000);  

// Pivot engsel tutup di belakang peti
const ENGSEL = [0, 0.8, -0.7];

export class Chest {
    constructor(GL) {
        this.model = new EnvModel(GL);

        // --- 1. BADAN UTAMA PETI (lebar 1.4, tinggi 0.8, dalam 1.4), alas di y = 0 ---
        this.model.addPart(B.box(1.4, 0.8, 1.4), KAYU, T(0, 0.4, 0));

        // --- 2. BADAN UTAMA PETI (lebar 1.4, tinggi 0.8, dalam 1.4), alas di y = 0 ---
        this.model.addPart(B.box(1.46, 0.1, 1.46), LINE, T(0, 1, 0));

        // --- 3. BADAN UTAMA PETI (lebar 1.4, tinggi 0.8, dalam 1.4), alas di y = 0 ---
        this.model.addPart(B.box(1.46, 0.1, 1.46), LINE, T(0, 1.24, 0));

        // --- 3. BADAN UTAMA PETI (lebar 1.4, tinggi 0.8, dalam 1.4), alas di y = 0 ---
        this.model.addPart(B.box(1.46, 0.1, 1.46), LINE, T(0, 1.24, 0));

         // --- 3.LINE BERDIRI (lebar 1.4, tinggi 0.8, dalam 1.4), alas di y = 0 ---
        this.model.addPart(B.box(0.1, 1.25, 0.1), LINE, T(-0.68, 0.65 , 0.7));

        // --- 3.LINE BERDIRI (lebar 1.4, tinggi 0.8, dalam 1.4), alas di y = 0 ---
        this.model.addPart(B.box(0.1, 1.25, 0.1), LINE, T(0.68, 0.65 , 0.7));

         // --- 3.LINE BERDIRI (lebar 1.4, tinggi 0.8, dalam 1.4), alas di y = 0 ---
        this.model.addPart(B.box(0.1, 1.25, 0.1), LINE, T(0.68, 0.65 , -0.7));

         // --- 3.LINE BERDIRI (lebar 1.4, tinggi 0.8, dalam 1.4), alas di y = 0 ---
        this.model.addPart(B.box(0.1, 1.25, 0.1), LINE, T(-0.68, 0.65 , -0.7));

        // --- 3. BADAN UTAMA PETI (lebar 1.4, tinggi 0.8, dalam 1.4), alas di y = 0 ---
        this.model.addPart(B.box(1.46, 0.1, 1.46), LINE, T(0, 0, 0));

        // --- 2. TUTUP PETI: grup dengan pivot di engsel belakang, supaya bisa dibuka ---
        this.model.addGroup("tutup", T(ENGSEL[0], ENGSEL[1], ENGSEL[2]));
        this.model.addPart(B.box(1.4, 0.5, 1.4), KAYU, T(0, 0.25, 0.7), "tutup");

        // --- 3. GEMBOK DEPAN, menempel di tengah depan tutup ---
        this.model.addPart(B.box(0.2, 0.3, 0.1), PERAK, T(0, 0.15, 1.45), "tutup");
    }

    // sudut dalam radian: 0 = tertutup, makin besar makin terbuka
    bukaTutup(sudut) {
        this.model.setGroupMatrix("tutup", mul(T(ENGSEL[0], ENGSEL[1], ENGSEL[2]), RX(-sudut)));
    }

    render(shaderVars, parentMatrix) {
        this.model.render(shaderVars, parentMatrix);
    }
}
