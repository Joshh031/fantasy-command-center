import { useContext, useState, useMemo } from "react";
import { AppContext } from "../App.jsx";
import { Swap, Plus, Trash, Alert, Search } from "../icons.jsx";
import battersData from "../data/batters.json";
import pitchersData from "../data/pitchers.json";

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

const allCBSPlayers = [...battersData, ...pitchersData].sort(
  (a, b) => (b.leagueFpts || 0) - (a.leagueFpts || 0)
);

function getVerdict(diff) {
  if (diff > 30) return { label: "SMASH ACCEPT", color: COLORS.green, emoji: "\u{1F525}" };
  if (diff > 10) return { label: "LEAN ACCEPT", color: "#88cc44", emoji: "\u{1F44D}" };
  if (diff >= -10) return { label: "FAIR DEAL", color: COLORS.amber, emoji: "\u{1F91D}" };
  if (diff >= -30) return { label: "LEAN DECLINE", color: COLORS.warning, emoji: "\u{1F914}" };
  return { label: "HARD DECLINE", color: COLORS.danger, emoji: "\u274C" };
}

export default function TradeTab() {
  const {
    roster, keepers, tradeMyPlayers, setTradeMyPlayers,
    tradeTheirPlayers, setTradeTheirPlayers, showToast,
  } = useContext(AppContext);

  const [theirSearch, setTheirSearch] = useState("");

  const allMyPlayers = useMemo(() => {
    const map = new Map();
    keepers.forEach(p => map.set(p.name, p));
    roster.forEach(p => { if (!map.has(p.name)) map.set(p.name, p); });
    return Array.from(map.values());
  }, [keepers, roster]);

  const keeperMap = useMemo(() => {
    const m = {};
    keepers.forEach(k => { m[k.name] = k; });
    return m;
  }, [keepers]);

  // Search CBS pool for "I Receive" side
  const theirSearchResults = useMemo(() => {
    if (!theirSearch.trim() || theirSearch.length < 2) return [];
    const q = theirSearch.toLowerCase();
    return allCBSPlayers
      .filter(p => p.name.toLowerCase().includes(q) && !tradeTheirPlayers.find(tp => tp.name === p.name))
      .slice(0, 8);
  }, [theirSearch, tradeTheirPlayers]);

  const availableToGive = allMyPlayers.filter(p => !tradeMyPlayers.find(tp => tp.name === p.name));

  const addMyPlayer = (name) => {
    const player = allMyPlayers.find(p => p.name === name);
    if (player) setTradeMyPlayers(prev => [...prev, player]);
  };

  const addTheirPlayer = (player) => {
    setTradeTheirPlayers(prev => [...prev, {
      name: player.name,
      pos: player.pos,
      team: player.team,
      proj: player.leagueFpts || player.cbsFpts || 0,
    }]);
    setTheirSearch("");
  };

  const myTotal = tradeMyPlayers.reduce((s, p) => s + (p.proj || 0), 0);
  const theirTotal = tradeTheirPlayers.reduce((s, p) => s + (p.proj || 0), 0);
  const diff = theirTotal - myTotal;
  const hasPlayers = tradeMyPlayers.length > 0 && tradeTheirPlayers.length > 0;
  const verdict = hasPlayers ? getVerdict(diff) : null;
  const keeperRisk = tradeMyPlayers.some(p => keeperMap[p.name]);

  const clearAll = () => {
    setTradeMyPlayers([]);
    setTradeTheirPlayers([]);
    showToast("Trade cleared");
  };

  const sectionStyle = {
    background: COLORS.surface,
    borderRadius: 12,
    padding: 20,
    border: `1px solid ${COLORS.muted}33`,
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
    outline: "none",
  };

  const playerRow = (player, onRemove, sideColor) => (
    <div key={player.name} style={{
      display: "flex",
      alignItems: "center",
      padding: "8px 10px",
      borderBottom: `1px solid ${COLORS.muted}22`,
      gap: 8,
    }}>
      <span style={{
        background: `${COLORS.purple}22`, color: COLORS.purple,
        padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 700, fontFamily: mono,
      }}>{player.pos}</span>
      <span style={{ flex: 1, color: COLORS.text, fontWeight: 600, fontSize: 13 }}>{player.name}</span>
      <span style={{ color: COLORS.muted, fontSize: 11, fontFamily: mono }}>{player.team || "—"}</span>
      {keeperMap[player.name] && (
        <span style={{
          background: `${COLORS.warning}22`, color: COLORS.warning,
          padding: "1px 6px", borderRadius: 4, fontSize: 9, fontWeight: 700,
        }}>KEEPER</span>
      )}
      <span style={{
        color: sideColor, fontFamily: mono, fontSize: 13, fontWeight: 700, minWidth: 50, textAlign: "right",
      }}>{player.proj ? player.proj.toFixed(1) : "—"}</span>
      <button onClick={() => onRemove(player.name)} style={{
        background: `${COLORS.danger}22`, color: COLORS.danger,
        border: "none", borderRadius: 4, padding: "3px 6px", cursor: "pointer",
        display: "flex", alignItems: "center",
      }}><Trash /></button>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ color: COLORS.text, fontSize: 22, fontWeight: 700, display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
          <Swap /> Trade Evaluator
        </h2>
        <button onClick={clearAll} style={{
          background: `${COLORS.muted}22`, color: COLORS.muted,
          border: `1px solid ${COLORS.muted}44`, borderRadius: 6,
          padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer",
        }}>Clear All</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* I GIVE */}
        <div style={{ ...sectionStyle, borderColor: `${COLORS.danger}44` }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.danger, marginBottom: 16, textTransform: "uppercase", letterSpacing: 1 }}>
            I Give
          </div>
          <select
            onChange={e => { if (e.target.value) addMyPlayer(e.target.value); e.target.value = ""; }}
            style={{ ...inputStyle, marginBottom: 12 }}
          >
            <option value="">— Add player from roster —</option>
            {availableToGive.map(p => (
              <option key={p.name} value={p.name}>
                {p.name} ({p.pos}) — {p.proj ? p.proj.toFixed(1) : "?"} pts
              </option>
            ))}
          </select>

          {tradeMyPlayers.length === 0 && (
            <div style={{ color: COLORS.muted, textAlign: "center", padding: 16, fontSize: 13 }}>
              Select players to trade away
            </div>
          )}
          {tradeMyPlayers.map(p => playerRow(p, (name) => setTradeMyPlayers(prev => prev.filter(x => x.name !== name)), COLORS.danger))}

          {tradeMyPlayers.length > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", marginTop: 8, borderTop: `2px solid ${COLORS.danger}33` }}>
              <span style={{ color: COLORS.danger, fontWeight: 700, fontSize: 13 }}>TOTAL GIVING</span>
              <span style={{ color: COLORS.danger, fontFamily: mono, fontSize: 16, fontWeight: 800 }}>{myTotal.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* I RECEIVE — searchable CBS pool */}
        <div style={{ ...sectionStyle, borderColor: `${COLORS.green}44` }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.green, marginBottom: 16, textTransform: "uppercase", letterSpacing: 1 }}>
            I Receive
          </div>

          <div style={{ position: "relative", marginBottom: 12 }}>
            <input
              placeholder="Search any player (e.g. Kyle Tucker)..."
              value={theirSearch}
              onChange={e => setTheirSearch(e.target.value)}
              style={inputStyle}
            />
            {theirSearchResults.length > 0 && (
              <div style={{
                position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10,
                background: COLORS.bgDark, border: `1px solid ${COLORS.muted}44`,
                borderRadius: 8, marginTop: 4, maxHeight: 240, overflowY: "auto",
                boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
              }}>
                {theirSearchResults.map(p => (
                  <button
                    key={`${p.name}-${p.pos}`}
                    onClick={() => addTheirPlayer(p)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8, width: "100%",
                      background: "transparent", border: "none", padding: "8px 12px",
                      cursor: "pointer", color: COLORS.text, textAlign: "left",
                      borderBottom: `1px solid ${COLORS.muted}15`,
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = `${COLORS.primary}15`}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <span style={{ color: COLORS.primary, fontSize: 10, fontWeight: 700, background: `${COLORS.primary}22`, padding: "1px 6px", borderRadius: 4 }}>{p.pos}</span>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{p.name}</span>
                    <span style={{ color: COLORS.muted, fontSize: 10 }}>{p.team}</span>
                    <span style={{ color: COLORS.primary, fontFamily: mono, fontSize: 12, fontWeight: 700 }}>{(p.leagueFpts || 0).toFixed(1)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {tradeTheirPlayers.length === 0 && (
            <div style={{ color: COLORS.muted, textAlign: "center", padding: 16, fontSize: 13 }}>
              Search players above to add to the trade
            </div>
          )}
          {tradeTheirPlayers.map(p => playerRow(p, (name) => setTradeTheirPlayers(prev => prev.filter(x => x.name !== name)), COLORS.green))}

          {tradeTheirPlayers.length > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", marginTop: 8, borderTop: `2px solid ${COLORS.green}33` }}>
              <span style={{ color: COLORS.green, fontWeight: 700, fontSize: 13 }}>TOTAL RECEIVING</span>
              <span style={{ color: COLORS.green, fontFamily: mono, fontSize: 16, fontWeight: 800 }}>{theirTotal.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Verdict */}
      {hasPlayers && verdict && (
        <div style={{
          ...sectionStyle, textAlign: "center",
          background: `${verdict.color}10`, border: `1px solid ${verdict.color}44`, marginBottom: 20,
        }}>
          <div style={{ fontSize: 14, color: COLORS.muted, marginBottom: 6 }}>TRADE VERDICT</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: verdict.color, marginBottom: 8 }}>
            {verdict.emoji} {verdict.label}
          </div>
          <div style={{
            color: diff > 0 ? COLORS.green : diff < 0 ? COLORS.danger : COLORS.text,
            fontFamily: mono, fontSize: 20, fontWeight: 700, marginBottom: 8,
          }}>
            Net: {diff > 0 ? "+" : ""}{diff.toFixed(1)} projected points
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 40 }}>
            <div>
              <div style={{ color: COLORS.muted, fontSize: 11, textTransform: "uppercase" }}>Giving</div>
              <div style={{ color: COLORS.danger, fontFamily: mono, fontWeight: 700 }}>{myTotal.toFixed(1)}</div>
            </div>
            <div>
              <div style={{ color: COLORS.muted, fontSize: 11, textTransform: "uppercase" }}>Receiving</div>
              <div style={{ color: COLORS.green, fontFamily: mono, fontWeight: 700 }}>{theirTotal.toFixed(1)}</div>
            </div>
          </div>

          {keeperRisk && (
            <div style={{
              marginTop: 16, padding: "8px 14px",
              background: `${COLORS.warning}15`, borderRadius: 8, border: `1px solid ${COLORS.warning}44`,
              display: "inline-flex", alignItems: "center", gap: 8,
            }}>
              <Alert />
              <span style={{ color: COLORS.warning, fontWeight: 700, fontSize: 13 }}>
                KEEPER RISK: You are trading away a keeper-eligible player!
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
