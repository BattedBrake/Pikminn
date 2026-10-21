import { LIBS } from "../../shared/libs.js";
import * as builder from "../../shared/buildersWinged.js";

export class Template {
    constructor(GL) {
        this.gl = GL;
        this.mesh = builder.generateEllipsoid(1.0, 1.0, 1.0, 30, 20);

        this.vertexBuffer = GL.createBuffer();
        GL.bindBuffer(GL.ARRAY_BUFFER, this.vertexBuffer);
        GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(this.mesh.vertices), GL.STATIC_DRAW);

        this.indexBuffer = GL.createBuffer();
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.mesh.faces), GL.STATIC_DRAW);
    }

    render(shaderVars, parentMatrix, time) {
        const GL = this.gl;
        const STRIDE = 4 * 9;

        GL.bindBuffer(GL.ARRAY_BUFFER, this.vertexBuffer);
        GL.vertexAttribPointer(shaderVars.position, 3, GL.FLOAT, false, STRIDE, 0);
        GL.vertexAttribPointer(shaderVars.normal, 3, GL.FLOAT, false, STRIDE, 4 * 3);
        GL.vertexAttribPointer(shaderVars.color, 3, GL.FLOAT, false, STRIDE, 4 * 6);
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

        // --- BADAN (contoh: bola yang naik-turun) ---
        var LOCAL_BODY = LIBS.get_I4();
        LIBS.translateY(LOCAL_BODY, Math.sin(time) * 0.3);
        var FINAL_BODY = LIBS.get_I4();
        LIBS.multiply(FINAL_BODY, parentMatrix, LOCAL_BODY);

        GL.uniform3f(shaderVars.uColor, 0.9, 0.8, 0.2);
        GL.uniformMatrix4fv(shaderVars.mMmatrix, false, FINAL_BODY);
        GL.drawElements(GL.TRIANGLES, this.mesh.faces.length, GL.UNSIGNED_SHORT, 0);
    }
}
