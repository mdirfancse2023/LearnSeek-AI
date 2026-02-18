import os
import json
import joblib
import pandas as pd
import requests

TRANS_DIR = "data/transcripts"
MAP_FILE = "data/youtube_map.json"
OUT_FILE = "data/chunks_with_embeddings.joblib"
OLLAMA_URL = "http://localhost:11434"

def embed(texts):
    r = requests.post(
        f"{OLLAMA_URL}/api/embed",
        json={"model": "bge-m3", "input": texts}
    )
    r.raise_for_status()
    return r.json()["embeddings"]

def build_embeddings(status_info):
    status_info["message"] = "Building embeddings..."

    with open(MAP_FILE) as f:
        video_map = json.load(f)

    records = []
    chunk_id = 0

    files = sorted(
        os.listdir(TRANS_DIR),
        key=lambda x: int(x.split("_")[0])
    )

    for idx, file in enumerate(files, start=1):
        video_no = file.split("_")[0]
        meta = video_map[video_no]

        status_info["message"] = f"Embedding video {idx} of {len(files)}: {meta.get('title','')[:30]}..."
        status_info.setdefault("log", []).append(f"Embedding video {idx}: {meta.get('title')}")

        with open(os.path.join(TRANS_DIR, file)) as f:
            data = json.load(f)

        texts = [c["text"] for c in data["chunks"]]
        embeddings = embed(texts)

        for i, chunk in enumerate(data["chunks"]):
            records.append({
                "chunk_id": chunk_id,
                "tutorial_number": int(video_no),
                "tutorial_title": meta["title"],
                "start": chunk["start"],
                "end": chunk["end"],
                "text": chunk["text"],
                "embedding": embeddings[i]
            })
            chunk_id += 1

    joblib.dump(pd.DataFrame(records), OUT_FILE)
    status_info.setdefault("log", []).append("✅ Embeddings built and saved")
    print("✅ Embeddings built")
