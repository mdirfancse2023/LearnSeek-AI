import os
import json
import subprocess
import re

AUDIO_DIR = "data/audios"
MAP_FILE = "data/youtube_map.json"

def safe_title(title: str) -> str:
    title = title.lower().strip()
    title = re.sub(r"[^a-z0-9 ]", "", title)
    title = re.sub(r"\s+", "_", title)
    return title[:50]

def download_audio(playlist_url: str, status_info: dict):
    os.makedirs(AUDIO_DIR, exist_ok=True)

    # Fetch playlist metadata (ordered)
    result = subprocess.run(
        ["yt-dlp", "--flat-playlist", "-J", playlist_url],
        capture_output=True,
        text=True,
        check=True
    )

    playlist = json.loads(result.stdout)
    entries = playlist.get("entries", [])

    status_info["message"] = f"Playlist has {len(entries)} videos"
    status_info.setdefault("log", []).append(f"Playlist found: {len(entries)} videos")

    youtube_map = {}

    for idx, video in enumerate(entries, start=1):
        title = video.get("title", f"video_{idx}")
        clean = safe_title(title)
        base = f"{idx}_{clean}"

        url = f"https://www.youtube.com/watch?v={video['id']}"
        out = os.path.join(AUDIO_DIR, f"{base}.mp3")

        status_info["message"] = f"Fetching video {idx} of {len(entries)}: {title[:30]}..."
        status_info.setdefault("log", []).append(f"Fetching video {idx}: {title}")

        # 🔥 DOWNLOAD ONLY FIRST 10 SECONDS
        try:
            subprocess.run(
                [
                    "yt-dlp",
                    "-x",
                    "--audio-format", "mp3",
                    "--download-sections", "*0-10",
                    "--force-keyframes-at-cuts",
                    "--extractor-args", "youtube:player_client=android",
                    "-o", out,
                    url
                ],
                check=True
            )
            status_info.setdefault("log", []).append(f"Saved audio: {base}.mp3")
        except Exception as e:
            status_info.setdefault("log", []).append(f"Failed to download {base}: {e}")
            raise

        youtube_map[str(idx)] = {
            "title": title,
            "filename": base,
            "url": url
        }

        print(f"⬇️ Downloaded first 10s: {base}.mp3")

    with open(MAP_FILE, "w") as f:
        json.dump(youtube_map, f, indent=2)

    status_info.setdefault("log", []).append("✅ Audio downloaded (10s each) and youtube_map.json created")
    print("✅ Audio downloaded (10s each) and youtube_map.json created")
