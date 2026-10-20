// Tes karakter template sendirian (buka characters/_template/index.html)
import { createScene } from "../../shared/renderer.js";
import { Environment } from "../../environment/Environment.js";
import { Template } from "./Template.js";

function main() {
    var scene = createScene(document.getElementById("mycanvas"));
    if (!scene) return;

    var environment = new Environment(scene.GL);
    var karakter = new Template(scene.GL);

    scene.run(function (shaderVars, root, time) {
        environment.render(shaderVars, root);
        karakter.render(shaderVars, root, time);
    });
}

window.addEventListener("load", main);
