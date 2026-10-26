import { LIBS } from '../shared/libs.js';
import { setMaterial, resetMaterial } from '../shared/renderer.js';

// Rumus bentuk bukit: tinggi di titik-titik grid tanah dihitung dari sini
export function rumusTanah(x, z) {
    return -3.75 + Math.sin(x * 0.4) * Math.cos(z * 0.4) * 0.6;
}

// Ukuran tanah (lebar = dalam), berpusat di (0, 0): membentang dari -UKURAN_TANAH/2 sampai +UKURAN_TANAH/2.
// Pohon (environment/pohon.js) otomatis menyebar mengikuti angka ini.
export const UKURAN_TANAH = 1000;

// Jumlah kotak grid per sisi. Jarak antar titik grid = UKURAN_TANAH / RESOLUSI_TANAH.
// Makin besar makin halus mengikuti rumusTanah (maksimal 255 karena index 16-bit).
export const RESOLUSI_TANAH = 50;

// Tinggi PERMUKAAN TANAH YANG TERGAMBAR di titik (x, z).
// Grid tanah lebih kasar daripada gelombang rumusTanah, jadi tinggi dibaca dari segitiga mesh
// (bukan dari rumus) supaya pohon, rumput, pikmin, dan kamera benar-benar menapak di permukaan.
export function tinggiTanah(x, z) {
    var langkah = UKURAN_TANAH / RESOLUSI_TANAH, setengah = UKURAN_TANAH / 2;
    var gx = Math.min(Math.max((x + setengah) / langkah, 0), RESOLUSI_TANAH - 1e-6);
    var gz = Math.min(Math.max((z + setengah) / langkah, 0), RESOLUSI_TANAH - 1e-6);
    var i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j;
    var x0 = -setengah + i * langkah, z0 = -setengah + j * langkah;
    var h0 = rumusTanah(x0, z0), h1 = rumusTanah(x0 + langkah, z0);
    var h2 = rumusTanah(x0, z0 + langkah), h3 = rumusTanah(x0 + langkah, z0 + langkah);
    // Kotak grid dibagi dua segitiga lewat diagonal (x+1, z) - (x, z+1), sama seperti di generateWavyDesert
    if (u + v <= 1) return h0 + u * (h1 - h0) + v * (h2 - h0);
    return h3 + (1 - u) * (h2 - h3) + (1 - v) * (h1 - h3);
}

// Kekasaran permukaan tanah (ubah angkanya untuk menyetel tampilan)
//   tekstur       = kekuatan kasar: 0 = mulus .. 1 = sangat kasar (bergelombang kecil + bercak + bintik)
//   skalaTekstur  = kerapatan butiran: kecil = gumpalan besar, besar = butiran halus dan rapat
//   kilap         = ketajaman kilap (kecil = kilap lebar & lembut)
//   kekuatanKilap = 0 (tanah tidak mengkilap sama sekali) .. 1 (mengkilap penuh)
export const MATERIAL_TANAH = { tekstur: 0.5, skalaTekstur: 0.9, kilap: 5, kekuatanKilap: 0.3 };

export class Environment {
    constructor(gl) {
        this.gl = gl;
    
        var planeData = this.generateWavyDesert(UKURAN_TANAH, UKURAN_TANAH, RESOLUSI_TANAH); 

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

                // Tinggi titik grid dari rumusTanah (tinggiTanah membaca kembali permukaan ini)
                let yPos = rumusTanah(xPos, zPos); 

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

        // Material tanah: kasar & tidak mengkilap (atur di MATERIAL_TANAH di atas)
        GL.uniform1f(shaderVars.uIsRough, 0.0);
        setMaterial(GL, shaderVars, MATERIAL_TANAH);
        GL.uniform3f(shaderVars.uColor, 0.34, 0.65, 0.22);

        GL.bindBuffer(GL.ARRAY_BUFFER, this.envVB);
        
        GL.vertexAttribPointer(shaderVars.position, 3, GL.FLOAT, false, STRIDE, 0);
        GL.vertexAttribPointer(shaderVars.normal, 3, GL.FLOAT, false, STRIDE, 4 * 3);
        GL.vertexAttribPointer(shaderVars.color, 3, GL.FLOAT, false, STRIDE, 4 * 6);
        
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.envIB);

        // Render tanah sesuai matriks root scene
        GL.uniformMatrix4fv(shaderVars.mMmatrix, false, root);
        GL.drawElements(GL.TRIANGLES, this.indexCount, GL.UNSIGNED_SHORT, 0);

        resetMaterial(GL, shaderVars);   // supaya objek berikutnya tidak ikut kasar
    }
}