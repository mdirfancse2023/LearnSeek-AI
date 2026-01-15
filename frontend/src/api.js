const API = "http://localhost:8000";

export async function loadYoutube(url) {
  console.log("Sending:", { url });

  const res = await fetch(`${API}/load-youtube`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url })   // single URL
  });

  if (!res.ok) throw new Error("Load failed");
  return res.json();
}

export async function askAI(query) {
  const res = await fetch(`${API}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query })
  });

  if (!res.ok) throw new Error("Ask failed");
  return res.json();
}

export async function resetAll() {
  await fetch(`${API}/reset`, { method: "POST" });
}

export async function checkStatus() {
  const res = await fetch("http://localhost:8000/status");
  return res.json();
}

