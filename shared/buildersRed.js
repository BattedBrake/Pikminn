// buildersRed.js
// Pembuat bentuk (geometri) untuk Red Pikmin. Setiap fungsi mengembalikan { vertices, faces }.
// Satu titik (vertex) = 9 angka: x, y, z, r, g, b, nx, ny, nz  (posisi, warna, normal untuk pencahayaan)
const PI = Math.PI;

function normalisasi(v) {
    var panjang = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    if (panjang == 0) panjang = 1;
    return [v[0] / panjang, v[1] / panjang, v[2] / panjang];
}

// Membuat titik-titik yang tersusun seperti grid (nu kolom x nv baris), lalu menyambungnya jadi segitiga.
// fungsi(u, v) mengembalikan [x, y, z, nx, ny, nz] untuk u dan v antara 0 sampai 1.
function buatGrid(nu, nv, fungsi, warna) {
    var vertices = [];
    var faces = [];
    for (var j = 0; j <= nv; j++) {
        for (var i = 0; i <= nu; i++) {
            var d = fungsi(i / nu, j / nv);
            // warna bisa satu warna tetap [r, g, b], atau fungsi(u, v) supaya warnanya berubah di sepanjang bentuk
            var w = (typeof warna === "function") ? warna(i / nu, j / nv) : warna;
            vertices.push(d[0], d[1], d[2], w[0], w[1], w[2], d[3], d[4], d[5]);
        }
    }
    for (var j = 0; j < nv; j++) {
        for (var i = 0; i < nu; i++) {
            var a = j * (nu + 1) + i;
            var b = a + nu + 1;
            faces.push(a, b, a + 1);
            faces.push(a + 1, b, b + 1);
        }
    }
    return { vertices: vertices, faces: faces };
}

// ---------- 1. ELLIPSOID ----------
// x = a sin(phi) cos(theta), y = b cos(phi), z = c sin(phi) sin(theta)
export function ellipsoid(a, b, c, warna) {
    return buatGrid(40, 30, function (u, v) {
        var theta = u * 2 * PI, phi = v * PI;
        var x = Math.sin(phi) * Math.cos(theta);
        var y = Math.cos(phi);
        var z = Math.sin(phi) * Math.sin(theta);
        var n = normalisasi([x / a, y / b, z / c]);
        return [a * x, b * y, c * z, n[0], n[1], n[2]];
    }, warna);
}

// ---------- 2. CONE ---------- (alas di y = 0 dengan radius r, puncak di y = h)
export function cone(r, h, warna, bagian) {
    // bagian = 1 (atau kosong): kerucut utuh. bagian < 1: ujung runcingnya dipotong, hanya bagian dari alas sampai (bagian x h) yang dipakai
    if (bagian === undefined) bagian = 1;
    return buatGrid(24, 1, function (u, v) {
        var theta = u * 2 * PI, vv = v * bagian, rr = r * (1 - vv);
        var n = normalisasi([h * Math.cos(theta), r, h * Math.sin(theta)]);
        return [rr * Math.cos(theta), vv * h, rr * Math.sin(theta), n[0], n[1], n[2]];
    }, warna);
}

// ---------- 3. CYLINDER ---------- (pangkal y = 0 radius r0, ujung y = h radius r1, kedua ujung ditutup)
export function cylinder(r0, r1, h, warna) {
    return buatGrid(24, 5, function (u, v) {
        var baris = Math.round(v * 5), theta = u * 2 * PI;
        var c = Math.cos(theta), s = Math.sin(theta);
        var sisi = normalisasi([c, (r0 - r1) / h, s]);
        if (baris == 0) return [0, 0, 0, 0, -1, 0];                   // pusat tutup bawah
        if (baris == 1) return [r0 * c, 0, r0 * s, 0, -1, 0];         // tepi tutup bawah
        if (baris == 2) return [r0 * c, 0, r0 * s, sisi[0], sisi[1], sisi[2]];   // sisi, bawah
        if (baris == 3) return [r1 * c, h, r1 * s, sisi[0], sisi[1], sisi[2]];   // sisi, atas
        if (baris == 4) return [r1 * c, h, r1 * s, 0, 1, 0];          // tepi tutup atas
        return [0, h, 0, 0, 1, 0];                                    // pusat tutup atas
    }, warna);
}

// ---------- 4. ELLIPTIC PARABOLOID ---------- (dipakai untuk jari)
// y / h = 1 - (x/a)^2 - (z/b)^2   -> pangkal elips di y = 0, ujung runcing di y = h
export function elipticParaboloid(a, b, h, warna) {
    return buatGrid(16, 10, function (u, v) {
        var theta = u * 2 * PI, r = Math.sqrt(1 - v);
        var x = a * r * Math.cos(theta), z = b * r * Math.sin(theta), y = h * v;
        var n = normalisasi([2 * x / (a * a), 1 / h, 2 * z / (b * b)]);
        return [x, y, z, n[0], n[1], n[2]];
    }, warna);
}

// ---------- 5. MESH KURVA ---------- (tabung yang mengikuti kurva Bezier, dipakai untuk tangkai)
function titikBezier(p, t) {
    var u = 1 - t, hasil = [0, 0, 0];
    for (var i = 0; i < 3; i++) {
        hasil[i] = u * u * u * p[0][i] + 3 * u * u * t * p[1][i] + 3 * u * t * t * p[2][i] + t * t * t * p[3][i];
    }
    return hasil;
}
function arahBezier(p, t) { // turunan kurva = arah singgung
    var u = 1 - t, hasil = [0, 0, 0];
    for (var i = 0; i < 3; i++) {
        hasil[i] = 3 * u * u * (p[1][i] - p[0][i]) + 6 * u * t * (p[2][i] - p[1][i]) + 3 * t * t * (p[3][i] - p[2][i]);
    }
    return normalisasi(hasil);
}
// titik = 4 titik kontrol, radius mengecil dari r0 ke r1 (pangkat > 1 = mengecil cepat di awal),
// tAwal dan tAkhir = bagian kurva yang dipakai (0 sampai 1)
// warna = [r, g, b] tetap, ATAU fungsi(t) yang mengembalikan warna di posisi t sepanjang kurva (untuk gradasi)
export function tubeBezier(titik, r0, r1, pangkat, tAwal, tAkhir, warna) {
    var warnaGrid = warna;
    if (typeof warna === "function") {
        warnaGrid = function (u, v) { return warna(tAwal + (tAkhir - tAwal) * v); };
    }
    return buatGrid(24, 24, function (u, v) {
        var t = tAwal + (tAkhir - tAwal) * v;
        var pusat = titikBezier(titik, t);
        var arah = arahBezier(titik, t);
        var sumbu1 = normalisasi([-arah[1], arah[0], 0]);   // tegak lurus kurva
        var radius = r1 + (r0 - r1) * Math.pow(1 - t, pangkat);
        var theta = u * 2 * PI;
        var nx = sumbu1[0] * Math.cos(theta), ny = sumbu1[1] * Math.cos(theta), nz = Math.sin(theta);
        return [pusat[0] + radius * nx, pusat[1] + radius * ny, pusat[2] + radius * nz, nx, ny, nz];
    }, warnaGrid);
}

// ---------- Alat bantu: memindah, memutar, dan menggabungkan bentuk ----------
function ubahTitik(bentuk, fungsi, ubahNormal) {
    var v = bentuk.vertices.slice();
    for (var i = 0; i < v.length; i += 9) {
        var p = fungsi(v[i], v[i + 1], v[i + 2]);
        v[i] = p[0]; v[i + 1] = p[1]; v[i + 2] = p[2];
        if (ubahNormal) {
            var n = fungsi(v[i + 6], v[i + 7], v[i + 8]);
            v[i + 6] = n[0]; v[i + 7] = n[1]; v[i + 8] = n[2];
        }
    }
    return { vertices: v, faces: bentuk.faces.slice() };
}
export function geser(bentuk, dx, dy, dz) {
    return ubahTitik(bentuk, function (x, y, z) { return [x + dx, y + dy, z + dz]; }, false);
}
export function putarX(bentuk, a) {
    var c = Math.cos(a), s = Math.sin(a);
    return ubahTitik(bentuk, function (x, y, z) { return [x, y * c - z * s, y * s + z * c]; }, true);
}
export function putarY(bentuk, a) {
    var c = Math.cos(a), s = Math.sin(a);
    return ubahTitik(bentuk, function (x, y, z) { return [x * c + z * s, y, -x * s + z * c]; }, true);
}
export function putarZ(bentuk, a) {
    var c = Math.cos(a), s = Math.sin(a);
    return ubahTitik(bentuk, function (x, y, z) { return [x * c - y * s, x * s + y * c, z]; }, true);
}
export function gabung(...daftarBentuk) {
    var vertices = [], faces = [];
    daftarBentuk.forEach(function (b) {
        var offset = vertices.length / 9;
        vertices = vertices.concat(b.vertices);
        b.faces.forEach(function (f) { faces.push(f + offset); });
    });
    return { vertices: vertices, faces: faces };
}