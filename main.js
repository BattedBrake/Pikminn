// =====================================================================
// main.js - ROCK PIKMIN (Pikmin 3)  |  WebGL murni, tanpa three.js
// =====================================================================
//
// OBJEK YANG DIPAKAI:
//   1. Ellipsoid           -> Mata, pupil, sendi (siku, pergelangan, pergelangan kaki)
//                             Badan = batu bersegi low-poly (flat shading)
//   2. Elliptic Cone       -> Paha, betis, lengan atas, lengan bawah, jari tangan
//   3. Elliptic Paraboloid -> Daun (runcing & melengkung) dan jari kaki (pipih)
//   +  KURVA Bezier kubik  -> Tangkai kepala bergoyang
//
// ---------------------------------------------------------------------
// DOKUMENTASI 2 ARBITRARY CONNECTION PIVOTS PADA LENGAN:
// ---------------------------------------------------------------------
//   1. PIVOT 1 (Sendi Siku):
//      M_siku = M_lengan_atas x T(0, -L_lengan_atas, 0) x RX(sudut_siku)
//      -> Memutar lengan bawah di sekitar titik siku tanpa terlepas.
//
//   2. PIVOT 2 (Sendi Pergelangan / Dekat Jari-Jari):
//      M_wrist = M_siku x T(0, -L_lengan_bawah, 0) x RX(sudut_wrist)
//      -> Memutar telapak tangan & 3 jari di sekitar titik pergelangan.
// =====================================================================

function main() {
  var CANVAS = document.getElementById("your_canvas");
  CANVAS.width = window.innerWidth;
  CANVAS.height = window.innerHeight;

  // ===================================================================
  // 1. KAMERA ORBIT
  // ===================================================================
  var THETA = 0.35, PHI = 0.3, DIST = 10;
  var drag = false, xPrev = 0, yPrev = 0, dX = 0, dY = 0;

  CANVAS.addEventListener("mousedown", function (e) {
    drag = true; xPrev = e.pageX; yPrev = e.pageY; e.preventDefault();
  });
  window.addEventListener("mouseup", function () { drag = false; });
  window.addEventListener("mousemove", function (e) {
    if (!drag) return;
    dX = ((e.pageX - xPrev) * Math.PI) / CANVAS.width;
    dY = ((e.pageY - yPrev) * Math.PI) / CANVAS.height;
    THETA += dX; PHI = Math.max(-0.15, Math.min(1.45, PHI + dY));
    xPrev = e.pageX; yPrev = e.pageY;
  });
  CANVAS.addEventListener("wheel", function (e) {
    DIST = Math.max(5, Math.min(30, DIST + e.deltaY * 0.01));
    e.preventDefault();
  }, { passive: false });

  // ===================================================================
  // 2. WEBGL CONTEXT & SHADER
  // ===================================================================
  var GL = CANVAS.getContext("webgl", { antialias: true });
  if (!GL) { alert("WebGL context cannot be initialized"); return; }

  var vertexSource = `
    attribute vec3 position;
    attribute vec3 normal;
    attribute vec3 color;
    uniform mat4 Pmatrix, Vmatrix, Mmatrix;
    uniform mat3 Nmatrix;
    varying vec3 vNormal, vWorld, vColor;
    void main(void) {
      vec4 world = Mmatrix * vec4(position, 1.);
      vWorld = world.xyz;
      vNormal = Nmatrix * normal;
      vColor = color;
      gl_Position = Pmatrix * Vmatrix * world;
    }`;

  var fragmentSource = `
    precision mediump float;
    varying vec3 vNormal, vWorld, vColor;
    uniform vec3 uEye;
    uniform float uShine, uSpec;
    void main(void) {
      vec3 N = normalize(vNormal);
      if (!gl_FrontFacing) N = -N;
      vec3 sun  = normalize(vec3(0.45, 0.85, 0.55));
      vec3 fill = normalize(vec3(-0.7, 0.25, -0.35));
      vec3 V = normalize(uEye - vWorld);
      vec3 ambient = mix(vec3(0.30, 0.32, 0.30), vec3(0.50, 0.58, 0.72), N.y * 0.5 + 0.5);
      vec3 diffuse = max(dot(N, sun), 0.0) * vec3(1.0, 0.96, 0.88) * 0.85
                   + max(dot(N, fill), 0.0) * vec3(0.30, 0.36, 0.55) * 0.35;
      float spec = pow(max(dot(N, normalize(sun + V)), 0.0), uShine) * uSpec;
      float rim = pow(1.0 - max(dot(N, V), 0.0), 3.0) * 0.12;
      gl_FragColor = vec4(vColor * (ambient * 0.75 + diffuse) + vec3(spec) + rim * vec3(0.6, 0.7, 1.0), 1.0);
    }`;

  var vs = GL.createShader(GL.VERTEX_SHADER);
  GL.shaderSource(vs, vertexSource); GL.compileShader(vs);
  var fs = GL.createShader(GL.FRAGMENT_SHADER);
  GL.shaderSource(fs, fragmentSource); GL.compileShader(fs);

  var PROGRAM = GL.createProgram();
  GL.attachShader(PROGRAM, vs); GL.attachShader(PROGRAM, fs); GL.linkProgram(PROGRAM);
  GL.useProgram(PROGRAM);

  var uP = GL.getUniformLocation(PROGRAM, "Pmatrix"), uV = GL.getUniformLocation(PROGRAM, "Vmatrix");
  var uM = GL.getUniformLocation(PROGRAM, "Mmatrix"), uN = GL.getUniformLocation(PROGRAM, "Nmatrix");
  var uEye = GL.getUniformLocation(PROGRAM, "uEye");
  var uShine = GL.getUniformLocation(PROGRAM, "uShine"), uSpec = GL.getUniformLocation(PROGRAM, "uSpec");
  var aPos = GL.getAttribLocation(PROGRAM, "position");
  var aNormal = GL.getAttribLocation(PROGRAM, "normal");
  var aColor = GL.getAttribLocation(PROGRAM, "color");
  GL.enableVertexAttribArray(aPos); GL.enableVertexAttribArray(aNormal); GL.enableVertexAttribArray(aColor);

  GL.enable(GL.DEPTH_TEST);
  GL.depthFunc(GL.LEQUAL);
  GL.clearColor(0.62, 0.82, 0.95, 1.0);

  // ===================================================================
  // 3. GENERATOR MESH UTILITIES
  // ===================================================================
  function buildMesh(fn, nu, nv, color) {
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
      var n = LIBS.cross3(e1, e2);
      if (Math.hypot(n[0], n[1], n[2]) < 1e-10) return;
      tri.n = n; kept.push(tri);
      for (k = 0; k < 3; k++) {
        var key = tri[k].p.map(function (x) { return Math.round(x * 1e4); }).join(",");
        normalAt[key] = normalAt[key] || [0, 0, 0];
        normalAt[key][0] += n[0]; normalAt[key][1] += n[1]; normalAt[key][2] += n[2];
      }
    });
    var data = new Float32Array(kept.length * 3 * 9), o = 0;
    kept.forEach(function (tri) {
      tri.forEach(function (vtx) {
        var key = vtx.p.map(function (x) { return Math.round(x * 1e4); }).join(",");
        var n = LIBS.norm3(normalAt[key]);
        var col = typeof color === "function" ? color(vtx.p, vtx.u, vtx.v) : color;
        data.set([vtx.p[0], vtx.p[1], vtx.p[2], n[0], n[1], n[2], col[0], col[1], col[2]], o);
        o += 9;
      });
    });
    return { data: data, count: kept.length * 3, dirty: true };
  }

  function buildTube(mesh, pts, r0, r1, sides, color) {
    var n = pts.length, ring = [], j, i;
    for (j = 0; j < n; j++) {
      var before = pts[Math.max(0, j - 1)], after = pts[Math.min(n - 1, j + 1)];
      var tangent = LIBS.norm3([after[0] - before[0], after[1] - before[1], after[2] - before[2]]);
      var side1 = LIBS.norm3(LIBS.cross3(tangent, [0, 0, 1]));
      var side2 = LIBS.cross3(side1, tangent);
      ring.push({ a: side1, b: side2, r: r0 + ((r1 - r0) * j) / (n - 1) });
    }
    var data = new Float32Array((n - 1) * sides * 6 * 9), o = 0;
    var corner = function (ii, jj) {
      var th = (2 * Math.PI * (ii % sides)) / sides, c = Math.cos(th), s = Math.sin(th), f = ring[jj];
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

  // ===================================================================
  // 4. BENTUK GEOMETRI DASAR
  // ===================================================================
  var PI = Math.PI;
  var GRAY = [0.72, 0.75, 0.78];

  var ellipsoid = function (a, b, c) {
    return function (i, j, u, v) {
      var th = 2 * PI * u, ph = PI * v;
      return [a * Math.sin(ph) * Math.cos(th), b * Math.cos(ph), c * Math.sin(ph) * Math.sin(th)];
    };
  };

  var cone = function (r0, r1, len, zr) {
    return function (i, j, u, v) {
      var th = 2 * PI * u, r = r0 + (r1 - r0) * v;
      return [r * Math.cos(th), -len * v, zr * r * Math.sin(th)];
    };
  };

  var toe = function (a, b, h) {
    return function (i, j, u, v) {
      var th = 2 * PI * u, r = Math.sqrt(1 - v);
      return [a * r * Math.cos(th), b * r * Math.sin(th), h * v];
    };
  };

  var LEAF = { a: 1.0, b: 0.4, h: 0.12, bend: 0.35 };
  var leaf = function (i, j, u, v) {
    var th = 2 * PI * u, r = v;
    var x = LEAF.a * r * Math.cos(th), z = LEAF.b * r * Math.sin(th), y = LEAF.h * r * r;
    var xn = (x / LEAF.a + 1) / 2;
    z *= 1 - 0.97 * Math.pow(xn, 1.6);
    y -= LEAF.bend * xn * xn;
    return [x, y, z];
  };

  // ===================================================================
  // 5. INISIALISASI MESH
  // ===================================================================
  var ROCK_VERTICES = [
    [0.05, 1.02, -0.05], [-0.35, 0.88, 0.22], [0.38, 0.85, 0.25], [0.32, 0.82, -0.40], [-0.38, 0.80, -0.38],
    [-0.62, 0.42, 0.48], [0.00, 0.55, 0.65], [0.60, 0.38, 0.45], [0.72, 0.32, -0.35], [0.00, 0.40, -0.72], [-0.68, 0.35, -0.38],
    [-0.65, -0.22, 0.42], [0.00, -0.25, 0.60], [0.62, -0.20, 0.40], [0.65, -0.25, -0.38], [0.00, -0.30, -0.65], [-0.62, -0.28, -0.42],
    [-0.32, -0.75, 0.25], [0.30, -0.78, 0.22], [0.28, -0.80, -0.28], [-0.30, -0.78, -0.30], [0.00, -0.98, -0.02],
  ];

  var ROCK_TRIANGLES = [
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
  var ROCK_COLORS = [[0.26, 0.29, 0.35], [0.34, 0.38, 0.44], [0.45, 0.48, 0.52]];

  var bodyMesh = { data: new Float32Array(ROCK_TRIANGLES.length * 3 * 9), count: ROCK_TRIANGLES.length * 3, dirty: true };
  ROCK_TRIANGLES.forEach(function (face, f) {
    var p = face.v.map(function (id) { return ROCK_VERTICES[id]; });
    var n = LIBS.norm3(LIBS.cross3(
      [p[1][0] - p[0][0], p[1][1] - p[0][1], p[1][2] - p[0][2]],
      [p[2][0] - p[0][0], p[2][1] - p[0][1], p[2][2] - p[0][2]]));
    for (var k = 0; k < 3; k++) {
      bodyMesh.data.set([p[k][0], p[k][1], p[k][2], n[0], n[1], n[2]].concat(ROCK_COLORS[face.c]), (f * 3 + k) * 9);
    }
  });
  // =================================================================
  // 5.1. MATA, PUPIL, LENGAN, JARI TANGAN, JARI KAKI, DAUN & TANGKAI
  // =================================================================
  var ballGray = buildMesh(ellipsoid(1, 1, 1), 22, 14, GRAY); // Bola untuk sendi siku, pergelangan tangan

  var eyeWhite = buildMesh(ellipsoid(1, 1, 1), 22, 14, [0.98, 0.98, 0.98]);// Bola mata putih
  var eyePupil = buildMesh(ellipsoid(1, 1, 1), 22, 14, [0.03, 0.03, 0.04]);// Bola pupil hitam

  var L_LEG = 0.85;// Panjang paha + betis (dari pangkal paha ke tumit)
  var legCone = buildMesh(cone(0.19, 0.0, L_LEG, 1.0), 20, 1, GRAY);// Kerucut untuk paha + betis
  var legCylinder = buildMesh(cone(0.07, 0.07, L_LEG, 1.0), 20, 1, GRAY);// Silinder untuk paha + betis (opsional, bisa diganti kerucut)
  var footToe = buildMesh(toe(0.065, 0.025, 0.36), 16, 10, GRAY);// Jari kaki (pipih & runcing)
  var FOOT_BALL = 0.08, TOE_DROP = 0.06, FOOT_H = TOE_DROP + 0.025;// Bola untuk sendi pergelangan kaki, dan jarak dari tumit ke jari kaki

  // LENGAN TERPISAH DENGAN 2 SENDI ARBITRARY (Upper Arm & Forearm)
  var ARM_UPPER_LEN = 0.42, ARM_FORE_LEN = 0.38;// Panjang lengan atas & lengan bawah (dari bahu ke pergelangan tangan)
  var armUpperMesh = buildMesh(cone(0.07, 0.05, ARM_UPPER_LEN, 1.0), 16, 1, GRAY);// Kerucut untuk lengan atas
  var armForearmMesh = buildMesh(cone(0.05, 0.035, ARM_FORE_LEN, 1.0), 16, 1, GRAY);// Kerucut untuk lengan bawah
  var handFinger = buildMesh(cone(0.026, 0.003, 0.18, 1.0), 10, 1, GRAY);// Kerucut untuk jari tangan (runcing & pipih)

  var leafMesh = buildMesh(leaf, 28, 12, function (p, u, v) {
    var rib = Math.max(0, 1 - Math.abs(p[2]) / 0.05);
    return [0.5 + 0.2 * v + 0.1 * rib, 0.8 + 0.1 * v + 0.06 * rib, 0.2 + 0.1 * v];
  });

  var stalkMesh = { data: new Float32Array(0), count: 0, dirty: true };

  // ===================================================================
  // 6. PENEMPELAN MATA & TANGKAI DENGAN RAY-CASTING
  // ===================================================================
  var bd = bodyMesh.data;
  var EYE_X = 0.2, EYE_Y = 0.45, EYE_FRAME = {};
  [-1, 1].forEach(function (s) {
    var x = s * EYE_X, y = EYE_Y, best = null;
    for (var t = 0; t < bodyMesh.count; t += 3) {
      var a = t * 9, b = (t + 1) * 9, c = (t + 2) * 9;
      var den = (bd[b + 1] - bd[c + 1]) * (bd[a] - bd[c]) + (bd[c] - bd[b]) * (bd[a + 1] - bd[c + 1]);
      if (Math.abs(den) < 1e-9) continue;
      var l1 = ((bd[b + 1] - bd[c + 1]) * (x - bd[c]) + (bd[c] - bd[b]) * (y - bd[c + 1])) / den;
      var l2 = ((bd[c + 1] - bd[a + 1]) * (x - bd[c]) + (bd[a] - bd[c]) * (y - bd[c + 1])) / den;
      var l3 = 1 - l1 - l2;
      if (l1 < -1e-6 || l2 < -1e-6 || l3 < -1e-6) continue;
      var z = l1 * bd[a + 2] + l2 * bd[b + 2] + l3 * bd[c + 2];
      if (!best || z > best.z) {
        var n = [bd[a + 3], bd[a + 4], bd[a + 5]];
        if (n[2] < 0) n = [-n[0], -n[1], -n[2]];
        best = { z: z, n: n };
      }
    }
    var axisX = LIBS.norm3(LIBS.cross3([0, 1, 0], best.n)), axisY = LIBS.cross3(best.n, axisX);
    var origin = [x + best.n[0] * 0.015, y + best.n[1] * 0.015, best.z + best.n[2] * 0.015];
    EYE_FRAME[s] = LIBS.basis(axisX, axisY, best.n, origin);
  });

  var BODY_TOP_X = 0.05, BODY_TOP = -9;
  for (var t = 0; t < bodyMesh.count; t += 3) {
    var a = t * 9, b = (t + 1) * 9, c = (t + 2) * 9;
    var den = (bd[b + 2] - bd[c + 2]) * (bd[a] - bd[c]) + (bd[c] - bd[b]) * (bd[a + 2] - bd[c + 2]);
    if (Math.abs(den) < 1e-9) continue;
    var l1 = ((bd[b + 2] - bd[c + 2]) * (BODY_TOP_X - bd[c]) + (bd[c] - bd[b]) * (0 - bd[c + 2])) / den;
    var l2 = ((bd[c + 2] - bd[a + 2]) * (BODY_TOP_X - bd[c]) + (bd[a] - bd[c]) * (0 - bd[c + 2])) / den;
    var l3 = 1 - l1 - l2;
    if (l1 < -1e-6 || l2 < -1e-6 || l3 < -1e-6) continue;
    BODY_TOP = Math.max(BODY_TOP, l1 * bd[a + 1] + l2 * bd[b + 1] + l3 * bd[c + 1]);
  }
  BODY_TOP -= 0.04;

  // ===================================================================
  // 7. MATRIKS & PROYEKSI
  // ===================================================================
  var mul = LIBS.mul, T = LIBS.translation, S = LIBS.scaling;
  var RX = LIBS.rotationX, RY = LIBS.rotationY, RZ = LIBS.rotationZ;
  var PROJ = LIBS.get_projection(40, CANVAS.width / CANVAS.height, 1, 100);
  window.addEventListener("resize", function () {
    CANVAS.width = window.innerWidth; CANVAS.height = window.innerHeight;
    PROJ = LIBS.get_projection(40, CANVAS.width / CANVAS.height, 1, 100);
  });

  var HIP_X = 0.24, HIP_Y = -0.55;
  var SPLAY = 0.12, HIP_SWING = 0.0;
  var BODY_Y = -HIP_Y + L_LEG * Math.cos(SPLAY) * Math.cos(HIP_SWING) + FOOT_H;

  // ===================================================================
  // 8. FUNGSI DRAW
  // ===================================================================
  function draw(mesh, M, shine, spec) {
    if (!mesh.buf) mesh.buf = GL.createBuffer();
    GL.bindBuffer(GL.ARRAY_BUFFER, mesh.buf);
    if (mesh.dirty) { GL.bufferData(GL.ARRAY_BUFFER, mesh.data, GL.DYNAMIC_DRAW); mesh.dirty = false; }
    GL.vertexAttribPointer(aPos, 3, GL.FLOAT, false, 36, 0);
    GL.vertexAttribPointer(aNormal, 3, GL.FLOAT, false, 36, 12);
    GL.vertexAttribPointer(aColor, 3, GL.FLOAT, false, 36, 24);
    GL.uniformMatrix4fv(uM, false, M);
    GL.uniformMatrix3fv(uN, false, LIBS.normalMatrix(M));
    GL.uniform1f(uShine, shine);
    GL.uniform1f(uSpec, spec);
    GL.drawArrays(GL.TRIANGLES, 0, mesh.count);
  }

  // ===================================================================
  // 9. ANIMASI & RENDER LOOP (2 ARBITRARY ROTATION JOINTS ON ARMS)
  // ===================================================================
  function animate(ms) {
    var t = ms / 1000;
    if (!drag) {
      dX *= 0.95; dY *= 0.95;
      THETA += dX; PHI = Math.max(-0.15, Math.min(1.45, PHI + dY));
    }

    var sway = 0.27 * Math.sin(t * 1.5) + 0.25 * Math.sin(t * 1.9);
    var swayZ = 0.4 * Math.sin(t * 1.4 + 1);

    var bodyF = T(0, BODY_Y, 0);

    var view = mul(T(0, -1.7, -DIST), mul(RX(PHI), RY(THETA)));
    GL.viewport(0, 0, CANVAS.width, CANVAS.height);
    GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
    GL.uniformMatrix4fv(uP, false, PROJ);
    GL.uniformMatrix4fv(uV, false, view);
    GL.uniform3fv(uEye, LIBS.eyeFromView(view));

    // BADAN
    draw(bodyMesh, bodyF, 20, 0.25);

    // MATA & PUPIL
    [-1, 1].forEach(function (s) {
      var eyeF = mul(bodyF, EYE_FRAME[s]);
      draw(eyeWhite, mul(eyeF, S(0.125, 0.14, 0.055)), 60, 0.7);
      var pupilF = mul(eyeF, T(0, 0, 0.05));
      draw(eyePupil, mul(pupilF, S(0.085, 0.1, 0.035)), 80, 0.9);
    });

    // TANGKAI BÉZIER KUBIK
    var P0 = [0, -0.05, 0];
    var P1 = [0.05 * sway, 0.45, 0.03 * swayZ];
    var P2 = [0.05 + 0.2 * sway, 0.9, 0.07 * swayZ];
    var P3 = [0.4 + 0.4 * sway, 1.2 - 0.08 * Math.abs(sway), 0.1 * swayZ];
    var curve = [];
    for (var k = 0; k <= 22; k++) {
      var u = k / 22, w = 1 - u, point = [0, 0, 0];
      for (var axis = 0; axis < 3; axis++) {
        point[axis] = w * w * w * P0[axis] + 3 * w * w * u * P1[axis] + 3 * w * u * u * P2[axis] + u * u * u * P3[axis];
      }
      curve.push(point);
    }
    buildTube(stalkMesh, curve, 0.1, 0.055, 9, function (v) { return [0.66 - 0.2 * v, 0.69, 0.7 - 0.3 * v]; });
    var stalkF = mul(bodyF, T(BODY_TOP_X, BODY_TOP, 0));
    draw(stalkMesh, stalkF, 20, 0.2);

    // DAUN
    var Tn = LIBS.norm3([P3[0] - P2[0], P3[1] - P2[1], P3[2] - P2[2]]);
    var perp = LIBS.norm3([-Tn[1], Tn[0], 0]);
    var raw = LIBS.norm3([perp[0] * 0.55, perp[1] * 0.55, 0.85]);
    var d = LIBS.dot3(raw, Tn);
    var Nn = LIBS.norm3([raw[0] - Tn[0] * d, raw[1] - Tn[1] * d, raw[2] - Tn[2] * d]);
    var Wn = LIBS.cross3(Tn, Nn);
    var leafOrigin = [
      P3[0] + Tn[0] * (LEAF.a - 0.04) - Nn[0] * LEAF.h,
      P3[1] + Tn[1] * (LEAF.a - 0.04) - Nn[1] * LEAF.h,
      P3[2] + Tn[2] * (LEAF.a - 0.04) - Nn[2] * LEAF.h,
    ];
    draw(leafMesh, mul(stalkF, LIBS.basis(Tn, Nn, Wn, leafOrigin)), 24, 0.35);

    // =================================================================
    // HIERARKI LENGAN DENGAN 2 ARBITRARY ROTATION PIVOTS 
    // =================================================================
    var armRaise = -0.75 + 0.10 * Math.sin(t * 2.5);   // Bahu terangkat ke depan
    var elbowBend = -1.20 + 0.15 * Math.sin(t * 3.0);  // PIVOT 1: Sendi Siku
    var wristFlex = -0.35 + 0.10 * Math.cos(t * 3.0);  // PIVOT 2: Sendi Pergelangan

    [-1, 1].forEach(function (s) {
      // 1. ROTASI BAHU (SHOULDER): M_bahu = M_badan x T(bahu) x RZ(buka) x RX(angkat)
      var shoulderF = mul(bodyF, mul(T(s * 0.58, 0.28, 0.05), mul(RZ(s * 0.6), RX(armRaise))));
      draw(armUpperMesh, shoulderF, 30, 0.25);

      // 2. ROTASI PIVOT 1 (SENDI SIKU - ARBITRARY ELBOW PIVOT):
      //    M_siku = M_bahu x T(0, -L_upper, 0) x RX(elbowBend)
      var elbowF = mul(shoulderF, mul(T(0, -ARM_UPPER_LEN, 0), RX(elbowBend)));
      draw(ballGray, mul(elbowF, S(0.05, 0.05, 0.05)), 30, 0.25); // Bola Sendi Siku
      draw(armForearmMesh, elbowF, 30, 0.25);                      // Lengan Bawah

      // 3. ROTASI PIVOT 2 (SENDI PERGELANGAN - ARBITRARY WRIST PIVOT):
      //    M_wrist = M_siku x T(0, -L_forearm, 0) x RX(wristFlex)
      var wristF = mul(elbowF, mul(T(0, -ARM_FORE_LEN, 0), RX(wristFlex)));
      draw(ballGray, mul(wristF, S(0.04, 0.04, 0.04)), 30, 0.25); // Bola Sendi Pergelangan

      // 4. JARI-JARI TANGAN (Anak dari Sendi Pergelangan)
      for (var c = -1; c <= 1; c++) {
        var fingerF = mul(wristF, mul(T(0, -0.02, 0), mul(RZ(c * 0.45), RX(-0.2))));
        draw(handFinger, fingerF, 30, 0.25);
      }

      // KAKI (Paha Cone + Betis Cylinder)
      var legF = mul(bodyF, mul(T(s * HIP_X, HIP_Y, 0.02), mul(RZ(s * SPLAY), RX(s * HIP_SWING))));
      draw(legCone, legF, 30, 0.25);
      draw(legCylinder, legF, 30, 0.25);

      // PERGELANGAN KAKI (Foot Ankle & Toes)
      var ankleF = mul(legF, mul(T(0, -L_LEG, 0), mul(RX(-s * HIP_SWING), RZ(-s * SPLAY))));
      draw(ballGray, mul(ankleF, S(FOOT_BALL, FOOT_BALL, FOOT_BALL)), 30, 0.25);
      for (var f = -1; f <= 1; f++) {
        draw(footToe, mul(ankleF, mul(T(0, -TOE_DROP, 0), RY(f * 0.5))), 30, 0.08);
      }
    });

    GL.flush();
    window.requestAnimationFrame(animate);
  }

  window.__rock = { cam: function (th, ph, d) { THETA = th; PHI = ph; DIST = d; } };
  animate(0);
}

window.addEventListener("load", main);