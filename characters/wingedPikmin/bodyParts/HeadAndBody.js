import { LIBS } from '../../../shared/libs.js';

export class HeadAndBody {
    constructor(gl, sphereMesh) {
        this.gl = gl;
        this.sphereMesh = sphereMesh;

        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphereMesh.vertices), gl.STATIC_DRAW);

        this.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(sphereMesh.faces), gl.STATIC_DRAW);
    }

    // headMatrix = sendi kepala (kepala & mata), bodyMatrix = sendi badan
    render(shaderVars, headMatrix, bodyMatrix) {
        const GL = this.gl;
        const STRIDE = 4 * 9;

        GL.bindBuffer(GL.ARRAY_BUFFER, this.vertexBuffer);
        GL.vertexAttribPointer(shaderVars.position, 3, GL.FLOAT, false, STRIDE, 0);
        GL.vertexAttribPointer(shaderVars.normal, 3, GL.FLOAT, false, STRIDE, 4 * 3);
        GL.vertexAttribPointer(shaderVars.color, 3, GL.FLOAT, false, STRIDE, 4 * 6);
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

        // --- KEPALA ---
        var MATRIX_OVAL_1 = LIBS.get_I4();
        LIBS.multiply(MATRIX_OVAL_1, headMatrix, LIBS.get_I4());
        GL.uniform3f(shaderVars.uColor, 0.92, 0.22, 0.58);
        GL.uniformMatrix4fv(shaderVars.mMmatrix, false, MATRIX_OVAL_1);
        GL.drawElements(GL.TRIANGLES, this.sphereMesh.faces.length, GL.UNSIGNED_SHORT, 0);

        // --- BADAN ---
        var LOCAL_OVAL_2 = LIBS.get_I4();
        LIBS.translateX(LOCAL_OVAL_2, 0.0);
        LIBS.translateY(LOCAL_OVAL_2, -1.2);
        LIBS.scale(LOCAL_OVAL_2, 0.6, 0.9, 0.6); 
        var FINAL_OVAL_2 = LIBS.get_I4();
        LIBS.multiply(FINAL_OVAL_2, bodyMatrix, LOCAL_OVAL_2);
        GL.uniform3f(shaderVars.uColor, 0.92, 0.22, 0.58);
        GL.uniformMatrix4fv(shaderVars.mMmatrix, false, FINAL_OVAL_2);
        GL.drawElements(GL.TRIANGLES, this.sphereMesh.faces.length, GL.UNSIGNED_SHORT, 0);

        var LOCAL_OVAL_3 = LIBS.get_I4();
        LIBS.translateX(LOCAL_OVAL_3, 0.2);
        LIBS.translateY(LOCAL_OVAL_3, -1.7);
        LIBS.translateZ(LOCAL_OVAL_3, -0.3);
        LIBS.scale(LOCAL_OVAL_3, 0.3, 0.3, 0.3);
        var FINAL_OVAL_3 = LIBS.get_I4();
        LIBS.multiply(FINAL_OVAL_3, bodyMatrix, LOCAL_OVAL_3);
        GL.uniform3f(shaderVars.uColor, 0.92, 0.22, 0.58);
        GL.uniformMatrix4fv(shaderVars.mMmatrix, false, FINAL_OVAL_3);
        GL.drawElements(GL.TRIANGLES, this.sphereMesh.faces.length, GL.UNSIGNED_SHORT, 0);

        var LOCAL_OVAL_4 = LIBS.get_I4();
        LIBS.translateX(LOCAL_OVAL_4, -0.2);
        LIBS.translateY(LOCAL_OVAL_4, -1.7);
        LIBS.translateZ(LOCAL_OVAL_4, -0.3);
        LIBS.scale(LOCAL_OVAL_4, 0.3, 0.3, 0.3);
        var FINAL_OVAL_4 = LIBS.get_I4();
        LIBS.multiply(FINAL_OVAL_4, bodyMatrix, LOCAL_OVAL_4);
        GL.uniform3f(shaderVars.uColor, 0.92, 0.22, 0.58);
        GL.uniformMatrix4fv(shaderVars.mMmatrix, false, FINAL_OVAL_4);
        GL.drawElements(GL.TRIANGLES, this.sphereMesh.faces.length, GL.UNSIGNED_SHORT, 0);

        var LOCAL_OVAL_5 = LIBS.get_I4();
        LIBS.translateX(LOCAL_OVAL_5, 0);
        LIBS.translateY(LOCAL_OVAL_5, -1.3);
        LIBS.translateZ(LOCAL_OVAL_5, 0);
        LIBS.scale(LOCAL_OVAL_5, 0.6, 0.6, 0.6);
        var FINAL_OVAL_5 = LIBS.get_I4();
        LIBS.multiply(FINAL_OVAL_5, bodyMatrix, LOCAL_OVAL_5);
        GL.uniform3f(shaderVars.uColor, 1.0, 0.10, 0.90);
        GL.uniformMatrix4fv(shaderVars.mMmatrix, false, FINAL_OVAL_5);
        GL.drawElements(GL.TRIANGLES, this.sphereMesh.faces.length, GL.UNSIGNED_SHORT, 0);


        // --- MATA KIRI ---
        var LOCAL_OVAL_MATA1 = LIBS.get_I4();
        LIBS.translateX(LOCAL_OVAL_MATA1, -0.6);
        LIBS.translateY(LOCAL_OVAL_MATA1, 0.2);
        LIBS.translateZ(LOCAL_OVAL_MATA1, 1.2);
        LIBS.scale(LOCAL_OVAL_MATA1, 0.5, 0.565, 0.1);
        var FINAL_OVAL_MATA1 = LIBS.get_I4();
        LIBS.multiply(FINAL_OVAL_MATA1, headMatrix, LOCAL_OVAL_MATA1);
        GL.uniform3f(shaderVars.uColor, 0.28, 0.78, 0.92);
        GL.uniformMatrix4fv(shaderVars.mMmatrix, false, FINAL_OVAL_MATA1);
        GL.drawElements(GL.TRIANGLES, this.sphereMesh.faces.length, GL.UNSIGNED_SHORT, 0);

        // --- MATA KANAN ---
        var LOCAL_OVAL_MATA2 = LIBS.get_I4();
        LIBS.translateX(LOCAL_OVAL_MATA2, 0.6);
        LIBS.translateY(LOCAL_OVAL_MATA2, 0.2);
        LIBS.translateZ(LOCAL_OVAL_MATA2, 1.2);
        LIBS.scale(LOCAL_OVAL_MATA2, 0.5, 0.565, 0.1); 
        var FINAL_OVAL_MATA2 = LIBS.get_I4();
        LIBS.multiply(FINAL_OVAL_MATA2, headMatrix, LOCAL_OVAL_MATA2);
        GL.uniform3f(shaderVars.uColor, 0.28, 0.78, 0.92);
        GL.uniformMatrix4fv(shaderVars.mMmatrix, false, FINAL_OVAL_MATA2);
        GL.drawElements(GL.TRIANGLES, this.sphereMesh.faces.length, GL.UNSIGNED_SHORT, 0);
    }
}