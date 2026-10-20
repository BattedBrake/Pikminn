// libs.js - helper matematika WebGL (tanpa three.js)
// Fungsi bawaan template pertemuan6 dipertahankan, ditambah operasi matriks
// yang dibutuhkan untuk animasi hierarkis (mul, translation, scaling, dst).
// Semua matriks 4x4 berformat column-major (sama seperti template).

var LIBS = {

  get_json: function (url, func) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", url, true);
    xmlHttp.onreadystatechange = function () {
      if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
        func(JSON.parse(xmlHttp.responseText));
      }
    };
    xmlHttp.send();
  },

  degToRad: function (angle) {
    return (angle * Math.PI) / 180;
  },

  get_projection: function (angle, a, zMin, zMax) {
    var tan = Math.tan(LIBS.degToRad(0.5 * angle)),
      A = -(zMax + zMin) / (zMax - zMin),
      B = (-2 * zMax * zMin) / (zMax - zMin);

    return [
      0.5 / tan, 0, 0, 0,
      0, (0.5 * a) / tan, 0, 0,
      0, 0, A, -1,
      0, 0, B, 0,
    ];
  },

  get_I4: function () {
    return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  },

  set_I4: function (m) {
    (m[0] = 1), (m[1] = 0), (m[2] = 0), (m[3] = 0),
      (m[4] = 0), (m[5] = 1), (m[6] = 0), (m[7] = 0),
      (m[8] = 0), (m[9] = 0), (m[10] = 1), (m[11] = 0),
      (m[12] = 0), (m[13] = 0), (m[14] = 0), (m[15] = 1);
  },

  rotateX: function (m, angle) {
    var c = Math.cos(angle);
    var s = Math.sin(angle);
    var mv1 = m[1], mv5 = m[5], mv9 = m[9];
    m[1] = m[1] * c - m[2] * s;
    m[5] = m[5] * c - m[6] * s;
    m[9] = m[9] * c - m[10] * s;

    m[2] = m[2] * c + mv1 * s;
    m[6] = m[6] * c + mv5 * s;
    m[10] = m[10] * c + mv9 * s;
  },

  rotateY: function (m, angle) {
    var c = Math.cos(angle);
    var s = Math.sin(angle);
    var mv0 = m[0], mv4 = m[4], mv8 = m[8];
    m[0] = c * m[0] + s * m[2];
    m[4] = c * m[4] + s * m[6];
    m[8] = c * m[8] + s * m[10];

    m[2] = c * m[2] - s * mv0;
    m[6] = c * m[6] - s * mv4;
    m[10] = c * m[10] - s * mv8;
  },

  rotateZ: function (m, angle) {
    var c = Math.cos(angle);
    var s = Math.sin(angle);
    var mv0 = m[0], mv4 = m[4], mv8 = m[8];
    m[0] = c * m[0] - s * m[1];
    m[4] = c * m[4] - s * m[5];
    m[8] = c * m[8] - s * m[9];

    m[1] = c * m[1] + s * mv0;
    m[5] = c * m[5] + s * mv4;
    m[9] = c * m[9] + s * mv8;
  },

  translateZ: function (m, t) {
    m[14] += t;
  },

  translateY: function (m, t) {
    m[13] += t;
  },

  /* ================= TAMBAHAN UNTUK ANIMASI HIERARKIS ================= */

  // hasil = a * b  (column-major)
  mul: function (a, b) {
    var o = new Array(16);
    for (var c = 0; c < 4; c++) {
      for (var r = 0; r < 4; r++) {
        var s = 0;
        for (var k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
        o[c * 4 + r] = s;
      }
    }
    return o;
  },

  translation: function (x, y, z) {
    return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1];
  },

  scaling: function (x, y, z) {
    return [x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1];
  },

  rotationX: function (a) {
    var c = Math.cos(a), s = Math.sin(a);
    return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1];
  },

  rotationY: function (a) {
    var c = Math.cos(a), s = Math.sin(a);
    return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1];
  },

  rotationZ: function (a) {
    var c = Math.cos(a), s = Math.sin(a);
    return [c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  },

  // matriks dari 3 sumbu basis + titik asal (kolom = sumbu x, y, z)
  basis: function (xa, ya, za, o) {
    return [
      xa[0], xa[1], xa[2], 0,
      ya[0], ya[1], ya[2], 0,
      za[0], za[1], za[2], 0,
      o[0], o[1], o[2], 1,
    ];
  },

  // normal matrix = transpose(inverse(upper-left 3x3)), untuk skala non-uniform
  normalMatrix: function (m) {
    var a00 = m[0], a10 = m[1], a20 = m[2];
    var a01 = m[4], a11 = m[5], a21 = m[6];
    var a02 = m[8], a12 = m[9], a22 = m[10];
    // kofaktor
    var c00 = a11 * a22 - a12 * a21;
    var c01 = -(a10 * a22 - a12 * a20);
    var c02 = a10 * a21 - a11 * a20;
    var c10 = -(a01 * a22 - a02 * a21);
    var c11 = a00 * a22 - a02 * a20;
    var c12 = -(a00 * a21 - a01 * a20);
    var c20 = a01 * a12 - a02 * a11;
    var c21 = -(a00 * a12 - a02 * a10);
    var c22 = a00 * a11 - a01 * a10;
    var det = a00 * c00 + a01 * c01 + a02 * c02;
    var id = Math.abs(det) < 1e-12 ? 1 : 1 / det;
    // N[r][c] = C[r][c]/det, disimpan column-major
    return [
      c00 * id, c01 * id, c02 * id,
      c10 * id, c11 * id, c12 * id,
      c20 * id, c21 * id, c22 * id,
    ];
  },

  // posisi kamera (dunia) dari view matrix rigid (rotasi + translasi)
  eyeFromView: function (V) {
    return [
      -(V[0] * V[12] + V[1] * V[13] + V[2] * V[14]),
      -(V[4] * V[12] + V[5] * V[13] + V[6] * V[14]),
      -(V[8] * V[12] + V[9] * V[13] + V[10] * V[14]),
    ];
  },

  // ---- vektor kecil ----
  norm3: function (v) {
    var l = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) || 1;
    return [v[0] / l, v[1] / l, v[2] / l];
  },
  cross3: function (a, b) {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ];
  },
  dot3: function (a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  },
};
