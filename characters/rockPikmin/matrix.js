// matrix.js
// Pembuat matriks untuk rantai hierarki Rock Pikmin:  M_anak = M_induk x T(pivot) x R(sudut)
import { LIBS } from "../../shared/libs.js";

export function T(x, y, z) { var m = LIBS.get_I4(); LIBS.set_position(m, x, y, z); return m; }
export function S(x, y, z) { var m = LIBS.get_I4(); LIBS.scale(m, x, y, z); return m; }
export function RX(a) { var m = LIBS.get_I4(); LIBS.rotateX(m, a); return m; }
export function RY(a) { var m = LIBS.get_I4(); LIBS.rotateY(m, a); return m; }
export function RZ(a) { var m = LIBS.get_I4(); LIBS.rotateZ(m, a); return m; }

// Rotasi SUMBU BEBAS: putar sebesar a (radian) mengelilingi garis dengan arah `axis` yang melewati titik `pivot`
// (lihat LIBS.get_rotationArbitrary di shared/libs.js). Dipakai animasi "putar" (animation/Putar.js).
export function RA(axis, a, pivot) { return LIBS.get_rotationArbitrary(axis, a, pivot); }

// Kalikan berurutan dari kiri ke kanan (parent dulu, lalu child)
export function mul(...daftar) {
    var hasil = LIBS.get_I4();
    daftar.forEach(function (m) {
        var baru = LIBS.get_I4();
        LIBS.multiply(baru, hasil, m);
        hasil = baru;
    });
    return hasil;
}
