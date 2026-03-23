import { useContext, useState, useMemo } from "react";
import { AppContext } from "../App.jsx";
import { TrendUp, Alert } from "../icons.jsx";

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

function getRecommendation(diff) {
  if (diff > 20) return { label: "STRONG ADD", color: COLORS.green, bg: `${COLORS.green}15` };
  if (diff > 0) return { label: "MARGINAL ADD", color: "#88cc44", bg: "#88cc4415" };
  if (diff > -20) return { label: "MARGINAL HOLD", color: COLORS.amber, bg: `${COLORS.amber}15` };
  return { label: "STRONG HOLD", color: COLORS.danger, bg: `${COLORS.danger}15` };
}

export default function FreeAgentTab() {
  const { roster, keepers, setRoster, showToast } = useContext(AppContext);

  const [dropPlayer, setDropPlayer] = useState("");
  const [faName, setFaName] = useState("");
  const [faPos, setFaPos] = useState("SP");
  const [faTeam, setFaTeam] = useState("");
  const [faProj, setFaProj] = useState("");
  const [faNotes, setFaNotes] = useState("");

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

  const dropPlayerData = allPlayers.find(p => p.name === dropPlayer);
  const faProjection = parseFloat(faProj) || 0;
  const dropProjection = dropPlayerData?.proj || 0;
  const diff = faProjection - dropProjection;
  const hasAnalysis = dropPlayer && faName.trim() && faProj;
  const rec = hasAnalysis ? getRecommendation(diff) : null;
  const isKeeper = dropPlayer && keeperMap[dropPlayer];

  const executeTransaction = () => {
    if (!dropPlayer || !faName.trim()) {
      showToast("Select a player to drop and enter FA info");
      return;
    }
    if (isKeeper) {
      showToast("Cannot drop a keeper from here - use Keepers tab");
      return;
    }
    const newPlayer = {
      name: faName.trim(),
      pos: faPos,
      team: faTeam.toUpperCase(),
      proj: faProjection,
      notes: faNotes,
    };
    setRoster(prev => [...prev.filter(p => p.name !== dropPlayer), newPlayer]);
    showToast(`Dropped ${dropPlayer}, added ${faName.trim()}`);
    setDropPlayer("");
    setFaName("");
    setFaPos("SP");
    setFaTeam("");
    setFaProj("");
    setFaNotes("");
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
        <TrendUp /> Free Agent Analyzer
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Drop Side */}
        <div style={sectionStyle}>
          <div style={{ ...headerStyle, color: COLORS.danger }}>
            DROP CANDIDATE
          </div>
          <label style={labelStyle}>Select Player to Drop</label>
          <select
            value={dropPlayer}
            onChange={e => setDropPlayer(e.target.value)}
            style={{ ...inputStyle, marginBottom: 16 }}
          >
            <option value="">— Select Player —</option>
            {allPlayers.map(p => (
              <option key={p.name} value={p.name}>
                {p.name} ({p.pos}) — {p.proj ? p.proj.toFixed(1) : "?"} pts
              </option>
            ))}
          </select>

          {dropPlayerData && (
            <div style={{
              background: COLORS.bgDark,
              borderRadius: 8,
              padding: 14,
              border: `1px solid ${COLORS.danger}33`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ color: COLORS.text, fontWeight: 700, fontSize: 16 }}>
                  {dropPlayerData.name}
                </span>
                <span style={{
                  background: `${COLORS.danger}22`,
                  color: COLORS.danger,
                  padding: "2px 8px",
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 700,
                }}>
                  {dropPlayerData.pos}
                </span>
              </div>
              <div style={{ color: COLORS.muted, fontSize: 12, marginBottom: 4 }}>
                {dropPlayerData.team} {dropPlayerData.ecr ? `| ${dropPlayerData.ecr}` : ""}
              </div>
              <div style={{
                color: COLORS.danger,
                fontFamily: mono,
                fontSize: 20,
                fontWeight: 700,
              }}>
                {dropProjection.toFixed(1)} pts
              </div>
              {isKeeper && (
                <div style={{
                  marginTop: 8,
                  padding: "6px 10px",
                  background: `${COLORS.warning}15`,
                  borderRadius: 6,
                  border: `1px solid ${COLORS.warning}44`,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}>
                  <Alert />
                  <span style={{ color: COLORS.warning, fontSize: 12, fontWeight: 600 }}>
                    KEEPER WARNING: This player is a locked keeper!
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* FA Side */}
        <div style={sectionStyle}>
          <div style={{ ...headerStyle, color: COLORS.green }}>
            FREE AGENT
          </div>
          <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Player Name</label>
              <input
                placeholder="Enter free agent name"
                value={faName}
                onChange={e => setFaName(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={labelStyle}>Position</label>
                <select value={faPos} onChange={e => setFaPos(e.target.value)} style={inputStyle}>
                  {["C","1B","2B","3B","SS","OF","DH","SP","RP"].map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Team</label>
                <input
                  placeholder="Team"
                  value={faTeam}
                  onChange={e => setFaTeam(e.target.value.toUpperCase())}
                  style={inputStyle}
                />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Projected Points</label>
              <input
                placeholder="Projected points"
                type="number"
                value={faProj}
                onChange={e => setFaProj(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Notes (optional)</label>
              <input
                placeholder="Notes"
                value={faNotes}
                onChange={e => setFaNotes(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          {faName.trim() && faProj && (
            <div style={{
              background: COLORS.bgDark,
              borderRadius: 8,
              padding: 14,
              border: `1px solid ${COLORS.green}33`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ color: COLORS.text, fontWeight: 700, fontSize: 16 }}>
                  {faName}
                </span>
                <span style={{
                  background: `${COLORS.green}22`,
                  color: COLORS.green,
                  padding: "2px 8px",
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 700,
                }}>
                  {faPos}
                </span>
              </div>
              <div style={{ color: COLORS.muted, fontSize: 12, marginBottom: 4 }}>
                {faTeam || "—"}
              </div>
              <div style={{
                color: COLORS.green,
                fontFamily: mono,
                fontSize: 20,
                fontWeight: 700,
              }}>
                {faProjection.toFixed(1)} pts
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Analysis */}
      {hasAnalysis && (
        <div style={{
          ...sectionStyle,
          background: rec.bg,
          border: `1px solid ${rec.color}44`,
          textAlign: "center",
        }}>
          <div style={{ color: rec.color, fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
            {rec.label}
          </div>
          <div style={{
            color: COLORS.text,
            fontSize: 16,
            marginBottom: 12,
          }}>
            Projection Difference:{" "}
            <span style={{
              color: diff > 0 ? COLORS.green : diff < 0 ? COLORS.danger : COLORS.text,
              fontFamily: mono,
              fontWeight: 700,
              fontSize: 22,
            }}>
              {diff > 0 ? "+" : ""}{diff.toFixed(1)} pts
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 40, marginBottom: 16 }}>
            <div>
              <div style={{ color: COLORS.muted, fontSize: 11, textTransform: "uppercase", marginBottom: 4 }}>
                Dropping
              </div>
              <div style={{ color: COLORS.danger, fontFamily: mono, fontWeight: 700 }}>
                {dropPlayerData.name} ({dropProjection.toFixed(1)})
              </div>
            </div>
            <div style={{ color: COLORS.muted, fontSize: 20, alignSelf: "center" }}>{"\u2192"}</div>
            <div>
              <div style={{ color: COLORS.muted, fontSize: 11, textTransform: "uppercase", marginBottom: 4 }}>
                Adding
              </div>
              <div style={{ color: COLORS.green, fontFamily: mono, fontWeight: 700 }}>
                {faName} ({faProjection.toFixed(1)})
              </div>
            </div>
          </div>

          {isKeeper && (
            <div style={{
              marginTop: 10,
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
                KEEPER AT RISK — Dropping a keeper cannot be undone!
              </span>
            </div>
          )}

          {!isKeeper && (
            <button
              onClick={executeTransaction}
              style={{
                marginTop: 16,
                background: rec.color,
                color: "#000",
                border: "none",
                borderRadius: 8,
                padding: "10px 30px",
                fontSize: 14,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Execute Drop/Add
            </button>
          )}
        </div>
      )}
    </div>
  );
}
