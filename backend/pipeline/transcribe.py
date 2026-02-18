import os
import json
import whisper

AUDIO_DIR = "data/audios"
TRANS_DIR = "data/transcripts"

model = whisper.load_model("large-v2")

def transcribe_all(status_info):
    os.makedirs(TRANS_DIR, exist_ok=True)

    audios = sorted(
        os.listdir(AUDIO_DIR),
        key=lambda x: int(x.split("_")[0])
    )

    status_info["message"] = f"Transcribing {len(audios)} videos..."
    status_info.setdefault("log", []).append(f"Transcription starting for {len(audios)} videos")

    for audio in audios:
        base = audio.replace(".mp3", "")
        video_no = int(base.split("_")[0])

        status_info["message"] = f"Transcribing video {video_no}..."
        status_info.setdefault("log", []).append(f"Transcribing video {video_no}")

        audio_path = os.path.join(AUDIO_DIR, audio)

        # Skip obviously empty or missing files and log the issue
        try:
            size = os.path.getsize(audio_path)
        except Exception:
            size = 0

        if size < 2000:
            status_info.setdefault("log", []).append(f"Skipping {base}: audio file missing or too small ({size} bytes)")
            print(f"Skipping {base}: audio file missing or too small ({size} bytes)")
            continue

        try:
            result = model.transcribe(
                audio=audio_path,
                language="en",
                task="translate"
            )
        except Exception as e:
            # Log the error and continue with remaining files
            status_info.setdefault("log", []).append(f"Transcription failed for {base}: {e}")
            print(f"Transcription failed for {base}: {e}")
            continue

        chunks = []
        for seg in result["segments"]:
            chunks.append({
                "tutorial_number": video_no,
                "start": round(seg["start"], 2),
                "end": round(seg["end"], 2),
                "text": seg["text"].strip()
            })

        with open(f"{TRANS_DIR}/{base}.json", "w") as f:
            json.dump({
                "tutorial_number": video_no,
                "chunks": chunks
            }, f, indent=2, ensure_ascii=False)

        status_info.setdefault("log", []).append(f"Transcribed {base}")
        print(f"📝 Transcribed {base}")
