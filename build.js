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
const seoRoutes = ['kompres-pdf', 'ganti-background-foto', 'resize-pas-foto', 'gabung-pdf',
  'pisah-pdf', 'susun-pdf', 'scan-dokumen', 'konversi-pdf'];
for (const route of seoRoutes) {
  fs.copyFileSync(path.join(publicDir, 'index.html'), path.join(publicDir, route + '.html'));
  console.log(`SEO route page: public/${route}.html`);
}
