// draw.js
// Menggambar satu mesh Rock Pikmin (format { data, count, dirty }) dengan matriks model M.
// Mesh dikirim ke GPU hanya ketika berubah (dirty), misalnya tangkai yang dibangun ulang tiap frame.
// material (opsional) = salah satu isi MATERIAL di config.js
import { setMaterial } from "../../shared/renderer.js";

export function drawMesh(GL, shaderVars, mesh, M, material) {
    if (material) setMaterial(GL, shaderVars, material);
    if (!mesh.buf) mesh.buf = GL.createBuffer();
    GL.bindBuffer(GL.ARRAY_BUFFER, mesh.buf);
    if (mesh.dirty) { GL.bufferData(GL.ARRAY_BUFFER, mesh.data, GL.DYNAMIC_DRAW); mesh.dirty = false; }
    GL.vertexAttribPointer(shaderVars.position, 3, GL.FLOAT, false, 36, 0);
    GL.vertexAttribPointer(shaderVars.normal, 3, GL.FLOAT, false, 36, 12);
    GL.vertexAttribPointer(shaderVars.color, 3, GL.FLOAT, false, 36, 24);
    GL.uniformMatrix4fv(shaderVars.mMmatrix, false, M);
    GL.drawArrays(GL.TRIANGLES, 0, mesh.count);
}
