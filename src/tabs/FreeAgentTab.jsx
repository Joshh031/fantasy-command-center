import { useContext, useState, useMemo } from "react";
import { AppContext } from "../App.jsx";
import { TrendUp, Alert, Search } from "../icons.jsx";
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

function getRecommendation(diff) {
  if (diff > 20) return { label: "STRONG ADD", color: COLORS.green, bg: `${COLORS.green}15`, emoji: "🔥" };
  if (diff > 0) return { label: "MARGINAL ADD", color: "#88cc44", bg: "#88cc4415", emoji: "👍" };
  if (diff > -20) return { label: "MARGINAL HOLD", color: COLORS.amber, bg: `${COLORS.amber}15`, emoji: "🤔" };
  return { label: "STRONG HOLD", color: COLORS.danger, bg: `${COLORS.danger}15`, emoji: "✋" };
}

export default function FreeAgentTab() {
  const { roster, keepers, setRoster, intelCache, showToast } = useContext(AppContext);

  const [dropPlayer, setDropPlayer] = useState("");
  const [faSearch, setFaSearch] = useState("");
  const [selectedFA, setSelectedFA] = useState(null);

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

  // Searchable CBS player pool (exclude rostered players)
  const faSearchResults = useMemo(() => {
    if (!faSearch.trim() || faSearch.length < 2) return [];
    const q = faSearch.toLowerCase();
    const rosterNames = new Set(allMyPlayers.map(p => p.name));
    return allCBSPlayers
      .filter(p => p.name.toLowerCase().includes(q) && !rosterNames.has(p.name))
      .slice(0, 10);
  }, [faSearch, allMyPlayers]);

  const dropPlayerData = allMyPlayers.find(p => p.name === dropPlayer);
  const dropProjection = dropPlayerData?.proj || 0;
  const faProjection = selectedFA?.leagueFpts || 0;
  const diff = faProjection - dropProjection;
  const hasAnalysis = dropPlayer && selectedFA;
  const rec = hasAnalysis ? getRecommendation(diff) : null;
  const isKeeper = dropPlayer && keeperMap[dropPlayer];

  // Check intel cache for FA
  const faIntel = selectedFA ? intelCache[selectedFA.name?.toLowerCase()] : null;

  const executeTransaction = () => {
    if (!dropPlayer || !selectedFA) {
      showToast("Select a player to drop and a free agent to add");
      return;
    }
    if (isKeeper) {
      showToast("Cannot drop a keeper from here — use Keepers tab");
      return;
    }
    const newPlayer = {
      name: selectedFA.name,
      pos: selectedFA.pos,
      team: selectedFA.team,
      proj: selectedFA.leagueFpts || 0,
    };
    setRoster(prev => [...prev.filter(p => p.name !== dropPlayer), newPlayer]);
    showToast(`Dropped ${dropPlayer}, added ${selectedFA.name}`);
    setDropPlayer("");
    setSelectedFA(null);
    setFaSearch("");
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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* Drop Side */}
        <div style={sectionStyle}>
          <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.danger, marginBottom: 16, textTransform: "uppercase", letterSpacing: 1 }}>
            Drop Candidate
          </div>
          <label style={labelStyle}>Select Player to Drop</label>
          <select
            value={dropPlayer}
            onChange={e => setDropPlayer(e.target.value)}
            style={{ ...inputStyle, marginBottom: 16 }}
          >
            <option value="">— Select Player —</option>
            {allMyPlayers.map(p => (
              <option key={p.name} value={p.name}>
                {p.name} ({p.pos}) — {p.proj ? p.proj.toFixed(1) : "?"} pts
              </option>
            ))}
          </select>

          {dropPlayerData && (
            <div style={{ background: COLORS.bgDark, borderRadius: 8, padding: 14, border: `1px solid ${COLORS.danger}33` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ color: COLORS.text, fontWeight: 700, fontSize: 16 }}>{dropPlayerData.name}</span>
                <span style={{ background: `${COLORS.danger}22`, color: COLORS.danger, padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
                  {dropPlayerData.pos}
                </span>
              </div>
              <div style={{ color: COLORS.muted, fontSize: 12, marginBottom: 4 }}>
                {dropPlayerData.team} {dropPlayerData.ecr ? `| ${dropPlayerData.ecr}` : ""}
              </div>
              <div style={{ color: COLORS.danger, fontFamily: mono, fontSize: 20, fontWeight: 700 }}>
                {dropProjection.toFixed(1)} pts
              </div>
              {isKeeper && (
                <div style={{
                  marginTop: 8, padding: "6px 10px", background: `${COLORS.warning}15`,
                  borderRadius: 6, border: `1px solid ${COLORS.warning}44`,
                  display: "flex", alignItems: "center", gap: 6,
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

        {/* FA Side — searchable CBS pool */}
        <div style={sectionStyle}>
          <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.green, marginBottom: 16, textTransform: "uppercase", letterSpacing: 1 }}>
            Free Agent
          </div>
          <label style={labelStyle}>Search Available Players</label>
          <div style={{ position: "relative", marginBottom: 16 }}>
            <input
              placeholder="Search any player (e.g. Kyle Tucker)..."
              value={faSearch}
              onChange={e => { setFaSearch(e.target.value); if (selectedFA) setSelectedFA(null); }}
              style={inputStyle}
            />
            {faSearchResults.length > 0 && !selectedFA && (
              <div style={{
                position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10,
                background: COLORS.bgDark, border: `1px solid ${COLORS.muted}44`,
                borderRadius: 8, marginTop: 4, maxHeight: 280, overflowY: "auto",
                boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
              }}>
                {faSearchResults.map(p => (
                  <button
                    key={`${p.name}-${p.pos}`}
                    onClick={() => { setSelectedFA(p); setFaSearch(p.name); }}
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
                    <span style={{ color: COLORS.green, fontFamily: mono, fontSize: 12, fontWeight: 700 }}>{(p.leagueFpts || 0).toFixed(1)} pts</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedFA && (
            <div style={{ background: COLORS.bgDark, borderRadius: 8, padding: 14, border: `1px solid ${COLORS.green}33` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ color: COLORS.text, fontWeight: 700, fontSize: 16 }}>{selectedFA.name}</span>
                <span style={{ background: `${COLORS.green}22`, color: COLORS.green, padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
                  {selectedFA.pos}
                </span>
              </div>
              <div style={{ color: COLORS.muted, fontSize: 12, marginBottom: 4 }}>{selectedFA.team}</div>
              <div style={{ color: COLORS.green, fontFamily: mono, fontSize: 20, fontWeight: 700 }}>
                {faProjection.toFixed(1)} pts
              </div>
              <div style={{ color: COLORS.muted, fontSize: 11, marginTop: 4 }}>
                CBS Rank: #{selectedFA.cbsRank} | CBS FPTS: {selectedFA.cbsFpts?.toFixed(1)}
              </div>
              {/* Key stats */}
              {selectedFA.stats && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                  {selectedFA.stats.HR !== undefined && (
                    <span style={{ color: COLORS.green, fontSize: 10, background: `${COLORS.green}15`, padding: "1px 6px", borderRadius: 4 }}>
                      HR: {selectedFA.stats.HR}
                    </span>
                  )}
                  {selectedFA.stats.SB !== undefined && (
                    <span style={{ color: COLORS.green, fontSize: 10, background: `${COLORS.green}15`, padding: "1px 6px", borderRadius: 4 }}>
                      SB: {selectedFA.stats.SB}
                    </span>
                  )}
                  {selectedFA.stats.K !== undefined && selectedFA.stats.AB && (
                    <span style={{ color: selectedFA.stats.K > 150 ? COLORS.danger : COLORS.muted, fontSize: 10, background: `${selectedFA.stats.K > 150 ? COLORS.danger : COLORS.muted}15`, padding: "1px 6px", borderRadius: 4 }}>
                      K: {selectedFA.stats.K}
                    </span>
                  )}
                  {selectedFA.stats.W !== undefined && (
                    <span style={{ color: COLORS.green, fontSize: 10, background: `${COLORS.green}15`, padding: "1px 6px", borderRadius: 4 }}>
                      W: {selectedFA.stats.W}
                    </span>
                  )}
                  {selectedFA.stats.S !== undefined && selectedFA.stats.S > 0 && (
                    <span style={{ color: COLORS.amber, fontSize: 10, background: `${COLORS.amber}15`, padding: "1px 6px", borderRadius: 4 }}>
                      SV: {selectedFA.stats.S}
                    </span>
                  )}
                  {selectedFA.stats.ERA !== undefined && (
                    <span style={{ color: COLORS.muted, fontSize: 10, background: `${COLORS.muted}15`, padding: "1px 6px", borderRadius: 4 }}>
                      ERA: {selectedFA.stats.ERA}
                    </span>
                  )}
                </div>
              )}
              {faIntel && (
                <div style={{
                  marginTop: 8, padding: "4px 8px", borderRadius: 4,
                  background: faIntel.verdict === "RISER" ? `${COLORS.green}15` : faIntel.verdict === "FALLER" ? `${COLORS.danger}15` : `${COLORS.amber}15`,
                  color: faIntel.verdict === "RISER" ? COLORS.green : faIntel.verdict === "FALLER" ? COLORS.danger : COLORS.amber,
                  fontSize: 10, fontWeight: 700, display: "inline-block",
                }}>
                  INTEL: {faIntel.verdict === "RISER" ? "▲" : faIntel.verdict === "FALLER" ? "▼" : "—"} {faIntel.verdict}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Analysis Output */}
      {hasAnalysis && rec && (
        <div style={{
          ...sectionStyle, textAlign: "center",
          background: rec.bg, border: `1px solid ${rec.color}44`, marginBottom: 20,
        }}>
          <div style={{ fontSize: 14, color: COLORS.muted, marginBottom: 6 }}>ANALYSIS</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: rec.color, marginBottom: 8 }}>
            {rec.emoji} {rec.label}
          </div>
          <div style={{
            color: diff > 0 ? COLORS.green : diff < 0 ? COLORS.danger : COLORS.text,
            fontFamily: mono, fontSize: 22, fontWeight: 700, marginBottom: 12,
          }}>
            {diff > 0 ? "+" : ""}{diff.toFixed(1)} projected points
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: 40, marginBottom: 16 }}>
            <div>
              <div style={{ color: COLORS.muted, fontSize: 11, textTransform: "uppercase", marginBottom: 4 }}>Dropping</div>
              <div style={{ color: COLORS.danger, fontFamily: mono, fontWeight: 700 }}>
                {dropPlayerData.name} ({dropProjection.toFixed(1)})
              </div>
            </div>
            <div style={{ color: COLORS.muted, fontSize: 20, alignSelf: "center" }}>→</div>
            <div>
              <div style={{ color: COLORS.muted, fontSize: 11, textTransform: "uppercase", marginBottom: 4 }}>Adding</div>
              <div style={{ color: COLORS.green, fontFamily: mono, fontWeight: 700 }}>
                {selectedFA.name} ({faProjection.toFixed(1)})
              </div>
            </div>
          </div>

          {isKeeper && (
            <div style={{
              marginTop: 10, padding: "8px 14px", background: `${COLORS.warning}15`,
              borderRadius: 8, border: `1px solid ${COLORS.warning}44`,
              display: "inline-flex", alignItems: "center", gap: 8,
            }}>
              <Alert />
              <span style={{ color: COLORS.warning, fontWeight: 700, fontSize: 13 }}>
                KEEPER AT RISK — Dropping a keeper cannot be undone!
              </span>
            </div>
          )}

          {!isKeeper && (
            <button onClick={executeTransaction} style={{
              marginTop: 16, background: rec.color, color: "#000",
              border: "none", borderRadius: 8, padding: "10px 30px",
              fontSize: 14, fontWeight: 800, cursor: "pointer",
            }}>
              Execute Drop/Add
            </button>
          )}
        </div>
      )}
    </div>
  );
}
