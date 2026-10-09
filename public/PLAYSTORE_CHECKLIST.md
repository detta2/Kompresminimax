# Panduan & Checklist Google Play Store — KompresMiniMax

## 1. Kenapa Ukuran File APK/AAB Kecil (~250 KB)?
Aplikasi ini dibangun menggunakan **arsitektur native ultra-lean (Android WebView wrapper)** tanpa bloatware pihak ketiga (seperti React Native, Flutter, atau Chromium bundling).
- Aplikasi lain ukurannya puluhan MB karena menyertakan engine C++ runtime, library analitik berat, font berat, atau bundling browser engine sendiri.
- KompresMiniMax memanfaatkan WebView native OS bawaan Android dan HTML5 Canvas/Web Worker internal.
- **Sangat aman dan normal!** Google Play Store justru sangat mengapresiasi ukuran aplikasi kecil karena download rate & instalasi user meningkat pesat.

---

## 2. File Release yang Tersedia
Di direktori `release/`:
1. `KompresMiniMax-v2.aab` (~248 KB) — **Format WAJIB untuk Google Play Console** (versionCode 2, versionName 2.0.0)
2. `KompresMiniMax-v2.apk` (~253 KB) — Format direct install / sideload untuk tester & user
3. `KompresMiniMax.aab` / `KompresMiniMax.apk` (lama) — **JANGAN dipakai**: masih target API 34, DITOLAK Play Store sejak 31 Agu 2026 (aplikasi baru wajib target API 36).

---

## 3. Syarat & Persiapan Upload Google Play Console
Berikut checklist yang wajib disiapkan di dashboard Google Play Console:

### A. Teknis Binary (SUDAH TERPENUHI & VALID — v2, 2026-09-28)
- [x] **Target SDK 36 (Android 16)** — wajib untuk aplikasi baru sejak 31 Agu 2026. Terverifikasi via `aapt2 dump badging` (`targetSdkVersion:'36'`) pada APK maupun AAB (via universal APK dari bundletool).
- [x] Min SDK 24 (Android 7.0 Nougat).
- [x] Icon Aplikasi Adaptive & Standard (`ic_launcher` dan `ic_launcher_round` dari mdpi s/d xxxhdpi) — dibuat dari `logo.svg` (maskot dino) + background `#10B981`.
- [x] Format Google Android App Bundle (`.aab`) terverifikasi dengan `bundletool validate` dan ditandatangani keystore release.
- [x] **16 KB page size: TIDAK PERLU tindakan** — aplikasi tidak menyertakan native library (`.so`) sama sekali (murni Java + WebView + aset web), sehingga ketentuan 16 KB page-size Android 15+ tidak berlaku.
- [x] Project Android (`android/`) tersedia di repo: AGP 8.13.2, Gradle 8.14.5 (wrapper), compileSdk 36. Build ulang: `cd android && ./gradlew bundleRelease assembleRelease` (butuh `android/key.properties` + keystore — lihat bawah).
- [x] Fitur native (bukan sekadar WebView): file chooser galeri + kamera (`onShowFileChooser`), download hasil kompresi (blob → MediaStore/DownloadManager), dan menerima Share gambar dari aplikasi lain (`ACTION_SEND`).

### B. Keystore Release (PENTING — JANGAN HILANG)
- File: `android/keystore/release.jks` (RSA 2048, valid 10.000 hari, alias `kompresminimax`).
- File ini **TIDAK di-commit ke git** (ada di `.gitignore`) — simpan backup di tempat aman. Kalau hilang, update aplikasi berikutnya tidak bisa ditandatangani dengan kunci yang sama (= harus rilis sebagai aplikasi baru).
- Password keystore & key disimpan terpisah (tidak di repo). Signing config dibaca dari `android/key.properties` (juga tidak di-commit; contoh: `android/key.properties.example`).

### C. Kebijakan & Privasi (Privacy & Policy)
- **URL Kebijakan Privasi (Privacy Policy):**
  `https://kompresminimax.vercel.app/privacy.html` (atau domain produksi Anda).
- **Akses Aplikasi (App Access):** Pilih *"All functionality is available without restrictions"* (tanpa login).
- **Iklan (Ads):** Pilih *"No, my app does not contain ads"* (jika belum pasang AdMob).
- **Target Audiens (Target Audience):** Pilih 13 tahun ke atas / 18 tahun ke atas.
- **Deklarasi Izin Data / Data Safety:**
  - Aplikasi memproses gambar secara **100% lokal di perangkat** (client-side).
  - Tidak ada data user atau foto yang dikirim ke server/cloud.
  - Izin yang diminta: Internet (wajib), Kamera (untuk opsi "Ambil foto" saat pilih gambar).

### D. Toko / Listing Aset (Store Listing Assets)
Siapkan aset visual berikut sebelum submit:
1. **App Name:** KompresMiniMax
2. **Short Description (maks 80 karakter):**
   *Kompres foto & gambar kilat, hemat memori hingga 90% dengan aman offline.*
3. **Full Description:**
   *Aplikasi kompresi gambar offline, cepat, privasi terjaga tanpa upload ke server.*
4. **App Icon:** 512 x 512 PNG 32-bit (bisa diekspor dari `logo.svg`).
5. **Feature Graphic:** 1024 x 500 JPG/PNG (banner promo di Play Store).
6. **Screenshots:** Minimal 2 tangkapan layar smartphone (rasio 16:9 atau 18:9).
