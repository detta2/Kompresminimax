import os
import re
import time
import uuid
import urllib.parse
import requests
from typing import Optional, Dict, Any
from fastapi import FastAPI, HTTPException, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
import yt_dlp

app = FastAPI(
    title="Universal Media Downloader API",
    description="Engine ekstraksi video/audio ultra-cepat untuk YouTube, TikTok, dan Instagram",
    version="3.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "Content-Length"]
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DOWNLOAD_DIR = os.path.join(BASE_DIR, "downloads")
STATIC_DIR = os.path.join(BASE_DIR, "static")
INDEX_HTML = os.path.join(STATIC_DIR, "index.html")
os.makedirs(DOWNLOAD_DIR, exist_ok=True)
os.makedirs(STATIC_DIR, exist_ok=True)

HTTP_CLIENT = requests.Session()
HTTP_CLIENT.headers.update({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9,id;q=0.8"
})

INFO_CACHE: Dict[str, Dict[str, Any]] = {}
FILE_CACHE: Dict[str, Dict[str, Any]] = {}
CACHE_TTL = 3600
NODE_PATH = "/data/data/com.termux/files/usr/bin/node"

class ExtractRequest(BaseModel):
    url: str

PLATFORM_PATTERNS = {
    "youtube": r"(https?://)?(www\.|m\.)?(youtube\.com|youtu\.be)/.+",
    "tiktok": r"(https?://)?(www\.|vm\.|vt\.)?tiktok\.com/.+",
    "instagram": r"(https?://)?(www\.)?instagram\.com/(p|reel|tv|stories)/.+"
}

def detect_platform(url: str) -> str:
    url_clean = url.strip()
    for platform, pattern in PLATFORM_PATTERNS.items():
        if re.match(pattern, url_clean):
            return platform
    return "unknown"

def get_base_ydl_opts(is_download: bool = False):
    opts = {
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,
        "socket_timeout": 60,
        "extractor_args": {
            "youtube": {
                "player_client": ["android", "mweb", "web"]
            }
        },
        "http_headers": {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        }
    }
    if os.path.exists(NODE_PATH):
        opts["js_runtimes"] = {"node": {"path": NODE_PATH}}

    if is_download:
        opts.update({
            "concurrent_fragment_downloads": 4,
            "buffersize": 1048576,
            "retries": 3,
            "fragment_retries": 3,
        })
    else:
        opts["extract_flat"] = "in_playlist"
    return opts

def safe_error_handler(e: Exception) -> dict:
    err_str = str(e).lower()
    if "private video" in err_str or "sign in" in err_str or "login" in err_str:
        return {"status": 403, "detail": "Konten bersifat privat atau memerlukan autentikasi platform."}
    elif "429" in err_str or "too many requests" in err_str or "rate-limit" in err_str:
        return {"status": 429, "detail": "Platform target membatasi request. Coba beberapa saat lagi."}
    elif "not found" in err_str or "404" in err_str or "unable to download webpage" in err_str or "unavailable" in err_str:
        return {"status": 404, "detail": "Media tidak ditemukan atau konten telah dihapus."}
    elif "unsupported url" in err_str:
        return {"status": 400, "detail": "Format tautan salah atau platform tidak didukung."}
    else:
        return {"status": 400, "detail": f"Gagal memproses media: {str(e)[:150]}"}

def try_fast_metadata(url: str, platform: str) -> Optional[Dict[str, Any]]:
    try:
        if platform == "youtube":
            vid_match = re.search(r"(?:v=|\/|youtu\.be\/|shorts\/)([a-zA-Z0-9_-]{11})", url)
            if vid_match:
                vid = vid_match.group(1)
                norm_watch_url = f"https://www.youtube.com/watch?v={vid}"
                try:
                    oembed_url = f"https://www.youtube.com/oembed?url={urllib.parse.quote(norm_watch_url)}&format=json"
                    res = HTTP_CLIENT.get(oembed_url, timeout=2.0)
                    if res.status_code == 200:
                        data = res.json()
                        return {
                            "success": True,
                            "platform": "youtube",
                            "title": data.get("title", f"YouTube Video ({vid})"),
                            "uploader": data.get("author_name", "YouTube Creator"),
                            "thumbnail": f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg"
                        }
                except Exception:
                    pass
                return {
                    "success": True,
                    "platform": "youtube",
                    "title": f"YouTube Video ({vid})",
                    "uploader": "YouTube Creator",
                    "thumbnail": f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg"
                }

        elif platform == "tiktok":
            target_url = url
            if "vt.tiktok.com" in url or "vm.tiktok.com" in url:
                try:
                    head_res = HTTP_CLIENT.head(url, allow_redirects=True, timeout=2.0)
                    target_url = head_res.url
                except Exception:
                    pass

            try:
                oembed_url = f"https://www.tiktok.com/oembed?url={urllib.parse.quote(target_url)}"
                res = HTTP_CLIENT.get(oembed_url, timeout=2.0)
                if res.status_code == 200:
                    d = res.json()
                    return {
                        "success": True,
                        "platform": "tiktok",
                        "title": d.get("title") or f"TikTok Video by {d.get('author_name', 'Creator')}",
                        "uploader": d.get("author_name", "TikTok Creator"),
                        "thumbnail": d.get("thumbnail_url", "")
                    }
            except Exception:
                pass

            vid_match = re.search(r"video/(\d+)", target_url)
            item_id = vid_match.group(1) if vid_match else "Media"
            return {
                "success": True,
                "platform": "tiktok",
                "title": f"TikTok Video #{item_id}",
                "uploader": "TikTok Creator",
                "thumbnail": "https://sf16-website-login.neutral.ttwstatic.com/obj/tiktok_web_login_static/tiktok/webapp/main/webapp-desktop/8ca3c345da5895780eb7.png"
            }

        elif platform == "instagram":
            short_match = re.search(r"instagram\.com/(?:p|reel|tv)/([a-zA-Z0-9_-]+)", url)
            code = short_match.group(1) if short_match else "Media"
            try:
                embed_url = f"https://www.instagram.com/p/{code}/embed/captioned/"
                res = HTTP_CLIENT.get(embed_url, timeout=2.0)
                if res.status_code == 200:
                    html = res.text
                    caption_m = re.search(r"class=\"CaptionComments\"[^>]*>([^<]+)<", html) or re.search(r"class=\"Caption\"[^>]*>([^<]+)<", html)
                    author_m = re.search(r"class=\"CaptionUsername\"[^>]*>([^<]+)<", html)
                    return {
                        "success": True,
                        "platform": "instagram",
                        "title": caption_m.group(1).strip()[:100] if caption_m else f"Instagram Reel ({code})",
                        "uploader": f"@{author_m.group(1).strip()}" if author_m else "@instagram",
                        "thumbnail": "https://static.cdninstagram.com/rsrc.php/v3/yI/r/VsNE-OHk_8a.png"
                    }
            except Exception:
                pass

            return {
                "success": True,
                "platform": "instagram",
                "title": f"Instagram Reel ({code})",
                "uploader": "@instagram",
                "thumbnail": "https://static.cdninstagram.com/rsrc.php/v3/yI/r/VsNE-OHk_8a.png"
            }
    except Exception:
        pass
    return None

@app.get("/", include_in_schema=False)
def serve_root():
    return FileResponse(INDEX_HTML)

@app.post("/api/info")
def get_media_info(payload: ExtractRequest):
    url = payload.url.strip()
    platform = detect_platform(url)

    if platform == "unknown":
        raise HTTPException(
            status_code=400, 
            detail="Tautan tidak dikenali. Masukkan URL YouTube, TikTok, atau Instagram yang valid."
        )

    now = time.time()
    if url in INFO_CACHE:
        cached = INFO_CACHE[url]
        if now - cached["timestamp"] < CACHE_TTL:
            return cached["data"]

    fast_data = try_fast_metadata(url, platform)
    if fast_data:
        INFO_CACHE[url] = {"data": fast_data, "timestamp": now}
        return fast_data

    opts = get_base_ydl_opts(is_download=False)
    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(url, download=False)
            if not info:
                raise HTTPException(status_code=404, detail="Tidak dapat membaca media.")

            title = info.get("title", "Unknown Media")
            thumbnail = info.get("thumbnail") or (info.get("thumbnails")[-1]["url"] if info.get("thumbnails") else "")
            uploader = info.get("uploader") or info.get("channel", "Creator")
            
            result = {
                "success": True,
                "platform": platform,
                "title": title,
                "uploader": uploader,
                "thumbnail": thumbnail
            }
            INFO_CACHE[url] = {"data": result, "timestamp": now}
            return result

    except HTTPException:
        raise
    except Exception as e:
        err = safe_error_handler(e)
        raise HTTPException(status_code=err["status"], detail=err["detail"])

def cleanup_old_files():
    try:
        now = time.time()
        for fname in os.listdir(DOWNLOAD_DIR):
            fpath = os.path.join(DOWNLOAD_DIR, fname)
            if os.path.isfile(fpath):
                if now - os.path.getmtime(fpath) > 1200:
                    try:
                        os.remove(fpath)
                    except Exception:
                        pass
    except Exception:
        pass

class DownloadRequest(BaseModel):
    url: str
    format: str = "mp4"

@app.post("/api/download")
def direct_download_post(payload: DownloadRequest, background_tasks: BackgroundTasks = BackgroundTasks()):
    return direct_download(url=payload.url, format=payload.format, background_tasks=background_tasks)

@app.get("/api/download")
def direct_download(
    url: str = Query(..., description="Target video URL"),
    format: str = Query("mp4", description="Format: mp4 atau mp3"),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    background_tasks.add_task(cleanup_old_files)
    url = url.strip()
    fmt = format.lower().strip()
    if fmt not in ["mp4", "mp3"]:
        fmt = "mp4"

    cache_key = f"{url}_{fmt}"
    now = time.time()
    
    if cache_key in FILE_CACHE:
        cached = FILE_CACHE[cache_key]
        if os.path.exists(cached["filepath"]):
            ascii_name = re.sub(r"[^a-zA-Z0-9_.\- ]", "_", cached["filename"])
            quoted_name = urllib.parse.quote(cached["filename"])
            return FileResponse(
                path=cached["filepath"],
                filename=cached["filename"],
                media_type=cached["media_type"],
                headers={
                    "Content-Disposition": f"attachment; filename=\"{ascii_name}\"; filename*=UTF-8''{quoted_name}",
                    "Access-Control-Expose-Headers": "Content-Disposition, Content-Length"
                }
            )

    token = str(uuid.uuid4())[:8]
    output_template = os.path.join(DOWNLOAD_DIR, f"media_{token}.%(ext)s")

    opts = get_base_ydl_opts(is_download=True)
    if fmt == "mp3":
        opts.update({
            "format": "bestaudio/best",
            "outtmpl": output_template,
            "postprocessors": [{
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
                "preferredquality": "192",
            }],
        })
    else:
        opts.update({
            "format": "best[ext=mp4][acodec!=none]/best[ext=mp4]/bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=1080]+bestaudio/best",
            "outtmpl": output_template,
            "merge_output_format": "mp4"
        })

    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            meta = ydl.extract_info(url, download=True)
            raw_title = meta.get("title", f"media_{token}") if meta else f"media_{token}"
            clean_title = re.sub(r'[\\/*?:"<>|\r\n\t]', "", raw_title).strip()
            if not clean_title:
                clean_title = f"media_{token}"

        target_ext = "mp3" if fmt == "mp3" else "mp4"
        expected_file = os.path.join(DOWNLOAD_DIR, f"media_{token}.{target_ext}")

        if not os.path.exists(expected_file):
            for fname in os.listdir(DOWNLOAD_DIR):
                if fname.startswith(f"media_{token}"):
                    expected_file = os.path.join(DOWNLOAD_DIR, fname)
                    target_ext = fname.split(".")[-1]
                    break

        if not os.path.exists(expected_file):
            raise HTTPException(status_code=500, detail="Gagal mengunduh berkas media.")

        final_filename = f"{clean_title}.{target_ext}"
        media_type = "audio/mpeg" if target_ext == "mp3" else "video/mp4"

        FILE_CACHE[cache_key] = {
            "filepath": expected_file,
            "filename": final_filename,
            "media_type": media_type,
            "created_at": now
        }

        ascii_name = re.sub(r"[^a-zA-Z0-9_.\- ]", "_", final_filename)
        quoted_name = urllib.parse.quote(final_filename)

        return FileResponse(
            path=expected_file,
            filename=final_filename,
            media_type=media_type,
            headers={
                "Content-Disposition": f"attachment; filename=\"{ascii_name}\"; filename*=UTF-8''{quoted_name}",
                "Access-Control-Expose-Headers": "Content-Disposition, Content-Length"
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        err = safe_error_handler(e)
        raise HTTPException(status_code=err["status"], detail=err["detail"])

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
