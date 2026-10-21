import { createScene, place } from "./shared/renderer.js";
import { Sun } from "./environment/sun.js";
import { Environment, tinggiTanah } from "./environment/Environment.js";

import { WingedPikmin } from "./characters/wingedPikmin/WingedPikmin.js";
import { RedPikmin } from "./characters/redPikmin/RedPikmin.js";
import { RockPikmin } from "./characters/rockPikmin/RockPikmin.js";

import { Chest } from "./environment/chest.js";
import { SkeletonKey } from "./environment/skeletonKey.js";
import { Kopdes } from "./environment/kopdes.js";

function main() {
    var scene = createScene(document.getElementById("mycanvas"));
    if (!scene) return;

    var environment = new Environment(scene.GL);
    var wingedPikmin = new WingedPikmin(scene.GL);
    var redPikmin = new RedPikmin(scene.GL);
    var rockPikmin = new RockPikmin(scene.GL);


    var sun = new Sun(scene.GL); 
    var chest = new Chest(scene.GL);
    var kunci = new SkeletonKey(scene.GL);
    var kopdes = new Kopdes(scene.GL);


    scene.run(function (shaderVars, root, time) {
        sun.render(shaderVars, root, time);        
        environment.render(shaderVars, root);  

        // Item environment: place(root, x, y, z, skala), y = tinggiTanah(x, z) supaya menempel di pasir
        kopdes.render(shaderVars, place(root, 0, tinggiTanah(0, -14), -14, 2.8));
        chest.render(shaderVars, place(root, -7, tinggiTanah(-7, 1), 1, 2.5));
        kunci.render(shaderVars, place(root, 7, tinggiTanah(7, 1), 1, 2.5));
        
        wingedPikmin.render(shaderVars, place(root, -3, 0, 0), time);
        redPikmin.render(shaderVars, place(root, 3, -1.5, 0, 0.75), time); 
        rockPikmin.render(shaderVars, place(root, 0, tinggiTanah(1,0), 1.5, 1.5), time);   // telapak di tanah
    });
}

window.addEventListener("load", main);