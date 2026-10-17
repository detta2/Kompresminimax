/* ============================================================
   TAB 8: GANTI BACKGROUND PAS FOTO (client-side AI)
   - Pakai @imgly/background-removal (ONNX, jalan di browser)
   - Model diunduh sekali (~40 MB, tersimpan di IndexedDB)
   - Tidak ada upload ke server mana pun
   ============================================================ */

const BG = {
    file: null,          // File asli
    fileURL: null,       // object URL untuk preview
    resultURL: null,     // object URL hasil akhir
    bgColor: '#ff0000',  // default: merah CPNS
    processing: false,
    lib: null,           // modul @imgly/background-removal (lazy load)
};

const $ = (id) => document.getElementById(id);

function bgLog(msg, pct) {
    const bar = $('bgStatusBar'), fill = $('bgProgressFill'), txt = $('bgStatusText');
    if (!bar) return;
    bar.classList.remove('hidden');
    txt.classList.remove('hidden');
    txt.textContent = msg;
    if (typeof pct === 'number') fill.style.width = Math.max(0, Math.min(100, pct)) + '%';
}

function bgDone() {
    $('bgStatusBar')?.classList.add('hidden');
    $('bgStatusText')?.classList.add('hidden');
}

/* ---------- pilih file ---------- */
function bgHandleFile(file) {
    if (!file || !file.type.startsWith('image/')) {
        alert('Pilih file gambar (JPG/PNG/WEBP).');
        return;
    }
    if (BG.fileURL) URL.revokeObjectURL(BG.fileURL);
    BG.file = file;
    BG.fileURL = URL.createObjectURL(file);
    $('bgPreviewBefore').src = BG.fileURL;
    $('bgPreviewAfter').classList.add('hidden');
    $('bgAfterPlaceholder').classList.remove('hidden');
    $('btnDownloadBg').classList.add('hidden');
    $('btnChainBgToResize')?.classList.add('hidden');
    BG.resultBlob = null;
    if (BG.resultURL) { URL.revokeObjectURL(BG.resultURL); BG.resultURL = null; }
    $('bgChangeWorkspace').classList.remove('hidden');
    $('dropZoneBgChange').style.display = 'none';
    bgDone();
}

/* ---------- pilihan warna ---------- */
function bgInitColorChoices() {
    document.querySelectorAll('#bgColorChoices .bg-choice').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#bgColorChoices .bg-choice')
                .forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            BG.bgColor = btn.dataset.color;
            // jika hasil sudah ada, render ulang dengan warna baru (tanpa AI ulang)
            if (BG.fgImage) bgComposite();
        });
    });
    $('bgCustomColor').addEventListener('input', (e) => {
        document.querySelectorAll('#bgColorChoices .bg-choice')
            .forEach(b => b.classList.remove('active'));
        BG.bgColor = e.target.value;
        if (BG.fgImage) bgComposite();
    });
}

/* ---------- composite: foreground + warna ---------- */
function bgComposite() {
    const fg = BG.fgImage;
    const canvas = document.createElement('canvas');
    canvas.width = fg.naturalWidth || fg.width;
    canvas.height = fg.naturalHeight || fg.height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = BG.bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(fg, 0, 0);
    canvas.toBlob((blob) => {
        BG.resultBlob = blob;
        if (BG.resultURL) URL.revokeObjectURL(BG.resultURL);
        BG.resultURL = URL.createObjectURL(blob);
        const img = $('bgPreviewAfter');
        img.src = BG.resultURL;
        img.classList.remove('hidden');
        $('bgAfterPlaceholder').classList.add('hidden');
        const dl = $('btnDownloadBg');
        dl.href = BG.resultURL;
        dl.classList.remove('hidden');
        $('btnChainBgToResize')?.classList.remove('hidden');
        bgDone();
        bgLog('✅ Selesai! Klik "Unduh Hasil" untuk menyimpan.', 100);
        setTimeout(bgDone, 4000);
    }, 'image/jpeg', 0.92);
}

/* ---------- proses utama ---------- */
async function bgProcess() {
    if (BG.processing) return;
    if (!BG.file) { alert('Pilih foto dulu.'); return; }
    BG.processing = true;
    $('btnProcessBg').disabled = true;

    try {
        // Lazy-load library (sekali saja)
        if (!BG.lib) {
            bgLog('📦 Memuat mesin AI (sekali saja)...', 5);
            BG.lib = await import(
                'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/+esm'
            );
        }

        // Progress agregat seluruh file model: tampilkan MB terunduh / total MB
        const fetchParts = {};
        const toMB = (b) => (b / 1048576).toFixed(1);
        bgLog('🧠 Memisahkan orang dari background...', 15);
        const blob = await BG.lib.removeBackground(BG.file, {
            model: 'isnet_quint8', // model ringan (~40 MB), cukup akurat untuk pas foto
            progress: (key, current, total) => {
                // key: 'fetch:...' (unduh model) atau 'compute:inference' (proses)
                if (key.startsWith('fetch:')) {
                    fetchParts[key] = { current, total };
                    let cur = 0, tot = 0;
                    Object.values(fetchParts).forEach(p => { cur += p.current; tot += Math.max(p.total, p.current); });
                    const pct = tot > 0 ? Math.round((cur / tot) * 100) : 0;
                    bgLog(`⬇️ Mengunduh model AI... ${toMB(cur)} MB / ${toMB(tot)} MB (${pct}%)`, 5 + pct * 0.55);
                } else {
                    const pct = total > 0 ? Math.round((current / total) * 100) : 0;
                    bgLog(`🧠 Memproses gambar... ${pct}%`, 60 + pct * 0.35);
                }
            },
        });

        // Jadikan Image agar bisa di-composite ulang saat ganti warna
        const fgURL = URL.createObjectURL(blob);
        const fgImg = new Image();
        await new Promise((res, rej) => {
            fgImg.onload = res;
            fgImg.onerror = rej;
            fgImg.src = fgURL;
        });
        BG.fgImage = fgImg;
        bgLog('🎨 Menggabungkan dengan background baru...', 95);
        bgComposite();
    } catch (err) {
        console.error(err);
        bgLog('❌ Gagal: ' + (err?.message || err), 0);
        alert('Gagal memproses. Pastikan koneksi internet aktif (untuk unduh model pertama kali) lalu coba lagi.');
    } finally {
        BG.processing = false;
        $('btnProcessBg').disabled = false;
    }
}

/* ---------- workflow chaining: hasil BG -> tab Ubah Ukuran Foto (preset 3x4) ---------- */
async function sendBgToResize() {
    let blob = BG.resultBlob;
    if (!blob && BG.resultURL) {
        try { blob = await (await fetch(BG.resultURL)).blob(); } catch (e) { /* abaikan */ }
    }
    if (!blob) { alert('Proses ganti background dulu sampai selesai.'); return; }
    const file = new File([blob], 'pasfoto-background-baru.jpg', { type: 'image/jpeg' });
    window._pendingResizePreset = 'pas3x4';
    switchToolTab('resize');
    handleResizeFileInput(file);
    document.querySelector('.app-container')?.scrollIntoView({ behavior: 'smooth' });
}
window.sendBgToResize = sendBgToResize;

/* ---------- reset ---------- */
function resetBgChange() {
    if (BG.fileURL) URL.revokeObjectURL(BG.fileURL);
    if (BG.resultURL) URL.revokeObjectURL(BG.resultURL);
    Object.assign(BG, { file: null, fileURL: null, resultURL: null, resultBlob: null, fgImage: null });
    $('btnChainBgToResize')?.classList.add('hidden');
    const fi = $('fileInputBgChange');
    if (fi) fi.value = '';
    $('bgChangeWorkspace').classList.add('hidden');
    $('dropZoneBgChange').style.display = '';
    bgDone();
}
window.resetBgChange = resetBgChange;

/* ---------- init ---------- */
(function bgInit() {
    const fi = $('fileInputBgChange');
    if (!fi) return;
    fi.addEventListener('change', (e) => bgHandleFile(e.target.files[0]));

    const dz = $('dropZoneBgChange');
    dz.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.add('dragover'); });
    dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
    dz.addEventListener('drop', (e) => {
        e.preventDefault();
        dz.classList.remove('dragover');
        if (e.dataTransfer.files.length) bgHandleFile(e.dataTransfer.files[0]);
    });

    $('btnProcessBg').addEventListener('click', bgProcess);
    bgInitColorChoices();
})();
