import { PI } from "../config.js";

export function tPose(pikmin) {
    var pose = pikmin.pose;
    pose.badan.miring = 0;
    pose.badan.toleh = 0;
    pose.badan.naik = 0;
    pose.mata.pupil = 1;

    ["kiri", "kanan"].forEach(function (sisi) {
        pose.lengan[sisi].bahuZ = PI / 2;  // PI / 2 = 90 derajat (terangkat lurus ke samping / T-Pose)
        pose.lengan[sisi].bahuX = 0;
        pose.lengan[sisi].siku = 0;
        pose.kaki[sisi].pinggul = 0;
        pose.kaki[sisi].lutut = 0;
    });
}