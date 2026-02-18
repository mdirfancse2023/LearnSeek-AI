# 🎓 LearnSeek AI – YouTube Playlist Q&A (RAG)

LearnSeek AI is a **local, playlist-based Question Answering system** that allows you to load a YouTube playlist and ask natural language questions about its content — similar to ChatGPT, but grounded strictly in your videos.

Everything runs **locally** using open-source tools.

---

## ✨ Features

* 📥 Load **any YouTube playlist**
* 🎧 Download audio in **ordered & readable format**

  * `1_video_title.mp3`
  * `2_video_title.mp3`
* 📝 Transcribe audio to English
* 🧠 Build embeddings locally
* 💬 Ask questions about the playlist
* 👨‍🏫 Get **teacher-style answers**
* 🔄 Reset everything with one click
* 🔐 No cloud APIs — fully local

---

## 📁 Project Structure

```
youtube-rag/
├── backend/
│   ├── app.py
│   ├── rag.py
│   ├── requirements.txt
│   └── pipeline/
│       ├── download.py
│       ├── transcribe.py
│       └── embed.py
├── frontend/
│   └── (Angular chat UI)
└── data/
    ├── audios/
    │   ├── 1_video_title.mp3
    │   ├── 2_video_title.mp3
    │   └── ...
    ├── transcripts/
    │   ├── 1_video_title.json
    │   ├── 2_video_title.json
    │   └── ...
    ├── youtube_map.json
    └── chunks_with_embeddings.joblib
```

---

## 🧰 Tech Stack

### Backend

* Python
* FastAPI
* Whisper (speech → text)
* Ollama (`llama3.2`, `bge-m3`)
* yt-dlp
* ffmpeg
* NumPy, Pandas, scikit-learn

### Frontend

* Angular
* Simple chat UI

---

## 🔄 How It Works

1. **Load Playlist**

   * Reads playlist metadata
   * Downloads **first 10 seconds** of each video
   * Saves audio as `1_title.mp3`, `2_title.mp3`
   * Creates `youtube_map.json`

2. **Transcription**

   * Whisper converts audio to English text
   * Saves transcripts with the same numbering

3. **Embeddings**

   * Text chunks embedded using `bge-m3`
   * Stored in `chunks_with_embeddings.joblib`

4. **Question Answering**

   * User query → embedding
   * Relevant chunks retrieved
   * LLM answers like a real teacher

---

## 🧠 Question Behavior

### Conceptual Questions

Example:

> What is DSA?

➡️ Explains the concept clearly
❌ No video number
❌ No timestamps

---

### Location-Based Questions

Example:

> Where is Drop 0 recap discussed?

➡️ Answer includes:

* Video number
* Video title
* Start and end time

---

### Unrelated Questions

Example:

> What is photosynthesis?

➡️

> I can only help with questions related to this playlist.

---

## ⚙️ Setup Instructions

### 1️⃣ Install System Dependencies

#### macOS

```bash
brew install yt-dlp ffmpeg
```

Verify:

```bash
yt-dlp --version
ffmpeg -version
```

---

### 2️⃣ Install Ollama & Models

```bash
ollama pull llama3.2
ollama pull bge-m3
ollama serve
```

---

### 3️⃣ Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn app:app --reload
```

Backend runs at:

```
http://localhost:8000
```

---

### 4️⃣ Frontend Setup

```bash
cd frontend
npm install
npm start
```

Frontend runs at:

```
http://localhost:4200
```

---

## 🔘 API Endpoints

### Load Playlist

```http
POST /load-youtube
Body: { "url": "<playlist_url>" }
```

### Ask Question

```http
POST /ask
Body: { "query": "<your question>" }
```

### Reset Everything

```http
POST /reset
```

### Check Status

```http
GET /status
```

---

## 🔄 Reset Behavior

When **Reset** is clicked:

* All audios deleted
* All transcripts deleted
* Embeddings deleted
* Chat cleared
* Ask button disabled

User must load a playlist again.

---

## 📌 Why `youtube_map.json` Exists

* Stores original video titles
* Keeps correct playlist order
* Stores video URLs
* Enables future UI features (clickable timestamps)

This file is **auto-generated** during download.

---

## ⚡ Development Mode

* Only **first 10 seconds** of each video are downloaded
* Makes testing fast and lightweight
* Can be switched to full videos later

---

## 🚀 Future Improvements

* Clickable timestamps
* mm:ss time formatting
* Full video processing
* Multiple playlist support
* Conversation memory
* Progress bar per video

---

## 👨‍💻 Author

Built as a **learning-focused RAG system** to help students and developers navigate long playlists efficiently.

---

## 📜 License

For **educational and personal use**.
