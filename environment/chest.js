// chest.js
// Model Minecraft Chest (low-poly, warna solid tanpa tekstur).
// Alas peti tepat di y = 0, jadi tinggal diletakkan di permukaan tanah.
//
//   var peti = new Chest(GL);
//   peti.bukaTutup(Math.PI / 3);   // opsional: buka tutup 60 derajat (0 = tertutup)
//   peti.render(shaderVars, parentMatrix);
//
// Animasi untuk urutan di ADEGAN (main.js): tertutup, buka, terbuka, tutup.
// Pengaturan tambahan (opsional): sudut = lebar bukaan dalam radian (default SUDUT_BUKA).
import * as B from "../shared/buildersEnv.js";
import { ItemBergerak, T, RX, mul } from "./EnvModel.js";

const KAYU = B.hex(0xF9801D);    // kayu oak cokelat
const PERAK = B.hex(0xD0D0D0);
const LINE = B.hex(0x0000000);  

// Pivot engsel tutup di belakang peti
const ENGSEL = [0, 0.8, -0.7];
const SUDUT_BUKA = Math.PI / 2;

function halus(k) {   // mulai & berhenti pelan
    return k * k * (3 - 2 * k);
}

function sudutBuka(langkah) {
    return langkah && langkah.sudut !== undefined ? langkah.sudut : SUDUT_BUKA;
}

const DAFTAR_ANIMASI = {
    tertutup: function (item) { item.pose.tutup = 0; },
    buka: function (item, progres, waktu, langkah) { item.pose.tutup = sudutBuka(langkah) * halus(progres); },
    terbuka: function (item, progres, waktu, langkah) { item.pose.tutup = sudutBuka(langkah); },
    tutup: function (item, progres, waktu, langkah) { item.pose.tutup = sudutBuka(langkah) * (1 - halus(progres)); },
};

export class Chest extends ItemBergerak {
    constructor(GL) {
        super(GL, { tutup: 0 }, DAFTAR_ANIMASI);

        // --- 1. BADAN UTAMA PETI (lebar 1.4, tinggi 0.8, dalam 1.4), alas di y = 0 ---
        this.model.addPart(B.box(1.4, 0.8, 1.4), KAYU, T(0, 0.4, 0));

        // --- 2. GARIS HITAM BAGIAN BAWAH: bingkai alas + 4 tiang sudut sampai batas tutup ---
        this.model.addPart(B.box(1.46, 0.1, 1.46), LINE, T(0, 0, 0));
        var tiangBawah = B.box(0.1, 0.775, 0.1);
        this.model.addPart(tiangBawah, LINE, T(-0.68, 0.4125, 0.7));
        this.model.addPart(tiangBawah, LINE, T(0.68, 0.4125, 0.7));
        this.model.addPart(tiangBawah, LINE, T(0.68, 0.4125, -0.7));
        this.model.addPart(tiangBawah, LINE, T(-0.68, 0.4125, -0.7));

        // --- 3. TUTUP PETI: grup dengan pivot di engsel belakang, supaya bisa dibuka ---
        this.model.addGroup("tutup", T(ENGSEL[0], ENGSEL[1], ENGSEL[2]));
        this.model.addPart(B.box(1.4, 0.5, 1.4), KAYU, T(0, 0.25, 0.7), "tutup");

        // Garis hitam bagian tutup ikut terangkat bersama tutup
        var bingkaiTutup = B.box(1.46, 0.1, 1.46);
        this.model.addPart(bingkaiTutup, LINE, T(0, 0.2, 0.7), "tutup");
        this.model.addPart(bingkaiTutup, LINE, T(0, 0.44, 0.7), "tutup");
        var tiangAtas = B.box(0.1, 0.475, 0.1);
        this.model.addPart(tiangAtas, LINE, T(-0.68, 0.2375, 1.4), "tutup");
        this.model.addPart(tiangAtas, LINE, T(0.68, 0.2375, 1.4), "tutup");
        this.model.addPart(tiangAtas, LINE, T(0.68, 0.2375, 0), "tutup");
        this.model.addPart(tiangAtas, LINE, T(-0.68, 0.2375, 0), "tutup");

        // --- 4. GEMBOK DEPAN, menempel di tengah depan tutup ---
        this.model.addPart(B.box(0.2, 0.3, 0.1), PERAK, T(0, 0.15, 1.45), "tutup");
    }

    // sudut dalam radian: 0 = tertutup, makin besar makin terbuka
    bukaTutup(sudut) {
        this.pose.tutup = sudut;
    }

    terapkanPose(parentMatrix) {
        this.model.setGroupMatrix("tutup", mul(T(ENGSEL[0], ENGSEL[1], ENGSEL[2]), RX(-this.pose.tutup)));
        return parentMatrix;
    }
}
