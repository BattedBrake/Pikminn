// buildersEnv.js
// Pembuat bentuk dasar untuk item environment. Setiap fungsi mengembalikan { vertices, faces }.
// Satu titik (vertex) = 9 angka: x, y, z, nx, ny, nz, r, g, b  (posisi, normal, warna)
// Warna vertex dibuat putih; warna asli diberikan lewat uColor saat render (lihat environment/EnvModel.js).
// Ukuran & orientasi mengikuti geometri Three.js supaya angka posisi dari kode lama bisa dipakai langsung.

function titik(vertices, x, y, z, nx, ny, nz) {
    vertices.push(x, y, z, nx, ny, nz, 1, 1, 1);
}

// Kotak berpusat di (0, 0, 0), ukuran w x h x d (seperti THREE.BoxGeometry)
export function box(w, h, d) {
    var x = w / 2, y = h / 2, z = d / 2;
    var vertices = [], faces = [];
    // tiap sisi: normal + 4 sudut
    var sisi = [
        [[0, 0, 1],  [[-x, -y, z], [x, -y, z], [x, y, z], [-x, y, z]]],     // depan
        [[0, 0, -1], [[x, -y, -z], [-x, -y, -z], [-x, y, -z], [x, y, -z]]], // belakang
        [[1, 0, 0],  [[x, -y, z], [x, -y, -z], [x, y, -z], [x, y, z]]],     // kanan
        [[-1, 0, 0], [[-x, -y, -z], [-x, -y, z], [-x, y, z], [-x, y, -z]]], // kiri
        [[0, 1, 0],  [[-x, y, z], [x, y, z], [x, y, -z], [-x, y, -z]]],     // atas
        [[0, -1, 0], [[-x, -y, -z], [x, -y, -z], [x, -y, z], [-x, -y, z]]], // bawah
    ];
    sisi.forEach(function (s) {
        var n = s[0], awal = vertices.length / 9;
        s[1].forEach(function (p) { titik(vertices, p[0], p[1], p[2], n[0], n[1], n[2]); });
        faces.push(awal, awal + 1, awal + 2, awal, awal + 2, awal + 3);
    });
    return { vertices, faces };
}

// Silinder tegak (sumbu y) berpusat di (0, 0, 0), tinggi h, radius atas rTop & bawah rBottom,
// kedua ujung ditutup (seperti THREE.CylinderGeometry)
export function cylinder(rTop, rBottom, h, segmen) {
    var vertices = [], faces = [];
    var y0 = -h / 2, y1 = h / 2;
    var kemiringan = (rBottom - rTop) / h;   // supaya normal sisi miring ikut condong

    // Sisi
    for (var i = 0; i <= segmen; i++) {
        var a = i / segmen * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
        var len = Math.sqrt(1 + kemiringan * kemiringan);
        titik(vertices, rBottom * c, y0, rBottom * s, c / len, kemiringan / len, s / len);
        titik(vertices, rTop * c, y1, rTop * s, c / len, kemiringan / len, s / len);
    }
    for (var i = 0; i < segmen; i++) {
        var k = i * 2;
        faces.push(k, k + 1, k + 3, k, k + 3, k + 2);
    }

    // Tutup atas & bawah
    [[y1, rTop, 1], [y0, rBottom, -1]].forEach(function (t) {
        var pusat = vertices.length / 9;
        titik(vertices, 0, t[0], 0, 0, t[2], 0);
        for (var i = 0; i <= segmen; i++) {
            var a = i / segmen * Math.PI * 2;
            titik(vertices, t[1] * Math.cos(a), t[0], t[1] * Math.sin(a), 0, t[2], 0);
        }
        for (var i = 0; i < segmen; i++) faces.push(pusat, pusat + 1 + i, pusat + 2 + i);
    });
    return { vertices, faces };
}

// Bola berpusat di (0, 0, 0)
export function sphere(r, segmen, cincin) {
    var vertices = [], faces = [];
    for (var j = 0; j <= cincin; j++) {
        var phi = j / cincin * Math.PI;
        for (var i = 0; i <= segmen; i++) {
            var theta = i / segmen * Math.PI * 2;
            var nx = Math.sin(phi) * Math.cos(theta), ny = Math.cos(phi), nz = Math.sin(phi) * Math.sin(theta);
            titik(vertices, r * nx, r * ny, r * nz, nx, ny, nz);
        }
    }
    for (var j = 0; j < cincin; j++) {
        for (var i = 0; i < segmen; i++) {
            var a = j * (segmen + 1) + i, b = a + segmen + 1;
            faces.push(a, b, a + 1, a + 1, b, b + 1);
        }
    }
    return { vertices, faces };
}

// Torus (cincin) di bidang XY, lubang menghadap sumbu z (seperti THREE.TorusGeometry)
export function torus(R, r, segmenCincin, segmenTabung) {
    var vertices = [], faces = [];
    for (var j = 0; j <= segmenCincin; j++) {
        var u = j / segmenCincin * Math.PI * 2;
        for (var i = 0; i <= segmenTabung; i++) {
            var v = i / segmenTabung * Math.PI * 2;
            var nx = Math.cos(v) * Math.cos(u), ny = Math.cos(v) * Math.sin(u), nz = Math.sin(v);
            titik(vertices, R * Math.cos(u) + r * nx, R * Math.sin(u) + r * ny, r * nz, nx, ny, nz);
        }
    }
    for (var j = 0; j < segmenCincin; j++) {
        for (var i = 0; i < segmenTabung; i++) {
            var a = j * (segmenTabung + 1) + i, b = a + segmenTabung + 1;
            faces.push(a, b, a + 1, a + 1, b, b + 1);
        }
    }
    return { vertices, faces };
}

// Bidang datar di bidang XY menghadap +z, berpusat di (0, 0, 0) (seperti THREE.PlaneGeometry)
export function plane(w, h) {
    var x = w / 2, y = h / 2;
    var vertices = [];
    titik(vertices, -x, -y, 0, 0, 0, 1);
    titik(vertices, x, -y, 0, 0, 0, 1);
    titik(vertices, x, y, 0, 0, 0, 1);
    titik(vertices, -x, y, 0, 0, 0, 1);
    return { vertices, faces: [0, 1, 2, 0, 2, 3] };
}

// Atap limasan: alas persegi panjang (width x depth) di y = 0, bubungan sepanjang ridgeLength di y = height
export function limasanRoof(width, depth, height, ridgeLength) {
    var w2 = width / 2, d2 = depth / 2, r2 = ridgeLength / 2;
    var p = [
        [-w2, 0, d2], [w2, 0, d2], [w2, 0, -d2], [-w2, 0, -d2],   // 0-3: alas
        [-r2, height, 0], [r2, height, 0],                         // 4-5: bubungan
    ];
    var segitiga = [
        [0, 1, 5], [0, 5, 4],   // depan (trapesium)
        [2, 3, 4], [2, 4, 5],   // belakang (trapesium)
        [3, 0, 4],              // kiri (segitiga)
        [1, 2, 5],              // kanan (segitiga)
        [0, 3, 2], [0, 2, 1],   // bawah
    ];
    // Tiap segitiga punya titik sendiri supaya normalnya datar per sisi (sudut atap tegas)
    var vertices = [], faces = [];
    segitiga.forEach(function (t) {
        var a = p[t[0]], b = p[t[1]], c = p[t[2]];
        var u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
        var n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
        var len = Math.sqrt(n[0] * n[0] + n[1] * n[1] + n[2] * n[2]) || 1;
        var awal = vertices.length / 9;
        [a, b, c].forEach(function (q) { titik(vertices, q[0], q[1], q[2], n[0] / len, n[1] / len, n[2] / len); });
        faces.push(awal, awal + 1, awal + 2);
    });
    return { vertices, faces };
}

// Warna hex (seperti di Three.js, contoh 0x8B5A2B) -> [r, g, b] 0..1
export function hex(warna) {
    return [((warna >> 16) & 255) / 255, ((warna >> 8) & 255) / 255, (warna & 255) / 255];
}
