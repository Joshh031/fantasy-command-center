import { useState } from "react";
import KidsNutrition from "./KidsNutrition.jsx";

const PIN = "1211";

function PinGate({ onSuccess }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handleKey = (n) => {
    if (pin.length >= 4) return;
    const next = pin + n;
    setPin(next);
    if (next.length === 4) {
      if (next === PIN) {
        sessionStorage.setItem("kf_auth", PIN);
        onSuccess();
      } else {
        setError("Incorrect PIN");
        setTimeout(() => { setPin(""); setError(""); }, 800);
      }
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) setPin(pin.slice(0, -1));
  };

  return (
    <div className="pin-overlay">
      <div className="pin-box">
        <div className="pin-logo">🍎</div>
        <div className="pin-title">Kids Fuel</div>
        <div className="pin-sub">Enter PIN to continue</div>
        <div className="pin-dots">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`pin-dot ${i < pin.length ? (error ? "error" : "filled") : ""}`} />
          ))}
        </div>
        <div className="pin-grid">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, "del"].map((k, i) => (
            k === null ? <div key={i} /> :
            k === "del" ? (
              <button key={i} className="pin-key del" onClick={handleDelete}>DEL</button>
            ) : (
              <button key={i} className="pin-key" onClick={() => handleKey(String(k))}>{k}</button>
            )
          ))}
        </div>
        <div className="pin-error">{error}</div>
      </div>
    </div>
  );
}

export default function App() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem("kf_auth") === PIN);

  if (!authed) return <PinGate onSuccess={() => setAuthed(true)} />;

  return <KidsNutrition />;
}
