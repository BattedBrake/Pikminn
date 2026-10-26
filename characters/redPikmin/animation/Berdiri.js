// Berdiri.js
// Pose normal Red Pikmin: lengan menjuntai miring 20 derajat ke luar, kaki lurus, badan tegak.

import { SUDUT_AWAL, PI } from "../config.js";

export function poseBerdiri(pikmin) {
    var pose = pikmin.pose;
    pose.badan.miring = 0;
    pose.badan.toleh = 0;
    pose.badan.naik = 0;
    ["kiri", "kanan"].forEach(function (sisi) {
        pose.lengan[sisi].bahuZ = SUDUT_AWAL * PI / 180;
        pose.lengan[sisi].bahuX = 0;
        pose.lengan[sisi].siku = 0;
        pose.kaki[sisi].pinggul = 0;
        pose.kaki[sisi].lutut = 0;
    });
}
