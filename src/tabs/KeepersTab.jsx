import { useContext, useState, useMemo } from "react";
import { AppContext } from "../App.jsx";
import { BATTING_SCORING, PITCHING_SCORING } from "../constants.js";
import { Lock, Plus, Trash, Alert, Check, Clock } from "../icons.jsx";

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

const DEADLINE = new Date("2026-03-15T23:59:59");

function getCountdown() {
  const now = new Date();
  const diff = DEADLINE - now;
  if (diff <= 0) return { text: "DEADLINE PASSED", days: 0, urgent: true, passed: true };
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  return {
    text: `${days}d ${hours}h ${mins}m remaining`,
    days,
    urgent: days <= 3,
    passed: false,
  };
}

export default function KeepersTab() {
  const { keepers, setKeepers, keeperWatchlist, setKeeperWatchlist, showToast } = useContext(AppContext);

  const [addForm, setAddForm] = useState({
    name: "", pos: "SP", team: "", type: "major", year: 1, maxYears: 2, proj: "", ecr: "", age: "", notes: "",
  });

  const countdown = useMemo(getCountdown, []);

  const lockIn = (player) => {
    if (keepers.find(k => k.name === player.name)) {
      showToast(`${player.name} is already a keeper!`);
      return;
    }
    setKeepers(prev => [...prev, { ...player, year: 1, maxYears: player.type === "major" ? 2 : 3 }]);
    setKeeperWatchlist(prev => prev.filter(p => p.name !== player.name));
    showToast(`${player.name} locked in as keeper!`);
  };

  const removeFromWatchlist = (name) => {
    setKeeperWatchlist(prev => prev.filter(p => p.name !== name));
    showToast(`${name} removed from watchlist`);
  };

  const removeKeeper = (name) => {
    setKeepers(prev => prev.filter(p => p.name !== name));
    showToast(`${name} removed from keepers`);
  };

  const handleAdd = () => {
    if (!addForm.name.trim()) { showToast("Enter player name"); return; }
    const entry = {
      ...addForm,
      proj: parseFloat(addForm.proj) || 0,
      age: parseInt(addForm.age) || 0,
      year: parseInt(addForm.year) || 1,
      maxYears: addForm.type === "major" ? 2 : 3,
    };
    setKeeperWatchlist(prev => [...prev, entry]);
    setAddForm({ name: "", pos: "SP", team: "", type: "major", year: 1, maxYears: 2, proj: "", ecr: "", age: "", notes: "" });
    showToast(`${entry.name} added to watchlist`);
  };

  const totalProj = keepers.reduce((s, k) => s + (k.proj || 0), 0);

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
    padding: "6px 10px",
    color: COLORS.text,
    fontSize: 13,
    fontFamily: mono,
  };

  return (
    <div>
      <h2 style={{ color: COLORS.text, fontSize: 22, fontWeight: 700, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
        <Lock /> Keeper Management
      </h2>

      {/* Keepers are locked — deadline passed March 15, 2026 */}

      {/* Locked Keepers */}
      <div style={sectionStyle}>
        <div style={headerStyle}>
          Locked Keepers ({keepers.length})
          <span style={{ fontSize: 13, color: COLORS.muted, fontWeight: 400, marginLeft: "auto" }}>
            Total Projected: <span style={{ color: COLORS.green, fontFamily: mono }}>{totalProj.toFixed(1)}</span>
          </span>
        </div>

        {keepers.length === 0 && (
          <div style={{ color: COLORS.muted, textAlign: "center", padding: 20, fontSize: 14 }}>
            No keepers locked in yet.
          </div>
        )}

        {keepers.map(k => (
          <div key={k.name} style={{
            display: "flex",
            alignItems: "center",
            padding: "12px",
            borderBottom: `1px solid ${COLORS.muted}22`,
            gap: 10,
          }}>
            {/* Type badge */}
            <span style={{
              background: k.type === "major" ? `${COLORS.primary}22` : `${COLORS.green}22`,
              color: k.type === "major" ? COLORS.primary : COLORS.green,
              padding: "2px 8px",
              borderRadius: 6,
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
            }}>
              {k.type}
            </span>

            {/* Pos badge */}
            <span style={{
              background: `${COLORS.purple}22`,
              color: COLORS.purple,
              padding: "2px 8px",
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 700,
              fontFamily: mono,
              minWidth: 32,
              textAlign: "center",
            }}>
              {k.pos}
            </span>

            {/* Name */}
            <span style={{ flex: 1, color: COLORS.text, fontWeight: 600, fontSize: 14 }}>
              {k.name}
            </span>

            {/* Team */}
            <span style={{ color: COLORS.muted, fontSize: 12, fontFamily: mono }}>{k.team}</span>

            {/* Year tracking */}
            <span style={{
              color: COLORS.amber,
              fontSize: 11,
              fontFamily: mono,
              fontWeight: 600,
            }}>
              Yr {k.year}/{k.maxYears}
            </span>

            {/* ECR */}
            {k.ecr && (
              <span style={{ color: COLORS.muted, fontSize: 11, fontFamily: mono }}>{k.ecr}</span>
            )}

            {/* Projection */}
            <span style={{
              color: COLORS.green,
              fontFamily: mono,
              fontSize: 13,
              fontWeight: 600,
              minWidth: 50,
              textAlign: "right",
            }}>
              {k.proj ? k.proj.toFixed(1) : "—"}
            </span>

            {/* Remove */}
            <button
              onClick={() => removeKeeper(k.name)}
              style={{
                background: `${COLORS.danger}22`,
                color: COLORS.danger,
                border: "none",
                borderRadius: 6,
                padding: "4px 8px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
              }}
            >
              <Trash />
            </button>
          </div>
        ))}
      </div>

      {/* Scoring Reference */}
      <div style={sectionStyle}>
        <div style={headerStyle}>Scoring Reference</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div>
            <div style={{ color: COLORS.primary, fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Batting</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
              {Object.entries(BATTING_SCORING).map(([key, val]) => (
                <div key={key} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
                  <span style={{ color: COLORS.muted, fontSize: 12, fontFamily: mono }}>{key}</span>
                  <span style={{
                    color: val > 0 ? COLORS.green : val < 0 ? COLORS.danger : COLORS.text,
                    fontSize: 12,
                    fontFamily: mono,
                    fontWeight: 600,
                  }}>
                    {val > 0 ? "+" : ""}{val}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div style={{ color: COLORS.purple, fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Pitching</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
              {Object.entries(PITCHING_SCORING).map(([key, val]) => (
                <div key={key} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
                  <span style={{ color: COLORS.muted, fontSize: 12, fontFamily: mono }}>{key}</span>
                  <span style={{
                    color: val > 0 ? COLORS.green : val < 0 ? COLORS.danger : COLORS.text,
                    fontSize: 12,
                    fontFamily: mono,
                    fontWeight: 600,
                  }}>
                    {val > 0 ? "+" : ""}{val}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
