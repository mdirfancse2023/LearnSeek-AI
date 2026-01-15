import { useEffect, useState } from "react";
import ToolBar from "./ToolBar";
import Chat from "./Chat";
import { checkStatus } from "./api";
import "./styles.css";

export default function App() {
  const [ready, setReady] = useState(false);
  const [resetKey, setResetKey] = useState(0); // 🔥 forces Chat reset

  useEffect(() => {
    checkStatus().then(res => {
      if (res.ready) setReady(true);
    });
  }, []);

  const handleReset = () => {
    setReady(false);
    setResetKey(prev => prev + 1); // 🔥 remount Chat
  };

  return (
    <>
      <ToolBar
        onReady={() => setReady(true)}
        onReset={() => setReady(false)}
      />
      <Chat enabled={ready}
          resetKey={resetKey}
     />
    </>
  );
}
