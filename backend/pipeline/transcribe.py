import os
import json
import whisper

AUDIO_DIR = "data/audios"
TRANS_DIR = "data/transcripts"

model = whisper.load_model("large-v2")

def transcribe_all():
    os.makedirs(TRANS_DIR, exist_ok=True)

    audios = sorted(
        os.listdir(AUDIO_DIR),
        key=lambda x: int(x.split("_")[0])
    )

    for audio in audios:
        base = audio.replace(".mp3", "")
        video_no = int(base.split("_")[0])

        result = model.transcribe(
            audio=os.path.join(AUDIO_DIR, audio),
            language="en",
            task="translate"
        )

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

        print(f"📝 Transcribed {base}")
