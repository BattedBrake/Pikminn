// MyObject.js
// Satu bagian tubuh. Strukturnya mengikuti template: POSITION_MATRIX, MOVE_MATRIX, childs, render().
// Bentuk (vertex & faces) diberikan dari luar (lihat shared/buildersRed.js), dan tiap titik punya normal untuk pencahayaan.
import { LIBS } from "../../shared/libs.js";

export class MyObject {
    GL = null;

    OBJECT_VERTEX = null;
    OBJECT_FACES = null;

    vertex = [];
    faces = [];

    POSITION_MATRIX = null;   // posisi/ukuran bentuk di dalam sendinya sendiri (tidak diwariskan ke child)
    MOVE_MATRIX = null;       // gerakan sendi (diwariskan ke child)

    childs = [];

    constructor(GL, shapeData) {
        this.GL = GL;

        this.POSITION_MATRIX = LIBS.get_I4();
        this.MOVE_MATRIX = LIBS.get_I4();

        this.vertex = shapeData.vertices;
        this.faces = shapeData.faces;

        this.OBJECT_VERTEX = GL.createBuffer();
        this.OBJECT_FACES = GL.createBuffer();
        this.kirimData();
    }

    // Mengirim vertex & faces ke GPU
    kirimData() {
        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, this.OBJECT_VERTEX);
        this.GL.bufferData(this.GL.ARRAY_BUFFER, new Float32Array(this.vertex), this.GL.DYNAMIC_DRAW);
        this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, this.OBJECT_FACES);
        this.GL.bufferData(this.GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.faces), this.GL.DYNAMIC_DRAW);
    }

    // Mengganti bentuk saat animasi (dipakai untuk tangkai yang kurvanya berubah tiap frame)
    updateShape(shapeData) {
        this.vertex = shapeData.vertices;
        this.faces = shapeData.faces;
        this.kirimData();
    }

    render(shaderVars, PARENT_MATRIX) {
        var JOINT_MATRIX = LIBS.get_I4();
        LIBS.multiply(JOINT_MATRIX, PARENT_MATRIX, this.MOVE_MATRIX);
        var MODEL_MATRIX = LIBS.get_I4();
        LIBS.multiply(MODEL_MATRIX, JOINT_MATRIX, this.POSITION_MATRIX);

        this.GL.uniformMatrix4fv(shaderVars.mMmatrix, false, MODEL_MATRIX);

        // Urutan data per titik: posisi (0), warna (12), normal (24)
        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, this.OBJECT_VERTEX);
        this.GL.vertexAttribPointer(shaderVars.position, 3, this.GL.FLOAT, false, 36, 0);
        this.GL.vertexAttribPointer(shaderVars.color, 3, this.GL.FLOAT, false, 36, 12);
        this.GL.vertexAttribPointer(shaderVars.normal, 3, this.GL.FLOAT, false, 36, 24);

        this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, this.OBJECT_FACES);
        this.GL.drawElements(this.GL.TRIANGLES, this.faces.length, this.GL.UNSIGNED_SHORT, 0);

        this.childs.forEach(child => child.render(shaderVars, JOINT_MATRIX));
    }
}
