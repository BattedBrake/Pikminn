// timeline.js
// Pemutar URUTAN animasi. Cukup susun daftar langkah, timeline yang mengatur kapan tiap animasi berjalan,
// memindahkan posisi karakter, dan membuat transisi halus antar animasi.
//
//   var urutan = [
//       { animasi: "berdiri", durasi: 1 },
//       { animasi: "terbang", durasi: 2, dari: [0, 0, 0], ke: [0, 2, 0] },   // sambil pindah posisi
//       { animasi: "melambai", durasi: 3 },
//       { animasi: ["terbang", "melambai"], durasi: 3 },                    // gabungan: dijalankan berurutan
//   ];
//   var timeline = new Timeline(DAFTAR_ANIMASI, urutan, { ulang: true, transisi: 0.4 });
//
//   // tiap frame (di dalam render karakter):
//   parentMatrix = timeline.terapkan(pikmin, parentMatrix);   // isi pikmin.pose + geser, hadapkan, skalakan
//
// ARAH HADAP: karakter otomatis menghadap ke arah ia berjalan (dilihat dari dari -> ke di bidang x-z).
//   Tambahkan hadap: derajat di sebuah langkah untuk memaksa arah (0 = menghadap kamera/+z, 90 = ke kanan/+x,
//   -90 = ke kiri, 180 = membelakangi kamera).
//
// KEMIRINGAN BADAN (per langkah, dalam derajat, default 0 = tegak; berubah halus antar langkah):
//   miring : condong ke depan/belakang. 90 = tengkurap menghadap tanah (seperti jatuh), -90 = telentang
//            menghadap langit, 180 = terbalik (kepala di bawah)
//   guling : miring ke samping. Positif = ke kanan (dari sudut pandang karakter), negatif = ke kiri,
//            360 = satu putaran penuh (berguling)
//   Langkah yang tidak menulis miring/guling kembali tegak (0).
//
// SYARAT ANIMASI: fungsi (pikmin, progres, waktu, langkah) yang HANYA mengisi pikmin.pose.
//   progres = 0..1 sepanjang durasi langkah, waktu = detik sejak langkah dimulai,
//   langkah = objek langkah dari urutan (bisa berisi pengaturan tambahan, misalnya kecepatan).
// Karena animasi hanya mengisi angka di pose, dua animasi bisa dicampur untuk transisi halus.
import { LIBS } from "./libs.js";

// Salin pose (objek berisi angka, boleh bertingkat)
function salinPose(p) {
    return JSON.parse(JSON.stringify(p));
}

// Campur dua pose: a (k = 0) .. b (k = 1)
function campurPose(a, b, k) {
    if (typeof a === "number") return a + (b - a) * k;
    var hasil = {};
    for (var kunci in a) hasil[kunci] = campurPose(a[kunci], b[kunci], k);
    return hasil;
}

function halus(k) {   // smoothstep: mulai & berhenti pelan
    return k * k * (3 - 2 * k);
}

// Campur dua sudut lewat jalan terpendek (supaya berbalik tidak memutar 350 derajat)
function campurSudut(a, b, k) {
    var d = b - a;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    return a + d * k;
}

function kali(a, b) {
    var hasil = LIBS.get_I4();
    LIBS.multiply(hasil, a, b);
    return hasil;
}

export class Timeline {
    // daftarAnimasi = { nama: fungsi }, urutan = array langkah
    // opsi.ulang (default true), opsi.transisi = detik campuran antar animasi (default 0.4), opsi.posisiAwal,
    // opsi.poseDasar = pose awal sebelum animasi diterapkan (default: pose karakter saat timeline mulai),
    // opsi.arahAwal = arah hadap awal dalam derajat (default 0 = menghadap kamera),
    // opsi.skala = ukuran karakter (default 1),
    // opsi.tanah = fungsi (x, z) -> tinggi yang ditambahkan ke y (misalnya tinggi pasir), default 0
    constructor(daftarAnimasi, urutan, opsi = {}) {
        this.daftar = daftarAnimasi;
        this.urutan = urutan;
        this.ulang = opsi.ulang !== false;
        this.transisi = opsi.transisi !== undefined ? opsi.transisi : 0.4;

        this.skala = opsi.skala !== undefined ? opsi.skala : 1;
        this.tanah = opsi.tanah || function () { return 0; };

        // Posisi awal & akhir tiap langkah. Langkah tanpa dari/ke tetap di posisi terakhir.
        // Arah hadap tiap langkah: hadap (kalau diisi), atau arah jalan, atau tetap seperti langkah sebelumnya.
        var pos = opsi.posisiAwal || [0, 0, 0];
        var arah = (opsi.arahAwal || 0) * Math.PI / 180;
        this.arahAwal = arah;
        this.posAwal = [];
        this.posAkhir = [];
        this.arah = [];
        this.miring = [];
        this.guling = [];
        this.total = 0;
        urutan.forEach((l) => {
            [].concat(l.animasi).forEach(function (nama) {
                if (typeof nama === "string" && !daftarAnimasi[nama]) {
                    console.warn("Animasi tidak dikenal di urutan: " + nama);
                }
            });
            var a = l.dari || pos, b = l.ke || a;
            this.posAwal.push(a);
            this.posAkhir.push(b);
            var dx = b[0] - a[0], dz = b[2] - a[2];
            if (l.hadap !== undefined) arah = l.hadap * Math.PI / 180;
            else if (Math.abs(dx) + Math.abs(dz) > 1e-6) arah = Math.atan2(dx, dz);
            this.arah.push(arah);
            this.miring.push((l.miring || 0) * Math.PI / 180);
            this.guling.push((l.guling || 0) * Math.PI / 180);
            pos = b;
            this.total += l.durasi;
        });

        this.poseDasar = opsi.poseDasar ? salinPose(opsi.poseDasar) : null;
        this.mulai = null;
        this.indeks = 0;
    }

    // Putar ulang dari langkah pertama
    mulaiUlang() {
        this.mulai = null;
    }

    // animasi bisa berupa nama, fungsi, atau array keduanya (dijalankan berurutan, yang belakang menimpa)
    fungsi(langkah) {
        var daftar = [].concat(langkah.animasi).map((a) => (typeof a === "function" ? a : this.daftar[a]));
        return function (pikmin, progres, waktu, l) {
            daftar.forEach(function (f) { if (f) f(pikmin, progres, waktu, l); });
        };
    }

    // Hasil animasi langkah ke-i pada waktu tertentu, ditulis ke salinan poseDasar
    poseLangkah(i, waktu, poseDasar) {
        var langkah = this.urutan[i];
        var wadah = { pose: salinPose(poseDasar) };
        this.fungsi(langkah)(wadah, Math.min(1, waktu / langkah.durasi), waktu, langkah);
        return wadah.pose;
    }

    // Isi pikmin.pose sesuai waktu sekarang, kembalikan posisi [x, y, z]
    update(pikmin) {
        var sekarang = performance.now() / 1000;
        if (this.mulai === null) {
            this.mulai = sekarang;
            if (!this.poseDasar) this.poseDasar = salinPose(pikmin.pose);
        }
        var d = sekarang - this.mulai;
        if (this.ulang) d = d % this.total;
        else d = Math.min(d, this.total);

        // Cari langkah yang sedang aktif
        var i = 0, awal = 0;
        while (i < this.urutan.length - 1 && d >= awal + this.urutan[i].durasi) {
            awal += this.urutan[i].durasi;
            i++;
        }
        this.indeks = i;
        var langkah = this.urutan[i];
        var waktu = d - awal;
        var progres = Math.min(1, waktu / langkah.durasi);

        // Pose langkah ini, dicampur dengan akhir langkah sebelumnya di awal langkah (transisi halus)
        var pose = this.poseLangkah(i, waktu, this.poseDasar);
        var sebelum = i > 0 ? i - 1 : (this.ulang ? this.urutan.length - 1 : -1);
        if (this.transisi > 0 && waktu < this.transisi && sebelum >= 0 && this.urutan.length > 1) {
            var poseSebelum = this.poseLangkah(sebelum, this.urutan[sebelum].durasi, this.poseDasar);
            pose = campurPose(poseSebelum, pose, halus(waktu / this.transisi));
        }
        pikmin.pose = pose;

        // Arah hadap: berbelok halus dari arah langkah sebelumnya selama waktu transisi
        var arahSebelum = sebelum >= 0 ? this.arah[sebelum] : this.arahAwal;
        var belok = this.transisi > 0 ? Math.min(1, waktu / this.transisi) : 1;
        this.arahSekarang = campurSudut(arahSebelum, this.arah[i], halus(belok));

        // Kemiringan badan: dicampur biasa (bukan jalan terpendek) supaya guling 360 benar-benar berputar penuh
        var k = halus(belok);
        var miringSebelum = sebelum >= 0 ? this.miring[sebelum] : 0;
        var gulingSebelum = sebelum >= 0 ? this.guling[sebelum] : 0;
        this.miringSekarang = miringSebelum + (this.miring[i] - miringSebelum) * k;
        this.gulingSekarang = gulingSebelum + (this.guling[i] - gulingSebelum) * k;

        // Posisi: bergerak lurus dari posAwal ke posAkhir selama langkah
        var a = this.posAwal[i], b = this.posAkhir[i];
        return [a[0] + (b[0] - a[0]) * progres, a[1] + (b[1] - a[1]) * progres, a[2] + (b[2] - a[2]) * progres];
    }

    // Update pose, lalu kembalikan parent x geser(posisi + tinggi tanah) x hadap x miring x guling x skala
    terapkan(pikmin, parentMatrix) {
        var p = this.update(pikmin);
        var geser = LIBS.get_I4();
        LIBS.set_position(geser, p[0], p[1] + this.tanah(p[0], p[2]), p[2]);
        var hadap = LIBS.get_I4();
        LIBS.rotateY(hadap, this.arahSekarang);
        var miring = LIBS.get_I4();
        LIBS.rotateX(miring, this.miringSekarang);
        var guling = LIBS.get_I4();
        LIBS.rotateZ(guling, this.gulingSekarang);    // positif = bagian atas condong ke kanan karakter
        var ukuran = LIBS.get_I4();
        LIBS.scale(ukuran, this.skala, this.skala, this.skala);
        return kali(kali(kali(kali(kali(parentMatrix, geser), hadap), miring), guling), ukuran);
    }
}
