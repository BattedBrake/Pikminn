import { LIBS } from '../shared/libs.js';

export class Environment {
    constructor(gl) {
        this.gl = gl;

        // 1. Buat Ground (Tanah)
        var groundData = this.generatePlane(40.0, 40.0);
        this.groundVB = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.groundVB);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(groundData.vertices), gl.STATIC_DRAW);
        this.groundIB = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.groundIB);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(groundData.faces), gl.STATIC_DRAW);
        this.groundCount = groundData.faces.length;

        // 2. Buat Prototype Pohon (Batang Silinder & Daun Bola)
        var trunkData = this.generateCylinder(0.4, 7.5, 12); // Batang
        var leavesData = this.generateSphere(1.8, 16, 12);   // Daun

        // Buffer Batang
        this.trunkVB = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.trunkVB);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(trunkData.vertices), gl.STATIC_DRAW);
        this.trunkIB = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.trunkIB);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(trunkData.faces), gl.STATIC_DRAW);
        this.trunkCount = trunkData.faces.length;

        // Buffer Daun
        this.leavesVB = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.leavesVB);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(leavesData.vertices), gl.STATIC_DRAW);
        this.leavesIB = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.leavesIB);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(leavesData.faces), gl.STATIC_DRAW);
        this.leavesCount = leavesData.faces.length;
    }

    // Helper: Buat Ground Datar
    generatePlane(width, depth) {
        var vertices = [];
        var faces = [];
        var yPos = -4.2; // Pas di bawah kaki karakter
        var halfW = width / 2;
        var halfD = depth / 2;

        vertices.push(
            -halfW, yPos, -halfD,  0, 1, 0,  0.22, 0.55, 0.22, // Hijau rumput
             halfW, yPos, -halfD,  0, 1, 0,  0.22, 0.55, 0.22,
             halfW, yPos,  halfD,  0, 1, 0,  0.22, 0.55, 0.22,
            -halfW, yPos,  halfD,  0, 1, 0,  0.22, 0.55, 0.22
        );
        faces.push(0, 1, 2);
        faces.push(0, 2, 3);
        return { vertices, faces };
    }

    // Helper: Buat Batang Pohon (Silinder Sederhana)
    generateCylinder(radius, height, radialSegments) {
        var vertices = [];
        var faces = [];
        for (let i = 0; i <= 1; i++) {
            let y = i * height - 4.2; // Mulai dari lantai
            let r = radius;
            for (let j = 0; j <= radialSegments; j++) {
                let theta = (j / radialSegments) * Math.PI * 2;
                let x = Math.cos(theta) * r;
                let z = Math.sin(theta) * r;
                let nx = Math.cos(theta), ny = 0, nz = Math.sin(theta);
                vertices.push(x, y, z, nx, ny, nz, 0.45, 0.28, 0.12); // Warna Cokelat Kayu
            }
        }
        for (let j = 0; j < radialSegments; j++) {
            let first = j;
            let second = first + radialSegments + 1;
            faces.push(first, second, first + 1);
            faces.push(second, second + 1, first + 1);
        }
        return { vertices, faces };
    }

    // Helper: Buat Daun Pohon (Bola Sederhana)
    generateSphere(radius, rings, sectors) {
        var vertices = [];
        var faces = [];
        for (let r = 0; r <= rings; r++) {
            let v = r / rings;
            let phi = v * Math.PI;
            for (let s = 0; s <= sectors; s++) {
                let u = s / sectors;
                let theta = u * Math.PI * 2;
                let x = radius * Math.sin(phi) * Math.cos(theta);
                let y = radius * Math.cos(phi);
                let z = radius * Math.sin(phi) * Math.sin(theta);
                let nx = x / radius, ny = y / radius, nz = z / radius;
                vertices.push(x, y, z, nx, ny, nz, 0.15, 0.45, 0.2); // Warna Hijau Daun
            }
        }
        for (let r = 0; r < rings; r++) {
            for (let s = 0; s < sectors; s++) {
                let first = r * (sectors + 1) + s;
                let second = first + sectors + 1;
                faces.push(first, second + 1, second);
                faces.push(first, first + 1, second + 1);
            }
        }
        return { vertices, faces };
    }

    // Fungsi Render Environment (Ground & Pohon di sekitar)
    render(shaderVars, mouseRot) {
        const GL = this.gl;
        const STRIDE = 4 * 9;

        GL.uniform1f(shaderVars.uRoughness, 1.0);
        GL.uniform1f(shaderVars.uShininess, 8.0);

        // --- 1. RENDER GROUND ---
        GL.uniform3f(shaderVars.uColor, 0.25, 0.55, 0.25);
        GL.bindBuffer(GL.ARRAY_BUFFER, this.groundVB);
        GL.vertexAttribPointer(shaderVars.position, 3, GL.FLOAT, false, STRIDE, 0);
        GL.vertexAttribPointer(shaderVars.normal, 3, GL.FLOAT, false, STRIDE, 4 * 3);
        GL.vertexAttribPointer(shaderVars.color, 3, GL.FLOAT, false, STRIDE, 4 * 6);
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.groundIB);

        var GROUND_MATRIX = LIBS.get_I4();
        LIBS.multiply(GROUND_MATRIX, mouseRot, LIBS.get_I4());
        GL.uniformMatrix4fv(shaderVars.mMmatrix, false, GROUND_MATRIX);
        GL.drawElements(GL.TRIANGLES, this.groundCount, GL.UNSIGNED_SHORT, 0);

        // --- 2. RENDER BEBERAPA POHON DI LATAR BELAKANG ---
        // Array posisi pohon (X, Z) di sekeliling karakter
        const treePositions = [
            { x: -4.0, z: -5.0 },
            { x: 5.0, z: -6.0 },
            { x: -6.0, z: 3.0 },
            { x: 6.0, z: 4.0 }
        ];

        for (let pos of treePositions) {
            // A. Gambar Batang Pohon
            GL.bindBuffer(GL.ARRAY_BUFFER, this.trunkVB);
            GL.vertexAttribPointer(shaderVars.position, 3, GL.FLOAT, false, STRIDE, 0);
            GL.vertexAttribPointer(shaderVars.normal, 3, GL.FLOAT, false, STRIDE, 4 * 3);
            GL.vertexAttribPointer(shaderVars.color, 3, GL.FLOAT, false, STRIDE, 4 * 6);
            GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.trunkIB);

            var TRUNK_MATRIX = LIBS.get_I4();
            LIBS.translateX(TRUNK_MATRIX, pos.x);
            LIBS.translateZ(TRUNK_MATRIX, pos.z);
            
            var FINAL_TRUNK = LIBS.get_I4();
            LIBS.multiply(FINAL_TRUNK, mouseRot, TRUNK_MATRIX);
            GL.uniformMatrix4fv(shaderVars.mMmatrix, false, FINAL_TRUNK);
            GL.drawElements(GL.TRIANGLES, this.trunkCount, GL.UNSIGNED_SHORT, 0);

            // B. Gambar Daun Pohon (Ditaruh di atas batang, Y = 1.2)
            GL.bindBuffer(GL.ARRAY_BUFFER, this.leavesVB);
            GL.vertexAttribPointer(shaderVars.position, 3, GL.FLOAT, false, STRIDE, 0);
            GL.vertexAttribPointer(shaderVars.normal, 3, GL.FLOAT, false, STRIDE, 4 * 3);
            GL.vertexAttribPointer(shaderVars.color, 3, GL.FLOAT, false, STRIDE, 4 * 6);
            GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.leavesIB);

            var LEAVES_MATRIX = LIBS.get_I4();
            LIBS.translateX(LEAVES_MATRIX, pos.x);
            LIBS.translateY(LEAVES_MATRIX, 1.8); // Posisi daun di atas batang
            LIBS.translateZ(LEAVES_MATRIX, pos.z);

            var FINAL_LEAVES = LIBS.get_I4();
            LIBS.multiply(FINAL_LEAVES, mouseRot, LEAVES_MATRIX);
            GL.uniformMatrix4fv(shaderVars.mMmatrix, false, FINAL_LEAVES);
            GL.drawElements(GL.TRIANGLES, this.leavesCount, GL.UNSIGNED_SHORT, 0);
        }
    }
}