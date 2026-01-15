import { useState } from "react";
import { loadYoutube, resetAll } from "./api";

export default function ToolBar({ onReady, onReset }) {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState("idle");

  const start = async () => {
    if (!url.trim()) return;

    setStatus("loading");
    try {
      await loadYoutube(url);
      setStatus("ready");
      onReady();
    } catch (e) {
      console.error(e);
      setStatus("error");
    }
  };

  const reset = async () => {
    await resetAll();
    setUrl("");
    setStatus("idle");
    onReset();
  };

  return (
    <div className="topbar">
      <div className="row">
        <input
          type="text"
          placeholder="Paste YouTube video or playlist URL"
          value={url}
          onChange={e => setUrl(e.target.value)}
          disabled={status === "loading"}
        />

        <button onClick={start} disabled={status === "loading"}>
          Load
        </button>

        <button className="reset" onClick={reset}>
          Reset
        </button>
      </div>

      {status === "loading" && <p className="status">⏳ Processing…</p>}
      {status === "ready" && <p className="status ok">✅ Ready to chat</p>}
      {status === "error" && <p className="status err">❌ Failed</p>}
    </div>
  );
}
