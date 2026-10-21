// Tes Red Pikmin sendirian (buka characters/redPikmin/index.html)
import { createScene, place } from "../../shared/renderer.js";
import { RedPikmin } from "./RedPikmin.js";

function main() {
    var scene = createScene(document.getElementById("mycanvas"));
    if (!scene) return;

    var redPikmin = new RedPikmin(scene.GL);

    scene.run(function (shaderVars, root, time) {
        redPikmin.render(shaderVars, place(root, 0, -2, 0), time);
    });
}

window.addEventListener("load", main);
