import { createScene, place } from "./shared/renderer.js";
import { Environment } from "./environment/Environment.js";

// Import karakter dari tiap anggota kelompok
import { WingedPikmin } from "./characters/wingedPikmin/WingedPikmin.js";

function main() {
    var scene = createScene(document.getElementById("mycanvas"));
    if (!scene) return;

    var environment = new Environment(scene.GL);
    var wingedPikmin = new WingedPikmin(scene.GL);
    // Tambah karakter baru di sini, contoh:
    // var karakter2 = new Karakter2(scene.GL);

    scene.run(function (shaderVars, root, time) {
        environment.render(shaderVars, root);
        wingedPikmin.render(shaderVars, place(root, 0, 0, 0), time);
        // karakter2.render(shaderVars, place(root, 6, 0, 0), time);
    });
}

window.addEventListener("load", main);
