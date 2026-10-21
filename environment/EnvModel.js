// EnvModel.js
// Pengganti THREE.Group untuk item environment: kumpulan bagian (mesh + warna + matriks),
// bisa dikelompokkan dalam grup yang punya matriks sendiri (misalnya tutup peti yang bisa dibuka).
//
//   var m = new EnvModel(GL);
//   m.addGroup("tutup", T(0, 0.8, -0.7));                  // seperti lidGroup.position.set(...)
//   m.addPart(B.box(1.4, 0.5, 1.4), KAYU, T(0, 0.25, 0.7), "tutup");
//   m.render(shaderVars, parentMatrix);
import { LIBS } from "../shared/libs.js";

// ---------- Pembuat matriks (urutan sama seperti Three.js: posisi x rotasi x skala) ----------
export function T(x, y, z) { var m = LIBS.get_I4(); LIBS.set_position(m, x, y, z); return m; }
export function S(x, y, z) { var m = LIBS.get_I4(); LIBS.scale(m, x, y, z); return m; }
export function RX(a) { var m = LIBS.get_I4(); LIBS.rotateX(m, a); return m; }
export function RY(a) { var m = LIBS.get_I4(); LIBS.rotateY(m, a); return m; }
export function RZ(a) { var m = LIBS.get_I4(); LIBS.rotateZ(m, a); return m; }

// Kalikan berurutan dari kiri ke kanan (parent dulu, lalu child)
export function mul(...daftar) {
    var hasil = LIBS.get_I4();
    daftar.forEach(function (m) {
        var baru = LIBS.get_I4();
        LIBS.multiply(baru, hasil, m);
        hasil = baru;
    });
    return hasil;
}

export class EnvModel {
    constructor(GL) {
        this.gl = GL;
        this.parts = [];
        this.groups = {};
    }

    // Grup = titik pivot bersama untuk beberapa bagian. parent = nama grup induk (opsional).
    addGroup(nama, matrix, parent = null) {
        this.groups[nama] = { matrix: matrix, parent: parent };
    }

    // Ganti matriks grup (dipakai untuk animasi, misalnya membuka tutup peti)
    setGroupMatrix(nama, matrix) {
        this.groups[nama].matrix = matrix;
    }

    // mesh = hasil fungsi di shared/buildersEnv.js, warna = [r, g, b], matrix = posisi di dalam grup
    addPart(mesh, warna, matrix, grup = null) {
        // Mesh yang sama (misalnya 4 tiang) cukup dikirim ke GPU sekali
        if (!mesh.vb) {
            var GL = this.gl;
            mesh.vb = GL.createBuffer();
            GL.bindBuffer(GL.ARRAY_BUFFER, mesh.vb);
            GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(mesh.vertices), GL.STATIC_DRAW);
            mesh.ib = GL.createBuffer();
            GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, mesh.ib);
            GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.faces), GL.STATIC_DRAW);
        }
        this.parts.push({ mesh: mesh, warna: warna, matrix: matrix, grup: grup });
    }

    matriksGrup(nama) {
        if (!nama) return LIBS.get_I4();
        var g = this.groups[nama];
        return mul(this.matriksGrup(g.parent), g.matrix);
    }

    render(shaderVars, parentMatrix) {
        const GL = this.gl;
        const STRIDE = 4 * 9;
        var cacheGrup = {};

        GL.uniform1f(shaderVars.uIsRough, 0.0);
        GL.uniform1f(shaderVars.uUseVertexColor, 0.0);

        this.parts.forEach((p) => {
            var kunci = p.grup || "";
            if (!cacheGrup[kunci]) cacheGrup[kunci] = mul(parentMatrix, this.matriksGrup(p.grup));

            GL.bindBuffer(GL.ARRAY_BUFFER, p.mesh.vb);
            GL.vertexAttribPointer(shaderVars.position, 3, GL.FLOAT, false, STRIDE, 0);
            GL.vertexAttribPointer(shaderVars.normal, 3, GL.FLOAT, false, STRIDE, 4 * 3);
            GL.vertexAttribPointer(shaderVars.color, 3, GL.FLOAT, false, STRIDE, 4 * 6);
            GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, p.mesh.ib);

            GL.uniform3f(shaderVars.uColor, p.warna[0], p.warna[1], p.warna[2]);
            GL.uniformMatrix4fv(shaderVars.mMmatrix, false, mul(cacheGrup[kunci], p.matrix));
            GL.drawElements(GL.TRIANGLES, p.mesh.faces.length, GL.UNSIGNED_SHORT, 0);
        });
    }
}
