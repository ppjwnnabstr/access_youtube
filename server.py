from pathlib import Path
import os
import re
import uuid

from flask import Flask, jsonify, request, send_from_directory
from yt_dlp import YoutubeDL

ROOT = Path(__file__).parent
WEB_DIR = ROOT / "access_youtube"
DOWNLOAD_DIR = WEB_DIR / "downloads"
DOWNLOAD_DIR.mkdir(exist_ok=True)

app = Flask(__name__)
YOUTUBE_HOSTS = {"youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"}


def is_youtube_url(value: str) -> bool:
    match = re.match(r"^https?://([^/]+)(/|$)", value, re.IGNORECASE)
    return bool(match and match.group(1).lower() in YOUTUBE_HOSTS)


@app.get("/")
def index():
    return send_from_directory(WEB_DIR, "index.html")


@app.get("/downloads/<path:filename>")
def downloads(filename):
    return send_from_directory(DOWNLOAD_DIR, filename, as_attachment=False)


@app.post("/api/youtube-to-mp4")
def youtube_to_mp4():
    data = request.get_json(silent=True) or {}
    url = str(data.get("url", "")).strip()
    if not is_youtube_url(url):
        return jsonify(error="กรุณาระบุลิงก์ YouTube ที่ถูกต้อง"), 400

    job_id = uuid.uuid4().hex
    output_template = str(DOWNLOAD_DIR / f"{job_id}.%(ext)s")
    options = {
        "format": "bestvideo+bestaudio/best",
        "merge_output_format": "mp4",
        "outtmpl": output_template,
        "noplaylist": True,
        "quiet": True,
    }
    try:
        with YoutubeDL(options) as downloader:
            info = downloader.extract_info(url, download=True)
        filename = f"{job_id}.mp4"
        if not (DOWNLOAD_DIR / filename).exists():
            filename = f"{job_id}.{info.get('ext', 'mp4')}"
        return jsonify(mp4Url=f"/downloads/{filename}")
    except Exception:
        return jsonify(error="แปลงวิดีโอไม่สำเร็จ ตรวจสอบลิงก์และ FFmpeg"), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "5000")), debug=True)
