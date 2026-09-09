import os
import re
import uuid
import asyncio
from typing import Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, HttpUrl
import yt_dlp

app = FastAPI(
    title="Universal Media Downloader API",
    description="Engine ekstraksi video/audio untuk YouTube, TikTok, dan Instagram",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DOWNLOAD_DIR = os.path.join(os.path.dirname(__file__), "downloads")
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(DOWNLOAD_DIR, exist_ok=True)
os.makedirs(STATIC_DIR, exist_ok=True)

class ExtractRequest(BaseModel):
    url: str

class DownloadRequest(BaseModel):
    url: str
    format: str  # 'mp4' | 'mp3'
    quality: Optional[str] = "best"

PLATFORM_PATTERNS = {
    "youtube": r"(https?://)?(www\.|m\.)?(youtube\.com|youtu\.be)/.+",
    "tiktok": r"(https?://)?(www\.|vm\.|vt\.)?tiktok\.com/.+",
    "instagram": r"(https?://)?(www\.)?instagram\.com/(p|reel|tv)/.+"
}

def detect_platform(url: str) -> str:
    for platform, pattern in PLATFORM_PATTERNS.items():
        if re.match(pattern, url.strip()):
            return platform
    return "unknown"

def get_base_ydl_opts():
    return {
        'quiet': True,
        'no_warnings': True,
        'extract_flat': False,
        'socket_timeout': 15,
        'http_headers': {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    }

def safe_error_handler(e: Exception) -> dict:
    err_str = str(e).lower()
    if "private video" in err_str or "sign in" in err_str or "login" in err_str:
        return {"status": 403, "detail": "Konten bersifat privat atau memerlukan autentikasi/login."}
    elif "429" in err_str or "too many requests" in err_str or "rate-limit" in err_str:
        return {"status": 429, "detail": "Platform target membatasi request (Rate-Limit). Coba lagi dalam beberapa saat."}
    elif "not found" in err_str or "404" in err_str or "unable to download webpage" in err_str:
        return {"status": 404, "detail": "URL tidak ditemukan atau video telah dihapus."}
    elif "unsupported url" in err_str:
        return {"status": 400, "detail": "URL tidak didukung atau format tautan salah."}
    else:
        return {"status": 500, "detail": f"Gagal mengekstrak media: {str(e)[:150]}"}

@app.post("/api/info")
def get_media_info(payload: ExtractRequest):
    url = payload.url.strip()
    platform = detect_platform(url)
    
    if platform == "unknown":
        raise HTTPException(
            status_code=400, 
            detail="URL tidak valid atau belum didukung. Masukkan URL YouTube, TikTok, atau Instagram yang valid."
        )

    opts = get_base_ydl_opts()
    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            if not info:
                raise HTTPException(status_code=404, detail="Tidak dapat membaca metadata media.")

            title = info.get("title", "Unknown Media")
            duration = info.get("duration", 0)
            thumbnail = info.get("thumbnail") or (info.get("thumbnails")[-1]["url"] if info.get("thumbnails") else "")
            uploader = info.get("uploader") or info.get("channel", "Unknown Creator")
            
            # Format detection
            formats_available = ["mp4", "mp3"]
            
            return {
                "success": True,
                "platform": platform,
                "title": title,
                "uploader": uploader,
                "duration_seconds": duration,
                "thumbnail": thumbnail,
                "formats": formats_available
            }
    except Exception as e:
        err = safe_error_handler(e)
        raise HTTPException(status_code=err["status"], detail=err["detail"])

def cleanup_file(filepath: str):
    try:
        if os.path.exists(filepath):
            os.remove(filepath)
    except Exception:
        pass

@app.post("/api/download")
def download_media(payload: DownloadRequest, background_tasks: BackgroundTasks):
    url = payload.url.strip()
    fmt = payload.format.lower()
    
    if fmt not in ["mp4", "mp3"]:
        raise HTTPException(status_code=400, detail="Format tidak valid. Pilih 'mp4' atau 'mp3'.")

    token = str(uuid.uuid4())[:8]
    output_template = os.path.join(DOWNLOAD_DIR, f"media_{token}.%(ext)s")
    
    opts = get_base_ydl_opts()
    
    if fmt == "mp3":
        opts.update({
            'format': 'bestaudio/best',
            'outtmpl': output_template,
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
        })
    else:  # mp4
        opts.update({
            'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
            'outtmpl': output_template,
            'merge_output_format': 'mp4'
        })

    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            meta = ydl.extract_info(url, download=True)
            clean_title = re.sub(r'[^a-zA-Z0-9_\- ]', '', meta.get("title", f"media_{token}")).strip()
            if not clean_title:
                clean_title = f"media_{token}"

        target_ext = "mp3" if fmt == "mp3" else "mp4"
        expected_file = os.path.join(DOWNLOAD_DIR, f"media_{token}.{target_ext}")

        # Fallback search if extension modified
        if not os.path.exists(expected_file):
            for fname in os.listdir(DOWNLOAD_DIR):
                if fname.startswith(f"media_{token}"):
                    expected_file = os.path.join(DOWNLOAD_DIR, fname)
                    target_ext = fname.split('.')[-1]
                    break

        if not os.path.exists(expected_file):
            raise HTTPException(status_code=500, detail="Proses konversi gagal menghasilkan file.")

        filename = f"{clean_title}.{target_ext}"
        media_type = "audio/mpeg" if target_ext == "mp3" else "video/mp4"

        # Background cleanup after 5 minutes
        async def delayed_cleanup(path: str):
            await asyncio.sleep(300)
            cleanup_file(path)

        background_tasks.add_task(delayed_cleanup, expected_file)

        return FileResponse(
            path=expected_file,
            filename=filename,
            media_type=media_type,
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )

    except Exception as e:
        err = safe_error_handler(e)
        raise HTTPException(status_code=err["status"], detail=err["detail"])

# Mount frontend
app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
