import * as S from "../../../shared/buildersRed.js";
import { MyObject } from "../MyObject.js";
import { MERAH, HIJAU } from "../config.js";

function warnaTangkai(t) {
    var k = (t - 0.4) / 0.45;
    if (k < 0) k = 0;
    if (k > 1) k = 1;
    k = k * k * (3 - 2 * k);
    return [MERAH[0] + (HIJAU[0] - MERAH[0]) * k,
            MERAH[1] + (HIJAU[1] - MERAH[1]) * k,
            MERAH[2] + (HIJAU[2] - MERAH[2]) * k];
}

export class Antenna {
    constructor(GL, kepala) {
        this.titikTangkai = [[0, 0.85, 0], [0, 2.0, 0], [0.1, 3.3, 0], [0.8, 4.3, 0]];
        this.tangkai = new MyObject(GL, this.bentukTangkai());
        kepala.childs.push(this.tangkai);
        this.daun = new MyObject(GL, S.ellipsoid(0.8, 0.05, 0.4, HIJAU));
        kepala.childs.push(this.daun);
    }

    bentukTangkai() {
        return S.tubeBezier(this.titikTangkai, 0.42, 0.04, 2, 0, 1, warnaTangkai);
    }

    updateTangkai() {
        this.tangkai.updateShape(this.bentukTangkai());
    }
}
