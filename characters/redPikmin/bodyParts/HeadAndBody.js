import { LIBS } from "../../../shared/libs.js";
import * as S from "../../../shared/buildersRed.js";
import { MyObject } from "../MyObject.js";
import { PI, MERAH, MERAH_TUA, PUTIH, HITAM } from "../config.js";

export class HeadAndBody {
    constructor(GL) {
        // ---------- BADAN (root) : ellipsoid ----------
        this.badan = new MyObject(GL, S.ellipsoid(0.9, 1.38, 0.65, MERAH));

        // ---------- KEPALA : ellipsoid, pusatnya 2.1 di atas pusat badan ----------
        this.kepala = new MyObject(GL, S.ellipsoid(0.85, 1.25, 0.85, MERAH));
        LIBS.set_position(this.kepala.MOVE_MATRIX, 0, 2.1, 0);
        this.badan.childs.push(this.kepala);

        // Hidung : cone, diputar 90 derajat supaya menghadap ke depan (sumbu z)
        this.hidung = new MyObject(GL, S.cone(0.18, 0.6, MERAH_TUA));
        LIBS.rotateX(this.hidung.MOVE_MATRIX, PI / 2);
        LIBS.set_position(this.hidung.MOVE_MATRIX, 0, -0.20, 0.81);
        this.kepala.childs.push(this.hidung);

        // Mata & pupil : ellipsoid (sx = -1 untuk kiri, 1 untuk kanan)
        for (var sx of [-1, 1]) {
            var mata = new MyObject(GL, S.ellipsoid(0.36, 0.27, 0.22, PUTIH));
            LIBS.rotateX(mata.MOVE_MATRIX, -Math.PI / 60);        
            LIBS.rotateY(mata.MOVE_MATRIX, sx * Math.PI / 6);      
            LIBS.set_position(mata.MOVE_MATRIX, sx * 0.6, 0.2, 0.58);   
            var pupil = new MyObject(GL, S.ellipsoid(0.14, 0.15, 0.07, HITAM));
            LIBS.set_position(pupil.MOVE_MATRIX, -sx * 0.02, 0, 0.17);
            mata.childs.push(pupil);
            this.kepala.childs.push(mata);
        }
    }
}
