import { LIBS } from '../../../shared/libs.js';

export class Antenna {
    constructor(gl, curvedStemMesh, sphereMesh, leafMesh) { // 💡 Ganti nama parameter biar jelas kalau ini mesh tangkai kurva
        this.gl = gl;
        this.curvedStemMesh = curvedStemMesh; // Mesh Tangkai Kurva
        this.sphereMesh = sphereMesh;         // Mesh Biji Bunga
        this.leafMesh = leafMesh;             // Mesh Kelopak
        this.numPetals = 5;

        // 1. Buffer Tangkai Kurva
        this.stemVB = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.stemVB);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(curvedStemMesh.vertices), gl.STATIC_DRAW);
        this.stemIB = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.stemIB);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(curvedStemMesh.faces), gl.STATIC_DRAW);

        // 2. Buffer Biji Bunga
        this.seedVB = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.seedVB);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphereMesh.vertices), gl.STATIC_DRAW);
        this.seedIB = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.seedIB);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(sphereMesh.faces), gl.STATIC_DRAW);

        // 3. Buffer Kelopak
        this.leafVB = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.leafVB);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(leafMesh.vertices), gl.STATIC_DRAW);
        this.leafIB = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.leafIB);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(leafMesh.faces), gl.STATIC_DRAW);
    }

    render(shaderVars, mouseRot, wobbleFactor) {
        const GL = this.gl;
        const STRIDE = 4 * 9;

        // =========================================================
        // 1. RENDER TANGKAI (Curved Stem Berbasis Grafik Kurva)
        // =========================================================
        GL.bindBuffer(GL.ARRAY_BUFFER, this.stemVB);
        GL.vertexAttribPointer(shaderVars.position, 3, GL.FLOAT, false, STRIDE, 0);
        GL.vertexAttribPointer(shaderVars.normal, 3, GL.FLOAT, false, STRIDE, 4 * 3);
        GL.vertexAttribPointer(shaderVars.color, 3, GL.FLOAT, false, STRIDE, 4 * 6);
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.stemIB);

        var LOCAL_STEM = LIBS.get_I4();
        LIBS.translateY(LOCAL_STEM, 0.8);              // Tumbuh dari atas kepala
        LIBS.rotateZ(LOCAL_STEM, wobbleFactor * 1.5);   // Efek Goyang / Wobble
        LIBS.rotateY(LOCAL_STEM, Math.PI);

        var FINAL_STEM = LIBS.get_I4();
        LIBS.multiply(FINAL_STEM, mouseRot, LOCAL_STEM);

        GL.uniform1f(shaderVars.uIsRough, 1.0);
        GL.uniform3f(shaderVars.uColor, 0.92, 0.22, 0.58); // Warna Hijau Tangkai
        GL.uniformMatrix4fv(shaderVars.mMmatrix, false, FINAL_STEM);
        GL.drawElements(GL.TRIANGLES, this.curvedStemMesh.faces.length, GL.UNSIGNED_SHORT, 0);

        // =========================================================
        // 2. RENDER BIJI HIJAU (Di Ujung Tangkai Kurva)
        // =========================================================
        GL.bindBuffer(GL.ARRAY_BUFFER, this.seedVB);
        GL.vertexAttribPointer(shaderVars.position, 3, GL.FLOAT, false, STRIDE, 0);
        GL.vertexAttribPointer(shaderVars.normal, 3, GL.FLOAT, false, STRIDE, 4 * 3);
        GL.vertexAttribPointer(shaderVars.color, 3, GL.FLOAT, false, STRIDE, 4 * 6);
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.seedIB);

        var LOCAL_OVAL_ANT = LIBS.get_I4();
        LIBS.translateY(LOCAL_OVAL_ANT, 3.5); 
        LIBS.translateZ(LOCAL_OVAL_ANT, -0.25);
        LIBS.scale(LOCAL_OVAL_ANT, 0.1, 0.2, 0.1);

        var FINAL_OVAL_ANT = LIBS.get_I4();
        LIBS.multiply(FINAL_OVAL_ANT, LOCAL_STEM, LOCAL_OVAL_ANT);
        LIBS.multiply(FINAL_OVAL_ANT, mouseRot, FINAL_OVAL_ANT);

        GL.uniform3f(shaderVars.uColor, 0.45, 0.78, 0.25);
        GL.uniformMatrix4fv(shaderVars.mMmatrix, false, FINAL_OVAL_ANT);
        GL.drawElements(GL.TRIANGLES, this.sphereMesh.faces.length, GL.UNSIGNED_SHORT, 0);

        // =========================================================
        // 3. RENDER KELOPAK BUNGA (Melingkar di Atas Tangkai)
        // =========================================================
        GL.bindBuffer(GL.ARRAY_BUFFER, this.leafVB);
        GL.vertexAttribPointer(shaderVars.position, 3, GL.FLOAT, false, STRIDE, 0);
        GL.vertexAttribPointer(shaderVars.normal, 3, GL.FLOAT, false, STRIDE, 4 * 3);
        GL.vertexAttribPointer(shaderVars.color, 3, GL.FLOAT, false, STRIDE, 4 * 6);
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.leafIB);

        GL.uniform3f(shaderVars.uColor, 0.32, 0.38, 0.88);

        for (var i = 0; i < this.numPetals; i++) {
            var angle = (i / this.numPetals) * Math.PI * 2;
            var LOCAL_LEAF = LIBS.get_I4();

            LIBS.translateY(LOCAL_LEAF, 3.45);
            LIBS.translateZ(LOCAL_LEAF, -0.4);
            LIBS.rotateY(LOCAL_LEAF, angle);
            LIBS.rotateX(LOCAL_LEAF, Math.PI / 5);

            var FINAL_LEAF = LIBS.get_I4();
            LIBS.multiply(FINAL_LEAF, LOCAL_STEM, LOCAL_LEAF);
            LIBS.multiply(FINAL_LEAF, mouseRot, FINAL_LEAF);

            GL.uniformMatrix4fv(shaderVars.mMmatrix, false, FINAL_LEAF);
            GL.drawElements(GL.TRIANGLES, this.leafMesh.faces.length, GL.UNSIGNED_SHORT, 0);
        }
    }
}