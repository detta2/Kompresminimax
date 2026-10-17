const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');

// Hapus folder public lama jika ada, lalu buat baru
if (fs.existsSync(publicDir)) {
  fs.rmSync(publicDir, { recursive: true, force: true });
}
fs.mkdirSync(publicDir, { recursive: true });

// Daftar file/folder yang dikecualikan dari copy
const excludeList = new Set([
  'node_modules',
  '.git',
  '.vercel',
  'public',
  'package.json',
  'package-lock.json',
  'build.js',
  'server.py',
  'run.log',
  'server.log',
  '.gitignore'
]);

const files = fs.readdirSync(__dirname);

for (const file of files) {
  if (excludeList.has(file)) continue;

  const srcPath = path.join(__dirname, file);
  const destPath = path.join(publicDir, file);
  const stat = fs.statSync(srcPath);

  if (stat.isFile()) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied: ${file} -> public/${file}`);
  } else if (stat.isDirectory()) {
    fs.cpSync(srcPath, destPath, { recursive: true });
    console.log(`Copied dir: ${file} -> public/${file}`);
  }
}

console.log('Build completed successfully: All files prepared in public/');

// Halaman fisik per rute SEO (clean URL): /kompres-pdf -> kompres-pdf.html (isi = SPA index.html,
// tab aktif dipilih dari URL oleh app.js). Menjamin rute tidak 404 di Vercel.
// Title/meta/canonical/H1 statis di-inject per rute persis blueprint SEO (PAGES),
// supaya terbaca crawler tanpa menunggu render JavaScript.
const escHtml = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const SEO_PAGES = {
  'kompres-pdf': { title: 'Kompres PDF 200KB untuk CPNS Online Gratis | KompresMiniMax', desc: 'Kompres PDF jadi pas 200KB untuk syarat SSCASN CPNS, PPPK & BUMN. Gratis tanpa daftar dan tanpa watermark — file diproses 100% di browser, tidak diupload ke server.', h1: 'Kompres PDF 200KB Online Gratis untuk CPNS' },
  'ganti-background-foto': { title: 'Ganti Background Foto Merah Online Gratis | KompresMiniMax', desc: 'Ganti background pas foto jadi merah (#FF0000 / #CC0000) atau biru pakai AI, langsung di browser. Gratis tanpa batas, tanpa daftar, tanpa watermark — foto tidak diupload ke server.', h1: 'Ganti Background Foto Merah Online Gratis' },
  'resize-pas-foto': { title: 'Resize Pas Foto 3x4 & 4x6 Jadi 200KB Online | KompresMiniMax', desc: 'Ubah ukuran pas foto 2x3, 3x4, 4x6 dan kompres pas di bawah 200KB untuk CPNS & lamaran kerja. Preset piksel 300 DPI, gratis tanpa aplikasi — file tetap di perangkatmu.', h1: 'Resize Pas Foto 3x4 & 4x6 Jadi 200KB Online Gratis' },
  'gabung-pdf': { title: 'Gabung PDF Online Gratis — Satukan File PDF | KompresMiniMax', desc: 'Gabungkan banyak file PDF jadi satu dan atur urutannya dengan geser & letakkan. Gratis tanpa batas, tanpa watermark, diproses 100% di browser tanpa upload ke server.', h1: 'Gabung PDF Online Gratis' },
  'pisah-pdf': { title: 'Pisah PDF Online Gratis — Ambil Halaman PDF | KompresMiniMax', desc: 'Pisahkan halaman PDF: ambil rentang halaman tertentu (mis. 1–3, 5) menjadi file baru. Gratis, tanpa daftar, tanpa watermark — 100% diproses di browsermu.', h1: 'Pisah PDF Online Gratis' },
  'susun-pdf': { title: 'Susun PDF Online Gratis — Urutkan & Putar Halaman | KompresMiniMax', desc: 'Bereskan urutan halaman PDF: geser untuk mengurutkan, putar halaman miring, hapus lembar yang tidak perlu. Gratis tanpa watermark, semua diproses lokal di browser.', h1: 'Susun Ulang Halaman PDF Online Gratis' },
  'scan-dokumen': { title: 'Scan Dokumen Jadi PDF Online Gratis dari HP | KompresMiniMax', desc: 'Scan dokumen pakai kamera HP atau laptop lalu ubah jadi PDF rapi. Gratis tanpa aplikasi tambahan, tanpa daftar — file hasil scan tidak dikirim ke server mana pun.', h1: 'Scan Dokumen Jadi PDF Online Gratis' },
  'konversi-pdf': { title: 'Konversi PDF Online Gratis — PDF ke Word & Excel | KompresMiniMax', desc: 'Ubah PDF jadi DOCX, PPTX, XLSX, TXT, HTML, atau gambar — cepat dan gratis tanpa daftar. Konversi 100% lokal di browser, file tidak diupload ke server.', h1: 'Konversi PDF Online Gratis' }
};
const indexHtml = fs.readFileSync(path.join(publicDir, 'index.html'), 'utf8');
for (const [route, meta] of Object.entries(SEO_PAGES)) {
  const url = 'https://www.kompresminimax.online/' + route;
  let html = indexHtml;
  html = html.replace(/<title>.*?<\/title>/, `<title>${escHtml(meta.title)}</title>`);
  html = html.replace(/(<meta name="title" content=").*?(")/, `$1${escHtml(meta.title)}$2`);
  html = html.replace(/(<meta name="description" content=").*?(")/, `$1${escHtml(meta.desc)}$2`);
  html = html.replace(/(<meta property="og:title" content=").*?(")/, `$1${escHtml(meta.title)}$2`);
  html = html.replace(/(<meta property="og:description" content=").*?(")/, `$1${escHtml(meta.desc)}$2`);
  html = html.replace(/(<meta property="og:url" content=").*?(")/, `$1${url}$2`);
  html = html.replace(/(<meta name="twitter:title" content=").*?(")/, `$1${escHtml(meta.title)}$2`);
  html = html.replace(/(<meta name="twitter:description" content=").*?(")/, `$1${escHtml(meta.desc)}$2`);
  html = html.replace(/(<link rel="canonical" href=").*?(")/, `$1${url}$2`);
  html = html.replace(/<h1 id="heroTitle">.*?<\/h1>/, `<h1 id="heroTitle">${escHtml(meta.h1)}</h1>`);
  fs.writeFileSync(path.join(publicDir, route + '.html'), html);
  console.log(`SEO route page: public/${route}.html`);
}
