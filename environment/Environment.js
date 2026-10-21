import { LIBS } from '../shared/libs.js';

// 💡 1. Buat fungsi helper untuk menghitung tinggi tanah (Y) berdasarkan posisi X dan Z
export function tinggiTanah(x, z) {
    // Rumus ini HARUS SAMA PERSIS dengan rumus yPos di dalam generateWavyDesert
    return -3.75 + Math.sin(x * 0.4) * Math.cos(z * 0.4) * 0.6;
}

export class Environment {
    constructor(gl) {
        this.gl = gl;
    
        var planeData = this.generateWavyDesert(40, 40, 50); 

        this.envVB = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.envVB);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(planeData.vertices), gl.STATIC_DRAW);

        this.envIB = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.envIB);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(planeData.faces), gl.STATIC_DRAW);
        
        this.indexCount = planeData.faces.length;
    }

    generateWavyDesert(width, depth, resolution) {
        var vertices = [];
        var faces = [];
        var halfW = width / 2;
        var halfD = depth / 2;
        var dx = width / resolution;
        var dz = depth / resolution;

        // 1. Buat Grid Vertices dengan Tinggi (Y) Bergelombang
        for (let z = 0; z <= resolution; z++) {
            let zPos = -halfD + z * dz;
            for (let x = 0; x <= resolution; x++) {
                let xPos = -halfW + x * dx;

                // Memanggil fungsi tinggiTanah agar rumusnya terpusat dan konsisten
                let yPos = tinggiTanah(xPos, zPos); 

                // Warna pasir gurun (Kecokelatan / Oranye Keemasan)
                let r = 0.85, g = 0.65, b = 0.35; 
                let nx = 0, ny = 1, nz = 0; // Normal menghadap atas

                vertices.push(xPos, yPos, zPos, nx, ny, nz, r, g, b);
            }
        }

        // 2. Hubungkan Titik-titik Menjadi Kotak (Faces / Triangles)
        for (let z = 0; z < resolution; z++) {
            for (let x = 0; x < resolution; x++) {
                let i0 = z * (resolution + 1) + x;
                let i1 = i0 + 1;
                let i2 = (z + 1) * (resolution + 1) + x;
                let i3 = i2 + 1;

                // Segitiga 1
                faces.push(i0, i2, i1);
                // Segitiga 2
                faces.push(i1, i2, i3);
            }
        }

        return { vertices, faces };
    }

    render(shaderVars, root) {
        const GL = this.gl;
        const STRIDE = 4 * 9;

        // Set material tanah (sedikit kasar agar efek cahayanya bagus)
        GL.uniform1f(shaderVars.uRoughness, 0.8);
        GL.uniform1f(shaderVars.uShininess, 200000000000000.0);
        GL.uniform3f(shaderVars.uColor, 0.6, 0.50, 0.4);

        GL.bindBuffer(GL.ARRAY_BUFFER, this.envVB);
        
        // 💡 Diperbaiki syntax vertexAttribPointer-nya
        GL.vertexAttribPointer(shaderVars.position, 3, GL.FLOAT, false, STRIDE, 0);
        GL.vertexAttribPointer(shaderVars.normal, 3, GL.FLOAT, false, STRIDE, 4 * 3);
        GL.vertexAttribPointer(shaderVars.color, 3, GL.FLOAT, false, STRIDE, 4 * 6);
        
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.envIB);

        // Render tanah sesuai matriks root scene
        GL.uniformMatrix4fv(shaderVars.mMmatrix, false, root);
        GL.drawElements(GL.TRIANGLES, this.indexCount, GL.UNSIGNED_SHORT, 0);
    }
}