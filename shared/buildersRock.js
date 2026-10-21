// buildersRock.js
// Pembuat mesh untuk Rock Pikmin.
// Satu vertex = 9 angka: posisi(3) normal(3) warna(3)  -> stride 36 byte (sama dengan renderer bersama)
// Mesh = { data: Float32Array, count: jumlah vertex, dirty: true bila perlu dikirim ke GPU }
// Mesh digambar dengan drawArrays (tanpa index), lihat characters/rockPikmin/draw.js

const PI = Math.PI;

// ---------- vektor kecil ----------
export function norm3(v) {
    var l = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) || 1;
    return [v[0] / l, v[1] / l, v[2] / l];
}
export function cross3(a, b) {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
export function dot3(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
// matriks dari 3 sumbu basis + titik asal (kolom = sumbu x, y, z)
export function basis(xa, ya, za, o) {
    return [
        xa[0], xa[1], xa[2], 0,
        ya[0], ya[1], ya[2], 0,
        za[0], za[1], za[2], 0,
        o[0], o[1], o[2], 1,
    ];
}

// (a) PERMUKAAN PARAMETRIK: fn(i, j, u, v) -> [x, y, z], grid (nu+1) x (nv+1), u dan v di [0, 1].
//     Normal = rata-rata normal segitiga yang berbagi titik (halus). color = [r,g,b] atau function(p, u, v).
export function buildMesh(fn, nu, nv, color) {
    var P = [], tris = [], normalAt = {}, i, j, k;
    for (i = 0; i <= nu; i++) {
        P[i] = [];
        for (j = 0; j <= nv; j++) P[i][j] = { p: fn(i, j, i / nu, j / nv), u: i / nu, v: j / nv };
    }
    for (i = 0; i < nu; i++) {
        for (j = 0; j < nv; j++) {
            var a = P[i][j], b = P[i + 1][j], c = P[i + 1][j + 1], d = P[i][j + 1];
            tris.push([a, b, c], [a, c, d]);
        }
    }
    var kept = [];
    tris.forEach(function (tri) {
        var e1 = [tri[1].p[0] - tri[0].p[0], tri[1].p[1] - tri[0].p[1], tri[1].p[2] - tri[0].p[2]];
        var e2 = [tri[2].p[0] - tri[0].p[0], tri[2].p[1] - tri[0].p[1], tri[2].p[2] - tri[0].p[2]];
        var n = cross3(e1, e2);
        if (Math.hypot(n[0], n[1], n[2]) < 1e-10) return;          // buang segitiga degenerate (kutub)
        tri.n = n; kept.push(tri);
        for (k = 0; k < 3; k++) {                                   // kumpulkan normal per posisi titik
            var key = tri[k].p.map(function (x) { return Math.round(x * 1e4); }).join(",");
            normalAt[key] = normalAt[key] || [0, 0, 0];
            normalAt[key][0] += n[0]; normalAt[key][1] += n[1]; normalAt[key][2] += n[2];
        }
    });
    var data = new Float32Array(kept.length * 3 * 9), o = 0;
    kept.forEach(function (tri) {
        tri.forEach(function (vtx) {
            var key = vtx.p.map(function (x) { return Math.round(x * 1e4); }).join(",");
            var n = norm3(normalAt[key]);
            var col = typeof color === "function" ? color(vtx.p, vtx.u, vtx.v) : color;
            data.set([vtx.p[0], vtx.p[1], vtx.p[2], n[0], n[1], n[2], col[0], col[1], col[2]], o);
            o += 9;
        });
    });
    return { data: data, count: kept.length * 3, dirty: true };
}

// (b) TUBE MENGIKUTI DERETAN TITIK (dipakai tangkai & lengan). Hasil ditulis ke mesh yang diberikan.
//     Penampang bulat, radius mengecil linear dari r0 (titik pertama) ke r1 (titik terakhir).
export function buildTube(mesh, pts, r0, r1, sides, color) {
    var n = pts.length, ring = [], j, i;
    for (j = 0; j < n; j++) {
        var before = pts[Math.max(0, j - 1)], after = pts[Math.min(n - 1, j + 1)];
        var tangent = norm3([after[0] - before[0], after[1] - before[1], after[2] - before[2]]);
        var side1 = norm3(cross3(tangent, [0, 0, 1]));     // dua sumbu tegak lurus kurva
        var side2 = cross3(side1, tangent);
        ring.push({ a: side1, b: side2, r: r0 + ((r1 - r0) * j) / (n - 1) });
    }
    var data = new Float32Array((n - 1) * sides * 6 * 9), o = 0;
    var corner = function (ii, jj) {                              // satu titik di keliling tube
        var th = (2 * PI * (ii % sides)) / sides, c = Math.cos(th), s = Math.sin(th), f = ring[jj];
        var nx = c * f.a[0] + s * f.b[0], ny = c * f.a[1] + s * f.b[1], nz = c * f.a[2] + s * f.b[2];
        var col = typeof color === "function" ? color(jj / (n - 1)) : color;
        return [pts[jj][0] + f.r * nx, pts[jj][1] + f.r * ny, pts[jj][2] + f.r * nz, nx, ny, nz, col[0], col[1], col[2]];
    };
    for (j = 0; j < n - 1; j++) {
        for (i = 0; i < sides; i++) {
            var A = corner(i, j), B = corner(i + 1, j), C = corner(i + 1, j + 1), D = corner(i, j + 1);
            [A, C, B, A, D, C].forEach(function (v) { data.set(v, o); o += 9; });
        }
    }
    mesh.data = data; mesh.count = (n - 1) * sides * 6; mesh.dirty = true;
}

// ---------- BENTUK DASAR (parametrik) ----------

// OBJEK 1 - ELLIPSOID: x = a sin(phi) cos(theta), y = b cos(phi), z = c sin(phi) sin(theta)
export function ellipsoid(a, b, c) {
    return function (i, j, u, v) {
        var th = 2 * PI * u, ph = PI * v;
        return [a * Math.sin(ph) * Math.cos(th), b * Math.cos(ph), c * Math.sin(ph) * Math.sin(th)];
    };
}

// OBJEK 2 - ELLIPTIC CONE (frustum), menunjuk ke bawah (-Y): radius r0 di atas -> r1 di bawah.
//           r0 = r1 menghasilkan CYLINDER.  x = r cos(theta), z = zr r sin(theta)
export function cone(r0, r1, len, zr) {
    return function (i, j, u, v) {
        var th = 2 * PI * u, r = r0 + (r1 - r0) * v;
        return [r * Math.cos(th), -len * v, zr * r * Math.sin(th)];
    };
}

// OBJEK 3 - ELLIPTIC PARABOLOID, menunjuk ke +Z:  x = a r cos(theta), y = b r sin(theta), z = h v,  r = sqrt(1 - v)
//           dipakai untuk JARI KAKI (pipih: lebar a, tebal b, panjang h)
export function toe(a, b, h) {
    return function (i, j, u, v) {
        var th = 2 * PI * u, r = Math.sqrt(1 - v);
        return [a * r * Math.cos(th), b * r * Math.sin(th), h * v];
    };
}

// OBJEK 3 (dimodifikasi) - DAUN = paraboloid mangkuk:  x = a r cos, z = b r sin, y = h r^2
//   modifikasi 1: runcing ke ujung  -> z dikali (1 - 0.97 xn^1.6), xn = 0 (pangkal) .. 1 (ujung)
//   modifikasi 2: melengkung        -> y dikurangi bend * xn^2 (ujung melengkung ke bawah)
export const LEAF = { a: 1.0, b: 0.4, h: 0.12, bend: 0.35 };
export function leaf(i, j, u, v) {
    var th = 2 * PI * u, r = v;
    var x = LEAF.a * r * Math.cos(th), z = LEAF.b * r * Math.sin(th), y = LEAF.h * r * r;
    var xn = (x / LEAF.a + 1) / 2;
    z *= 1 - 0.97 * Math.pow(xn, 1.6);
    y -= LEAF.bend * xn * xn;
    return [x, y, z];
}

// ---------- BADAN: ellipsoid yang dimodifikasi menjadi batu bersegi (22 titik, 40 segitiga) ----------
const ROCK_VERTICES = [
    // puncak
    [0.05, 1.02, -0.05], [-0.35, 0.88, 0.22], [0.38, 0.85, 0.25], [0.32, 0.82, -0.40], [-0.38, 0.80, -0.38],                          // 0-4
    // atas-tengah (muka depan, tempat mata)
    [-0.62, 0.42, 0.48], [0.00, 0.55, 0.65], [0.60, 0.38, 0.45], [0.72, 0.32, -0.35], [0.00, 0.40, -0.72], [-0.68, 0.35, -0.38],      // 5-10
    // bawah-tengah
    [-0.65, -0.22, 0.42], [0.00, -0.25, 0.60], [0.62, -0.20, 0.40], [0.65, -0.25, -0.38], [0.00, -0.30, -0.65], [-0.62, -0.28, -0.42], // 11-16
    // alas meruncing
    [-0.32, -0.75, 0.25], [0.30, -0.78, 0.22], [0.28, -0.80, -0.28], [-0.30, -0.78, -0.30], [0.00, -0.98, -0.02],                     // 17-21
];
// v = indeks tiga titik, c = warna (0: abu grafit, 1: tepi lebih terang, 2: aksen perak)
const ROCK_TRIANGLES = [
    { v: [0, 1, 2], c: 1 }, { v: [0, 2, 3], c: 0 }, { v: [0, 3, 4], c: 0 }, { v: [0, 4, 1], c: 1 },
    { v: [1, 5, 6], c: 0 }, { v: [1, 6, 2], c: 1 }, { v: [2, 6, 7], c: 0 },
    { v: [2, 7, 8], c: 0 }, { v: [3, 2, 8], c: 2 }, { v: [3, 8, 9], c: 0 },
    { v: [4, 3, 9], c: 0 }, { v: [4, 9, 10], c: 2 }, { v: [1, 4, 10], c: 0 }, { v: [1, 10, 5], c: 0 },
    { v: [6, 5, 11], c: 0 }, { v: [6, 11, 12], c: 1 }, { v: [6, 12, 13], c: 1 }, { v: [6, 13, 7], c: 0 },
    { v: [7, 13, 14], c: 0 }, { v: [7, 14, 8], c: 2 }, { v: [8, 14, 15], c: 0 }, { v: [8, 15, 9], c: 0 },
    { v: [9, 15, 16], c: 0 }, { v: [9, 16, 10], c: 2 }, { v: [10, 16, 11], c: 0 }, { v: [10, 11, 5], c: 0 },
    { v: [12, 11, 17], c: 0 }, { v: [12, 17, 18], c: 1 }, { v: [12, 18, 13], c: 0 },
    { v: [13, 18, 19], c: 0 }, { v: [13, 19, 14], c: 2 }, { v: [14, 19, 15], c: 0 },
    { v: [15, 19, 20], c: 0 }, { v: [15, 20, 16], c: 0 }, { v: [16, 20, 17], c: 2 }, { v: [16, 17, 11], c: 0 },
    { v: [21, 17, 20], c: 0 }, { v: [21, 18, 17], c: 1 }, { v: [21, 19, 18], c: 0 }, { v: [21, 20, 19], c: 0 },
];
const ROCK_COLORS = [[0.26, 0.29, 0.35], [0.34, 0.38, 0.44], [0.45, 0.48, 0.52]];

export function rockBody() {
    var mesh = { data: new Float32Array(ROCK_TRIANGLES.length * 3 * 9), count: ROCK_TRIANGLES.length * 3, dirty: true };
    ROCK_TRIANGLES.forEach(function (face, f) {
        var p = face.v.map(function (id) { return ROCK_VERTICES[id]; });
        // FLAT SHADING: satu normal untuk seluruh segitiga -> tepi batu tajam
        var n = norm3(cross3(
            [p[1][0] - p[0][0], p[1][1] - p[0][1], p[1][2] - p[0][2]],
            [p[2][0] - p[0][0], p[2][1] - p[0][1], p[2][2] - p[0][2]]));
        for (var k = 0; k < 3; k++) {
            mesh.data.set([p[k][0], p[k][1], p[k][2], n[0], n[1], n[2]].concat(ROCK_COLORS[face.c]), (f * 3 + k) * 9);
        }
    });
    return mesh;
}
