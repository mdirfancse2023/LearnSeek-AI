import joblib
import numpy as np
import requests
import json
from typing import Generator
from sklearn.metrics.pairwise import cosine_similarity

JOBLIB_FILE = "data/chunks_with_embeddings.joblib"
OLLAMA_URL = "http://localhost:11434"

TOP_K = 20
SIM_THRESHOLD = 0.30

LOCATION_KEYWORDS = [
    "where", "which", "when", "timestamp",
    "time", "video", "covered", "discussed"
]

def is_location_question(query: str) -> bool:
    q = query.lower()
    return any(k in q for k in LOCATION_KEYWORDS)

def answer_question(query):
    df = joblib.load(JOBLIB_FILE)

    # ---- Embed query ----
    q_emb = requests.post(
        f"{OLLAMA_URL}/api/embed",
        json={"model": "bge-m3", "input": [query]}
    ).json()["embeddings"][0]

    sims = cosine_similarity(
        np.vstack(df["embedding"]),
        np.array(q_emb).reshape(1, -1)
    ).flatten()

    if sims.max() < SIM_THRESHOLD:
        return {
            "answer": "I can only help with questions related to this playlist."
        }

    top = df.iloc[sims.argsort()[-TOP_K:][::-1]]

    # ---- Decide question type ----
    location_question = is_location_question(query)

    # ---- PROMPT: LOCATION QUESTION ----
    if location_question:
        prompt = f"""
You are a friendly instructor guiding a student through a video playlist.

Below are relevant excerpts from the playlist.
Each excerpt includes video number, title, and time range.

Content:
{top[['tutorial_number','tutorial_title','start','end','text']].to_json(orient='records')}

Student question:
"{query}"

Instructions:
- Your answer MUST mention:
  • video number
  • video title
  • start time and end time
- Explain clearly what is taught in that part of the video.
- Use natural, human language.
- Do NOT mention internal data formats.
"""

    # ---- PROMPT: CONCEPTUAL QUESTION ----
    else:
        prompt = f"""
You are a knowledgeable teacher explaining a concept to a student.

Below is background material from a video playlist that discusses this topic.

Content:
{top[['text']].to_json(orient='records')}

Student question:
"{query}"

Instructions:
- Explain the concept clearly in simple terms.
- Focus on *what it is* and *why it matters*.
- Do NOT mention video numbers, titles, or timestamps.
- Do NOT mention transcripts or internal data.
"""

    res = requests.post(
        f"{OLLAMA_URL}/api/generate",
        json={
            "model": "llama3.2",
            "prompt": prompt,
            "stream": False
        }
    )

    return {"answer": res.json()["response"]}
