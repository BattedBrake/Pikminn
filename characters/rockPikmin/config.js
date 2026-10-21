// config.js
// Angka-angka Rock Pikmin yang dipakai bersama oleh bodyParts/ dan animation/.

export const GRAY = [0.72, 0.75, 0.78];          // warna kaki, tangan, sendi
export const GREEN = [0.55, 0.82, 0.22];

// ---- kaki ----
export const L_LEG = 0.85;                       // panjang kaki
export const FOOT_BALL = 0.08;                   // radius bola pergelangan
export const TOE_DROP = 0.06;                    // jari kaki sedikit di bawah pusat bola
export const FOOT_H = TOE_DROP + 0.025;          // tinggi dari pusat bola ke tanah
export const HIP_X = 0.24, HIP_Y = -0.55;        // posisi pinggul relatif pusat badan
export const SPLAY = 0.12;                       // kaki sedikit membuka ke samping (rad)

// ---- lengan ----
export const ARM_LEN = 0.85, ARM_STEPS = 14;
export const ELBOW = 0.3;                        // 0 = lurus, makin besar makin menekuk

// ---- mata & tangkai ----
export const EYE_X = 0.3, EYE_Y = 0.45;
export const BODY_TOP_X = 0.05;

// ---- material tiap bagian (ubah angkanya untuk menyetel tampilan) ----
//   kilap         = ketajaman kilap (shininess): kecil = kilap lebar & lembut, besar = titik kilap kecil & tajam
//   kekuatanKilap = 0 (tidak mengkilap) .. 1 (kilap putih penuh)
//   tekstur       = kekuatan tekstur batu prosedural: 0 = mulus .. 1 = penuh
//   skalaTekstur  = kerapatan pola tekstur: makin besar makin rapat/halus
// Di halaman tes (characters/rockPikmin/) ada slider untuk mencoba angka badan secara langsung.
export const MATERIAL = {
    badan:    { kilap: 20, kekuatanKilap: 1.0, tekstur: 0.6, skalaTekstur: 6 },
    mata:     { kilap: 60, kekuatanKilap: 0.7 },
    pupil:    { kilap: 80, kekuatanKilap: 0.9 },
    tangkai:  { kilap: 20, kekuatanKilap: 0.2 },
    daun:     { kilap: 24, kekuatanKilap: 0.35 },
    kaki:     { kilap: 30, kekuatanKilap: 0.25 },   // juga lengan, tangan, dan sendi
    jariKaki: { kilap: 30, kekuatanKilap: 0.08 },
};
