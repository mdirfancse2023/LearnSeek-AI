import os
import shutil
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

from pipeline.download import download_audio
from pipeline.transcribe import transcribe_all
from pipeline.embed import build_embeddings
from rag import answer_question

app = FastAPI()

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
    download_audio(data.url)
    transcribe_all()
    build_embeddings()
    return {"status": "ready"}

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
    return {"ready": os.path.exists(JOBLIB_FILE)}
