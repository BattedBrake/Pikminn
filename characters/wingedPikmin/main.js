// Tes Winged Pikmin sendirian (buka characters/wingedPikmin/index.html)
import { createScene } from "../../shared/renderer.js";
import { Environment } from "../../environment/Environment.js";
import { WingedPikmin } from "./WingedPikmin.js";

function main() {
    var scene = createScene(document.getElementById("mycanvas"));
    if (!scene) return;

    var environment = new Environment(scene.GL);
    var wingedPikmin = new WingedPikmin(scene.GL);

    scene.run(function (shaderVars, root, time) {
        environment.render(shaderVars, root);
        wingedPikmin.render(shaderVars, root, time);
    });
}

window.addEventListener("load", main);
