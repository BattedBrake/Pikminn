import { createScene } from "../../shared/renderer.js";
import { Environment } from "../../environment/Environment.js";
import { WingedPikmin } from "./WingedPikmin.js";
import { Sun } from "../../environment/sun.js";

function main() {
    var scene = createScene(document.getElementById("mycanvas"));
    if (!scene) return;

    // 1. Inisialisasi Objek (Environment, WingedPikmin, dan Sun)
    var environment = new Environment(scene.GL);
    var wingedPikmin = new WingedPikmin(scene.GL);
    var sun = new Sun(scene.GL, wingedPikmin.sphereMesh || null); 

    // Tombol pilih pose (Normal / Terbang) di pojok kiri atas
    var tombolPose = document.querySelectorAll("#pilih-pose button");
    var tandaiAktif = function () {
        tombolPose.forEach(function (b) {
            b.classList.toggle("aktif", b.dataset.pose === wingedPikmin.namaPose);
        });
    };
    tombolPose.forEach(function (b) {
        b.addEventListener("click", function () {
            wingedPikmin.setPose(b.dataset.pose);
            tandaiAktif();
        });
    });
    tandaiAktif();


    scene.run(function (shaderVars, root, time) {
        sun.render(shaderVars, root, time);         
        environment.render(shaderVars, root);  
        wingedPikmin.render(shaderVars, root, time); 
    });
}

window.addEventListener("load", main);