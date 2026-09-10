# Panduan & Checklist Google Play Store — KompresMiniMax

## 1. Kenapa Ukuran File APK/AAB Hanya ~140 KB?
Aplikasi ini dibangun menggunakan **arsitektur native ultra-lean (Android WebView wrapper)** tanpa bloatware pihak ketiga (seperti React Native, Flutter, atau Chromium bundling).
- Aplikasi lain ukurannya puluhan MB karena menyertakan engine C++ runtime, library analitik berat, font berat, atau bundling browser engine sendiri.
- KompresMiniMax memanfaatkan WebView native OS bawaan Android dan HTML5 Canvas/Web Worker internal.
- **Sangat aman dan normal!** Google Play Store justru sangat mengapresiasi ukuran aplikasi kecil karena download rate & instalasi user meningkat pesat.

---

## 2. File Release yang Tersedia
Di direktori `release/`:
1. `KompresMiniMax.aab` (~137 KB) — **Format WAJIB untuk Google Play Console**
2. `KompresMiniMax.apk` (~140 KB) — Format direct install / sideload untuk tester & user

---

## 3. Syarat & Persiapan Upload Google Play Console
Berikut checklist yang wajib disiapkan di dashboard Google Play Console:

### A. Teknis Binary (SUDAH TERPENUHI & VALID)
- [x] Target SDK 34 (Android 14) - Standar wajib Google Play saat ini.
- [x] Min SDK 21 (Android 5.0 Lollipop) - Mencakup >99% perangkat Android di dunia.
- [x] Icon Aplikasi Adaptive & Standard (`ic_launcher` dan `ic_launcher_round` dari mdpi s/d xxxhdpi).
- [x] Format Google Android App Bundle (`.aab`) terverifikasi dengan `bundletool` dan ditandatangani keystore release.

### B. Kebijakan & Privasi (Privacy & Policy)
- **URL Kebijakan Privasi (Privacy Policy):**
  `https://kompresminimax.vercel.app/privacy.html` (atau domain produksi Anda).
- **Akses Aplikasi (App Access):** Pilih *"All functionality is available without restrictions"* (tanpa login).
- **Iklan (Ads):** Pilih *"No, my app does not contain ads"* (jika belum pasang AdMob).
- **Target Audiens (Target Audience):** Pilih 13 tahun ke atas / 18 tahun ke atas.
- **Deklarasi Izin Data / Data Safety:**
  - Aplikasi memproses gambar secara **100% lokal di perangkat** (client-side).
  - Tidak ada data user atau foto yang dikirim ke server/cloud.

### C. Toko / Listing Aset (Store Listing Assets)
Siapkan aset visual berikut sebelum submit:
1. **App Name:** KompresMiniMax
2. **Short Description (maks 80 karakter):**
   *Kompres foto & gambar kilat, hemat memori hingga 90% dengan aman offline.*
3. **Full Description:**
   *Aplikasi kompresi gambar offline, cepat, privasi terjaga tanpa upload ke server.*
4. **App Icon:** 512 x 512 PNG 32-bit (bisa diekspor dari `public/logo.svg`).
5. **Feature Graphic:** 1024 x 500 JPG/PNG (banner promo di Play Store).
6. **Screenshots:** Minimal 2 tangkapan layar smartphone (rasio 16:9 atau 18:9).
