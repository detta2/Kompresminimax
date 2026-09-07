// Security Sanitizer: Prevent DOM XSS from uploaded filename
function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * KompresMiniMax - Client-side Document & Image Engine
 * 100% Privacy Preserved - No Server Upload
 */

// State
let currentLang = 'id';
let compressionMode = 'target'; // 'target' | 'quality'
let compressFiles = [];
let mergeFiles = [];
let splitPdfDoc = null;
let splitPdfBytes = null;
let organizePdfDoc = null;
let organizePdfBytes = null;
let organizePages = []; // [{ pageIndex, rotation }]
let scannedImages = []; // [dataURL]
let cameraStream = null;

// Resize state
let resizeOriginalImg = null;
let resizeOriginalFile = null;
let resizeOrigWidth = 0;
let resizeOrigHeight = 0;
let resizeAspectLocked = true;

// Localization Dict
const translations = {
        id: {
        brandSubtitle: "",
        privacyBadge: "🔒 Privasi Aman (Lokal di HP/PC)",
        heroPill: "✨ Bereskan Dokumen & Foto Tanpa Ribet",
        heroTitle: "Kompres File Pas Sesuai <span>Ukuran Impian (KB/MB)</span>",
        heroSub: "Semua file diproses langsung di browsermu tanpa dikirim ke server luar. Bebas pusing batas ukuran berkas CPNS/BUMN, bikin pas foto rapi, gabung, pisah, sampai scan dokumen—semuanya serba cepat & gratis!",
        tabCompress: "🗜️ Kompres File",
        tabResize: "📐 Ubah Ukuran Foto",
        tabMerge: "📑 Gabung PDF",
        tabSplit: "✂️ Pisah PDF",
        tabOrganize: "🔄 Susun PDF",
        tabScan: "📷 Scan Dokumen",
        dropCompressTitle: "Tarik atau Pilih File yang Mau Dikompres",
        dropCompressSub: "Bisa foto (PNG, JPG, WEBP) maupun dokumen PDF sekaligus",
        btnChooseFile: "Pilih File Kamu",
        chipTarget: "🎯 Pas Ukuran Tertentu (KB/MB)",
        chipQuality: "🎚️ Atur Kualitas (%)",
        noteGov: "Paling pas buat syarat CPNS, BUMN, beasiswa, visa & email",
        labelTargetMax: "🎯 Mau Dikecilin Sampai Berapa?",
        labelFormatOutput: "Format Hasil Gambar",
        formatOriginal: "Sama Seperti Asli",
        formatJpg: "JPEG (Paling Fleksibel & Ringan)",
        formatWebp: "WEBP (Ukuran Paling Irit)",
        formatPng: "PNG (Bagus & Tajam)",
        labelQuality: "Kualitas Gambar",
        labelMaxRes: "Batas Lebar Foto (Resolusi)",
        optOriginalSize: "Resolusi Asli",
        btnClean: "Hapus Semua",
        btnCompressAll: "⚡ Mulai Kompres Semua",
        btnDownloadZip: "📦 Unduh Semua Sekaligus (.ZIP)",
        dropResizeTitle: "Pilih Foto yang Mau Diatur Ukurannya",
        dropResizeSub: "Bisa ubah pixel, potong pas foto 2x3, 3x4, 4x6 buat daftar CPNS/ijazah, atau sesuaikan ukuran medsos.",
        btnChoosePhoto: "Pilih Foto Kamu",
        labelQuickPresets: "⚡ Ukuran Siap Pakai:",
        preset2x3: "👤 Pas Foto 2x3",
        preset3x4: "👤 Pas Foto 3x4 (CPNS)",
        preset4x6: "👤 Pas Foto 4x6",
        presetSquare: "⏹️ Persegi 1:1 (Instagram)",
        presetStory: "📱 Story 9:16 (Status)",
        presetReset: "🔄 Balik ke Ukuran Awal",
        labelWidth: "Lebar (Width) [px]",
        labelHeight: "Tinggi (Height) [px]",
        labelLockAspect: "Kunci Perbandingan Ukuran",
        optLock: "🔒 Kunci Proporsional (Anti Gepeng)",
        optFree: "🔓 Bebas Atur Sesukamu",
        labelFitMode: "Gaya Pas Foto / Tampilan",
        optFit: "Fit (Tampilkan Utuh)",
        optCrop: "Crop / Fill (Isi Penuh Pas Foto Rapi)",
        optStretch: "Stretch (Tarik Pas Frame)",
        labelOutputQuality: "Kualitas Foto:",
        previewTitle: "Intip Hasil Foto",
        btnChangePhoto: "Ganti Foto Lain",
        btnSavePhoto: "⬇️ Simpan & Unduh Foto",
        dropMergeTitle: "Pilih File-File PDF yang Mau Disatukan",
        dropMergeSub: "Pilih 2 file PDF atau lebih. Kamu bebas geser buat atur urutannya sebelum digabung.",
        btnChoosePdf: "Pilih File PDF",
        btnMergeNow: "🔗 Satukan PDF Sekarang",
        mergeSuccessTitle: "🎉 Beres! PDF Kamu Sudah Jadi Satu!",
        mergeSuccessSub: "File gabungan sudah siap diunduh.",
        btnDownloadMerged: "⬇️ Unduh PDF Gabungan",
        dropSplitTitle: "Pilih File PDF yang Mau Dipisah",
        dropSplitSub: "Ambil lembar tertentu aja atau bagi per beberapa halaman (misal: 1-3, 5)",
        btnChoosePdfSource: "Pilih PDF Sumber",
        btnSplitNow: "✂️ Pisahkan Halaman Sekarang",
        checkSplitAll: "Bagi Semua Halaman Jadi File Terpisah (ZIP)",
        splitSuccessTitle: "🎉 Asik! PDF Berhasil Dipisah!",
        btnDownloadSplit: "⬇️ Unduh Halaman PDF",
        dropOrganizeTitle: "Bereskan Urutan, Putar & Hapus Lembar PDF",
        dropOrganizeSub: "Putar halaman yang miring, hapus lembar yang gak perlu, atau geser urutan lembaran sesuka hati.",
        btnChoosePdfOrganize: "Pilih PDF yang Mau Dirapikan",
        btnSaveOrganize: "💾 Simpan PDF yang Udah Rapi",
        dropScanTitle: "Scan Dokumen Jadi PDF (Foto ke PDF)",
        dropScanSub: "Bisa langsung jepret lewat kamera HP/laptop atau masukkan foto lembaran biar jadi satu file PDF resmi yang rapi.",
        btnOpenCam: "📸 Buka Kamera Scanner",
        btnUploadDocPhotos: "🖼️ Masukkan Foto Dokumen",
        btnSnapPage: "📸 Jepret Lembar Ini",
        btnCloseCam: "Tutup Kamera",
        btnCreateOfficialPdf: "📑 Satukan Jadi File PDF",
        card1Title: "Pas Sesuai Ukuran (KB/MB)",
        card1Desc: "Gak perlu bingung hitung manual. Cukup ketik mau berapa KB (misal 200 KB atau 500 KB CPNS), file langsung pas di bawah batas maksimal!",
        card2Title: "Ubah Ukuran & Pas Foto",
        card2Desc: "Bikin pas foto formal 2x3, 3x4, 4x6 yang rapi dan gak gepeng buat ijazah, pendaftaran kerja, visa, atau bikin foto medsos keren.",
        card3Title: "Gabung, Pisah & Rapikan PDF",
        card3Desc: "Satukan banyak berkas, ambil halaman yang kamu butuhin aja, putar halaman terbalik, atau buang lembaran yang salah.",
        card4Title: "Aman & Super Cepat di HP-mu",
        card4Desc: "Semua file diproses langsung di browsermu sendiri. Gak ada yang diunggah ke internet, privasimu dijamin 100% aman!"
    },
    en: {
        brandSubtitle: "",
        privacyBadge: "🔒 100% Client-Side Privacy",
        heroPill: "✨ Portable Document & Image Toolkit",
        heroTitle: "Compress Files to <span>Exact Size (KB/MB)</span>",
        heroSub: "All file operations happen entirely inside your web browser. Meet recruitment upload limits, resize passport photos, merge, split, and scan with zero external upload.",
        tabCompress: "🗜️ Compress File",
        tabResize: "📐 Resize Photo",
        tabMerge: "📑 Merge PDF",
        tabSplit: "✂️ Split PDF",
        tabOrganize: "🔄 Organize PDF",
        tabScan: "📷 Scan to PDF",
        dropCompressTitle: "Select or Drag & Drop Files to Compress",
        dropCompressSub: "Supports Images (PNG, JPG, WEBP) & Multi-page PDF Documents",
        btnChooseFile: "Choose Files",
        chipTarget: "🎯 Target Size (KB/MB)",
        chipQuality: "🎚️ Quality Percentage",
        noteGov: "Tailored for CPNS, Recruitment, Visa & Email limits",
        labelTargetMax: "🎯 Maximum Target Limit",
        labelFormatOutput: "Image Output Format",
        formatOriginal: "Original Format",
        formatJpg: "JPEG (Most Compatible)",
        formatWebp: "WEBP (Smallest Ratio)",
        formatPng: "PNG",
        labelQuality: "Quality Level",
        labelMaxRes: "Max Width Resolution",
        optOriginalSize: "Original Size",
        btnClean: "Clear All",
        btnCompressAll: "⚡ Compress All",
        btnDownloadZip: "📦 Download All (.ZIP)",
        dropResizeTitle: "Select Photo to Resize or Crop Dimensions",
        dropResizeSub: "Change pixel dimensions, crop passport photos (2x3, 3x4, 4x6 cm), diploma portraits, or social media ratios.",
        btnChoosePhoto: "Choose Photo",
        labelQuickPresets: "⚡ Quick Dimension Presets:",
        preset2x3: "👤 Passport 2x3 cm",
        preset3x4: "👤 Passport 3x4 cm",
        preset4x6: "👤 Passport 4x6 cm",
        presetSquare: "⏹️ Square 1:1",
        presetStory: "📱 Story 9:16",
        presetReset: "🔄 Original Size",
        labelWidth: "Width [px]",
        labelHeight: "Height [px]",
        labelLockAspect: "Lock Aspect Ratio",
        optLock: "🔒 Lock Original Aspect",
        optFree: "🔓 Free (Custom WxH)",
        labelFitMode: "Fit / Passport Mode",
        optFit: "Fit (Keep Entire Image)",
        optCrop: "Crop / Fill (Fill Passport Canvas)",
        optStretch: "Stretch (Force Fill)",
        labelOutputQuality: "Output Quality:",
        previewTitle: "Live Preview",
        btnChangePhoto: "Change Photo",
        btnSavePhoto: "⬇️ Save & Download Photo",
        dropMergeTitle: "Select PDF Documents to Combine",
        dropMergeSub: "Choose 2 or more PDF files. You can reorder pages before merging.",
        btnChoosePdf: "Select PDF Files",
        btnMergeNow: "🔗 Merge PDFs Now",
        mergeSuccessTitle: "🎉 PDFs Successfully Merged!",
        mergeSuccessSub: "Combined document is ready for download.",
        btnDownloadMerged: "⬇️ Download Combined PDF",
        dropSplitTitle: "Select PDF File to Split",
        dropSplitSub: "Extract specific pages or page ranges (e.g. 1-3, 5)",
        btnChoosePdfSource: "Select Source PDF",
        btnSplitNow: "✂️ Split PDF Now",
        checkSplitAll: "Extract All Pages to ZIP",
        splitSuccessTitle: "🎉 PDF Split Successfully!",
        btnDownloadSplit: "⬇️ Download Split Results",
        dropOrganizeTitle: "Organize, Rotate & Delete PDF Pages",
        dropOrganizeSub: "Rotate 90°/180°, remove incorrect sheets, or rearrange page sequences.",
        btnChoosePdfOrganize: "Select PDF to Organize",
        btnSaveOrganize: "💾 Save PDF Changes",
        dropScanTitle: "Scan Document to PDF",
        dropScanSub: "Take camera snaps directly or compile paper photos into a single PDF document.",
        btnOpenCam: "📸 Open Camera Scanner",
        btnUploadDocPhotos: "🖼️ Upload Document Photos",
        btnSnapPage: "📸 Snap This Page",
        btnCloseCam: "Close Camera",
        btnCreateOfficialPdf: "📑 Generate Official PDF",
        card1Title: "Target Size KB / MB",
        card1Desc: "Lock document sizes under strict 200 KB or 500 KB recruitment limits with automatic tuning.",
        card2Title: "Dimensions & Passport Photos",
        card2Desc: "Resize image pixels and create formal standard 2x3, 3x4, 4x6 passport photos with high DPI.",
        card3Title: "Merge, Split & Organize",
        card3Desc: "Combine separate files, extract specific ranges, reorient pages, and eliminate wrong sheets.",
        card4Title: "Client-Side Private & Fast",
        card4Desc: "Zero compromise privacy: all files process locally in browser memory without external server uploads."
    }
};

// Clock Initialization
function initLiveClock() {
    function update() {
        const d = new Date();
        const hrs = String(d.getHours()).padStart(2, '0');
        const mins = String(d.getMinutes()).padStart(2, '0');
        const secs = String(d.getSeconds()).padStart(2, '0');
        const clockEl = document.getElementById('headerClockDisplay');
        if (clockEl) clockEl.textContent = `${hrs}:${mins}:${secs}`;
    }
    update();
    setInterval(update, 1000);
}

// Language Selector
function setLanguage(lang) {
    currentLang = lang;
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    const dict = translations[lang] || translations.id;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) {
            el.innerHTML = dict[key];
        }
    });

    const heroTitle = document.getElementById('heroTitle');
    if (heroTitle && dict.heroTitle) {
        heroTitle.innerHTML = dict.heroTitle;
    }

    try {
        localStorage.setItem('minimax_lang', lang);
    } catch(e) {}
}

// Tab Switching
function switchToolTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.tab === tabId);
    });

    const views = {
        compress: 'viewCompress',
        resize: 'viewResize',
        merge: 'viewMerge',
        split: 'viewSplit',
        organize: 'viewOrganize',
        scan: 'viewScan',
        pdfconvert: 'viewPdfConvert'
    };

    Object.keys(views).forEach(key => {
        const el = document.getElementById(views[key]);
        if (el) {
            if (key === tabId) {
                el.classList.remove('hidden');
            } else {
                el.classList.add('hidden');
            }
        }
    });

    if (tabId !== 'scan' && cameraStream) {
        stopCameraScanner();
    }
}

// Format byte display helper
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// -------------------------------------------------------------
// TAB 1: COMPRESSION ENGINE
// -------------------------------------------------------------
function setCompressionMode(mode) {
    compressionMode = mode;
    const chipTarget = document.getElementById('chipTargetSize');
    const chipQual = document.getElementById('chipQuality');
    const targetBox = document.getElementById('targetSizeSettings');
    const qualBox = document.getElementById('qualitySettings');

    if (mode === 'target') {
        chipTarget.classList.add('active');
        chipQual.classList.remove('active');
        targetBox.classList.remove('hidden');
        qualBox.classList.add('hidden');
    } else {
        chipQual.classList.add('active');
        chipTarget.classList.remove('active');
        qualBox.classList.remove('hidden');
        targetBox.classList.add('hidden');
    }
}

function applyPreset(val, unit) {
    const valInput = document.getElementById('customTargetVal');
    const unitInput = document.getElementById('customTargetUnit');
    const slider = document.getElementById('customTargetSlider');
    const sliderVal = document.getElementById('targetSliderVal');
    if (valInput) valInput.value = val;
    if (unitInput) unitInput.value = unit;

    const kbEquivalent = (unit === 'MB') ? val * 1024 : val;
    if (slider) {
        slider.value = Math.min(Math.max(kbEquivalent, 20), 2000);
    }
    if (sliderVal) {
        sliderVal.textContent = `${val} ${unit}`;
    }
    updateTargetLabel();
}

function updateTargetLabel() {
    const v = document.getElementById('customTargetVal')?.value || 200;
    const u = document.getElementById('customTargetUnit')?.value || 'KB';
    const disp = document.getElementById('targetSizeDisplay');
    const sliderVal = document.getElementById('targetSliderVal');
    if (disp) disp.textContent = `Maks ${v} ${u}`;
    if (sliderVal) sliderVal.textContent = `${v} ${u}`;
}

function handleCompressFiles(files) {
    for (let i = 0; i < files.length; i++) {
        const f = files[i];
        compressFiles.push({
            id: 'cmp_' + Math.random().toString(36).substr(2, 9),
            file: f,
            name: f.name,
            size: f.size,
            type: f.type,
            status: 'ready', // ready, processing, done, error
            resultBlob: null,
            resultSize: null,
            reduction: 0
        });
    }
    renderCompressQueue();
}

function renderCompressQueue() {
    const queueEl = document.getElementById('compressQueue');
    const bulkBar = document.getElementById('compressBulkBar');
    const statsEl = document.getElementById('compressStats');
    const btnZip = document.getElementById('btnCompressZip');

    if (compressFiles.length === 0) {
        queueEl.innerHTML = '';
        bulkBar.classList.add('hidden');
        return;
    }

    bulkBar.classList.remove('hidden');
    let totalOriginal = 0;
    let totalDone = 0;
    let totalResult = 0;

    queueEl.innerHTML = compressFiles.map((item, idx) => {
        totalOriginal += item.size;
        if (item.status === 'done') {
            totalDone++;
            totalResult += item.resultSize || 0;
        }

        const isPdf = item.type === 'application/pdf' || item.name.toLowerCase().endsWith('.pdf');
        const badge = isPdf ? 'PDF' : 'IMG';

        let statusHtml = '';
        if (item.status === 'ready') {
            statusHtml = `<span style="font-size:0.8rem; color:var(--gray-500);">Siap dikompres</span>`;
        } else if (item.status === 'processing') {
            statusHtml = `<span style="font-size:0.8rem; color:var(--primary); font-weight:700;">Memproses...</span>`;
        } else if (item.status === 'done') {
            const pct = Math.round(item.reduction);
            statusHtml = `
                <div style="text-align:right;">
                    <div style="font-weight:700; color:var(--success); font-size:0.85rem;">${formatBytes(item.resultSize)} (-${pct}%)</div>
                    <a href="${URL.createObjectURL(item.resultBlob)}" download="minimax_${escapeHtml(item.name)}" class="btn-sm" style="background:#dcfce7; color:#15803d; text-decoration:none; display:inline-block; margin-top:4px;">⬇️ Unduh</a>
                </div>
            `;
        } else if (item.status === 'error') {
            statusHtml = `<span style="font-size:0.8rem; color:var(--danger); font-weight:700;">Gagal</span>`;
        }

        return `
            <div class="queue-item">
                <div class="item-info">
                    <span class="item-badge">${badge}</span>
                    <div>
                        <div class="item-title" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</div>
                        <div class="item-size-meta">Ukuran: ${formatBytes(item.size)}</div>
                    </div>
                </div>
                <div class="item-actions">
                    ${statusHtml}
                    <button class="btn-sm btn-del" onclick="removeCompressItem(${idx})">✕</button>
                </div>
            </div>
        `;
    }).join('');

    statsEl.textContent = `Total: ${compressFiles.length} file (${formatBytes(totalOriginal)})`;

    if (totalDone > 0 && totalDone === compressFiles.length) {
        btnZip.classList.remove('hidden');
    } else {
        btnZip.classList.add('hidden');
    }
}

function removeCompressItem(idx) {
    compressFiles.splice(idx, 1);
    renderCompressQueue();
}

function clearCompressQueue() {
    compressFiles = [];
    renderCompressQueue();
}

// Compress Image Core (Binary Search Quality & Dimensions for Exact Target)
async function compressImage(file, targetBytes, outputFormat, fixedQuality, maxRes) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = async () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Max resolution clamp
                if (maxRes && maxRes > 0 && width > maxRes) {
                    height = Math.round((height * maxRes) / width);
                    width = maxRes;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const mime = (outputFormat === 'original' || !outputFormat) ? (file.type || 'image/jpeg') : outputFormat;

                if (fixedQuality) {
                    // Direct quality mode
                    canvas.toBlob((blob) => {
                        resolve(blob || new Blob([e.target.result], { type: file.type }));
                    }, mime, fixedQuality / 100);
                    return;
                }

                // Target Size Mode: Binary Search
                let low = 0.05;
                let high = 0.95;
                let bestBlob = null;
                let scale = 1.0;

                for (let iter = 0; iter < 7; iter++) {
                    const mid = (low + high) / 2;
                    const b = await new Promise(res => canvas.toBlob(res, mime, mid));
                    if (!b) break;

                    if (b.size <= targetBytes) {
                        bestBlob = b;
                        low = mid; // Try higher quality
                    } else {
                        high = mid; // Needs more compression
                    }
                }

                // If still too large at minimum quality, scale down resolution
                if (!bestBlob || bestBlob.size > targetBytes) {
                    let curW = width;
                    let curH = height;
                    while ((!bestBlob || bestBlob.size > targetBytes) && curW > 200) {
                        curW = Math.round(curW * 0.8);
                        curH = Math.round(curH * 0.8);
                        canvas.width = curW;
                        canvas.height = curH;
                        ctx.drawImage(img, 0, 0, curW, curH);
                        bestBlob = await new Promise(res => canvas.toBlob(res, mime, 0.5));
                    }
                }

                resolve(bestBlob || new Blob([e.target.result], { type: file.type }));
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Compress PDF Client-Side using PDF-Lib
async function compressPDF(file, targetBytes) {
    const arrayBuffer = await file.arrayBuffer();
    if (typeof PDFLib === 'undefined') {
        return new Blob([arrayBuffer], { type: 'application/pdf' });
    }

    try {
        const srcDoc = await PDFLib.PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        const newDoc = await PDFLib.PDFDocument.create();
        const pageCount = srcDoc.getPageCount();
        const copiedPages = await newDoc.copyPages(srcDoc, srcDoc.getPageIndices());

        copiedPages.forEach(p => newDoc.addPage(p));
        const outBytes = await newDoc.save({ useObjectStreams: true });
        return new Blob([outBytes], { type: 'application/pdf' });
    } catch (e) {
        console.warn('PDF compress fallback:', e);
        return new Blob([arrayBuffer], { type: 'application/pdf' });
    }
}

async function processAllCompress() {
    const val = parseFloat(document.getElementById('customTargetVal').value) || 200;
    const unit = document.getElementById('customTargetUnit').value;
    const targetBytes = (unit === 'MB' ? val * 1024 * 1024 : val * 1024);
    const format = document.getElementById('formatSelect').value;
    const qualityVal = parseInt(document.getElementById('qualityRange').value, 10);
    const maxRes = parseInt(document.getElementById('resizeSelect').value, 10);

    const btnCompressAll = document.getElementById('btnCompressAll');
    btnCompressAll.disabled = true;
    btnCompressAll.textContent = '⏳ Memproses...';

    for (let i = 0; i < compressFiles.length; i++) {
        const item = compressFiles[i];
        if (item.status === 'done') continue;

        item.status = 'processing';
        renderCompressQueue();

        try {
            const isPdf = item.type === 'application/pdf' || item.name.toLowerCase().endsWith('.pdf');
            let resBlob;

            if (isPdf) {
                resBlob = await compressPDF(item.file, targetBytes);
            } else {
                if (compressionMode === 'target') {
                    resBlob = await compressImage(item.file, targetBytes, format, null, 0);
                } else {
                    resBlob = await compressImage(item.file, 0, format, qualityVal, maxRes);
                }
            }

            item.resultBlob = resBlob;
            item.resultSize = resBlob.size;
            item.reduction = Math.max(0, ((item.size - resBlob.size) / item.size) * 100);
            item.status = 'done';
        } catch (err) {
            console.error(err);
            item.status = 'error';
        }
        renderCompressQueue();
    }

    btnCompressAll.disabled = false;
    btnCompressAll.textContent = translations[currentLang]?.btnCompressAll || '⚡ Kompres Semua';
}

async function downloadCompressZip() {
    if (typeof JSZip === 'undefined') {
        alert('JSZip library belum termuat.');
        return;
    }
    const zip = new JSZip();
    compressFiles.forEach(item => {
        if (item.resultBlob) {
            zip.file('minimax_' + item.name, item.resultBlob);
        }
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(content);
    a.download = 'kompresminimax_all_files.zip';
    a.click();
}

// -------------------------------------------------------------
// TAB 2: EDIT SIZE FOTO & PAS FOTO RESIZER
// -------------------------------------------------------------
function handleResizeFileInput(file) {
    if (!file) return;
    resizeOriginalFile = file;

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            resizeOriginalImg = img;
            resizeOrigWidth = img.width;
            resizeOrigHeight = img.height;

            document.getElementById('resizeWidthInput').value = img.width;
            document.getElementById('resizeHeightInput').value = img.height;
            document.getElementById('resizeOrigMeta').textContent = `Asli: ${img.width} × ${img.height} px (${formatBytes(file.size)})`;

            document.getElementById('dropZoneResize').classList.add('hidden');
            document.getElementById('resizeWorkspace').classList.remove('hidden');

            renderResizeCanvas();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function applyResizePreset(type) {
    if (!resizeOriginalImg) return;

    // Pas Foto standar (300 DPI)
    // 2x3 cm -> 236 x 354 px
    // 3x4 cm -> 354 x 472 px
    // 4x6 cm -> 472 x 709 px
    const lockEl = document.getElementById('resizeLockAspect');
    const fitEl = document.getElementById('resizeFitMode');

    if (type === 'pas2x3') {
        document.getElementById('resizeWidthInput').value = 236;
        document.getElementById('resizeHeightInput').value = 354;
        lockEl.value = 'free';
        fitEl.value = 'crop';
    } else if (type === 'pas3x4') {
        document.getElementById('resizeWidthInput').value = 354;
        document.getElementById('resizeHeightInput').value = 472;
        lockEl.value = 'free';
        fitEl.value = 'crop';
    } else if (type === 'pas4x6') {
        document.getElementById('resizeWidthInput').value = 472;
        document.getElementById('resizeHeightInput').value = 709;
        lockEl.value = 'free';
        fitEl.value = 'crop';
    } else if (type === 'square') {
        const minDim = Math.min(resizeOrigWidth, resizeOrigHeight);
        document.getElementById('resizeWidthInput').value = minDim;
        document.getElementById('resizeHeightInput').value = minDim;
        lockEl.value = 'free';
        fitEl.value = 'crop';
    } else if (type === 'story') {
        document.getElementById('resizeWidthInput').value = 1080;
        document.getElementById('resizeHeightInput').value = 1920;
        lockEl.value = 'free';
        fitEl.value = 'crop';
    }
    renderResizeCanvas();
}

function resetToOriginalResize() {
    if (!resizeOriginalImg) return;
    document.getElementById('resizeWidthInput').value = resizeOrigWidth;
    document.getElementById('resizeHeightInput').value = resizeOrigHeight;
    document.getElementById('resizeLockAspect').value = 'lock';
    document.getElementById('resizeFitMode').value = 'fit';
    renderResizeCanvas();
}

function onWidthChange() {
    const w = parseInt(document.getElementById('resizeWidthInput').value, 10) || 1;
    const isLocked = document.getElementById('resizeLockAspect').value === 'lock';
    if (isLocked && resizeOrigWidth > 0) {
        const h = Math.round((w * resizeOrigHeight) / resizeOrigWidth);
        document.getElementById('resizeHeightInput').value = h;
    }
    renderResizeCanvas();
}

function onHeightChange() {
    const h = parseInt(document.getElementById('resizeHeightInput').value, 10) || 1;
    const isLocked = document.getElementById('resizeLockAspect').value === 'lock';
    if (isLocked && resizeOrigHeight > 0) {
        const w = Math.round((h * resizeOrigWidth) / resizeOrigHeight);
        document.getElementById('resizeWidthInput').value = w;
    }
    renderResizeCanvas();
}

function onLockAspectChange() {
    onWidthChange();
}

function onResizeQualityChange(val) {
    document.getElementById('resizeQualityLabel').textContent = `${val}%`;
    renderResizeCanvas();
}

function renderResizeCanvas() {
    if (!resizeOriginalImg) return;
    const canvas = document.getElementById('resizeCanvasPreview');
    const ctx = canvas.getContext('2d');

    const targetW = parseInt(document.getElementById('resizeWidthInput').value, 10) || 100;
    const targetH = parseInt(document.getElementById('resizeHeightInput').value, 10) || 100;
    const fitMode = document.getElementById('resizeFitMode').value;

    canvas.width = targetW;
    canvas.height = targetH;

    ctx.clearRect(0, 0, targetW, targetH);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetW, targetH);

    const srcW = resizeOriginalImg.width;
    const srcH = resizeOriginalImg.height;

    if (fitMode === 'stretch') {
        ctx.drawImage(resizeOriginalImg, 0, 0, targetW, targetH);
    } else if (fitMode === 'fit') {
        const ratio = Math.min(targetW / srcW, targetH / srcH);
        const dw = srcW * ratio;
        const dh = srcH * ratio;
        const dx = (targetW - dw) / 2;
        const dy = (targetH - dh) / 2;
        ctx.drawImage(resizeOriginalImg, dx, dy, dw, dh);
    } else if (fitMode === 'crop') {
        // Pas Foto standard center-crop
        const ratio = Math.max(targetW / srcW, targetH / srcH);
        const dw = srcW * ratio;
        const dh = srcH * ratio;
        const dx = (targetW - dw) / 2;
        const dy = (targetH - dh) / 2;
        ctx.drawImage(resizeOriginalImg, dx, dy, dw, dh);
    }

    document.getElementById('resizePreviewDims').textContent = `${targetW} × ${targetH} px`;

    // Estimate file size
    const mime = document.getElementById('resizeFormatSelect').value;
    const quality = parseInt(document.getElementById('resizeQualityRange').value, 10) / 100;
    canvas.toBlob(blob => {
        if (blob) {
            document.getElementById('resizePreviewEst').textContent = formatBytes(blob.size);
        }
    }, mime, quality);
}

function cancelResize() {
    resizeOriginalImg = null;
    resizeOriginalFile = null;
    document.getElementById('dropZoneResize').classList.remove('hidden');
    document.getElementById('resizeWorkspace').classList.add('hidden');
    document.getElementById('fileInputResize').value = '';
}

function downloadResizedPhoto() {
    const canvas = document.getElementById('resizeCanvasPreview');
    const mime = document.getElementById('resizeFormatSelect').value;
    const quality = parseInt(document.getElementById('resizeQualityRange').value, 10) / 100;

    let ext = '.jpg';
    if (mime === 'image/png') ext = '.png';
    else if (mime === 'image/webp') ext = '.webp';

    const baseName = (resizeOriginalFile?.name || 'foto').replace(/\.[^/.]+$/, '');
    const w = canvas.width;
    const h = canvas.height;

    canvas.toBlob(blob => {
        if (!blob) return;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${baseName}_${w}x${h}${ext}`;
        a.click();
    }, mime, quality);
}

// -------------------------------------------------------------
// TAB 3: MERGE PDF ENGINE
// -------------------------------------------------------------
function handleMergeFiles(files) {
    for (let i = 0; i < files.length; i++) {
        const f = files[i];
        if (f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')) {
            mergeFiles.push({
                id: 'mrg_' + Math.random().toString(36).substr(2, 9),
                file: f,
                name: f.name,
                size: f.size
            });
        }
    }
    renderMergeQueue();
}

function renderMergeQueue() {
    const queueEl = document.getElementById('mergeQueue');
    const bulkBar = document.getElementById('mergeBulkBar');
    const statsEl = document.getElementById('mergeStats');
    const resultBox = document.getElementById('mergeResultBox');
    resultBox.classList.add('hidden');

    if (mergeFiles.length === 0) {
        queueEl.innerHTML = '';
        bulkBar.classList.add('hidden');
        return;
    }

    bulkBar.classList.remove('hidden');
    statsEl.textContent = `${mergeFiles.length} PDF siap digabungkan`;

    queueEl.innerHTML = mergeFiles.map((item, idx) => `
        <div class="queue-item">
            <div class="item-info">
                <span class="item-badge">#${idx + 1}</span>
                <div>
                    <div class="item-title">${escapeHtml(item.name)}</div>
                    <div class="item-size-meta">${formatBytes(item.size)}</div>
                </div>
            </div>
            <div class="item-actions">
                <button class="btn-sm" style="background:var(--gray-200);" onclick="moveMergeItem(${idx}, -1)" ${idx === 0 ? 'disabled' : ''}>▲</button>
                <button class="btn-sm" style="background:var(--gray-200);" onclick="moveMergeItem(${idx}, 1)" ${idx === mergeFiles.length - 1 ? 'disabled' : ''}>▼</button>
                <button class="btn-sm btn-del" onclick="removeMergeItem(${idx})">✕</button>
            </div>
        </div>
    `).join('');
}

function moveMergeItem(idx, dir) {
    const target = idx + dir;
    if (target < 0 || target >= mergeFiles.length) return;
    const temp = mergeFiles[idx];
    mergeFiles[idx] = mergeFiles[target];
    mergeFiles[target] = temp;
    renderMergeQueue();
}

function removeMergeItem(idx) {
    mergeFiles.splice(idx, 1);
    renderMergeQueue();
}

function clearMergeQueue() {
    mergeFiles = [];
    renderMergeQueue();
}

async function executeMergePDF() {
    if (mergeFiles.length < 2) {
        alert('Silakan pilih minimal 2 berkas PDF untuk digabungkan.');
        return;
    }

    const btn = document.getElementById('btnExecuteMerge');
    btn.disabled = true;
    btn.textContent = '⏳ Menggabungkan PDF...';

    try {
        const mergedPdf = await PDFLib.PDFDocument.create();

        for (let i = 0; i < mergeFiles.length; i++) {
            const bytes = await mergeFiles[i].file.arrayBuffer();
            const srcDoc = await PDFLib.PDFDocument.load(bytes, { ignoreEncryption: true });
            const copiedPages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());
            copiedPages.forEach(page => mergedPdf.addPage(page));
        }

        const mergedBytes = await mergedPdf.save();
        const mergedBlob = new Blob([mergedBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(mergedBlob);

        const resultBox = document.getElementById('mergeResultBox');
        const dlBtn = document.getElementById('mergeDownloadBtn');
        const details = document.getElementById('mergeResultDetails');

        dlBtn.href = url;
        dlBtn.download = `gabungan_${mergeFiles.length}_dokumen.pdf`;
        details.textContent = `Total ukuran: ${formatBytes(mergedBlob.size)} (dari ${mergeFiles.length} berkas).`;
        resultBox.classList.remove('hidden');
    } catch (err) {
        console.error(err);
        alert('Gagal menggabungkan PDF. Pastikan file PDF tidak dikunci kata sandi.');
    } finally {
        btn.disabled = false;
        btn.textContent = translations[currentLang]?.btnMergeNow || '🔗 Gabungkan PDF Sekarang';
    }
}

// -------------------------------------------------------------
// TAB 4: SPLIT PDF ENGINE
// -------------------------------------------------------------
async function handleSplitFile(file) {
    if (!file) return;
    try {
        splitPdfBytes = await file.arrayBuffer();
        splitPdfDoc = await PDFLib.PDFDocument.load(splitPdfBytes, { ignoreEncryption: true });
        const pageCount = splitPdfDoc.getPageCount();

        document.getElementById('splitDocName').textContent = file.name;
        document.getElementById('splitDocPages').textContent = pageCount;
        document.getElementById('splitRangeInput').value = `1-${Math.min(pageCount, 3)}`;

        document.getElementById('dropZoneSplit').classList.add('hidden');
        document.getElementById('splitFileMeta').classList.remove('hidden');
        document.getElementById('splitResultBox').classList.add('hidden');
    } catch (e) {
        alert('Gagal membaca PDF. Pastikan format berkas valid.');
    }
}

function toggleSplitAll(chk) {
    const rangeInput = document.getElementById('splitRangeInput');
    rangeInput.disabled = chk.checked;
}

function parsePageRanges(rangeStr, maxPages) {
    const pages = new Set();
    const parts = rangeStr.split(',');
    for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed.includes('-')) {
            const [start, end] = trimmed.split('-').map(n => parseInt(n.trim(), 10));
            if (!isNaN(start) && !isNaN(end)) {
                for (let i = Math.max(1, start); i <= Math.min(maxPages, end); i++) {
                    pages.add(i - 1);
                }
            }
        } else {
            const num = parseInt(trimmed, 10);
            if (!isNaN(num) && num >= 1 && num <= maxPages) {
                pages.add(num - 1);
            }
        }
    }
    return Array.from(pages).sort((a, b) => a - b);
}

async function executeSplitPDF() {
    if (!splitPdfDoc) return;
    const totalPages = splitPdfDoc.getPageCount();
    const splitAll = document.getElementById('splitAllPagesCheckbox').checked;
    const resultBox = document.getElementById('splitResultBox');
    const dlBtn = document.getElementById('splitDownloadBtn');
    const details = document.getElementById('splitResultDetails');

    try {
        if (splitAll) {
            // Extract every single page into a ZIP
            const zip = new JSZip();
            for (let i = 0; i < totalPages; i++) {
                const singleDoc = await PDFLib.PDFDocument.create();
                const [copied] = await singleDoc.copyPages(splitPdfDoc, [i]);
                singleDoc.addPage(copied);
                const bytes = await singleDoc.save();
                zip.file(`halaman_${i + 1}.pdf`, bytes);
            }
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            dlBtn.href = URL.createObjectURL(zipBlob);
            dlBtn.download = `ekstrak_halaman_lengkap.zip`;
            details.textContent = `Berhasil mengekstrak ${totalPages} halaman individu ke arsip ZIP.`;
            resultBox.classList.remove('hidden');
        } else {
            const rangeStr = document.getElementById('splitRangeInput').value;
            const targetIndices = parsePageRanges(rangeStr, totalPages);

            if (targetIndices.length === 0) {
                alert('Format rentang halaman tidak valid.');
                return;
            }

            const newDoc = await PDFLib.PDFDocument.create();
            const copiedPages = await newDoc.copyPages(splitPdfDoc, targetIndices);
            copiedPages.forEach(p => newDoc.addPage(p));
            const newBytes = await newDoc.save();
            const blob = new Blob([newBytes], { type: 'application/pdf' });

            dlBtn.href = URL.createObjectURL(blob);
            dlBtn.download = `ekstrak_halaman_${rangeStr.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
            details.textContent = `Berhasil mengekstrak ${targetIndices.length} halaman (${formatBytes(blob.size)}).`;
            resultBox.classList.remove('hidden');
        }
    } catch (e) {
        console.error(e);
        alert('Terjadi kesalahan saat memisahkan dokumen PDF.');
    }
}

// -------------------------------------------------------------
// TAB 5: ORGANIZE PDF (ROTATE, REORDER, DELETE)
// -------------------------------------------------------------
async function handleOrganizeFile(file) {
    if (!file) return;
    try {
        organizePdfBytes = await file.arrayBuffer();
        organizePdfDoc = await PDFLib.PDFDocument.load(organizePdfBytes, { ignoreEncryption: true });
        const count = organizePdfDoc.getPageCount();

        organizePages = [];
        for (let i = 0; i < count; i++) {
            organizePages.push({
                origIndex: i,
                rotation: 0
            });
        }

        document.getElementById('organizeDocTitle').textContent = `Dokumen: ${file.name} (${count} Halaman)`;
        document.getElementById('dropZoneOrganize').classList.add('hidden');
        document.getElementById('organizeWorkspace').classList.remove('hidden');

        renderOrganizeGrid();
    } catch (e) {
        alert('Gagal memuat PDF untuk pengorganisasian.');
    }
}

function renderOrganizeGrid() {
    const grid = document.getElementById('pagesGrid');
    grid.innerHTML = organizePages.map((page, idx) => `
        <div class="page-card">
            <div class="page-preview-box" style="transform: rotate(${page.rotation}deg); transition: transform 0.2s;">
                📄
            </div>
            <div style="font-weight:700; font-size:0.8rem;">Hal ${page.origIndex + 1}</div>
            <div class="page-ctrl-strip">
                <button class="btn-sm" title="Putar Kiri" onclick="rotatePage(${idx}, -90)">↺</button>
                <button class="btn-sm" title="Putar Kanan" onclick="rotatePage(${idx}, 90)">↻</button>
                <button class="btn-sm" title="Pindah Kiri" onclick="shiftPage(${idx}, -1)" ${idx === 0 ? 'disabled' : ''}>◀</button>
                <button class="btn-sm" title="Pindah Kanan" onclick="shiftPage(${idx}, 1)" ${idx === organizePages.length - 1 ? 'disabled' : ''}>▶</button>
                <button class="btn-sm btn-del" title="Hapus Halaman" onclick="deletePage(${idx})">🗑️</button>
            </div>
        </div>
    `).join('');
}

function rotatePage(idx, deg) {
    organizePages[idx].rotation = (organizePages[idx].rotation + deg + 360) % 360;
    renderOrganizeGrid();
}

function shiftPage(idx, dir) {
    const target = idx + dir;
    if (target < 0 || target >= organizePages.length) return;
    const temp = organizePages[idx];
    organizePages[idx] = organizePages[target];
    organizePages[target] = temp;
    renderOrganizeGrid();
}

function deletePage(idx) {
    if (organizePages.length <= 1) {
        alert('Dokumen harus memiliki setidaknya satu halaman.');
        return;
    }
    organizePages.splice(idx, 1);
    renderOrganizeGrid();
}

async function saveOrganizedPDF() {
    if (!organizePdfDoc || organizePages.length === 0) return;

    try {
        const newDoc = await PDFLib.PDFDocument.create();
        const indices = organizePages.map(p => p.origIndex);
        const copied = await newDoc.copyPages(organizePdfDoc, indices);

        copied.forEach((p, idx) => {
            const rot = organizePages[idx].rotation;
            if (rot !== 0) {
                const currentRot = p.getRotation().angle;
                p.setRotation(PDFLib.degrees((currentRot + rot) % 360));
            }
            newDoc.addPage(p);
        });

        const newBytes = await newDoc.save();
        const blob = new Blob([newBytes], { type: 'application/pdf' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `dokumen_terorganisir.pdf`;
        a.click();
    } catch (e) {
        console.error(e);
        alert('Gagal menyimpan perubahan PDF.');
    }
}

// -------------------------------------------------------------
// TAB 6: SCAN TO PDF
// -------------------------------------------------------------
async function startCameraScanner() {
    const box = document.getElementById('cameraBox');
    const video = document.getElementById('cameraVideo');

    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: 'environment' } }
        });
        video.srcObject = cameraStream;
        box.classList.remove('hidden');
    } catch (e) {
        alert('Akses kamera tidak diizinkan atau tidak tersedia di peramban ini. Anda tetap dapat mengunggah foto dokumen secara manual.');
    }
}

function stopCameraScanner() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
    const box = document.getElementById('cameraBox');
    if (box) box.classList.add('hidden');
}

function captureDocumentPhoto() {
    const video = document.getElementById('cameraVideo');
    if (!video || !video.videoWidth) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    addScannedPage(dataUrl);
}

function handleScanFileUploads(files) {
    for (let i = 0; i < files.length; i++) {
        const reader = new FileReader();
        reader.onload = (e) => {
            addScannedPage(e.target.result);
        };
        reader.readAsDataURL(files[i]);
    }
}

function addScannedPage(dataUrl) {
    scannedImages.push(dataUrl);
    renderScannedStrip();
}

function renderScannedStrip() {
    const previewBox = document.getElementById('scanPagesPreview');
    const strip = document.getElementById('scannedPagesStrip');
    const countEl = document.getElementById('scanPageCount');

    if (scannedImages.length === 0) {
        previewBox.classList.add('hidden');
        return;
    }

    previewBox.classList.remove('hidden');
    countEl.textContent = scannedImages.length;

    strip.innerHTML = scannedImages.map((src, idx) => `
        <div style="position:relative; display:inline-block;">
            <img src="${src}" class="scanned-thumb">
            <button onclick="removeScannedPage(${idx})" style="position:absolute; top:2px; right:2px; background:rgba(239,68,68,0.9); color:#fff; border:none; border-radius:50%; width:20px; height:20px; cursor:pointer; font-size:11px;">✕</button>
        </div>
    `).join('');
}

function removeScannedPage(idx) {
    scannedImages.splice(idx, 1);
    renderScannedStrip();
}

async function generatePdfFromScan() {
    if (scannedImages.length === 0) {
        alert('Belum ada halaman pindaian yang ditambahkan.');
        return;
    }

    try {
        const doc = await PDFLib.PDFDocument.create();

        for (const dataUrl of scannedImages) {
            const jpgBytes = await fetch(dataUrl).then(res => res.arrayBuffer());
            const img = await doc.embedJpg(jpgBytes);
            const page = doc.addPage([img.width, img.height]);
            page.drawImage(img, {
                x: 0,
                y: 0,
                width: img.width,
                height: img.height
            });
        }

        const outBytes = await doc.save();
        const blob = new Blob([outBytes], { type: 'application/pdf' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `pindaian_dokumen_${Date.now()}.pdf`;
        a.click();
    } catch (e) {
        console.error(e);
        alert('Gagal menghasilkan file PDF dari hasil scan.');
    }
}

// -------------------------------------------------------------
// EVENT LISTENERS & INITIALIZATION
// -------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    initLiveClock();

    // Stored language
    try {
        const savedLang = localStorage.getItem('minimax_lang');
        if (savedLang && ['id', 'en'].includes(savedLang)) {
            setLanguage(savedLang);
        }
    } catch (e) {}

    // Target size inputs
    const customVal = document.getElementById('customTargetVal');
    const customUnit = document.getElementById('customTargetUnit');
    if (customVal) customVal.addEventListener('input', updateTargetLabel);
    if (customUnit) customUnit.addEventListener('change', updateTargetLabel);

    // Compress Dropzone
    const dropZoneCompress = document.getElementById('dropZoneCompress');
    const fileInputCompress = document.getElementById('fileInputCompress');
    if (dropZoneCompress && fileInputCompress) {
        dropZoneCompress.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZoneCompress.classList.add('dragover');
        });
        dropZoneCompress.addEventListener('dragleave', () => {
            dropZoneCompress.classList.remove('dragover');
        });
        dropZoneCompress.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZoneCompress.classList.remove('dragover');
            if (e.dataTransfer.files) handleCompressFiles(e.dataTransfer.files);
        });
        fileInputCompress.addEventListener('change', (e) => {
            if (e.target.files) handleCompressFiles(e.target.files);
            e.target.value = '';
        });
    }

    // Resize Dropzone
    const dropZoneResize = document.getElementById('dropZoneResize');
    const fileInputResize = document.getElementById('fileInputResize');
    if (dropZoneResize && fileInputResize) {
        dropZoneResize.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZoneResize.classList.add('dragover');
        });
        dropZoneResize.addEventListener('dragleave', () => {
            dropZoneResize.classList.remove('dragover');
        });
        dropZoneResize.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZoneResize.classList.remove('dragover');
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleResizeFileInput(e.dataTransfer.files[0]);
            }
        });
        fileInputResize.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                handleResizeFileInput(e.target.files[0]);
            }
        });
    }

    // Merge Dropzone
    const dropZoneMerge = document.getElementById('dropZoneMerge');
    const fileInputMerge = document.getElementById('fileInputMerge');
    if (dropZoneMerge && fileInputMerge) {
        dropZoneMerge.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZoneMerge.classList.add('dragover');
        });
        dropZoneMerge.addEventListener('dragleave', () => {
            dropZoneMerge.classList.remove('dragover');
        });
        dropZoneMerge.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZoneMerge.classList.remove('dragover');
            if (e.dataTransfer.files) handleMergeFiles(e.dataTransfer.files);
        });
        fileInputMerge.addEventListener('change', (e) => {
            if (e.target.files) handleMergeFiles(e.target.files);
            e.target.value = '';
        });
    }

    // Split Dropzone
    const dropZoneSplit = document.getElementById('dropZoneSplit');
    const fileInputSplit = document.getElementById('fileInputSplit');
    if (dropZoneSplit && fileInputSplit) {
        dropZoneSplit.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZoneSplit.classList.add('dragover');
        });
        dropZoneSplit.addEventListener('dragleave', () => {
            dropZoneSplit.classList.remove('dragover');
        });
        dropZoneSplit.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZoneSplit.classList.remove('dragover');
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleSplitFile(e.dataTransfer.files[0]);
            }
        });
        fileInputSplit.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                handleSplitFile(e.target.files[0]);
            }
            e.target.value = '';
        });
    }

    // Organize Dropzone
    const dropZoneOrganize = document.getElementById('dropZoneOrganize');
    const fileInputOrganize = document.getElementById('fileInputOrganize');
    if (dropZoneOrganize && fileInputOrganize) {
        dropZoneOrganize.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZoneOrganize.classList.add('dragover');
        });
        dropZoneOrganize.addEventListener('dragleave', () => {
            dropZoneOrganize.classList.remove('dragover');
        });
        dropZoneOrganize.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZoneOrganize.classList.remove('dragover');
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleOrganizeFile(e.dataTransfer.files[0]);
            }
        });
        fileInputOrganize.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                handleOrganizeFile(e.target.files[0]);
            }
            e.target.value = '';
        });
    }

    // Scan File Input
    const scanFileInput = document.getElementById('scanFileInput');
    if (scanFileInput) {
        scanFileInput.addEventListener('change', (e) => {
            if (e.target.files) handleScanFileUploads(e.target.files);
            e.target.value = '';
        });
    }

    // Quality slider label
    const qualityRange = document.getElementById('qualityRange');
    const qualityVal = document.getElementById('qualityVal');
    if (qualityRange && qualityVal) {
        qualityRange.addEventListener('input', (e) => {
            qualityVal.textContent = `${e.target.value}%`;
        });
    }
});


// ==========================================

// Toast Notification Utility
function showToast(message, type = 'info', duration = 3500) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast-message toast-${type}`;

    let iconClass = 'fas fa-info-circle';
    if (type === 'success') iconClass = 'fas fa-check-circle';
    else if (type === 'error') iconClass = 'fas fa-exclamation-circle';
    else if (type === 'warning') iconClass = 'fas fa-exclamation-triangle';

    toast.innerHTML = `<i class="${iconClass}"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// PDF TO ALL CONVERTER (POWERPOINT, WORD, EXCEL, TEXT, IMAGES, HTML)
// =================================================================

let currentConvertPdfFile = null;
let currentPdfDocument = null;
let selectedConvertFormat = 'powerpoint';

if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

const convertFormatDescriptions = {
    'powerpoint': 'Format Slide Presentasi Microsoft PowerPoint (.pptx)',
    'word': 'Format Dokumen Microsoft Word (.doc)',
    'excel': 'Format Lembar Kerja Spreadsheet Microsoft Excel (.xlsx)',
    'text': 'Format Plain Text Dokumen (.txt)',
    'images': 'Format Arsip Gambar Lembaran (.zip JPG Resolusi Tinggi)',
    'html': 'Format Halaman Web (.html Mandiri)'
};

function selectConvertFormat(format) {
    selectedConvertFormat = format;
    document.querySelectorAll('.format-card').forEach(card => {
        card.classList.toggle('selected', card.dataset.format === format);
    });

    const hintEl = document.getElementById('selectedFormatHint');
    if (hintEl) {
        hintEl.textContent = `Format terpilih: ${convertFormatDescriptions[format] || format}`;
    }
}

async function handlePdfConvertFile(file) {
    if (!file || (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf'))) {
        showToast('Mohon pilih file berkas PDF yang valid!', 'error');
        return;
    }

    currentConvertPdfFile = file;
    const dropZone = document.getElementById('dropZonePdfConvert');
    const workspace = document.getElementById('pdfConvertWorkspace');
    const titleEl = document.getElementById('convertDocTitle');
    const sizeEl = document.getElementById('convertDocSize');
    const pagesEl = document.getElementById('convertDocPages');
    const resultBox = document.getElementById('convertResultBox');
    const statusBar = document.getElementById('convertStatusBar');
    const statusText = document.getElementById('convertStatusText');

    if (dropZone) dropZone.classList.add('hidden');
    if (workspace) workspace.classList.remove('hidden');
    if (resultBox) resultBox.classList.add('hidden');
    if (statusBar) statusBar.classList.add('hidden');
    if (statusText) statusText.classList.add('hidden');

    if (titleEl) titleEl.textContent = file.name;
    if (sizeEl) sizeEl.textContent = formatBytes(file.size);
    if (pagesEl) pagesEl.textContent = 'Menghitung...';

    // Default ke format yang sedang aktif
    selectConvertFormat(selectedConvertFormat || 'powerpoint');

    try {
        const arrayBuffer = await file.arrayBuffer();
        currentPdfDocument = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        if (pagesEl) pagesEl.textContent = currentPdfDocument.numPages;
        showToast(`Dokumen siap: ${currentPdfDocument.numPages} halaman. Silakan tentukan format lalu klik Mulai Konversi.`, 'success');
    } catch (err) {
        console.error('Gagal membaca PDF:', err);
        showToast('Gagal membaca struktur berkas PDF.', 'error');
        resetPdfConvert();
    }
}

function resetPdfConvert() {
    currentConvertPdfFile = null;
    currentPdfDocument = null;
    const fileInput = document.getElementById('fileInputPdfConvert');
    if (fileInput) fileInput.value = '';
    
    const dropZone = document.getElementById('dropZonePdfConvert');
    const workspace = document.getElementById('pdfConvertWorkspace');
    const resultBox = document.getElementById('convertResultBox');
    const statusBar = document.getElementById('convertStatusBar');
    const statusText = document.getElementById('convertStatusText');

    if (workspace) workspace.classList.add('hidden');
    if (dropZone) dropZone.classList.remove('hidden');
    if (resultBox) resultBox.classList.add('hidden');
    if (statusBar) statusBar.classList.add('hidden');
    if (statusText) statusText.classList.add('hidden');
}

// Fungsi pembantu pembuatan format OpenXML PPTX yang valid
function createPptxSlideXml(slideIndex, emuW, emuH) {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" 
       xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" 
       xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id="1" name=""/>
        <p:cNvGrpSpPr/>
        <p:nvPr/>
      </p:nvGrpSpPr>
      <p:grpSpPr>
        <a:xfrm>
          <a:off x="0" y="0"/>
          <a:ext cx="0" cy="0"/>
          <a:chOff x="0" y="0"/>
          <a:chExt cx="0" cy="0"/>
        </a:xfrm>
      </p:grpSpPr>
      <p:pic>
        <p:nvPicPr>
          <p:cNvPr id="2" name="Page ${slideIndex}"/>
          <p:cNvPicPr>
            <a:picLocks noChangeAspect="1"/>
          </p:cNvPicPr>
          <p:nvPr/>
        </p:nvPicPr>
        <p:blipFill>
          <a:blip r:embed="rId1"/>
          <a:stretch>
            <a:fillRect/>
          </a:stretch>
        </p:blipFill>
        <p:spPr>
          <a:xfrm>
            <a:off x="0" y="0"/>
            <a:ext cx="${emuW}" cy="${emuH}"/>
          </a:xfrm>
          <a:prstGeom prst="rect">
            <a:avLst/>
          </a:prstGeom>
        </p:spPr>
      </p:pic>
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr>
    <a:masterClrMapping/>
  </p:clrMapOvr>
</p:sld>`;
}

async function executePdfConversion() {
    if (!currentPdfDocument || !currentConvertPdfFile) {
        showToast('Pilih berkas PDF terlebih dahulu!', 'error');
        return;
    }

    const btnExec = document.getElementById('btnExecuteConvert');
    const statusBar = document.getElementById('convertStatusBar');
    const progressFill = document.getElementById('convertProgressFill');
    const statusText = document.getElementById('convertStatusText');
    const resultBox = document.getElementById('convertResultBox');
    const btnDownload = document.getElementById('btnDownloadConverted');
    const statsText = document.getElementById('convertResultStats');

    if (btnExec) btnExec.disabled = true;
    if (statusBar) statusBar.classList.remove('hidden');
    if (statusText) {
        statusText.classList.remove('hidden');
        statusText.textContent = 'Menyiapkan berkas...';
    }
    if (progressFill) progressFill.style.width = '5%';
    if (resultBox) resultBox.classList.add('hidden');

    const totalPages = currentPdfDocument.numPages;
    const baseName = currentConvertPdfFile.name.replace(/\.[^/.]+$/, "");

    try {
        let outputBlob = null;
        let outputExt = 'pptx';

        // 1. FORMAT POWERPOINT PPTX
        if (selectedConvertFormat === 'powerpoint') {
            if (typeof JSZip === 'undefined') {
                throw new Error('Komponen JSZip belum dimuat.');
            }
            const zip = new JSZip();

            // Dapatkan dimensi halaman pertama untuk rasio presentasi
            const firstPage = await currentPdfDocument.getPage(1);
            const firstViewport = firstPage.getViewport({ scale: 1.0 });
            const pageW = firstViewport.width;
            const pageH = firstViewport.height;

            // Hitung EMUs (1 pt = 12700 EMUs)
            const emuW = Math.round(pageW * 12700);
            const emuH = Math.round(pageH * 12700);

            // [Content_Types].xml
            let contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="jpeg" ContentType="image/jpeg"/>
  <Default Extension="jpg" ContentType="image/jpeg"/>
  <Default Extension="png" ContentType="image/png"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>`;

            for (let i = 1; i <= totalPages; i++) {
                contentTypes += `\n  <Override PartName="/ppt/slides/slide${i}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`;
            }
            contentTypes += `\n</Types>`;
            zip.file('[Content_Types].xml', contentTypes);

            // _rels/.rels
            const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`;
            zip.file('_rels/.rels', rootRels);

            // ppt/_rels/presentation.xml.rels
            let presRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`;
            for (let i = 1; i <= totalPages; i++) {
                presRels += `\n  <Relationship Id="rId${i}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i}.xml"/>`;
            }
            presRels += `\n</Relationships>`;
            zip.file('ppt/_rels/presentation.xml.rels', presRels);

            // ppt/presentation.xml
            let presXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" 
                xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" 
                xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldMasterIdLst/>
  <p:sldIdLst>`;
            for (let i = 1; i <= totalPages; i++) {
                presXml += `\n    <p:sldId id="${255 + i}" r:id="rId${i}"/>`;
            }
            presXml += `\n  </p:sldIdLst>
  <p:sldSz cx="${emuW}" cy="${emuH}" type="custom"/>
  <p:notesSz cx="${emuH}" cy="${emuW}"/>
</p:presentation>`;
            zip.file('ppt/presentation.xml', presXml);

            // Render setiap halaman ke HD slide
            for (let i = 1; i <= totalPages; i++) {
                const page = await currentPdfDocument.getPage(i);
                // Menggunakan render scale 2.0 untuk kualitas tajam jernih di proyektor/layar
                const viewport = page.getViewport({ scale: 2.0 });
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = viewport.width;
                canvas.height = viewport.height;

                await page.render({ canvasContext: ctx, viewport: viewport }).promise;

                const imgDataUrl = canvas.toDataURL('image/jpeg', 0.92);
                const base64Data = imgDataUrl.replace(/^data:image\/jpeg;base64,/, '');

                // Simpan image ke ppt/media/
                zip.file(`ppt/media/slide_img_${i}.jpg`, base64Data, { base64: true });

                // slide xml
                const slideXml = createPptxSlideXml(i, emuW, emuH);
                zip.file(`ppt/slides/slide${i}.xml`, slideXml);

                // slide rels
                const slideRelXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/slide_img_${i}.jpg"/>
</Relationships>`;
                zip.file(`ppt/slides/_rels/slide${i}.xml.rels`, slideRelXml);

                const pct = Math.round((i / totalPages) * 90);
                if (progressFill) progressFill.style.width = `${pct}%`;
                if (statusText) statusText.textContent = `Merender slide PowerPoint ${i} dari ${totalPages}...`;
            }

            if (statusText) statusText.textContent = 'Menyusun paket berkas PowerPoint (.pptx)...';
            outputBlob = await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
            outputExt = 'pptx';
        }
        // 2. FORMAT PLAIN TEXT
        else if (selectedConvertFormat === 'text') {
            let fullText = '';
            for (let i = 1; i <= totalPages; i++) {
                const page = await currentPdfDocument.getPage(i);
                const content = await page.getTextContent();
                const pageText = content.items.map(item => item.str).join(' ');
                fullText += `--- Halaman ${i} ---\n\n` + pageText + '\n\n';
                if (progressFill) progressFill.style.width = `${Math.round((i / totalPages) * 100)}%`;
                if (statusText) statusText.textContent = `Mengekstrak teks halaman ${i} dari ${totalPages}...`;
            }
            outputBlob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
            outputExt = 'txt';
        } 
        // 3. FORMAT WORD (.DOC)
        else if (selectedConvertFormat === 'word') {
            let docHtml = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">';
            docHtml += '<head><meta charset="utf-8"><title>' + baseName + '</title>';
            docHtml += '<style>body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.5; padding: 20px; } p { margin-bottom: 1em; } .page-break { page-break-after: always; }</style></head><body>';
            
            for (let i = 1; i <= totalPages; i++) {
                const page = await currentPdfDocument.getPage(i);
                const content = await page.getTextContent();
                
                let lines = [];
                let currentLine = [];
                let lastY = null;

                content.items.forEach(item => {
                    const y = Math.round(item.transform[5]);
                    if (lastY !== null && Math.abs(y - lastY) > 5) {
                        lines.push(currentLine.join(' '));
                        currentLine = [];
                    }
                    currentLine.push(item.str);
                    lastY = y;
                });
                if (currentLine.length > 0) lines.push(currentLine.join(' '));

                docHtml += `<div class="pdf-page"><h2>Halaman ${i}</h2>`;
                lines.forEach(line => {
                    if (line.trim()) docHtml += `<p>${line.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`;
                });
                docHtml += '</div>';
                if (i < totalPages) docHtml += '<br clear="all" style="page-break-before:always" />';
                
                if (progressFill) progressFill.style.width = `${Math.round((i / totalPages) * 100)}%`;
                if (statusText) statusText.textContent = `Menata struktur Word halaman ${i} dari ${totalPages}...`;
            }
            docHtml += '</body></html>';
            outputBlob = new Blob([docHtml], { type: 'application/msword;charset=utf-8' });
            outputExt = 'doc';
        }
        // 4. FORMAT EXCEL (.XLSX)
        else if (selectedConvertFormat === 'excel') {
            if (typeof XLSX === 'undefined') {
                throw new Error('Pustaka SheetJS belum dimuat.');
            }
            const wb = XLSX.utils.book_new();
            
            for (let i = 1; i <= totalPages; i++) {
                const page = await currentPdfDocument.getPage(i);
                const content = await page.getTextContent();
                
                let rowsMap = {};
                content.items.forEach(item => {
                    const y = Math.round(item.transform[5] / 12) * 12;
                    if (!rowsMap[y]) rowsMap[y] = [];
                    rowsMap[y].push({ x: item.transform[4], text: item.str });
                });

                const sortedYs = Object.keys(rowsMap).map(Number).sort((a, b) => b - a);
                const sheetData = [];
                sortedYs.forEach(y => {
                    const sortedRow = rowsMap[y].sort((a, b) => a.x - b.x);
                    sheetData.push(sortedRow.map(col => col.text));
                });

                const ws = XLSX.utils.aoa_to_sheet(sheetData.length > 0 ? sheetData : [['Halaman Kosong']]);
                XLSX.utils.book_append_sheet(wb, ws, `Halaman_${i}`);

                if (progressFill) progressFill.style.width = `${Math.round((i / totalPages) * 100)}%`;
                if (statusText) statusText.textContent = `Menyusun baris spreadsheet halaman ${i} dari ${totalPages}...`;
            }

            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            outputBlob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            outputExt = 'xlsx';
        }
        // 5. FORMAT GAMBAR LEMBARAN (.ZIP)
        else if (selectedConvertFormat === 'images') {
            const zip = new JSZip();
            for (let i = 1; i <= totalPages; i++) {
                const page = await currentPdfDocument.getPage(i);
                const viewport = page.getViewport({ scale: 2.0 });
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = viewport.width;
                canvas.height = viewport.height;

                await page.render({ canvasContext: ctx, viewport: viewport }).promise;

                const imgDataUrl = canvas.toDataURL('image/jpeg', 0.9);
                const base64Data = imgDataUrl.replace(/^data:image\/jpeg;base64,/, '');
                zip.file(`Halaman_${String(i).padStart(3, '0')}.jpg`, base64Data, { base64: true });

                if (progressFill) progressFill.style.width = `${Math.round((i / totalPages) * 100)}%`;
                if (statusText) statusText.textContent = `Merender gambar resolusi tinggi halaman ${i} dari ${totalPages}...`;
            }

            if (statusText) statusText.textContent = 'Mengompresi gambar ke arsip ZIP...';
            outputBlob = await zip.generateAsync({ type: 'blob' });
            outputExt = 'zip';
        }
        // 6. FORMAT WEB HTML
        else if (selectedConvertFormat === 'html') {
            let htmlContent = '<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><title>' + baseName + '</title>';
            htmlContent += '<style>body{font-family:sans-serif;max-width:850px;margin:30px auto;line-height:1.6;padding:20px;background:#f8fafc;color:#1e293b;} .pdf-card{background:#fff;border:1px solid #e2e8f0;padding:24px;margin-bottom:20px;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.05);} h2{color:#2563eb;margin-top:0;}</style></head><body>';

            for (let i = 1; i <= totalPages; i++) {
                const page = await currentPdfDocument.getPage(i);
                const content = await page.getTextContent();
                const text = content.items.map(it => it.str).join(' ');
                htmlContent += `<div class="pdf-card"><h2>Halaman ${i}</h2><p>${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p></div>`;

                if (progressFill) progressFill.style.width = `${Math.round((i / totalPages) * 100)}%`;
                if (statusText) statusText.textContent = `Menghasilkan kode web halaman ${i} dari ${totalPages}...`;
            }
            htmlContent += '</body></html>';
            outputBlob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
            outputExt = 'html';
        }

        if (progressFill) progressFill.style.width = '100%';
        if (statusText) statusText.textContent = 'Konversi selesai dengan sempurna!';

        const downloadUrl = URL.createObjectURL(outputBlob);
        if (btnDownload) {
            btnDownload.href = downloadUrl;
            btnDownload.download = `${baseName}_converted.${outputExt}`;
        }
        if (statsText) {
            statsText.textContent = `Hasil: ${baseName}_converted.${outputExt} (${formatBytes(outputBlob.size)})`;
        }
        if (resultBox) resultBox.classList.remove('hidden');
        showToast('Konversi dokumen berhasil!', 'success');

    } catch (err) {
        console.error('Terjadi kesalahan konversi:', err);
        showToast('Gagal memproses konversi: ' + (err.message || 'Error internal'), 'error');
        if (statusText) statusText.textContent = 'Gagal memproses konversi.';
    } finally {
        if (btnExec) btnExec.disabled = false;
    }
}

// Initializing listeners for slider & convert dropzone
window.addEventListener('DOMContentLoaded', () => {
    // Slider target size synchronization
    const customSlider = document.getElementById('customTargetSlider');
    const customVal = document.getElementById('customTargetVal');
    const customUnit = document.getElementById('customTargetUnit');

    if (customSlider && customVal && customUnit) {
        customSlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            customVal.value = val;
            customUnit.value = 'KB';
            updateTargetLabel();
        });

        customVal.addEventListener('input', () => {
            const v = parseFloat(customVal.value) || 0;
            const u = customUnit.value;
            const kbVal = u === 'MB' ? v * 1024 : v;
            customSlider.value = Math.min(Math.max(kbVal, 20), 2000);
            updateTargetLabel();
        });

        customUnit.addEventListener('change', () => {
            const v = parseFloat(customVal.value) || 0;
            const u = customUnit.value;
            const kbVal = u === 'MB' ? v * 1024 : v;
            customSlider.value = Math.min(Math.max(kbVal, 20), 2000);
            updateTargetLabel();
        });
    }

    // PDF Converter Dropzone
    const dropZonePdfConvert = document.getElementById('dropZonePdfConvert');
    const fileInputPdfConvert = document.getElementById('fileInputPdfConvert');

    if (dropZonePdfConvert && fileInputPdfConvert) {
        dropZonePdfConvert.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZonePdfConvert.classList.add('dragover');
        });
        dropZonePdfConvert.addEventListener('dragleave', () => {
            dropZonePdfConvert.classList.remove('dragover');
        });
        dropZonePdfConvert.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZonePdfConvert.classList.remove('dragover');
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handlePdfConvertFile(e.dataTransfer.files[0]);
            }
        });
        fileInputPdfConvert.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                handlePdfConvertFile(e.target.files[0]);
            }
        });
    }
});
