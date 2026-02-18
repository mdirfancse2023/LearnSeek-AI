import os
import shutil
import threading
import time
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

from pipeline.download import download_audio
from pipeline.transcribe import transcribe_all
from pipeline.embed import build_embeddings
from rag import answer_question

app = FastAPI()

status_info = {"status": "idle", "message": "", "log": []}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = "data"
JOBLIB_FILE = os.path.join(DATA_DIR, "chunks_with_embeddings.joblib")

class Youtube(BaseModel):
    url: str

class Question(BaseModel):
    query: str

@app.post("/load-youtube")
def load_youtube(data: Youtube):
    global status_info

    def log_watcher(stop_event: threading.Event):
        last_index = 0
        last_message = None
        while not stop_event.is_set():
            try:
                logs = status_info.get("log", [])
                # print any new log lines
                if len(logs) > last_index:
                    for entry in logs[last_index:]:
                        print(f"[PIPELINE] {entry}")
                    last_index = len(logs)

                # print message changes
                msg = status_info.get("message")
                if msg and msg != last_message:
                    print(f"[PIPELINE STATUS] {msg}")
                    last_message = msg

            except Exception as e:
                print(f"[PIPELINE WATCHER ERROR] {e}")
            time.sleep(0.5)

    stop_event = threading.Event()
    watcher = threading.Thread(target=log_watcher, args=(stop_event,), daemon=True)
    # set initial status and start watcher
    status_info["status"] = "loading"
    status_info["message"] = "Downloading videos..."
    print("[PIPELINE] starting: Downloading videos...")
    watcher.start()

    try:
        download_audio(data.url, status_info)
        status_info["message"] = "Transcribing audio..."
        transcribe_all(status_info)
        status_info["message"] = "Building embeddings..."
        build_embeddings(status_info)
        status_info["status"] = "ready"
        status_info["message"] = "Ready to chat"
        print("[PIPELINE] finished: Ready to chat")
        return {"status": "ready"}
    except Exception as e:
        # ensure error is logged both in status_info and terminal
        err_msg = f"Pipeline error: {e}"
        print(f"[PIPELINE ERROR] {e}")
        status_info["status"] = "error"
        status_info["message"] = err_msg
        status_info.setdefault("log", []).append(err_msg)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        stop_event.set()

@app.post("/ask")
def ask(q: Question):
    if not os.path.exists(JOBLIB_FILE):
        raise HTTPException(400, "Please load a playlist first")
    return answer_question(q.query)

@app.post("/reset")
def reset():
    shutil.rmtree("data", ignore_errors=True)
    return {"status": "reset"}

@app.get("/status")
def status():
    return status_info
