package com.kompresminimax.app;

import android.Manifest;
import android.app.Activity;
import android.app.DownloadManager;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.MimeTypeMap;
import android.webkit.URLUtil;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;

/**
 * KompresMiniMax — WebView wrapper full-screen di atas aplikasi web lokal
 * (file:///android_asset/www/index.html), targetSdk 36.
 *
 * Fitur native (bukan sekadar WebView):
 *  - File chooser galeri + kamera (onShowFileChooser) -> inti alur kompres gambar
 *  - Download hasil kompresi: blob: URL dikonversi via JS bridge lalu disimpan
 *    ke folder Download; URL biasa lewat DownloadManager
 *  - Menerima share gambar (ACTION_SEND image/*) dari aplikasi lain
 */
public class MainActivity extends Activity {

    private static final int REQ_FILE_CHOOSER = 1001;
    private static final int REQ_CAMERA_PERMISSION = 1002;

    private WebView webView;
    private ValueCallback<Uri[]> filePathCallback;
    private Uri cameraImageUri;
    /** Gambar hasil share dari aplikasi lain, menunggu ditempel ke input file. */
    private Uri pendingSharedImage;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,
                WindowManager.LayoutParams.FLAG_FULLSCREEN);

        handleShareIntent(getIntent());

        webView = new WebView(this);
        setContentView(webView);

        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowFileAccessFromFileURLs(true);
        s.setAllowUniversalAccessFromFileURLs(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);
        s.setBuiltInZoomControls(false);

        webView.addJavascriptInterface(new BlobSaver(), "AndroidBlob");

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                // Kalau dibuka lewat Share gambar: otomatis buka pemilih file,
                // lalu onShowFileChooser langsung menempelkan gambar tsb.
                if (pendingSharedImage != null) {
                    view.evaluateJavascript(
                            "(function(){var i=document.querySelector('input[type=file]');"
                                    + "if(i){i.click();return true;}return false;})();", null);
                }
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView w, ValueCallback<Uri[]> callback,
                                             FileChooserParams params) {
                if (filePathCallback != null) {
                    filePathCallback.onReceiveValue(null);
                }
                filePathCallback = callback;
                // Gambar dari Share: tempel langsung tanpa buka chooser.
                if (pendingSharedImage != null) {
                    Uri u = pendingSharedImage;
                    pendingSharedImage = null;
                    filePathCallback.onReceiveValue(new Uri[]{u});
                    filePathCallback = null;
                    return true;
                }
                launchFileChooser(params);
                return true;
            }
        });

        webView.setDownloadListener((url, userAgent, contentDisposition, mimeType, contentLength) -> {
            if (url != null && url.startsWith("blob:")) {
                // DownloadManager tidak bisa menangani blob: -> konversi via JS.
                String safeUrl = url.replace("\\", "\\\\").replace("'", "\\'");
                String js = "(function(){fetch('" + safeUrl + "').then(function(r){return r.blob();})"
                        + ".then(function(b){var fr=new FileReader();"
                        + "fr.onloadend=function(){AndroidBlob.save(fr.result);};"
                        + "fr.readAsDataURL(b);})"
                        + ".catch(function(e){AndroidBlob.error(String(e));});})();";
                webView.evaluateJavascript(js, null);
            } else if (url != null) {
                try {
                    String name = URLUtil.guessFileName(url, contentDisposition, mimeType);
                    DownloadManager.Request req = new DownloadManager.Request(Uri.parse(url));
                    req.setMimeType(mimeType);
                    req.setTitle(name);
                    req.setDescription("KompresMiniMax");
                    req.setNotificationVisibility(
                            DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                    req.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, name);
                    ((DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE)).enqueue(req);
                    toast("Mengunduh " + name);
                } catch (Exception e) {
                    toast("Gagal mengunduh file");
                }
            }
        });

        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState);
        } else {
            webView.loadUrl("file:///android_asset/www/index.html");
        }

        // Izin kamera (dideklarasikan di manifest) diminta di awal supaya
        // opsi "Ambil foto" di file chooser langsung bisa dipakai.
        if (Build.VERSION.SDK_INT >= 23
                && checkSelfPermission(Manifest.permission.CAMERA)
                != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.CAMERA}, REQ_CAMERA_PERMISSION);
        }
    }

    /** Terima ACTION_SEND image/* dari aplikasi lain. */
    private void handleShareIntent(Intent intent) {
        if (intent == null || !Intent.ACTION_SEND.equals(intent.getAction())) return;
        String type = intent.getType();
        if (type == null || !type.startsWith("image/")) return;
        Uri uri = intent.getParcelableExtra(Intent.EXTRA_STREAM);
        if (uri == null) return;
        try {
            // Salin ke cache milik aplikasi supaya URI selalu bisa dibaca.
            File out = new File(getCacheDir(), "shared-" + System.currentTimeMillis() + ".jpg");
            try (InputStream in = getContentResolver().openInputStream(uri);
                 OutputStream os = new FileOutputStream(out)) {
                byte[] buf = new byte[8192];
                int n;
                while ((n = in.read(buf)) > 0) os.write(buf, 0, n);
            }
            pendingSharedImage = Uri.fromFile(out);
        } catch (Exception e) {
            pendingSharedImage = uri;
        }
        toast("Gambar diterima — menempel ke pilihan file…");
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleShareIntent(intent);
    }

    /** Chooser: galeri/dokumen + opsi kamera (tanpa FileProvider, via MediaStore). */
    private void launchFileChooser(WebChromeClient.FileChooserParams params) {
        Intent takePicture = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
        try {
            ContentValues values = new ContentValues();
            values.put(MediaStore.Images.Media.TITLE, "kompresminimax");
            values.put(MediaStore.Images.Media.MIME_TYPE, "image/jpeg");
            cameraImageUri = getContentResolver()
                    .insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values);
            if (cameraImageUri != null) {
                takePicture.putExtra(MediaStore.EXTRA_OUTPUT, cameraImageUri);
            }
        } catch (Exception e) {
            cameraImageUri = null;
        }

        Intent content = new Intent(Intent.ACTION_GET_CONTENT);
        content.addCategory(Intent.CATEGORY_OPENABLE);
        String accept = "image/*";
        if (params != null) {
            String[] types = params.getAcceptTypes();
            if (types != null && types.length > 0 && types[0] != null && !types[0].isEmpty()) {
                accept = types[0];
            }
        }
        content.setType(accept);

        Intent chooser = Intent.createChooser(content, "Pilih gambar");
        if (cameraImageUri != null
                && (Build.VERSION.SDK_INT < 23 || checkSelfPermission(Manifest.permission.CAMERA)
                == PackageManager.PERMISSION_GRANTED)) {
            chooser.putExtra(Intent.EXTRA_INITIAL_INTENTS, new Intent[]{takePicture});
        }
        startActivityForResult(chooser, REQ_FILE_CHOOSER);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != REQ_FILE_CHOOSER || filePathCallback == null) return;
        Uri[] results = null;
        if (resultCode == RESULT_OK) {
            if (data != null && data.getData() != null) {
                results = new Uri[]{data.getData()};       // dari galeri/dokumen
            } else if (cameraImageUri != null) {
                results = new Uri[]{cameraImageUri};       // dari kamera
            }
        }
        filePathCallback.onReceiveValue(results);
        filePathCallback = null;
        cameraImageUri = null;
    }

    /** Jembatan JS -> Android untuk menyimpan hasil fetch(blob:) sebagai file. */
    private class BlobSaver {
        @JavascriptInterface
        public void save(String dataUrl) {
            runOnUiThread(() -> {
                try {
                    int comma = dataUrl.indexOf(',');
                    String meta = dataUrl.substring(5, comma); // "image/jpeg;base64"
                    String mime = meta.split(";")[0];
                    byte[] data = Base64.decode(dataUrl.substring(comma + 1), Base64.DEFAULT);
                    String ext = MimeTypeMap.getSingleton().getExtensionFromMimeType(mime);
                    String name = "kompresminimax-" + System.currentTimeMillis()
                            + (ext != null ? "." + ext : ".bin");
                    saveToDownloads(name, mime, data);
                    toast("Tersimpan: " + name);
                } catch (Exception e) {
                    toast("Gagal menyimpan file");
                }
            });
        }

        @JavascriptInterface
        public void error(String msg) {
            runOnUiThread(() -> toast("Gagal mengunduh file"));
        }
    }

    private void saveToDownloads(String name, String mime, byte[] data) throws Exception {
        if (Build.VERSION.SDK_INT >= 29) {
            ContentValues v = new ContentValues();
            v.put(MediaStore.Downloads.DISPLAY_NAME, name);
            v.put(MediaStore.Downloads.MIME_TYPE, mime);
            v.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
            Uri uri = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, v);
            try (OutputStream os = getContentResolver().openOutputStream(uri)) {
                os.write(data);
            }
        } else {
            // Tanpa izin storage tambahan: simpan di folder khusus aplikasi.
            File dir = getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
            if (dir != null && !dir.exists()) dir.mkdirs();
            try (OutputStream os = new FileOutputStream(new File(dir, name))) {
                os.write(data);
            }
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        if (webView != null) webView.saveState(outState);
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.removeJavascriptInterface("AndroidBlob");
            webView.destroy();
        }
        super.onDestroy();
    }

    private void toast(String msg) {
        Toast.makeText(this, msg, Toast.LENGTH_SHORT).show();
    }
}
