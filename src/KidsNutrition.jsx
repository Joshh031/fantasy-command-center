import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { fbSetNutrition, fbListenNutrition, onAuthReady } from "./firebase.js";
import "./kids-nutrition.css";

// ─── Constants ───────────────────────────────────────────
const KIDS = [
  { id: "maddie", name: "Maddie", emoji: "🌸", color: "#e879a8" },
  { id: "max", name: "Max", emoji: "⚡", color: "#60a5fa" },
];

const CALORIE_TARGET = 1200;
const PROTEIN_TARGET = 50; // grams

const QUICK_FOODS = [
  { name: "Glass of Milk", cal: 150, protein: 8, icon: "🥛" },
  { name: "Apple", cal: 95, protein: 0, icon: "🍎" },
  { name: "Banana", cal: 105, protein: 1, icon: "🍌" },
  { name: "PB&J Sandwich", cal: 350, protein: 12, icon: "🥪" },
  { name: "Cheese Stick", cal: 80, protein: 7, icon: "🧀" },
  { name: "Yogurt", cal: 100, protein: 5, icon: "🫙" },
  { name: "Chicken Nuggets (6)", cal: 280, protein: 14, icon: "🍗" },
  { name: "Mac & Cheese", cal: 350, protein: 12, icon: "🧈" },
  { name: "Grilled Cheese", cal: 370, protein: 13, icon: "🥪" },
  { name: "Pizza Slice", cal: 270, protein: 12, icon: "🍕" },
  { name: "Scrambled Eggs (2)", cal: 180, protein: 12, icon: "🍳" },
  { name: "Goldfish Crackers", cal: 140, protein: 3, icon: "🐟" },
  { name: "Fruit Snacks", cal: 80, protein: 0, icon: "🍬" },
  { name: "Granola Bar", cal: 140, protein: 3, icon: "🍫" },
  { name: "Baby Carrots", cal: 35, protein: 1, icon: "🥕" },
  { name: "Chocolate Milk", cal: 190, protein: 8, icon: "🍫" },
];

const LS_KEY = "kids-nutrition-data";
const DEBOUNCE_MS = 400;

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ─── Main Component ──────────────────────────────────────
export default function KidsNutrition({ onBack }) {
  const [data, setData] = useState({});
  const [activeKid, setActiveKid] = useState("maddie");
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [showAdd, setShowAdd] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customCal, setCustomCal] = useState("");
  const [customProtein, setCustomProtein] = useState("");
  const [toast, setToast] = useState(null);
  const [syncStatus, setSyncStatus] = useState("…");
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }, []);

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setData(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, []);

  // Firebase listener
  useEffect(() => {
    onAuthReady(() => {
      setSyncStatus("ok");
      fbListenNutrition((val) => {
        setData(val);
        try { localStorage.setItem(LS_KEY, JSON.stringify(val)); } catch {}
      });
    });
  }, []);

  // Save helper
  const persist = useCallback((newData) => {
    setData(newData);
    try { localStorage.setItem(LS_KEY, JSON.stringify(newData)); } catch {}
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => fbSetNutrition(newData), DEBOUNCE_MS);
  }, []);

  // Get entries for active kid + date
  const entries = useMemo(() => {
    return data?.[activeKid]?.[selectedDate]?.entries || [];
  }, [data, activeKid, selectedDate]);

  const totals = useMemo(() => {
    return entries.reduce(
      (acc, e) => ({ cal: acc.cal + (e.cal || 0), protein: acc.protein + (e.protein || 0) }),
      { cal: 0, protein: 0 }
    );
  }, [entries]);

  const calPct = Math.min(100, Math.round((totals.cal / CALORIE_TARGET) * 100));
  const protPct = Math.min(100, Math.round((totals.protein / PROTEIN_TARGET) * 100));

  const addEntry = useCallback((name, cal, protein) => {
    const entry = { id: uid(), name, cal: Number(cal), protein: Number(protein), time: Date.now() };
    const newData = { ...data };
    if (!newData[activeKid]) newData[activeKid] = {};
    if (!newData[activeKid][selectedDate]) newData[activeKid][selectedDate] = { entries: [] };
    newData[activeKid][selectedDate] = {
      entries: [...(newData[activeKid][selectedDate].entries || []), entry],
    };
    persist(newData);
    showToast(`+${cal} cal logged for ${KIDS.find(k => k.id === activeKid).name}`);
  }, [data, activeKid, selectedDate, persist, showToast]);

  const removeEntry = useCallback((entryId) => {
    const newData = { ...data };
    const dayData = newData[activeKid]?.[selectedDate];
    if (!dayData) return;
    newData[activeKid][selectedDate] = {
      entries: dayData.entries.filter((e) => e.id !== entryId),
    };
    persist(newData);
  }, [data, activeKid, selectedDate, persist]);

  const handleCustomAdd = () => {
    if (!customName || !customCal) return;
    addEntry(customName, customCal, customProtein || 0);
    setCustomName("");
    setCustomCal("");
    setCustomProtein("");
    setShowAdd(false);
  };

  const navigateDate = (offset) => {
    const d = new Date(selectedDate + "T12:00:00");
    d.setDate(d.getDate() + offset);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const isToday = selectedDate === todayKey();
  const kid = KIDS.find((k) => k.id === activeKid);

  // Get recent foods for this kid (last 7 days, deduplicated)
  const recentFoods = useMemo(() => {
    const seen = new Set();
    const foods = [];
    const kidData = data?.[activeKid] || {};
    const dates = Object.keys(kidData).sort().reverse().slice(0, 7);
    for (const d of dates) {
      for (const e of kidData[d]?.entries || []) {
        const key = `${e.name}-${e.cal}-${e.protein}`;
        if (!seen.has(key) && !QUICK_FOODS.some(q => q.name === e.name)) {
          seen.add(key);
          foods.push({ name: e.name, cal: e.cal, protein: e.protein });
        }
      }
    }
    return foods.slice(0, 8);
  }, [data, activeKid]);

  return (
    <div className="kn-app">
      {/* Header */}
      <div className="kn-header">
        <div className="kn-title">
          <span className="kn-logo">🍎</span>
          <span>Kids Fuel</span>
        </div>
        <div className="kn-header-right">
          <span className={`kn-sync ${syncStatus === "ok" ? "ok" : ""}`}>
            {syncStatus === "ok" ? "✓ Synced" : "…"}
          </span>
          <button className="kn-fcc-btn" onClick={onBack} title="Fantasy Command Center">⚾</button>
        </div>
      </div>

      {/* Kid Tabs */}
      <div className="kn-kid-tabs">
        {KIDS.map((k) => (
          <button
            key={k.id}
            className={`kn-kid-tab ${activeKid === k.id ? "active" : ""}`}
            style={activeKid === k.id ? { borderColor: k.color, color: k.color } : {}}
            onClick={() => setActiveKid(k.id)}
          >
            <span className="kn-kid-emoji">{k.emoji}</span>
            {k.name}
          </button>
        ))}
      </div>

      {/* Date Navigator */}
      <div className="kn-date-nav">
        <button className="kn-date-btn" onClick={() => navigateDate(-1)}>‹</button>
        <span className="kn-date-label">
          {isToday ? "Today" : new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
        </span>
        <button className="kn-date-btn" onClick={() => navigateDate(1)} disabled={isToday}>›</button>
      </div>

      {/* Progress Rings */}
      <div className="kn-progress-section">
        <div className="kn-ring-container">
          <div className="kn-ring">
            <svg viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="#1e293b" strokeWidth="10" />
              <circle
                cx="60" cy="60" r="52" fill="none"
                stroke={calPct >= 100 ? "#22c55e" : kid.color}
                strokeWidth="10"
                strokeDasharray={`${calPct * 3.267} 326.7`}
                strokeLinecap="round"
                transform="rotate(-90 60 60)"
                style={{ transition: "stroke-dasharray 0.4s ease" }}
              />
            </svg>
            <div className="kn-ring-text">
              <div className="kn-ring-value">{totals.cal}</div>
              <div className="kn-ring-label">/ {CALORIE_TARGET} cal</div>
            </div>
          </div>
          <div className="kn-ring-title">Calories</div>
        </div>

        <div className="kn-ring-container">
          <div className="kn-ring">
            <svg viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="#1e293b" strokeWidth="10" />
              <circle
                cx="60" cy="60" r="52" fill="none"
                stroke={protPct >= 100 ? "#22c55e" : "#f59e0b"}
                strokeWidth="10"
                strokeDasharray={`${protPct * 3.267} 326.7`}
                strokeLinecap="round"
                transform="rotate(-90 60 60)"
                style={{ transition: "stroke-dasharray 0.4s ease" }}
              />
            </svg>
            <div className="kn-ring-text">
              <div className="kn-ring-value">{totals.protein}g</div>
              <div className="kn-ring-label">/ {PROTEIN_TARGET}g protein</div>
            </div>
          </div>
          <div className="kn-ring-title">Protein</div>
        </div>
      </div>

      {/* Quick Add - Milk Featured */}
      <div className="kn-section">
        <div className="kn-section-title">Quick Add</div>
        <button
          className="kn-milk-btn"
          style={{ borderColor: kid.color }}
          onClick={() => addEntry("Glass of Milk", 150, 8)}
        >
          <span className="kn-milk-icon">🥛</span>
          <span>Glass of Milk</span>
          <span className="kn-milk-meta">150 cal · 8g protein</span>
        </button>

        <div className="kn-quick-grid">
          {QUICK_FOODS.filter(f => f.name !== "Glass of Milk").map((food) => (
            <button
              key={food.name}
              className="kn-quick-btn"
              onClick={() => addEntry(food.name, food.cal, food.protein)}
            >
              <span className="kn-quick-icon">{food.icon}</span>
              <span className="kn-quick-name">{food.name}</span>
              <span className="kn-quick-cal">{food.cal} cal</span>
            </button>
          ))}
        </div>

        {/* Recent custom foods */}
        {recentFoods.length > 0 && (
          <>
            <div className="kn-section-title" style={{ marginTop: 16 }}>Recent</div>
            <div className="kn-quick-grid">
              {recentFoods.map((food, i) => (
                <button
                  key={i}
                  className="kn-quick-btn recent"
                  onClick={() => addEntry(food.name, food.cal, food.protein)}
                >
                  <span className="kn-quick-icon">🔄</span>
                  <span className="kn-quick-name">{food.name}</span>
                  <span className="kn-quick-cal">{food.cal} cal</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Custom Add */}
        <button className="kn-custom-toggle" onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? "Cancel" : "+ Add Custom Food"}
        </button>

        {showAdd && (
          <div className="kn-custom-form">
            <input
              className="kn-input"
              placeholder="Food name"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              autoFocus
            />
            <div className="kn-input-row">
              <input
                className="kn-input"
                type="number"
                placeholder="Calories"
                value={customCal}
                onChange={(e) => setCustomCal(e.target.value)}
              />
              <input
                className="kn-input"
                type="number"
                placeholder="Protein (g)"
                value={customProtein}
                onChange={(e) => setCustomProtein(e.target.value)}
              />
            </div>
            <button
              className="kn-add-btn"
              style={{ background: kid.color }}
              onClick={handleCustomAdd}
              disabled={!customName || !customCal}
            >
              Add to {kid.name}'s Log
            </button>
          </div>
        )}
      </div>

      {/* Today's Log */}
      <div className="kn-section">
        <div className="kn-section-title">
          {isToday ? "Today's" : new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })} Food Log
          <span className="kn-entry-count">{entries.length} items</span>
        </div>

        {entries.length === 0 ? (
          <div className="kn-empty">No food logged yet. Use quick add above!</div>
        ) : (
          <div className="kn-log">
            {[...entries].reverse().map((entry) => (
              <div key={entry.id} className="kn-log-item">
                <div className="kn-log-info">
                  <div className="kn-log-name">{entry.name}</div>
                  <div className="kn-log-meta">
                    {entry.cal} cal · {entry.protein}g protein · {formatTime(entry.time)}
                  </div>
                </div>
                <button className="kn-log-remove" onClick={() => removeEntry(entry.id)}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && <div className="kn-toast">{toast}</div>}
    </div>
  );
}
