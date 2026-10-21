// Berdiri.js
// Pose normal: semua sendi kembali ke posisi asli (semua sudut 0).

export function poseBerdiri(pikmin) {
    var pose = pikmin.pose;

    pose.kepala = 0;
    pose.badan = 0;

    pose.lengan.angkat = 0;
    pose.lengan.ayun = 0;
    pose.lengan.siku = 0;

    pose.kaki.ayun = 0;
}
