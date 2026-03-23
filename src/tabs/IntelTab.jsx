import { useContext, useState, useMemo } from "react";
import { AppContext } from "../App.jsx";
import { Search, Plus, Trash, TrendUp, TrendDown, Alert } from "../icons.jsx";

const COLORS = {
  primary: "#3b82f6",
  green: "#00ff88",
  warning: "#ff6b35",
  danger: "#ff4a4a",
  amber: "#ffaa00",
  purple: "#9966ff",
  bgDark: "#0a0a0f",
  surface: "#0f1017",
  text: "#e0e6ed",
  muted: "#556677",
};

const mono = "'JetBrains Mono', monospace";

const TYPE_COLORS = {
  riser: "#00ff88",
  faller: "#ff4a4a",
  news: "#3b82f6",
  pickup: "#ffaa00",
  injury: "#ff6b35",
  analysis: "#9966ff",
};

function SentimentBadge({ value }) {
  if (!value) return null;
  const v = value.toLowerCase();
  let symbol, color;
  if (v === "positive" || v === "bullish" || v.includes("up")) {
    symbol = "\u25B2"; color = COLORS.green;
  } else if (v === "negative" || v === "bearish" || v.includes("down")) {
    symbol = "\u25BC"; color = COLORS.danger;
  } else {
    symbol = "\u25CF"; color = COLORS.amber;
  }
  return (
    <span style={{
      color,
      fontWeight: 700,
      fontSize: 14,
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
    }}>
      {symbol} {value}
    </span>
  );
}

function RoleSecurityGauge({ value }) {
  if (!value) return null;
  const v = value.toLowerCase();
  let color, label;
  if (v === "green" || v === "locked" || v === "locked in") {
    color = COLORS.green; label = "LOCKED IN";
  } else if (v === "yellow" || v === "monitor") {
    color = COLORS.amber; label = "MONITOR";
  } else {
    color = COLORS.danger; label = "AT RISK";
  }
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span style={{
        width: 10,
        height: 10,
        borderRadius: "50%",
        background: color,
        display: "inline-block",
        boxShadow: `0 0 6px ${color}88`,
      }} />
      <span style={{ color, fontWeight: 700, fontSize: 12, fontFamily: mono }}>{label}</span>
    </span>
  );
}

export default function IntelTab() {
  const {
    keepers, roster, news, setNews, notes, setNotes,
    intelCache, setIntelCache, showToast,
  } = useContext(AppContext);

  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState("");

  const [intelForm, setIntelForm] = useState({
    player: "", type: "news", source: "", notes: "",
  });

  const keeperMap = useMemo(() => {
    const m = {};
    keepers.forEach(k => { m[k.name.toLowerCase()] = k; });
    return m;
  }, [keepers]);

  const rosterMap = useMemo(() => {
    const m = {};
    roster.forEach(p => { m[p.name.toLowerCase()] = p; });
    return m;
  }, [roster]);

  const doSearch = async () => {
    if (!searchQuery.trim()) { showToast("Enter a player name"); return; }
    setSearching(true);
    setSearchError("");
    setSearchResult(null);
    try {
      const res = await fetch("/api/intel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerName: searchQuery.trim() }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // Cross-reference with local data to correct hallucinations
      const localKey = searchQuery.trim().toLowerCase();
      const localPlayer = keeperMap[localKey] || rosterMap[localKey];
      if (localPlayer) {
        if (localPlayer.pos) data.pos = localPlayer.pos;
        if (localPlayer.age) data.age = localPlayer.age;
        if (localPlayer.team) data.team = localPlayer.team;
        if (localPlayer.proj) data.proj_points = localPlayer.proj;
      }

      setSearchResult(data);

      // Save verdict to intelCache
      if (data.verdict) {
        setIntelCache(prev => ({
          ...prev,
          [searchQuery.trim().toLowerCase()]: {
            verdict: data.verdict,
            date: new Date().toISOString(),
          },
        }));
      }

      showToast(`Intel loaded for ${searchQuery.trim()}`);
    } catch (err) {
      setSearchError(err.message || "Failed to fetch intel");
    } finally {
      setSearching(false);
    }
  };

  const addIntel = () => {
    if (!intelForm.player.trim() || !intelForm.notes.trim()) {
      showToast("Enter player and notes");
      return;
    }
    const entry = {
      id: Date.now(),
      player: intelForm.player.trim(),
      type: intelForm.type,
      source: intelForm.source.trim(),
      notes: intelForm.notes.trim(),
      date: new Date().toISOString(),
    };
    setNews(prev => [entry, ...prev]);
    setIntelForm({ player: "", type: "news", source: "", notes: "" });
    showToast("Intel saved");
  };

  const removeIntel = (id) => {
    setNews(prev => prev.filter(n => n.id !== id));
    showToast("Intel removed");
  };

  const verdictColor = (v) => {
    if (!v) return COLORS.muted;
    const vl = v.toUpperCase();
    if (vl === "RISER") return COLORS.green;
    if (vl === "FALLER") return COLORS.danger;
    return COLORS.amber;
  };

  const sectionStyle = {
    background: COLORS.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    border: `1px solid ${COLORS.muted}33`,
  };

  const headerStyle = {
    fontSize: 18,
    fontWeight: 700,
    color: COLORS.text,
    marginBottom: 16,
    display: "flex",
    alignItems: "center",
    gap: 8,
  };

  const inputStyle = {
    background: COLORS.bgDark,
    border: `1px solid ${COLORS.muted}44`,
    borderRadius: 6,
    padding: "8px 12px",
    color: COLORS.text,
    fontSize: 13,
    fontFamily: mono,
    width: "100%",
    boxSizing: "border-box",
  };

  const labelStyle = {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: 600,
    marginBottom: 4,
    display: "block",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  };

  return (
    <div>
      <h2 style={{ color: COLORS.text, fontSize: 22, fontWeight: 700, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
        <Search /> Intel Feed
      </h2>

      {/* AI Search */}
      <div style={sectionStyle}>
        <div style={headerStyle}>AI Player Search</div>
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <input
            placeholder="Search player name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") doSearch(); }}
            style={{ ...inputStyle, flex: 1 }}
          />
          <button
            onClick={doSearch}
            disabled={searching}
            style={{
              background: COLORS.primary,
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "8px 20px",
              fontSize: 13,
              fontWeight: 700,
              cursor: searching ? "wait" : "pointer",
              opacity: searching ? 0.6 : 1,
              whiteSpace: "nowrap",
            }}
          >
            {searching ? "Searching..." : "Search Intel"}
          </button>
        </div>

        {searchError && (
          <div style={{
            padding: "10px 14px",
            background: `${COLORS.danger}15`,
            borderRadius: 8,
            border: `1px solid ${COLORS.danger}44`,
            color: COLORS.danger,
            fontSize: 13,
            marginBottom: 16,
          }}>
            {searchError}
          </div>
        )}

        {searchResult && (
          <div style={{
            background: COLORS.bgDark,
            borderRadius: 10,
            padding: 20,
            border: `1px solid ${verdictColor(searchResult.verdict)}44`,
          }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <div style={{ color: COLORS.text, fontSize: 20, fontWeight: 800 }}>
                  {searchResult.player || searchQuery}
                </div>
                <div style={{ color: COLORS.muted, fontSize: 12, marginTop: 2 }}>
                  {searchResult.pos || "—"} | {searchResult.team || "—"} | Age: {searchResult.age || "—"}
                </div>
              </div>
              <div style={{
                background: `${verdictColor(searchResult.verdict)}22`,
                color: verdictColor(searchResult.verdict),
                padding: "4px 14px",
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 800,
                letterSpacing: 1,
              }}>
                {searchResult.verdict || "—"}
              </div>
            </div>

            {/* Metrics Row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 16 }}>
              <div style={{ background: `${COLORS.surface}`, borderRadius: 8, padding: 12 }}>
                <div style={{ color: COLORS.muted, fontSize: 10, textTransform: "uppercase", marginBottom: 4 }}>3-Day Sentiment</div>
                <SentimentBadge value={searchResult.sentiment_3day} />
              </div>
              <div style={{ background: `${COLORS.surface}`, borderRadius: 8, padding: 12 }}>
                <div style={{ color: COLORS.muted, fontSize: 10, textTransform: "uppercase", marginBottom: 4 }}>Week Sentiment</div>
                <SentimentBadge value={searchResult.sentiment_week} />
              </div>
              <div style={{ background: `${COLORS.surface}`, borderRadius: 8, padding: 12 }}>
                <div style={{ color: COLORS.muted, fontSize: 10, textTransform: "uppercase", marginBottom: 4 }}>Role Security</div>
                <RoleSecurityGauge value={searchResult.role_security} />
              </div>
              <div style={{ background: `${COLORS.surface}`, borderRadius: 8, padding: 12 }}>
                <div style={{ color: COLORS.muted, fontSize: 10, textTransform: "uppercase", marginBottom: 4 }}>Proj Points</div>
                <span style={{ color: COLORS.green, fontFamily: mono, fontWeight: 700, fontSize: 16 }}>
                  {searchResult.proj_points ? searchResult.proj_points.toFixed ? searchResult.proj_points.toFixed(1) : searchResult.proj_points : "—"}
                </span>
              </div>
            </div>

            {/* Key Risk / Upside */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div style={{
                background: `${COLORS.danger}10`,
                borderRadius: 8,
                padding: 12,
                border: `1px solid ${COLORS.danger}22`,
              }}>
                <div style={{ color: COLORS.danger, fontSize: 11, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>
                  Key Risk
                </div>
                <div style={{ color: COLORS.text, fontSize: 13 }}>
                  {searchResult.key_risk || "None identified"}
                </div>
              </div>
              <div style={{
                background: `${COLORS.green}10`,
                borderRadius: 8,
                padding: 12,
                border: `1px solid ${COLORS.green}22`,
              }}>
                <div style={{ color: COLORS.green, fontSize: 11, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>
                  Key Upside
                </div>
                <div style={{ color: COLORS.text, fontSize: 13 }}>
                  {searchResult.key_upside || "None identified"}
                </div>
              </div>
            </div>

            {/* Strategic Analysis */}
            {searchResult.strategic_analysis && (
              <div style={{
                background: `${COLORS.purple}10`,
                borderRadius: 8,
                padding: 14,
                border: `1px solid ${COLORS.purple}22`,
              }}>
                <div style={{ color: COLORS.purple, fontSize: 11, fontWeight: 700, marginBottom: 6, textTransform: "uppercase" }}>
                  Strategic Analysis
                </div>
                <div style={{ color: COLORS.text, fontSize: 13, lineHeight: 1.5 }}>
                  {searchResult.strategic_analysis}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Manual Intel Entry */}
      <div style={sectionStyle}>
        <div style={headerStyle}><Plus /> Add Intel Entry</div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
          <div>
            <label style={labelStyle}>Player</label>
            <input
              placeholder="Player name"
              value={intelForm.player}
              onChange={e => setIntelForm(f => ({ ...f, player: e.target.value }))}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Type</label>
            <select
              value={intelForm.type}
              onChange={e => setIntelForm(f => ({ ...f, type: e.target.value }))}
              style={inputStyle}
            >
              {Object.keys(TYPE_COLORS).map(t => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Source</label>
            <input
              placeholder="Source"
              value={intelForm.source}
              onChange={e => setIntelForm(f => ({ ...f, source: e.target.value }))}
              style={inputStyle}
            />
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Notes</label>
          <textarea
            placeholder="Enter intel notes..."
            value={intelForm.notes}
            onChange={e => setIntelForm(f => ({ ...f, notes: e.target.value }))}
            rows={3}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>
        <button
          onClick={addIntel}
          style={{
            background: COLORS.primary,
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "8px 20px",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Save Intel
        </button>
      </div>

      {/* Intel Feed */}
      <div style={sectionStyle}>
        <div style={headerStyle}>
          Saved Intel ({news.length})
        </div>

        {news.length === 0 && (
          <div style={{ color: COLORS.muted, textAlign: "center", padding: 20, fontSize: 14 }}>
            No intel entries yet. Search a player or add manually above.
          </div>
        )}

        <div style={{ display: "grid", gap: 10 }}>
          {news.map(entry => {
            const typeColor = TYPE_COLORS[entry.type] || COLORS.muted;
            return (
              <div key={entry.id} style={{
                background: COLORS.bgDark,
                borderRadius: 8,
                padding: 14,
                borderLeft: `3px solid ${typeColor}`,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{
                      background: `${typeColor}22`,
                      color: typeColor,
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: "uppercase",
                    }}>
                      {entry.type}
                    </span>
                    <span style={{ color: COLORS.text, fontWeight: 700, fontSize: 14 }}>
                      {entry.player}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: COLORS.muted, fontSize: 11, fontFamily: mono }}>
                      {entry.date ? new Date(entry.date).toLocaleDateString() : ""}
                    </span>
                    <button
                      onClick={() => removeIntel(entry.id)}
                      style={{
                        background: `${COLORS.danger}22`,
                        color: COLORS.danger,
                        border: "none",
                        borderRadius: 4,
                        padding: "2px 6px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <Trash />
                    </button>
                  </div>
                </div>
                {entry.source && (
                  <div style={{ color: COLORS.muted, fontSize: 11, marginBottom: 4 }}>
                    Source: {entry.source}
                  </div>
                )}
                <div style={{ color: COLORS.text, fontSize: 13, lineHeight: 1.4 }}>
                  {entry.notes}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scratch Pad */}
      <div style={sectionStyle}>
        <div style={headerStyle}>Scratch Pad</div>
        <textarea
          placeholder="Quick notes, thoughts, trade ideas..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={6}
          style={{
            ...inputStyle,
            resize: "vertical",
            lineHeight: 1.5,
          }}
        />
      </div>
    </div>
  );
}
