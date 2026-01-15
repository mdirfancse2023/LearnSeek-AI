import { useEffect, useState } from "react";
import { askAI } from "./api";

export default function Chat({ enabled, resetKey }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);

  // 🔥 RESET chat when resetKey changes
  useEffect(() => {
    setMessages([]);
    setInput("");
    setThinking(false);
  }, [resetKey]);

  const send = async () => {
    if (!enabled || !input.trim()) return;

    setMessages(m => [...m, { role: "user", text: input }]);
    setInput("");
    setThinking(true);

    const res = await askAI(input);

    setMessages(m => [...m, { role: "ai", text: res.answer }]);
    setThinking(false);
  };

  return (
    <div className={`chat ${!enabled ? "disabled" : ""}`}>
      <div className="messages">
        {!enabled && <p className="hint">Load a YouTube link to start</p>}

        {messages.map((m, i) => (
          <div key={i} className={m.role}>{m.text}</div>
        ))}

        {thinking && <div className="ai">🤖 Thinking…</div>}
      </div>

      <div className="input">
        <input
          disabled={!enabled}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Ask about the video…"
        />
        <button onClick={send} disabled={!enabled}>Ask</button>
      </div>
    </div>
  );
}
