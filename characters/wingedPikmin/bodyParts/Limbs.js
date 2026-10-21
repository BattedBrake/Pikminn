import { LIBS } from '../../../shared/libs.js';
import { T, S, RX, RY, RZ, mul } from '../matrix.js';

export class Limbs {
    constructor(gl, handMesh, sphereMesh, fingerMesh) {
        this.gl = gl;
        this.handMesh = handMesh;     
        this.sphereMesh = sphereMesh; 
        this.fingerMesh = fingerMesh || handMesh; 

        // Buffer Lengan Utama & Kaki
        this.handVB = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.handVB);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(handMesh.vertices), gl.STATIC_DRAW);
        this.handIB = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.handIB);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(handMesh.faces), gl.STATIC_DRAW);

        // Buffer Bola Pergelangan
        this.sphereVB = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.sphereVB);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphereMesh.vertices), gl.STATIC_DRAW);
        this.sphereIB = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.sphereIB);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(sphereMesh.faces), gl.STATIC_DRAW);

        // Buffer Jari
        this.fingerVB = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.fingerVB);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.fingerMesh.vertices), gl.STATIC_DRAW);
        this.fingerIB = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.fingerIB);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.fingerMesh.faces), gl.STATIC_DRAW);
    }

    // bodyMatrix = sendi badan (tangan & kaki menempel ke badan)
    // pose.lengan = { angkat, ayun, siku }, pose.kaki = { ayun }  (radian, 0 = pose berdiri asli)
    render(shaderVars, bodyMatrix, pose) {
        const GL = this.gl;
        const STRIDE = 4 * 9;

        GL.uniform1f(shaderVars.uIsRough, 1.0);
        GL.uniform3f(shaderVars.uColor, 0.92, 0.22, 0.58);

        const bindMesh = (vb, ib) => {
            GL.bindBuffer(GL.ARRAY_BUFFER, vb);
            GL.vertexAttribPointer(shaderVars.position, 3, GL.FLOAT, false, STRIDE, 0);
            GL.vertexAttribPointer(shaderVars.normal, 3, GL.FLOAT, false, STRIDE, 4 * 3);
            GL.vertexAttribPointer(shaderVars.color, 3, GL.FLOAT, false, STRIDE, 4 * 6);
            GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, ib);
        };
        const drawHand = (M) => {
            GL.uniformMatrix4fv(shaderVars.mMmatrix, false, M);
            GL.drawElements(GL.TRIANGLES, this.handMesh.faces.length, GL.UNSIGNED_SHORT, 0);
        };
        // Bola penutup sendi (radius r). sphereMesh berukuran 1.2 x 1.0 x 1.2, jadi x & z dibagi 1.2
        const drawJoint = (M, r) => {
            GL.uniformMatrix4fv(shaderVars.mMmatrix, false, mul(M, S(r / 1.2, r, r / 1.2)));
            GL.drawElements(GL.TRIANGLES, this.sphereMesh.faces.length, GL.UNSIGNED_SHORT, 0);
        };

        var lengan = pose.lengan, kaki = pose.kaki;

        // =========================================================
        // 1. RANTAI SENDI: badan -> bahu -> lengan atas -> siku -> lengan bawah
        //                  badan -> pinggul -> kaki
        // Pivot setiap sendi ada di pangkal mesh-nya, jadi saat diputar pangkalnya tetap menempel.
        // =========================================================
        const BAHU = [0.35, -0.75, 0];
        const SIKU = [0.8, -0.3, 0.15];          // posisi siku di dalam ruang lengan atas
        const PINGGUL = [0.18, -1.7, 0.1];

        // --- TANGAN KANAN ---
        var BAHU_KANAN = mul(bodyMatrix, T(BAHU[0], BAHU[1], BAHU[2]), RX(lengan.ayun), RZ(lengan.angkat));
        var FINAL_HAND_RIGHT = mul(BAHU_KANAN, RZ(-Math.PI / 12));
        var SIKU_KANAN = mul(FINAL_HAND_RIGHT, T(SIKU[0], SIKU[1], SIKU[2]), RY(-lengan.siku));
        var FINAL_RIGHT_FOREARM = mul(SIKU_KANAN, S(0.4, 0.4, 0.3));

        // --- TANGAN KIRI (cermin dari kanan) ---
        var BAHU_KIRI = mul(bodyMatrix, T(-BAHU[0], BAHU[1], BAHU[2]), RX(lengan.ayun), RZ(-lengan.angkat));
        var FINAL_HAND_LEFT = mul(BAHU_KIRI, RZ(Math.PI / 12), S(-1.0, 1.0, 1.0));
        var SIKU_KIRI = mul(FINAL_HAND_LEFT, T(SIKU[0], SIKU[1], SIKU[2]), RY(-lengan.siku));
        var FINAL_LEFT_FOREARM = mul(SIKU_KIRI, S(0.4, 0.4, 0.3));

        // --- KAKI (rotasi & skala asli, lalu ayunan di pinggul) ---
        var BENTUK_KAKI_KANAN = LIBS.get_I4();
        LIBS.scale(BENTUK_KAKI_KANAN, 0.75, 1, 1);
        LIBS.rotateY(BENTUK_KAKI_KANAN, -Math.PI / 6);
        LIBS.rotateX(BENTUK_KAKI_KANAN, Math.PI / 3);
        LIBS.rotateZ(BENTUK_KAKI_KANAN, -Math.PI / 8);
        var PINGGUL_KANAN = mul(bodyMatrix, T(PINGGUL[0], PINGGUL[1], PINGGUL[2]), RX(kaki.ayun));
        var FINAL_LEG_RIGHT = mul(PINGGUL_KANAN, BENTUK_KAKI_KANAN);

        var BENTUK_KAKI_KIRI = LIBS.get_I4();
        LIBS.scale(BENTUK_KAKI_KIRI, -0.75, 1, 1);
        LIBS.rotateY(BENTUK_KAKI_KIRI, Math.PI / 6);
        LIBS.rotateX(BENTUK_KAKI_KIRI, Math.PI / 3);
        LIBS.rotateZ(BENTUK_KAKI_KIRI, Math.PI / 8);
        var PINGGUL_KIRI = mul(bodyMatrix, T(-PINGGUL[0], PINGGUL[1], PINGGUL[2]), RX(kaki.ayun));
        var FINAL_LEG_LEFT = mul(PINGGUL_KIRI, BENTUK_KAKI_KIRI);

        // Gambar lengan atas, lengan bawah, dan kaki
        bindMesh(this.handVB, this.handIB);
        drawHand(FINAL_HAND_RIGHT);
        drawHand(FINAL_RIGHT_FOREARM);
        drawHand(FINAL_HAND_LEFT);
        drawHand(FINAL_LEFT_FOREARM);
        drawHand(FINAL_LEG_RIGHT);
        drawHand(FINAL_LEG_LEFT);

        // Tambalan sendi: bola di bahu, siku, dan pinggul supaya tidak terlihat lepas saat diputar
        bindMesh(this.sphereVB, this.sphereIB);
        drawJoint(BAHU_KANAN, 0.2);
        drawJoint(BAHU_KIRI, 0.2);
        drawJoint(SIKU_KANAN, 0.09);
        drawJoint(SIKU_KIRI, 0.09);
        drawJoint(PINGGUL_KANAN, 0.17);
        drawJoint(PINGGUL_KIRI, 0.17);


        // =========================================================
        // 2. HELPER JARI TANGAN & WRIST
        // =========================================================
        const drawWristAndFingers = (parentForearmMatrix, fingerCount = 5) => {
            var LOCAL_WRIST_POS = LIBS.get_I4();
            LIBS.translateX(LOCAL_WRIST_POS, 0.9);
            LIBS.translateY(LOCAL_WRIST_POS, -0.3); 
            LIBS.translateZ(LOCAL_WRIST_POS, 0.1);  

            var FINAL_WRIST_POS = LIBS.get_I4();
            LIBS.multiply(FINAL_WRIST_POS, parentForearmMatrix, LOCAL_WRIST_POS);

            // Bola Wrist
            GL.bindBuffer(GL.ARRAY_BUFFER, this.sphereVB);
            GL.vertexAttribPointer(shaderVars.position, 3, GL.FLOAT, false, STRIDE, 0);
            GL.vertexAttribPointer(shaderVars.normal, 3, GL.FLOAT, false, STRIDE, 4 * 3);
            GL.vertexAttribPointer(shaderVars.color, 3, GL.FLOAT, false, STRIDE, 4 * 6);
            GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.sphereIB);

            var LOCAL_WRIST_SPHERE = LIBS.get_I4();
            LIBS.scale(LOCAL_WRIST_SPHERE, 0.15, 0.15, 0.15);

            var FINAL_WRIST_SPHERE = LIBS.get_I4();
            LIBS.multiply(FINAL_WRIST_SPHERE, FINAL_WRIST_POS, LOCAL_WRIST_SPHERE);
            GL.uniformMatrix4fv(shaderVars.mMmatrix, false, FINAL_WRIST_SPHERE);
            GL.drawElements(GL.TRIANGLES, this.sphereMesh.faces.length, GL.UNSIGNED_SHORT, 0);

            // Jari Tangan (Memakai fingerVB yang dijamin muncul)
            GL.bindBuffer(GL.ARRAY_BUFFER, this.fingerVB);
            GL.vertexAttribPointer(shaderVars.position, 3, GL.FLOAT, false, STRIDE, 0);
            GL.vertexAttribPointer(shaderVars.normal, 3, GL.FLOAT, false, STRIDE, 4 * 3);
            GL.vertexAttribPointer(shaderVars.color, 3, GL.FLOAT, false, STRIDE, 4 * 6);
            GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.fingerIB);

          const ringRadius = 0.3;
const flare = 0.8; // radian, makin besar makin terbuka (coba 0.3 - 0.9)

for (let i = 0; i < fingerCount; i++) {
    const ringAngle = (i / fingerCount) * Math.PI * 2;

    var R_RING = LIBS.get_I4();
    LIBS.rotateX(R_RING, ringAngle);

    var T_OUT = LIBS.get_I4();
    LIBS.translateY(T_OUT, ringRadius);

    // miringkan ujung jari menjauhi sumbu lengan
    var R_FLARE = LIBS.get_I4();
    LIBS.rotateZ(R_FLARE, flare);

    var R_DIR = LIBS.get_I4();
    LIBS.rotateY(R_DIR, -Math.PI / 2);

    // ring * translate * flare * dir
    var LOCAL_FINGER = LIBS.get_I4();
    LIBS.multiply(LOCAL_FINGER, R_RING, T_OUT);
    LIBS.multiply(LOCAL_FINGER, LOCAL_FINGER, R_FLARE);
    LIBS.multiply(LOCAL_FINGER, LOCAL_FINGER, R_DIR);

    var FINAL_FINGER = LIBS.get_I4();
    LIBS.multiply(FINAL_FINGER, FINAL_WRIST_POS, LOCAL_FINGER);

    GL.uniformMatrix4fv(shaderVars.mMmatrix, false, FINAL_FINGER);
    GL.drawElements(GL.TRIANGLES, this.fingerMesh.faces.length, GL.UNSIGNED_SHORT, 0);
}
        };

      // =========================================================
// 3. HELPER JARI KAKI (telapak + jari melingkar seperti capit)
// =========================================================
const drawToes = (parentLegMatrix, toeCount = 3) => {
    // --- Parameter yang bisa disetel ---
    const tipX = 0.88, tipY = -0.36, tipZ = 0.16; // ujung handMesh (0.2, 0.8)
    const palmScale = 0.14;   // ukuran bola telapak
    const ringRadius = 0.1;   // jarak pangkal jari dari sumbu
    const flare = 1;        // bukaan jari
    const toeScale = 0.6;     // ukuran jari

    // --- Titik dasar = ujung kaki ---
    var LOCAL_FOOT_BASE = LIBS.get_I4();
    LIBS.translateX(LOCAL_FOOT_BASE, tipX);
    LIBS.translateY(LOCAL_FOOT_BASE, tipY);
    LIBS.translateZ(LOCAL_FOOT_BASE, tipZ);

    var FINAL_FOOT_BASE = LIBS.get_I4();
    LIBS.multiply(FINAL_FOOT_BASE, parentLegMatrix, LOCAL_FOOT_BASE);

    // --- Telapak (bola) ---
    GL.bindBuffer(GL.ARRAY_BUFFER, this.sphereVB);
    GL.vertexAttribPointer(shaderVars.position, 3, GL.FLOAT, false, STRIDE, 0);
    GL.vertexAttribPointer(shaderVars.normal, 3, GL.FLOAT, false, STRIDE, 4 * 3);
    GL.vertexAttribPointer(shaderVars.color, 3, GL.FLOAT, false, STRIDE, 4 * 6);
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.sphereIB);

    var LOCAL_PALM = LIBS.get_I4();
    LIBS.scale(LOCAL_PALM, palmScale, palmScale, palmScale);

    var FINAL_PALM = LIBS.get_I4();
    LIBS.multiply(FINAL_PALM, FINAL_FOOT_BASE, LOCAL_PALM);
    GL.uniformMatrix4fv(shaderVars.mMmatrix, false, FINAL_PALM);
    GL.drawElements(GL.TRIANGLES, this.sphereMesh.faces.length, GL.UNSIGNED_SHORT, 0);

    // --- Bind ulang ke buffer jari ---
    GL.bindBuffer(GL.ARRAY_BUFFER, this.fingerVB);
    GL.vertexAttribPointer(shaderVars.position, 3, GL.FLOAT, false, STRIDE, 0);
    GL.vertexAttribPointer(shaderVars.normal, 3, GL.FLOAT, false, STRIDE, 4 * 3);
    GL.vertexAttribPointer(shaderVars.color, 3, GL.FLOAT, false, STRIDE, 4 * 6);
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.fingerIB);

    // --- Jari kaki (sama dengan jari tangan) ---
    for (let i = 0; i < toeCount; i++) {
        const ringAngle = (i / toeCount) * Math.PI * 2;

        var R_RING = LIBS.get_I4();
        LIBS.rotateX(R_RING, ringAngle);

        var T_OUT = LIBS.get_I4();
        LIBS.translateY(T_OUT, ringRadius);

        var R_FLARE = LIBS.get_I4();
        LIBS.rotateZ(R_FLARE, flare);

        var R_DIR = LIBS.get_I4();
        LIBS.rotateY(R_DIR, -Math.PI / 2);

        var S_TOE = LIBS.get_I4();
        LIBS.scale(S_TOE, toeScale, toeScale, toeScale);

        var LOCAL_TOE = LIBS.get_I4();
        LIBS.multiply(LOCAL_TOE, R_RING, T_OUT);
        LIBS.multiply(LOCAL_TOE, LOCAL_TOE, R_FLARE);
        LIBS.multiply(LOCAL_TOE, LOCAL_TOE, R_DIR);
        LIBS.multiply(LOCAL_TOE, LOCAL_TOE, S_TOE);

        var FINAL_TOE = LIBS.get_I4();
        LIBS.multiply(FINAL_TOE, FINAL_FOOT_BASE, LOCAL_TOE);

        GL.uniformMatrix4fv(shaderVars.mMmatrix, false, FINAL_TOE);
        GL.drawElements(GL.TRIANGLES, this.fingerMesh.faces.length, GL.UNSIGNED_SHORT, 0);
    }
};
        // --- PEMANGGILAN HELPER ---
        drawWristAndFingers(FINAL_RIGHT_FOREARM, 5);
        drawWristAndFingers(FINAL_LEFT_FOREARM, 5);

        drawToes(FINAL_LEG_RIGHT, 3);
        drawToes(FINAL_LEG_LEFT, 3);
    }
}