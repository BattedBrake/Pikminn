// Idle.js
// Gerak idle Rock Pikmin: badan, tangan, dan kaki DIAM; hanya tangkai + daun yang bergoyang pelan.
// t = waktu dalam detik.

export function goyangTangkai(t) {
    return {
        sway: 0.27 * Math.sin(t * 1.5) + 0.25 * Math.sin(t * 1.9),   // goyang tangkai kiri-kanan
        swayZ: 0.4 * Math.sin(t * 1.4 + 1),                           // goyang tangkai depan-belakang
    };
}

// Pose idle: lengan membuka 0.95 rad dari badan, tidak berayun. Kaki tidak berayun.
// Coba ubah lengan.ayun = 0.6 atau kaki.ayun = 0.4: telapak tetap datar berkat rotasi balik di pergelangan.
export function poseIdle(pikmin) {
    pikmin.pose.lengan.buka = 0.95;
    pikmin.pose.lengan.ayun = 0.0;
    pikmin.pose.kaki.ayun = 0.0;
}
