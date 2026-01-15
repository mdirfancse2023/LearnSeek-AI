import { useState } from "react";
import { processPlaylist } from "./api";

export default function PlaylistSetup({ onReady }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const start = async () => {
    if (!url) return;
    setLoading(true);
    setMsg("Processing playlist… This may take some time ⏳");

    try {
      await processPlaylist(url);
      setMsg("Playlist processed successfully ✅");
      onReady();
    } catch {
      setMsg("Failed to process playlist ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="setup">
      <h1>🎥 AI YouTube Course Tutor</h1>

      <input
        placeholder="Paste YouTube playlist link…"
        value={url}
        onChange={e => setUrl(e.target.value)}
      />

      <button onClick={start} disabled={loading}>
        {loading ? "Processing…" : "Start Learning"}
      </button>

      {msg && <p className="status">{msg}</p>}
    </div>
  );
}
