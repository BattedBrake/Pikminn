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
│   └── Environment.js          ← tanah & pohon
└── characters/
    ├── _template/              ← salin ini untuk karakter baru
    └── wingedPikmin/
        ├── index.html / main.js   ← tes karakter ini saja
        ├── WingedPikmin.js        ← class karakter
        └── bodyParts/
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
