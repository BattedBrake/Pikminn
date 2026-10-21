import * as THREE from 'three';

/**
 * Membuat Texture Canvas Prosedural untuk Papan Nama KOPDES
 */
function createKopdesSignTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Background Putih
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border Hijau
    ctx.strokeStyle = '#1E5E20';
    ctx.lineWidth = 12;
    ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);

    // Logo Koperasi (Lingkaran Hijau dengan Bintang/Gigi)
    ctx.fillStyle = '#1E5E20';
    ctx.beginPath();
    ctx.arc(60, 64, 38, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FBC02D';
    ctx.beginPath();
    ctx.arc(60, 64, 22, 0, Math.PI * 2);
    ctx.fill();

    // Teks
    ctx.fillStyle = '#1E5E20';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('KOPERASI DESA', 120, 52);

    ctx.fillStyle = '#333333';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('KOPDES MEKAR JAYA', 120, 92);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

/**
 * Membuat Texture Canvas Prosedural untuk Foto Resmi Presiden Prabowo
 */
function createPrabowoPortraitTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');

    // Latar Belakang Merah Putih (Bendera)
    ctx.fillStyle = '#D32F2F';
    ctx.fillRect(0, 0, canvas.width, canvas.height / 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, canvas.height / 2, canvas.width, canvas.height / 2);

    // Jas Hitam (Bahu & Badan)
    ctx.fillStyle = '#111111';
    ctx.beginPath();
    ctx.ellipse(128, 300, 90, 70, 0, 0, Math.PI * 2);
    ctx.fill();

    // Kemeja Putih & Dasi Merah
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(110, 220);
    ctx.lineTo(146, 220);
    ctx.lineTo(128, 270);
    ctx.fill();

    ctx.fillStyle = '#B71C1C';
    ctx.beginPath();
    ctx.moveTo(124, 230);
    ctx.lineTo(132, 230);
    ctx.lineTo(130, 280);
    ctx.lineTo(126, 280);
    ctx.fill();

    // Kepala / Wajah
    ctx.fillStyle = '#E0AC69';
    ctx.beginPath();
    ctx.ellipse(128, 145, 45, 55, 0, 0, Math.PI * 2);
    ctx.fill();

    // Rambut
    ctx.fillStyle = '#222222';
    ctx.beginPath();
    ctx.arc(128, 125, 46, Math.PI, Math.PI * 2);
    ctx.fill();

    // Peci / Kopiah Hitam
    ctx.fillStyle = '#050505';
    ctx.beginPath();
    ctx.roundRect(82, 70, 92, 42, 6);
    ctx.fill();

    // Bingkai Foto Kayu
    ctx.strokeStyle = '#8D6E63';
    ctx.lineWidth = 16;
    ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

/**
 * Membuat Geometri Atap Limasan (Trapezoidal Hip Roof)
 */
function createLimasanRoofGeometry(width, depth, height, ridgeLength) {
    const geometry = new THREE.BufferGeometry();
    const w2 = width / 2;
    const d2 = depth / 2;
    const r2 = ridgeLength / 2;

    // Titik-titik Sudut Atap Limasan
    const vertices = new Float32Array([
        // Base Rectangle (Bawah)
        -w2, 0,  d2,  // 0: Kiri Depan
         w2, 0,  d2,  // 1: Kanan Depan
         w2, 0, -d2,  // 2: Kanan Belakang
        -w2, 0, -d2,  // 3: Kiri Belakang

        // Ridge Line (Garasi Bumbungan Atas)
        -r2, height, 0, // 4: Kiri Bumbungan
         r2, height, 0  // 5: Kanan Bumbungan
    ]);

    // Indeks Segitiga untuk Membentuk Muka Trapesium dan Segitiga
    const indices = [
        // Muka Depan (Trapesium -> 2 Segitiga)
        0, 1, 5,   0, 5, 4,
        // Muka Belakang (Trapesium -> 2 Segitiga)
        2, 3, 4,   2, 4, 5,
        // Muka Kiri (Segitiga Samping)
        3, 0, 4,
        // Muka Kanan (Segitiga Samping)
        1, 2, 5,
        // Muka Bawah
        0, 3, 2,   0, 2, 1
    ];

    geometry.setIndex(indices);
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.computeVertexNormals();

    return geometry;
}

/**
 * Fungsi Utama Pembuat Model KOPDES
 * @returns {THREE.Group} Model KOPDES
 */
export function createKopdesModel() {
    const kopdesGroup = new THREE.Group();

    // Material Standar
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xF5F5F5, roughness: 0.7 });
    const greenTrimMat = new THREE.MeshStandardMaterial({ color: 0x2E7D32, roughness: 0.5 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x5D4037, roughness: 0.6 });
    const roofTileMat = new THREE.MeshStandardMaterial({ color: 0xB71C1C, roughness: 0.4 });
    const concreteMat = new THREE.MeshStandardMaterial({ color: 0x9E9E9E, roughness: 0.8 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x81D4FA, roughness: 0.1, metalness: 0.8 });
    const goldFrameMat = new THREE.MeshStandardMaterial({ color: 0xFFB300, metalness: 0.6, roughness: 0.3 });

    // 1. Pondasi & Tangga Depan
    const baseGeo = new THREE.BoxGeometry(10.5, 0.4, 8.5);
    const baseMesh = new THREE.Mesh(baseGeo, concreteMat);
    baseMesh.position.y = 0.2;
    kopdesGroup.add(baseMesh);

    const stepGeo = new THREE.BoxGeometry(3.5, 0.2, 1.2);
    const stepMesh = new THREE.Mesh(stepGeo, concreteMat);
    stepMesh.position.set(0, 0.1, 4.2);
    kopdesGroup.add(stepMesh);

    // 2. Dinding Utama Bangunan
    const wallGeo = new THREE.BoxGeometry(9, 3.2, 6);
    const wallMesh = new THREE.Mesh(wallGeo, wallMat);
    wallMesh.position.set(0, 2, -0.5);
    kopdesGroup.add(wallMesh);

    // 3. Tiang Teras (Pillars)
    const pillarGeo = new THREE.CylinderGeometry(0.18, 0.18, 3, 16);
    const pillarPositions = [-3.8, -1.3, 1.3, 3.8];
    pillarPositions.forEach(x => {
        const pillar = new THREE.Mesh(pillarGeo, greenTrimMat);
        pillar.position.set(x, 1.9, 2.2);
        kopdesGroup.add(pillar);
    });

    // 4. Atap Teras Depan
    const porchRoofGeo = new THREE.BoxGeometry(9.6, 0.25, 2.8);
    const porchRoof = new THREE.Mesh(porchRoofGeo, greenTrimMat);
    porchRoof.position.set(0, 3.5, 1.6);
    kopdesGroup.add(porchRoof);

    // 5. Atap Utama Limasan (Trapezoidal Hip Roof Geometry)
    const mainRoofGeo = createLimasanRoofGeometry(10.2, 7.2, 2.4, 5.0);
    const mainRoof = new THREE.Mesh(mainRoofGeo, roofTileMat);
    mainRoof.position.set(0, 3.6, -0.5);
    kopdesGroup.add(mainRoof);

    // 6. Papan Nama KOPDES (Atas Teras)
    const signTex = createKopdesSignTexture();
    const signMat = new THREE.MeshBasicMaterial({ map: signTex });
    const signGeo = new THREE.PlaneGeometry(4.2, 1.05);
    const signMesh = new THREE.Mesh(signGeo, signMat);
    signMesh.position.set(0, 4.2, 2.85);
    kopdesGroup.add(signMesh);

    // 7. Pintu Kayu Utama
    const doorFrameGeo = new THREE.BoxGeometry(1.7, 2.3, 0.1);
    const doorFrame = new THREE.Mesh(doorFrameGeo, woodMat);
    doorFrame.position.set(0, 1.55, 2.51);
    kopdesGroup.add(doorFrame);

    // 8. Jendela Kaca (Kiri & Kanan)
    const winGeo = new THREE.BoxGeometry(1.4, 1.4, 0.08);
    [-2.6, 2.6].forEach(x => {
        const windowMesh = new THREE.Mesh(winGeo, glassMat);
        windowMesh.position.set(x, 1.9, 2.51);
        kopdesGroup.add(windowMesh);
    });

    // 9. Foto Resmi Presiden Prabowo (Di Dinding Teras Samping Pintu)
    const prabowoTex = createPrabowoPortraitTexture();
    const portraitMat = new THREE.MeshBasicMaterial({ map: prabowoTex });
    const portraitGeo = new THREE.PlaneGeometry(0.6, 0.75);
    const portraitMesh = new THREE.Mesh(portraitGeo, portraitMat);
    portraitMesh.position.set(1.4, 2.1, 2.52);
    kopdesGroup.add(portraitMesh);

    const frameGeo = new THREE.BoxGeometry(0.66, 0.81, 0.03);
    const frameMesh = new THREE.Mesh(frameGeo, goldFrameMat);
    frameMesh.position.set(1.4, 2.1, 2.505);
    kopdesGroup.add(frameMesh);

    // 10. Bendera Merah Putih & Tiang
    const poleGeo = new THREE.CylinderGeometry(0.04, 0.05, 5.5, 12);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0xCCCCCC, metalness: 0.8 });
    const poleMesh = new THREE.Mesh(poleGeo, poleMat);
    poleMesh.position.set(-4.3, 2.75, 3.8);
    kopdesGroup.add(poleMesh);

    // Kain Bendera
    const flagGeo = new THREE.PlaneGeometry(1.5, 0.9, 10, 5);
    const flagCanvas = document.createElement('canvas');
    flagCanvas.width = 128;
    flagCanvas.height = 80;
    const fCtx = flagCanvas.getContext('2d');
    fCtx.fillStyle = '#D32F2F';
    fCtx.fillRect(0, 0, 128, 40);
    fCtx.fillStyle = '#FFFFFF';
    fCtx.fillRect(0, 40, 128, 40);

    const flagTex = new THREE.CanvasTexture(flagCanvas);
    const flagMat = new THREE.MeshStandardMaterial({ 
        map: flagTex, 
        side: THREE.DoubleSide, 
        roughness: 0.5 
    });

    const flagMesh = new THREE.Mesh(flagGeo, flagMat);
    flagMesh.position.set(-3.55, 4.8, 3.8);
    kopdesGroup.add(flagMesh);

    return kopdesGroup;
}