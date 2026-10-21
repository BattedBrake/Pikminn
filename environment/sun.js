import { LIBS } from "../shared/libs.js";

export class Sun {
    constructor(gl) {
        this.gl = gl;

        // 💡 Bikin mesh bola sendiri di dalam Sun.js agar tidak tergantung file lain
        var sunMesh = this.generateSphere(1.5, 20, 20);

        this.sunVB = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.sunVB);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sunMesh.vertices), gl.STATIC_DRAW);

        this.sunIB = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.sunIB);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(sunMesh.faces), gl.STATIC_DRAW);
        
        this.indexCount = sunMesh.faces.length;
    }

    // Helper builder bola internal
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
                // Posisi (3), Normal (3), Warna Kuning Terang (3)
                vertices.push(x, y, z, nx, ny, nz, 1.0, 0.85, 0.1); 
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

    render(shaderVars, root, time) {
        const GL = this.gl;
        const STRIDE = 4 * 9; // 💡 Pastikan dikali 9

        GL.uniform1f(shaderVars.uRoughness, 0.0);
        GL.uniform1f(shaderVars.uShininess, 100.0);

        GL.uniform3f(shaderVars.uColor, 9.0, 2.5, 0.5); 

        GL.bindBuffer(GL.ARRAY_BUFFER, this.sunVB);
        GL.vertexAttribPointer(shaderVars.position, 3, GL.FLOAT, false, STRIDE, 0);
        GL.vertexAttribPointer(shaderVars.normal, 3, GL.FLOAT, false, STRIDE, 4 * 3); // 💡 Pastikan dikali 3
        GL.vertexAttribPointer(shaderVars.color, 3, GL.FLOAT, false, STRIDE, 4 * 6);    // 💡 Pastikan dikali 6
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.sunIB);

        var SUN_MATRIX = LIBS.get_I4();
        LIBS.translateX(SUN_MATRIX, 8.0);  
        LIBS.translateY(SUN_MATRIX, 18.0);  
        LIBS.translateZ(SUN_MATRIX, -20.0); 

        let pulse = 1.0 + Math.sin(time * 0.1) * 0.05;
        
        LIBS.scale(SUN_MATRIX, 3.0 * pulse, 3.0 * pulse, 3.0 * pulse); 

        var FINAL_SUN = LIBS.get_I4();
        LIBS.multiply(FINAL_SUN, root, SUN_MATRIX); 

        GL.uniformMatrix4fv(shaderVars.mMmatrix, false, FINAL_SUN);
        GL.drawElements(GL.TRIANGLES, this.indexCount, GL.UNSIGNED_SHORT, 0);
    }
}