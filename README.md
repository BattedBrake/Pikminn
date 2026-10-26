# Pikminn

## Struktur

```
Pikminn/
├── index.html / main.js        ← scene gabungan (semua karakter)
├── shared/                     ← dipakai semua, ubah hanya 
│   ├── renderer.js             ← canvas, shader, kamera, mouse, loop
│   ├── libs.js                 ← matriks
│   ├── builders.js             ← generator mesh
│   └── csg.js
├── environment/
│   ├── Environment.js          ← tanah pasir bergelombang + tinggiTanah(x, z)
│   ├── sun.js
│   ├── EnvModel.js             ← penyusun model dari beberapa bagian (pengganti THREE.Group)
│   ├── chest.js, skeletonKey.js, kopdes.js
│   └── (bentuk dasar: shared/buildersEnv.js → box, cylinder, sphere, torus, plane, limasanRoof)
└── characters/
    ├── _template/              ← salin ini untuk karakter baru
    ├── redPikmin/
    │   ├── index.html / main.js   ← tes karakter ini saja
    │   ├── RedPikmin.js           ← class karakter
    │   ├── MyObject.js, config.js
    │   ├── bodyParts/             ← HeadAndBody, Antenna, Limbs
    │   └── animation/             ← Jalan, GoyangTangkai, TutupMata
    ├── rockPikmin/
    │   ├── index.html / main.js   ← tes karakter ini saja
    │   ├── RockPikmin.js          ← class karakter
    │   ├── config.js, matrix.js, draw.js
    │   ├── bodyParts/             ← Body (batu + mata), Antenna (tangkai + daun), Limbs
    │   └── animation/             ← Idle (goyang tangkai, pose idle)
    └── wingedPikmin/
        ├── index.html / main.js   ← tes karakter ini saja
        ├── WingedPikmin.js        ← class karakter
        ├── bodyParts/
        └── animation/             ← (masih kosong, lihat README di dalamnya)
```

## Cara menjalankan

Pakai server lokal dari folder **root `Pikminn`** (ES module tidak jalan kalau dibuka dengan double-click):

- VS Code: klik kanan `index.html` → *Open with Live Server*, atau
- `npx serve .` lalu buka `http://localhost:3000/` (gabungan) atau `http://localhost:3000/characters/wingedPikmin/` (tes satu karakter).

## Menambah karakter

1. Salin `characters/_template/` → `characters/namaKarakter/`.
2. Ganti nama `Template.js` dan class-nya, sesuaikan import di `main.js` folder itu.
3. Class wajib punya:
   - `constructor(GL)`
   - `render(shaderVars, parentMatrix, time)`. Semua matriks dikalikan dengan `parentMatrix`.
4. Tes lewat `characters/namaKarakter/index.html`.
5. Kalau sudah oke, daftarkan di `main.js` root:
   ```js
   import { NamaKarakter } from "./characters/namaKarakter/NamaKarakter.js";
   var k = new NamaKarakter(scene.GL);
   // di dalam scene.run:
   k.render(shaderVars, place(root, 6, 0, 0), time);
   ```


- Edit hanya folder karakter sendiri.
- bisa bikin builders sendiri biar ga campur2 (di folder yang sama)
- Nama file di `import` harus sama persis huruf besar-kecilnya dengan nama file (Windows tidak peduli, tapi Mac/Linux/GitHub Pages peduli).

## Mengatur adegan (posisi & urutan gerakan)

Buka `main.js` di root, bagian **PENGATURAN ADEGAN** (`const ADEGAN`). Untuk tiap pikmin atur:
`posisi` awal, `skala`, `arahAwal`, `ulang`, dan `urutan` langkah (`animasi`, `durasi`, `ke`, `hadap`).
Karakter otomatis menghadap ke arah jalannya dan kakinya mengikuti tinggi pasir.

Pemutar urutan ada di `shared/timeline.js`. Animasi tiap karakter didaftarkan di `DAFTAR_ANIMASI`
(`WingedPikmin.js`, `RedPikmin.js`, `RockPikmin.js`); animasi hanya boleh mengisi angka di `pikmin.pose`.
