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
 */
export function createScene(CANVAS) {
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

        void main(void) {
            vec4 worldPos = Mmatrix * vec4(position, 1.0);
            vFragPos = vec3(worldPos);
            vNormal = mat3(Mmatrix) * normal;
            vColor = color;

            gl_Position = Pmatrix * Vmatrix * worldPos;
        }`;

    var shader_fragment_source = `
        precision mediump float;

        varying vec3 vColor;
        varying vec3 vNormal;
        varying vec3 vFragPos;

        uniform vec3 lightPos;
        uniform vec3 uColor;
        uniform float uIsRough;

        const vec3 source_ambient_color  = vec3(1.0, 1.0, 1.0);
        const vec3 source_diffuse_color  = vec3(1.0, 1.0, 1.0);
        const vec3 source_specular_color = vec3(1.0, 1.0, 1.0);
        const vec3 cameraPos = vec3(0.0, 0.0, 20.0);

        void main(void) {
            vec3 N = normalize(vNormal);

            if (uIsRough > 0.5) {
                float bumpX = sin(vFragPos.x * 60.0) * cos(vFragPos.y * 60.0) * 0.08;
                float bumpY = cos(vFragPos.y * 60.0) * sin(vFragPos.z * 60.0) * 0.08;
                float bumpZ = sin(vFragPos.z * 60.0) * cos(vFragPos.x * 60.0) * 0.08;
                N = normalize(N + vec3(bumpX, bumpY, bumpZ));
            }

            vec3 L = normalize(lightPos - vFragPos);

            vec3 ambient_color  = mix(vec3(0.4), vec3(0.5), uIsRough);
            vec3 diffuse_color  = mix(vec3(0.6), vec3(0.5), uIsRough);
            vec3 specular_color = mix(vec3(0.8), vec3(0.15), uIsRough);
            float shininess     = mix(64.0, 12.0, uIsRough);

            vec3 ambient = source_ambient_color * ambient_color * uColor;
            float lambert = max(dot(N, L), 0.0);
            vec3 diffuse = source_diffuse_color * diffuse_color * lambert * uColor;

            vec3 V = normalize(cameraPos - vFragPos);
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
        uColor: GL.getUniformLocation(SHADER_PROGRAM, "uColor"),
        uIsRough: GL.getUniformLocation(SHADER_PROGRAM, "uIsRough"),
    };

    GL.enableVertexAttribArray(shaderVars.position);
    GL.enableVertexAttribArray(shaderVars.normal);
    GL.enableVertexAttribArray(shaderVars.color);

    /*=================== CAMERA & CONTROLS =================== */
    var PROJMATRIX = LIBS.get_projection(40, CANVAS.width / CANVAS.height, 1, 100);
    var VIEWMATRIX = LIBS.get_I4();

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
        PROJMATRIX = LIBS.get_projection(40, CANVAS.width / CANVAS.height, 1, 100);
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

        var animate = function () {
            TIME += 0.05;

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
            LIBS.set_I4(VIEWMATRIX);
            LIBS.translateZ(VIEWMATRIX, -20.0);

            GL.uniformMatrix4fv(shaderVars.Pmatrix, false, PROJMATRIX);
            GL.uniformMatrix4fv(shaderVars.Vmatrix, false, VIEWMATRIX);
            GL.uniform3f(shaderVars.lightPos, 5.0, 10.0, 10.0);

            // Reset default tiap frame (modul bisa menimpa sendiri)
            GL.uniform1f(shaderVars.uIsRough, 0.0);

            // 3. Rotasi mouse
            var MOUSE_ROT = LIBS.get_I4();
            LIBS.rotateY(MOUSE_ROT, THETA);
            LIBS.rotateX(MOUSE_ROT, PHI);

            // 4. Render semua objek
            renderFn(shaderVars, MOUSE_ROT, TIME);

            GL.flush();
            window.requestAnimationFrame(animate);
        };

        animate();
    };

    return { GL, CANVAS, shaderVars, run };
}

// Geser objek ke posisi (x, y, z) relatif terhadap matriks parent.
// Pakai ini di scene gabungan supaya karakter tidak bertumpuk di titik (0, 0, 0).
export function place(parent, x, y, z) {
    var T = LIBS.get_I4();
    LIBS.set_position(T, x, y, z);
    var out = LIBS.get_I4();
    LIBS.multiply(out, parent, T);
    return out;
}
