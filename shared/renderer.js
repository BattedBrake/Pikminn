import { LIBS } from "./libs.js";

/*
 * Renderer bersama: canvas, shader, kamera, kontrol mouse, dan loop animasi.
 * Dipakai oleh index.html terluar (scene gabungan) dan index.html tiap karakter
 * (tes satu karakter), supaya semua karakter dirender dengan shader yang sama.
 *
 * Pemakaian:
 *   const scene = createScene(document.getElementById("mycanvas"));
 *   const pikmin = new WingedPikmin(scene.GL);
 *   scene.run((shaderVars, root, time) => {
 *       pikmin.render(shaderVars, place(root, 0, 0, 0), time);
 *   });
 *
 * Mode kamera (opsi kedua):
 *   createScene(canvas)                       -> kamera PUTAR: drag mouse memutar seluruh objek (default)
 *   createScene(canvas, { kamera: "bebas" })  -> kamera BEBAS: jelajahi map
 *       W / A / S / D   = maju / kiri / mundur / kanan
 *       Space / Q       = naik,  Ctrl / E = turun
 *       Shift (tahan)   = bergerak lebih cepat
 *       Drag mouse      = melihat sekeliling (atau klik canvas lalu gerakkan mouse kalau kunciMouse: true; Esc untuk lepas)
 *     Opsi tambahan kamera bebas:
 *       posisiAwal: [x, y, z] (default [0, 0, 20]), arahAwal: derajat (default 0 = menghadap -z),
 *       kecepatan: satuan per detik (default 8), tinggiMin: fungsi (x, z) -> y terendah kamera (supaya tidak menembus tanah),
 *       jarakPandang: seberapa jauh objek masih terlihat (default 250), kunciMouse: true/false (default false)
 */
export function createScene(CANVAS, opsiScene = {}) {
    var MODE_BEBAS = opsiScene.kamera === "bebas";
    CANVAS.width = window.innerWidth;
    CANVAS.height = window.innerHeight;

    const GL = CANVAS.getContext("webgl", { antialias: true });

    if (!GL) {
        alert("WebGL context cannot be initialized");
        return null;
    }

    /*========================= SHADERS ========================= */
    var shader_vertex_source = `
        attribute vec3 position;
        attribute vec3 normal;
        attribute vec3 color;

        uniform mat4 Pmatrix, Vmatrix, Mmatrix;

        varying vec3 vColor;
        varying vec3 vNormal;
        varying vec3 vFragPos;
        varying vec3 vLocalPos;   // posisi di ruang objek: tekstur ikut menempel saat objek/kamera diputar

        void main(void) {
            vec4 worldPos = Mmatrix * vec4(position, 1.0);
            vFragPos = vec3(worldPos);
            vLocalPos = position;
            vNormal = mat3(Mmatrix) * normal;
            vColor = color;

            gl_Position = Pmatrix * Vmatrix * worldPos;
        }`;

    var shader_fragment_source = `
        precision mediump float;

        varying vec3 vColor;
        varying vec3 vNormal;
        varying vec3 vFragPos;
        varying vec3 vLocalPos;

        uniform vec3 lightPos;
        uniform vec3 uColor;
        uniform float uIsRough;
        uniform float uUseVertexColor;   // 0 = pakai uColor, 1 = pakai warna per-vertex

        // Material per objek (atur lewat setMaterial di renderer.js). Nilai < 0 = otomatis (ikut uIsRough).
        uniform float uMatShininess;     // ketajaman kilap: kecil = kilap lebar & lembut, besar = titik kilap kecil & tajam
        uniform float uMatSpecular;      // kekuatan kilap: 0 = tidak mengkilap sama sekali, 1 = kilap putih penuh
        uniform float uMatTexture;       // kekuatan tekstur batu prosedural: 0 = mulus, 1 = penuh
        uniform float uMatTexScale;      // kerapatan tekstur: makin besar makin halus/rapat polanya

        // ---- noise 3D untuk tekstur batu (tanpa file gambar) ----
        float hash(vec3 p) {
            p = fract(p * 0.3183099 + 0.1);
            p *= 17.0;
            return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
        }
        float noise(vec3 x) {
            vec3 i = floor(x);
            vec3 f = fract(x);
            f = f * f * (3.0 - 2.0 * f);
            return mix(mix(mix(hash(i + vec3(0, 0, 0)), hash(i + vec3(1, 0, 0)), f.x),
                           mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
                       mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x),
                           mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
        }
        float fbm(vec3 p) {   // 3 lapis noise: bercak besar + bintik sedang + butiran halus
            return 0.5 * noise(p) + 0.3 * noise(p * 2.1) + 0.2 * noise(p * 4.3);
        }

        const vec3 source_ambient_color  = vec3(1.0, 1.0, 1.0);
        const vec3 source_diffuse_color  = vec3(1.0, 1.0, 1.0);
        const vec3 source_specular_color = vec3(1.0, 1.0, 1.0);
        uniform vec3 uCameraPos;   // posisi kamera di dunia (untuk kilap/specular)

        void main(void) {
            vec3 N = normalize(vNormal);

            if (uIsRough > 0.5) {
                float bumpX = sin(vFragPos.x * 60.0) * cos(vFragPos.y * 60.0) * 0.08;
                float bumpY = cos(vFragPos.y * 60.0) * sin(vFragPos.z * 60.0) * 0.08;
                float bumpZ = sin(vFragPos.z * 60.0) * cos(vFragPos.x * 60.0) * 0.08;
                N = normalize(N + vec3(bumpX, bumpY, bumpZ));
            }

            // Tekstur batu: permukaan dibuat bergelombang kecil (normal digeser mengikuti noise)
            float pola = 0.5;
            if (uMatTexture > 0.0) {
                vec3 q = vLocalPos * uMatTexScale;
                pola = fbm(q);
                float e = 0.15;
                vec3 grad = vec3(fbm(q + vec3(e, 0, 0)) - pola,
                                 fbm(q + vec3(0, e, 0)) - pola,
                                 fbm(q + vec3(0, 0, e)) - pola) / e;
                N = normalize(N - grad * 0.25 * uMatTexture);
            }

            vec3 L = normalize(lightPos - vFragPos);

            vec3 ambient_color  = mix(vec3(0.4), vec3(0.5), uIsRough);
            vec3 diffuse_color  = mix(vec3(0.6), vec3(0.5), uIsRough);
            vec3 specular_color = mix(vec3(0.8), vec3(0.15), uIsRough);
            float shininess     = mix(64.0, 12.0, uIsRough);
            if (uMatShininess > 0.0) shininess = uMatShininess;
            if (uMatSpecular >= 0.0) specular_color = vec3(uMatSpecular);

            vec3 baseColor = mix(uColor, vColor, uUseVertexColor);

            // Tekstur batu: bercak gelap-terang + bintik mineral kecil yang sedikit lebih terang
            if (uMatTexture > 0.0) {
                float bintik = step(0.82, noise(vLocalPos * uMatTexScale * 6.0));
                baseColor *= mix(1.0, 0.55 + 0.9 * pola, uMatTexture);
                baseColor += bintik * 0.12 * uMatTexture;
            }

            vec3 ambient = source_ambient_color * ambient_color * baseColor;
            float lambert = max(dot(N, L), 0.0);
            vec3 diffuse = source_diffuse_color * diffuse_color * lambert * baseColor;

            vec3 V = normalize(uCameraPos - vFragPos);
            vec3 R = reflect(-L, N);
            float spec = pow(max(dot(R, V), 0.0), shininess);
            vec3 specular = source_specular_color * specular_color * spec;

            vec3 lighting = ambient + diffuse + specular;
            gl_FragColor = vec4(lighting, 1.0);
        }`;

    var compile_shader = function (source, type, typeString) {
        var shader = GL.createShader(type);
        GL.shaderSource(shader, source);
        GL.compileShader(shader);
        if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
            alert("ERROR IN " + typeString + " SHADER: " + GL.getShaderInfoLog(shader));
            return null;
        }
        return shader;
    };

    var shader_vertex = compile_shader(shader_vertex_source, GL.VERTEX_SHADER, "VERTEX");
    var shader_fragment = compile_shader(shader_fragment_source, GL.FRAGMENT_SHADER, "FRAGMENT");

    var SHADER_PROGRAM = GL.createProgram();
    GL.attachShader(SHADER_PROGRAM, shader_vertex);
    GL.attachShader(SHADER_PROGRAM, shader_fragment);
    GL.linkProgram(SHADER_PROGRAM);

    if (!GL.getProgramParameter(SHADER_PROGRAM, GL.LINK_STATUS)) {
        alert("SHADER LINK ERROR: " + GL.getProgramInfoLog(SHADER_PROGRAM));
        return null;
    }
    GL.useProgram(SHADER_PROGRAM);

    var shaderVars = {
        position: GL.getAttribLocation(SHADER_PROGRAM, "position"),
        normal: GL.getAttribLocation(SHADER_PROGRAM, "normal"),
        color: GL.getAttribLocation(SHADER_PROGRAM, "color"),
        Pmatrix: GL.getUniformLocation(SHADER_PROGRAM, "Pmatrix"),
        Vmatrix: GL.getUniformLocation(SHADER_PROGRAM, "Vmatrix"),
        mMmatrix: GL.getUniformLocation(SHADER_PROGRAM, "Mmatrix"),
        lightPos: GL.getUniformLocation(SHADER_PROGRAM, "lightPos"),
        uCameraPos: GL.getUniformLocation(SHADER_PROGRAM, "uCameraPos"),
        uColor: GL.getUniformLocation(SHADER_PROGRAM, "uColor"),
        uIsRough: GL.getUniformLocation(SHADER_PROGRAM, "uIsRough"),
        uUseVertexColor: GL.getUniformLocation(SHADER_PROGRAM, "uUseVertexColor"),
        uMatShininess: GL.getUniformLocation(SHADER_PROGRAM, "uMatShininess"),
        uMatSpecular: GL.getUniformLocation(SHADER_PROGRAM, "uMatSpecular"),
        uMatTexture: GL.getUniformLocation(SHADER_PROGRAM, "uMatTexture"),
        uMatTexScale: GL.getUniformLocation(SHADER_PROGRAM, "uMatTexScale"),
    };

    GL.enableVertexAttribArray(shaderVars.position);
    GL.enableVertexAttribArray(shaderVars.normal);
    GL.enableVertexAttribArray(shaderVars.color);

    /*=================== CAMERA & CONTROLS =================== */
    var JARAK_PANDANG = MODE_BEBAS ? (opsiScene.jarakPandang || 250) : 100;
    var PROJMATRIX = LIBS.get_projection(40, CANVAS.width / CANVAS.height, 1, JARAK_PANDANG);
    var VIEWMATRIX = LIBS.get_I4();

    // ---- Kamera bebas: posisi, arah (yaw = kiri-kanan, pitch = atas-bawah), dan tombol yang sedang ditekan ----
    var kamPos = (opsiScene.posisiAwal || [0, 0, 20]).slice();
    var kamYaw = (opsiScene.arahAwal || 0) * Math.PI / 180, kamPitch = 0;
    var KECEPATAN = opsiScene.kecepatan || 8;
    var tombol = {};
    if (MODE_BEBAS) {
        window.addEventListener("keydown", (e) => {
            tombol[e.code] = true;
            if (["Space", "KeyW", "KeyA", "KeyS", "KeyD"].includes(e.code)) e.preventDefault();
        });
        window.addEventListener("keyup", (e) => { tombol[e.code] = false; });
        window.addEventListener("blur", () => { tombol = {}; });   // jangan terus bergerak kalau jendela kehilangan fokus

        // Kunci mouse (opsional): klik canvas, lalu mouse menggerakkan pandangan tanpa perlu drag
        if (opsiScene.kunciMouse) {
            CANVAS.addEventListener("click", () => { if (CANVAS.requestPointerLock) CANVAS.requestPointerLock(); });
            document.addEventListener("mousemove", (e) => {
                if (document.pointerLockElement !== CANVAS) return;
                kamYaw += e.movementX * 0.0025;
                kamPitch = Math.max(-1.5, Math.min(1.5, kamPitch + e.movementY * 0.0025));
            });
        }
    }

    var THETA = 0, PHI = 0;
    var drag = false;
    var x_prev, y_prev;
    var FRICTION = 0.05;
    var dX = 0, dY = 0;

    CANVAS.addEventListener("mousedown", (e) => { drag = true; x_prev = e.pageX; y_prev = e.pageY; e.preventDefault(); }, false);
    CANVAS.addEventListener("mouseup", () => { drag = false; }, false);
    CANVAS.addEventListener("mouseout", () => { drag = false; }, false);
    CANVAS.addEventListener("mousemove", (e) => {
        if (!drag) return;
        if (MODE_BEBAS) {
            // Kamera bebas: drag = melihat sekeliling (arah pandang mengikuti arah drag)
            kamYaw += (e.pageX - x_prev) * 0.005;
            kamPitch = Math.max(-1.5, Math.min(1.5, kamPitch + (e.pageY - y_prev) * 0.005));
            x_prev = e.pageX; y_prev = e.pageY;
            e.preventDefault();
            return;
        }
        dX = (e.pageX - x_prev) * 2 * Math.PI / CANVAS.width;
        dY = (e.pageY - y_prev) * 2 * Math.PI / CANVAS.height;
        THETA += dX; PHI += dY;
        x_prev = e.pageX; y_prev = e.pageY;
        e.preventDefault();
    }, false);

    // Resize: perbarui ukuran canvas dan proyeksi
    window.addEventListener("resize", () => {
        CANVAS.width = window.innerWidth;
        CANVAS.height = window.innerHeight;
        PROJMATRIX = LIBS.get_projection(40, CANVAS.width / CANVAS.height, 1, JARAK_PANDANG);
    });

    /*========================= DRAWING LOOP ========================= */
    GL.enable(GL.DEPTH_TEST);
    GL.depthFunc(GL.LEQUAL);
    GL.enable(GL.BLEND);
    GL.blendFunc(GL.SRC_ALPHA, GL.ONE_MINUS_SRC_ALPHA);
    GL.clearColor(0.53, 0.81, 0.92, 1.0);

    // renderFn(shaderVars, MOUSE_ROT, TIME) dipanggil tiap frame
    var run = function (renderFn) {
        var TIME = 0;
        var waktuLalu = performance.now();

        var animate = function () {
            TIME += 0.05;
            var sekarang = performance.now();
            var dt = Math.min(0.1, (sekarang - waktuLalu) / 1000);   // detik sejak frame lalu (dibatasi supaya tidak meloncat)
            waktuLalu = sekarang;

            if (!drag) {
                dX *= (1 - FRICTION);
                dY *= (1 - FRICTION);
                THETA += dX;
                PHI += dY;
            }

            // 1. Bersihkan layar dan siapkan viewport
            GL.viewport(0, 0, CANVAS.width, CANVAS.height);
            GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

            // 2. Setup kamera & matriks utama
            if (MODE_BEBAS) {
                // Gerak WASD di bidang datar mengikuti arah hadap kamera
                var laju = KECEPATAN * dt * (tombol.ShiftLeft || tombol.ShiftRight ? 3 : 1);
                var maju = [Math.sin(kamYaw), -Math.cos(kamYaw)], kanan = [Math.cos(kamYaw), Math.sin(kamYaw)];
                var gx = 0, gz = 0, gy = 0;
                if (tombol.KeyW) { gx += maju[0]; gz += maju[1]; }
                if (tombol.KeyS) { gx -= maju[0]; gz -= maju[1]; }
                if (tombol.KeyD) { gx += kanan[0]; gz += kanan[1]; }
                if (tombol.KeyA) { gx -= kanan[0]; gz -= kanan[1]; }
                if (tombol.Space || tombol.KeyQ) gy += 1;
                if (tombol.ControlLeft || tombol.ControlRight || tombol.KeyE) gy -= 1;
                var panjang = Math.hypot(gx, gz) || 1;              // diagonal tidak lebih cepat
                kamPos[0] += gx / panjang * laju;
                kamPos[2] += gz / panjang * laju;
                kamPos[1] += gy * laju;
                if (opsiScene.tinggiMin) kamPos[1] = Math.max(kamPos[1], opsiScene.tinggiMin(kamPos[0], kamPos[2]));

                // VIEW = putarX(pitch) x putarY(yaw) x geser(-posisi kamera)
                var putarX = LIBS.get_I4(); LIBS.rotateX(putarX, kamPitch);
                var putarY = LIBS.get_I4(); LIBS.rotateY(putarY, kamYaw);
                var geser = LIBS.get_I4(); LIBS.set_position(geser, -kamPos[0], -kamPos[1], -kamPos[2]);
                var putar = LIBS.get_I4(); LIBS.multiply(putar, putarX, putarY);
                LIBS.multiply(VIEWMATRIX, putar, geser);
                GL.uniform3f(shaderVars.uCameraPos, kamPos[0], kamPos[1], kamPos[2]);
            } else {
                LIBS.set_I4(VIEWMATRIX);
                LIBS.translateZ(VIEWMATRIX, -20.0);
                GL.uniform3f(shaderVars.uCameraPos, 0.0, 0.0, 20.0);
            }

            GL.uniformMatrix4fv(shaderVars.Pmatrix, false, PROJMATRIX);
            GL.uniformMatrix4fv(shaderVars.Vmatrix, false, VIEWMATRIX);
            GL.uniform3f(shaderVars.lightPos, 5.0, 10.0, 10.0);

            // Reset default tiap frame (modul bisa menimpa sendiri)
            GL.uniform1f(shaderVars.uIsRough, 0.0);
            GL.uniform1f(shaderVars.uUseVertexColor, 0.0);
            resetMaterial(GL, shaderVars);

            // 3. Rotasi mouse (kamera bebas: dunia tidak diputar, kamera yang bergerak)
            var MOUSE_ROT = LIBS.get_I4();
            if (!MODE_BEBAS) {
                LIBS.rotateY(MOUSE_ROT, THETA);
                LIBS.rotateX(MOUSE_ROT, PHI);
            }

            // 4. Render semua objek
            renderFn(shaderVars, MOUSE_ROT, TIME);

            GL.flush();
            window.requestAnimationFrame(animate);
        };

        animate();
    };

    // posisiKamera() -> [x, y, z] kamera bebas saat ini (berguna untuk mencari koordinat saat menyusun ADEGAN)
    var posisiKamera = function () { return kamPos.slice(); };

    return { GL, CANVAS, shaderVars, run, posisiKamera };
}

// Geser objek ke posisi (x, y, z) relatif terhadap matriks parent, dengan skala s (opsional, default 1).
// Pakai ini di scene gabungan supaya karakter tidak bertumpuk di titik (0, 0, 0) dan ukurannya seimbang.
export function place(parent, x, y, z, s = 1) {
    var T = LIBS.get_I4();
    LIBS.scale(T, s, s, s);
    LIBS.set_position(T, x, y, z);
    var out = LIBS.get_I4();
    LIBS.multiply(out, parent, T);
    return out;
}

// ---------- Material per objek ----------
// Panggil sebelum menggambar sebuah bagian, lalu resetMaterial sesudahnya supaya objek lain tidak ikut berubah.
//   setMaterial(GL, shaderVars, { kilap: 20, kekuatanKilap: 0.25, tekstur: 0.6, skalaTekstur: 6 });
// Bagian yang tidak diisi memakai nilai otomatis (kilap & kekuatanKilap ikut uIsRough, tekstur mati).
export function setMaterial(GL, shaderVars, m) {
    GL.uniform1f(shaderVars.uMatShininess, m.kilap !== undefined ? m.kilap : -1);
    GL.uniform1f(shaderVars.uMatSpecular, m.kekuatanKilap !== undefined ? m.kekuatanKilap : -1);
    GL.uniform1f(shaderVars.uMatTexture, m.tekstur !== undefined ? m.tekstur : 0);
    GL.uniform1f(shaderVars.uMatTexScale, m.skalaTekstur !== undefined ? m.skalaTekstur : 4);
}

export function resetMaterial(GL, shaderVars) {
    setMaterial(GL, shaderVars, {});
}
