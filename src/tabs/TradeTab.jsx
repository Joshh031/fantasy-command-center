import { useContext, useState, useMemo } from "react";
import { AppContext } from "../App.jsx";
import { Swap, Plus, Trash, Alert } from "../icons.jsx";

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

  const [theirForm, setTheirForm] = useState({ name: "", pos: "SP", team: "", proj: "" });

  const allPlayers = useMemo(() => {
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

  const availableToGive = allPlayers.filter(p => !tradeMyPlayers.find(tp => tp.name === p.name));

  const addMyPlayer = (name) => {
    const player = allPlayers.find(p => p.name === name);
    if (player && !tradeMyPlayers.find(p => p.name === name)) {
      setTradeMyPlayers(prev => [...prev, player]);
    }
  };

  const removeMyPlayer = (name) => {
    setTradeMyPlayers(prev => prev.filter(p => p.name !== name));
  };

  const addTheirPlayer = () => {
    if (!theirForm.name.trim()) { showToast("Enter player name"); return; }
    const entry = {
      name: theirForm.name.trim(),
      pos: theirForm.pos,
      team: theirForm.team.toUpperCase(),
      proj: parseFloat(theirForm.proj) || 0,
    };
    setTradeTheirPlayers(prev => [...prev, entry]);
    setTheirForm({ name: "", pos: "SP", team: "", proj: "" });
  };

  const removeTheirPlayer = (name) => {
    setTradeTheirPlayers(prev => prev.filter(p => p.name !== name));
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
    padding: "6px 10px",
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

  const playerRow = (player, onRemove, sideColor) => (
    <div key={player.name} style={{
      display: "flex",
      alignItems: "center",
      padding: "8px 10px",
      borderBottom: `1px solid ${COLORS.muted}22`,
      gap: 8,
    }}>
      <span style={{
        background: `${COLORS.purple}22`,
        color: COLORS.purple,
        padding: "2px 6px",
        borderRadius: 4,
        fontSize: 10,
        fontWeight: 700,
        fontFamily: mono,
      }}>
        {player.pos}
      </span>
      <span style={{ flex: 1, color: COLORS.text, fontWeight: 600, fontSize: 13 }}>
        {player.name}
      </span>
      <span style={{ color: COLORS.muted, fontSize: 11, fontFamily: mono }}>{player.team || "—"}</span>
      {keeperMap[player.name] && (
        <span style={{
          background: `${COLORS.warning}22`,
          color: COLORS.warning,
          padding: "1px 6px",
          borderRadius: 4,
          fontSize: 9,
          fontWeight: 700,
        }}>
          KEEPER
        </span>
      )}
      <span style={{
        color: sideColor,
        fontFamily: mono,
        fontSize: 13,
        fontWeight: 700,
        minWidth: 50,
        textAlign: "right",
      }}>
        {player.proj ? player.proj.toFixed(1) : "—"}
      </span>
      <button
        onClick={() => onRemove(player.name)}
        style={{
          background: `${COLORS.danger}22`,
          color: COLORS.danger,
          border: "none",
          borderRadius: 4,
          padding: "3px 6px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Trash />
      </button>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ color: COLORS.text, fontSize: 22, fontWeight: 700, display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
          <Swap /> Trade Evaluator
        </h2>
        <button
          onClick={clearAll}
          style={{
            background: `${COLORS.muted}22`,
            color: COLORS.muted,
            border: `1px solid ${COLORS.muted}44`,
            borderRadius: 6,
            padding: "6px 14px",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Clear All
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* I GIVE */}
        <div style={{ ...sectionStyle, borderColor: `${COLORS.danger}44` }}>
          <div style={{
            fontSize: 16,
            fontWeight: 800,
            color: COLORS.danger,
            marginBottom: 16,
            textTransform: "uppercase",
            letterSpacing: 1,
          }}>
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

          {tradeMyPlayers.map(p => playerRow(p, removeMyPlayer, COLORS.danger))}

          {tradeMyPlayers.length > 0 && (
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "10px 12px",
              marginTop: 8,
              borderTop: `2px solid ${COLORS.danger}33`,
            }}>
              <span style={{ color: COLORS.danger, fontWeight: 700, fontSize: 13 }}>TOTAL GIVING</span>
              <span style={{ color: COLORS.danger, fontFamily: mono, fontSize: 16, fontWeight: 800 }}>
                {myTotal.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* I RECEIVE */}
        <div style={{ ...sectionStyle, borderColor: `${COLORS.green}44` }}>
          <div style={{
            fontSize: 16,
            fontWeight: 800,
            color: COLORS.green,
            marginBottom: 16,
            textTransform: "uppercase",
            letterSpacing: 1,
          }}>
            I Receive
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto", gap: 6, marginBottom: 12 }}>
            <input
              placeholder="Player name"
              value={theirForm.name}
              onChange={e => setTheirForm(f => ({ ...f, name: e.target.value }))}
              style={inputStyle}
            />
            <select
              value={theirForm.pos}
              onChange={e => setTheirForm(f => ({ ...f, pos: e.target.value }))}
              style={inputStyle}
            >
              {["C","1B","2B","3B","SS","OF","DH","SP","RP"].map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <input
              placeholder="Team"
              value={theirForm.team}
              onChange={e => setTheirForm(f => ({ ...f, team: e.target.value.toUpperCase() }))}
              style={inputStyle}
            />
            <input
              placeholder="Proj"
              type="number"
              value={theirForm.proj}
              onChange={e => setTheirForm(f => ({ ...f, proj: e.target.value }))}
              style={inputStyle}
            />
            <button
              onClick={addTheirPlayer}
              style={{
                background: COLORS.green,
                color: "#000",
                border: "none",
                borderRadius: 6,
                padding: "6px 12px",
                cursor: "pointer",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
              }}
            >
              <Plus />
            </button>
          </div>

          {tradeTheirPlayers.length === 0 && (
            <div style={{ color: COLORS.muted, textAlign: "center", padding: 16, fontSize: 13 }}>
              Add players you would receive
            </div>
          )}

          {tradeTheirPlayers.map(p => playerRow(p, removeTheirPlayer, COLORS.green))}

          {tradeTheirPlayers.length > 0 && (
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "10px 12px",
              marginTop: 8,
              borderTop: `2px solid ${COLORS.green}33`,
            }}>
              <span style={{ color: COLORS.green, fontWeight: 700, fontSize: 13 }}>TOTAL RECEIVING</span>
              <span style={{ color: COLORS.green, fontFamily: mono, fontSize: 16, fontWeight: 800 }}>
                {theirTotal.toFixed(1)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Verdict */}
      {hasPlayers && verdict && (
        <div style={{
          ...sectionStyle,
          textAlign: "center",
          background: `${verdict.color}10`,
          border: `1px solid ${verdict.color}44`,
          marginBottom: 20,
        }}>
          <div style={{ fontSize: 14, color: COLORS.muted, marginBottom: 6 }}>TRADE VERDICT</div>
          <div style={{
            fontSize: 32,
            fontWeight: 800,
            color: verdict.color,
            marginBottom: 8,
          }}>
            {verdict.emoji} {verdict.label}
          </div>
          <div style={{
            color: diff > 0 ? COLORS.green : diff < 0 ? COLORS.danger : COLORS.text,
            fontFamily: mono,
            fontSize: 20,
            fontWeight: 700,
            marginBottom: 8,
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
              marginTop: 16,
              padding: "8px 14px",
              background: `${COLORS.warning}15`,
              borderRadius: 8,
              border: `1px solid ${COLORS.warning}44`,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
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
