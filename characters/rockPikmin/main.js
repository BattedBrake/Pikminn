// Tes Rock Pikmin sendirian (buka characters/rockPikmin/index.html)
import { createScene, place } from "../../shared/renderer.js";
import { RockPikmin } from "./RockPikmin.js";
import { MATERIAL } from "./config.js";

function main() {
    var scene = createScene(document.getElementById("mycanvas"));
    if (!scene) return;

    var rockPikmin = new RockPikmin(scene.GL);

    // Slider material badan: mengubah MATERIAL.badan secara langsung (hanya selama halaman terbuka).
    // Kalau sudah cocok, salin angka di bawah slider ke MATERIAL.badan di config.js.
    var salin = document.getElementById("salin");
    var tulisSalin = function () {
        var m = MATERIAL.badan;
        salin.textContent = "badan: { kilap: " + m.kilap + ", kekuatanKilap: " + m.kekuatanKilap +
            ", tekstur: " + m.tekstur + ", skalaTekstur: " + m.skalaTekstur + " },";
    };
    document.querySelectorAll("#material input").forEach(function (input) {
        var kunci = input.dataset.kunci;
        var label = document.querySelector('[data-nilai="' + kunci + '"]');
        input.value = MATERIAL.badan[kunci];
        label.textContent = MATERIAL.badan[kunci];
        input.addEventListener("input", function () {
            MATERIAL.badan[kunci] = parseFloat(input.value);
            label.textContent = input.value;
            tulisSalin();
        });
    });
    tulisSalin();

    scene.run(function (shaderVars, root, time) {
        // telapak di y = 0 model; diturunkan & diperbesar supaya pas di layar
        rockPikmin.render(shaderVars, place(root, 0, -3.5, 0, 2), time);
    });
}

window.addEventListener("load", main);
