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
// LOMPAT: posisi y naik-turun berkali-kali selama SATU langkah (translate di sumbu y), sementara animasi
//   langkah itu (misalnya melambai) tetap berjalan mulus tanpa terputus.
//   lompat: { tinggi: 1.2, kali: 10 }
//     tinggi : tinggi lompatan (default 1)
//     kali   : jumlah lompatan selama langkah (default: satu lompatan tiap 0.7 detik)
//
// ORBIT (ROTATE ARBITRARY AXIS): karakter diputar UTUH mengelilingi sebuah sumbu selama langkah itu.
//   orbit: { pusat: [x, z], putaran: 360, miring: 0 }
//     pusat   : titik yang dilewati sumbu, [x, z] (sumbu setinggi karakter) atau [x, y, z] (y = tinggi di atas tanah)
//     putaran : derajat yang ditempuh selama langkah (default 360 = satu keliling; negatif = arah sebaliknya)
//     miring  : condongkan sumbu (derajat) dari tegak, sehingga lintasan naik-turun (default 0 = sumbu tegak).
//               Sumbu dicondongkan ke arah gerak awal, jadi lingkaran tetap berpusat di sumbu dan
//               karakter naik-turun setinggi jari-jari x sin(miring) di atas & di bawah ketinggian awalnya
//     sumbu   : (opsional) arah sumbu [x, y, z] sendiri, menggantikan miring
//   Matriksnya: T(pusat) x R(sumbu, sudut) x T(-pusat) (LIBS.rotasiSumbu), bukan pindah titik demi titik.
//   Karakter otomatis menghadap arah putaran (kalau hadap tidak diisi). Langkah berikutnya kembali ke posisi
//   sebelum orbit, jadi pakai putaran kelipatan 360 supaya tidak meloncat.
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

// Ubah pengaturan orbit dari urutan menjadi pusat, arah sumbu, dan sudut total (radian).
// awal = posisi karakter saat orbit dimulai (dipakai untuk menentukan arah condong sumbu).
function siapkanOrbit(o, awal) {
    var tiga = o.pusat.length === 3;
    var px = o.pusat[0], pz = tiga ? o.pusat[2] : o.pusat[1];
    var m = (o.miring || 0) * Math.PI / 180;
    // arah singgung (tegak lurus jari-jari di bidang datar): sumbu dicondongkan ke sini
    var rx = awal[0] - px, rz = awal[2] - pz, rl = Math.hypot(rx, rz) || 1;
    var tx = rz / rl, tz = -rx / rl;
    return {
        px: px, pz: pz,
        py: tiga ? o.pusat[1] : null,                      // null = setinggi karakter
        sumbu: o.sumbu || [Math.sin(m) * tx, Math.cos(m), Math.sin(m) * tz],
        sudut: (o.putaran !== undefined ? o.putaran : 360) * Math.PI / 180,
    };
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
    // opsi.tanah = fungsi (x, z) -> tinggi yang ditambahkan ke y (misalnya tinggi pasir), default 0,
    // opsi.hadapOtomatis = false supaya tidak berbelok mengikuti arah gerak (default true)
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
        this.orbit = [];
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
            else if (l.orbit && opsi.hadapOtomatis !== false) {
                // menghadap arah singgung lingkaran orbit (arah karakter bergerak saat diputar)
                var o = l.orbit, opz = o.pusat[o.pusat.length === 3 ? 2 : 1];
                var rx = a[0] - o.pusat[0], rz = a[2] - opz, tanda = (o.putaran !== undefined ? o.putaran : 360) >= 0 ? 1 : -1;
                arah = Math.atan2(rz * tanda, -rx * tanda);
            }
            else if (opsi.hadapOtomatis !== false && Math.abs(dx) + Math.abs(dz) > 1e-6) arah = Math.atan2(dx, dz);
            this.arah.push(arah);
            this.orbit.push(l.orbit ? siapkanOrbit(l.orbit, a) : null);
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

        // Orbit: sudut bertambah rata selama langkah
        this.orbitSekarang = this.orbit[i] ? Object.assign({ sudutSekarang: this.orbit[i].sudut * progres }, this.orbit[i]) : null;

        // Posisi: bergerak lurus dari posAwal ke posAkhir selama langkah
        var a = this.posAwal[i], b = this.posAkhir[i];
        var naik = 0;
        if (langkah.lompat) {
            // |sin| membentuk busur: naik cepat, melambat di puncak, turun, menyentuh tanah, lalu lompat lagi
            var tinggi = langkah.lompat.tinggi !== undefined ? langkah.lompat.tinggi : 1;
            var kali = langkah.lompat.kali !== undefined ? langkah.lompat.kali : Math.max(1, Math.round(langkah.durasi / 0.7));
            naik = tinggi * Math.abs(Math.sin(Math.PI * kali * progres));
        }
        return [a[0] + (b[0] - a[0]) * progres, a[1] + (b[1] - a[1]) * progres + naik, a[2] + (b[2] - a[2]) * progres];
    }

    // Update pose, lalu kembalikan parent x geser(posisi + tinggi tanah) x hadap x miring x guling x skala
    terapkan(pikmin, parentMatrix) {
        var p = this.update(pikmin);
        var y = p[1] + this.tanah(p[0], p[2]);

        // ORBIT: parent x [koreksi tinggi tanah] x T(pusat) x R(sumbu, sudut) x T(-pusat) x ...
        if (this.orbitSekarang) {
            var o = this.orbitSekarang;
            var py = o.py !== null ? o.py + this.tanah(o.px, o.pz) : y;
            var R = LIBS.rotasiSumbu([o.px, py, o.pz], o.sumbu, o.sudutSekarang);
            // posisi karakter setelah diputar: kaki tetap menempel di tanah yang bergelombang
            var qx = R[0] * p[0] + R[4] * y + R[8] * p[2] + R[12];
            var qz = R[2] * p[0] + R[6] * y + R[10] * p[2] + R[14];
            var koreksi = LIBS.get_I4();
            LIBS.set_position(koreksi, 0, this.tanah(qx, qz) - this.tanah(p[0], p[2]), 0);
            parentMatrix = kali(kali(parentMatrix, koreksi), R);
        }

        var geser = LIBS.get_I4();
        LIBS.set_position(geser, p[0], y, p[2]);
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
