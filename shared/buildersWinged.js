export function generateEllipsoid(a, b, c, stack, step) {
    var vertices = [];
    var faces = [];

    for (var i = 0; i <= stack; i++) {
        var u = i / stack * Math.PI - (Math.PI / 2);
        for (var j = 0; j <= step; j++) {
            var v = j / step * 2 * Math.PI - Math.PI; 

            var x = a * Math.cos(v) * Math.cos(u);
            var y = b * Math.sin(u);
            var z = c * Math.sin(v) * Math.cos(u);
            
            var nx = x / (a * a);
            var ny = y / (b * b);
            var nz = z / (c * c);
            var len = Math.sqrt(nx * nx + ny * ny + nz * nz);
            
            vertices.push(x, y, z);
            vertices.push(nx / len, ny / len, nz / len);
            vertices.push(1.0, 0.4, 0.6);
           
        }
    }

    for (var i = 0; i < stack; i++) {
        for (var j = 0; j < step; j++) {
            var first = i * (step + 1) + j;
            var second = first + 1;
            var third = first + (step + 1);
            var fourth = third + 1;

            faces.push(first, second, fourth);
            faces.push(first, fourth, third);
        }
    }
    return { vertices, faces };
}

export function generateCurvedCone(baseRadius, height, segments, radialSegments, r = 1.0, g = 0.41, b = 0.71) {
    var vertices = [];
    var faces = [];

    var P0 = [0, 0, 0];
    var P1 = [0, height * 0.25, -height * 0.55];
    var P2 = [0, height * 2,-height * 0.15];

    for (var i = 0; i <= segments; i++) {
        var t = i / segments;
        var cx = (1 - t) * (1 - t) * P0[0] + 2 * (1 - t) * t * P1[0] + t * t * P2[0];
        var cy = (1 - t) * (1 - t) * P0[1] + 2 * (1 - t) * t * P1[1] + t * t * P2[1];
        var cz = (1 - t) * (1 - t) * P0[2] + 2 * (1 - t) * t * P1[2] + t * t * P2[2];

        // Radius pangkal gemuk, semakin ke ujung makin meruncing kecil
        var currentRadius = baseRadius * Math.pow(1 - t, 1.2); 

        for (var j = 0; j <= radialSegments; j++) {
            var theta = (j / radialSegments) * Math.PI * 2;

            var x = cx + currentRadius * Math.cos(theta);
            var y = cy;
            var z = cz + currentRadius * Math.sin(theta);

            // Normal sederhana
            var nx = Math.cos(theta);
            var ny = 0.3;
            var nz = Math.sin(theta);
            var len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1.0;

            // Memadukan warna pink di pangkal agar menyatu dengan kepala
            vertices.push(x, y, z);
            vertices.push(nx / len, ny / len, nz / len);
            vertices.push(r, g, b);
        }
    }

    // Generator Index Faces
    for (var i = 0; i < segments; i++) {
        for (var j = 0; j < radialSegments; j++) {
            var first = i * (radialSegments + 1) + j;
            var second = first + 1;
            var third = first + (radialSegments + 1);
            var fourth = third + 1;

            faces.push(first, second, fourth);
            faces.push(first, fourth, third);
        }
    }

    return { vertices, faces };
}

export function generateCurvedConeHand(baseRadius, height, segments, radialSegments, r = 1.0, g = 0.41, b = 0.71) {
    var vertices = [];
    var faces = [];

    // Titik Kontrol Kurva Bézier Memanjang ke Samping (X) & Sedikit Melengkung Turun (Y)
    var P0 = [0, 0, 0];                                     // Pangkal bahu
    var P1 = [height * 0.6, -height * 0.15, height * 0.1];   // Melengkung halus ke samping
    var P2 = [height * 1.2, -height * 0.45, height * 0.2];   // Ujung memanjang ke luar bawah

    for (var i = 0; i <= segments; i++) {
        var t = i / segments;

        // Posisi pusat lingkaran sepanjang kurva
        var cx = (1 - t) * (1 - t) * P0[0] + 2 * (1 - t) * t * P1[0] + t * t * P2[0];
        var cy = (1 - t) * (1 - t) * P0[1] + 2 * (1 - t) * t * P1[1] + t * t * P2[1];
        var cz = (1 - t) * (1 - t) * P0[2] + 2 * (1 - t) * t * P1[2] + t * t * P2[2];

        // Gunakan Math.pow(1 - t, 0.5) agar pangkal-ke-tengah TETAP TEBAL BERISI, 
        // dan baru mengecil secara bertahap saat mendekati ujung.
        var currentRadius = baseRadius * Math.pow(1.0 - t * 0.9, 0.6); 

        for (var j = 0; j <= radialSegments; j++) {
            var theta = (j / radialSegments) * Math.PI * 2;

            // Membentuk tabung membulat 3D sempurna (Penampang melingkar di Y-Z)
            var x = cx;
            var y = cy + currentRadius * Math.cos(theta);
            var z = cz + currentRadius * Math.sin(theta);

            // Normal untuk pencahayaan 3D yang cembung/berisi
            var nx = 0.2;
            var ny = Math.cos(theta);
            var nz = Math.sin(theta);
            var len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1.0;

            vertices.push(x, y, z);
            vertices.push(nx / len, ny / len, nz / len);
            vertices.push(r, g, b);
        }
    }

    // Generator Faces
    for (var i = 0; i < segments; i++) {
        for (var j = 0; j < radialSegments; j++) {
            var first = i * (radialSegments + 1) + j;
            var second = first + 1;
            var third = first + (radialSegments + 1);
            var fourth = third + 1;

            faces.push(first, second, fourth);
            faces.push(first, fourth, third);
        }
    }

    return { vertices, faces };
}

export function generateParaboloidWing(radiusX, radiusZ, height, segments, radialSegments) {
    var vertices = [];
    var faces = [];

    for (var i = 0; i <= segments; i++) {
        var u = i / segments; // 0.0 sampai 1.0 (pangkal ke ujung sayap)
        
        // Persamaan Paraboloid: Y meningkat seiring kuadrat jarak
        var currentHeight = height * (u * u); 
        var rx = radiusX * u; 
        var rz = radiusZ * u;

        for (var j = 0; j <= radialSegments; j++) {
            var v = (j / radialSegments) * Math.PI * 2;

            var x = rx * Math.cos(v);
            var y = currentHeight;
            var z = rz * Math.sin(v);

            // Normal untuk pencahayaan sayap
            var nx = Math.cos(v);
            var ny = 0.5;
            var nz = Math.sin(v);
            var len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1.0;

            // Warna dasar putih transparan
            vertices.push(x, y, z);
            vertices.push(nx / len, ny / len, nz / len);
            vertices.push(1.0, 1.0, 1.0); 
        }
    }

    for (var i = 0; i < segments; i++) {
        for (var j = 0; j < radialSegments; j++) {
            var first = i * (radialSegments + 1) + j;
            var second = first + 1;
            var third = first + (radialSegments + 1);
            var fourth = third + 1;

            faces.push(first, second, fourth);
            faces.push(first, fourth, third);
        }
    }

    return { vertices, faces };
}

export function generateLeaf(length, width, segments) {
    var vertices = [];
    var faces = [];

    for (var i = 0; i <= segments; i++) {
        var u = i / segments; // 0.0 (pangkal biji) -> 1.0 (ujung kelopak)
        
        // Lebar mekar di tengah dan meruncing di ujung
        var currentWidth = width * Math.sin(u * Math.PI); 
        
        // Z dibuat menjulur panjang ke luar (horizontal), Y hanya naik sedikit melengkung landai
        var currentZ = length * u;                           // Menjulur datar keluar
        var currentY = Math.sin(u * Math.PI) * (length * 0.25); // Melengkung landai halus (tiduran)

        for (var j = 0; j <= 2; j++) {
            var v = (j / 2) - 0.5; // -0.5 sampai 0.5
            var currentX = v * currentWidth; 

            // Normal pencahayaan dari atas
            var nx = 0.0;
            var ny = 0.9;
            var nz = 0.3;

            vertices.push(currentX, currentY, currentZ);
            vertices.push(nx, ny, nz);
            vertices.push(0.3, 0.85, 0.2); // Warna hijau (bisa di-override di JS)
        }
    }

    for (var i = 0; i < segments; i++) {
        var row1 = i * 3;
        var row2 = (i + 1) * 3;

        faces.push(row1, row2, row1 + 1);
        faces.push(row1 + 1, row2, row2 + 1);
        faces.push(row1 + 1, row2 + 1, row1 + 2);
        faces.push(row1 + 2, row2 + 1, row2 + 2);
    }

    return { vertices, faces };
}

export function createParabolaMesh(radius = 0.5, depth = 0.25, rings = 16, slices = 16) {
    let vertices = [];
    let faces = [];

    for (let r = 0; r <= rings; r++) {
        let rho = r / rings; // 0.0 sampai 1.0 (pusat ke tepi)
        let currentRadius = rho * radius;
        
        // Rumus Parabola: Z melengkung berdasarkan kuadrat jari-jari
        let z = -depth * (rho * rho); 

        for (let s = 0; s <= slices; s++) {
            let phi = (s / slices) * Math.PI * 2;
            let x = currentRadius * Math.cos(phi);
            let y = currentRadius * Math.sin(phi);

            // Normal Vector untuk Lighting Parabola (Cembung/Cekung)
            let nx = -2 * x * (depth / (radius * radius));
            let ny = -2 * y * (depth / (radius * radius));
            let nz = 1.0;
            let len = Math.sqrt(nx * nx + ny * ny + nz * nz);

            // Position (X, Y, Z), Normal (NX, NY, NZ), Color (R, G, B)
            vertices.push(
                x, y, z, 
                nx / len, ny / len, nz / len, 
                0.8, 0.95, 1.0
            );
        }
    }

    // Generate Indices / Triangles
    for (let r = 0; r < rings; r++) {
        for (let s = 0; s < slices; s++) {
            let first = r * (slices + 1) + s;
            let second = first + slices + 1;

            faces.push(first, second, first + 1);
            faces.push(second, second + 1, first + 1);
        }
    }

    return { vertices, faces };
}
export function generateHookFinger(baseRadius = 0.1, height = 0.8, segments = 20, radialSegments = 12, r = 1.0, g = 0.41, b = 0.71) {
    var vertices = [];
    var faces = [];

    var P0 = [0, 0, 0];
    var P1 = [0, height * 0.1, -height * 0.5];
    var P2 = [0, -height * 0.8, -height * 0.3];

    for (var i = 0; i <= segments; i++) {
        var t = i / segments;
        var omt = 1 - t;

        // Posisi pusat di kurva Bézier
        var cy = omt * omt * P0[1] + 2 * omt * t * P1[1] + t * t * P2[1];
        var cz = omt * omt * P0[2] + 2 * omt * t * P1[2] + t * t * P2[2];

        // Tangent = turunan kurva (x selalu 0)
        var ty = 2 * omt * (P1[1] - P0[1]) + 2 * t * (P2[1] - P1[1]);
        var tz = 2 * omt * (P1[2] - P0[2]) + 2 * t * (P2[2] - P1[2]);
        var tl = Math.sqrt(ty * ty + tz * tz) || 1.0;
        ty /= tl; tz /= tl;

        // Sumbu cincin: N = (1,0,0), B = T x N = (0, tz, -ty)
        var currentRadius = baseRadius * Math.pow(1.0 - t, 0.8);

        for (var j = 0; j <= radialSegments; j++) {
            var theta = (j / radialSegments) * Math.PI * 2;
            var c = Math.cos(theta), s = Math.sin(theta);

            // arah keluar dari pusat tabung (juga dipakai sebagai normal)
            var nx = c;
            var ny = s * tz;
            var nz = -s * ty;

            vertices.push(
                currentRadius * nx,
                cy + currentRadius * ny,
                cz + currentRadius * nz
            );
            vertices.push(nx, ny, nz);
            vertices.push(r, g, b);
        }
    }

    for (var i = 0; i < segments; i++) {
        for (var j = 0; j < radialSegments; j++) {
            var first = i * (radialSegments + 1) + j;
            var second = first + 1;
            var third = first + (radialSegments + 1);
            var fourth = third + 1;

            faces.push(first, second, fourth);
            faces.push(first, fourth, third);
        }
    }

    return { vertices, faces, indices: faces };
}