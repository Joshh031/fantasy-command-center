import { useContext, useState, useMemo } from "react";
import { AppContext } from "../App.jsx";
import { BATTING_SCORING, PITCHING_SCORING, ANALYSTS } from "../constants.js";
import { Star, Check } from "../icons.jsx";

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

const POS_ORDER = ["C", "1B", "2B", "3B", "SS", "OF", "DH"];

const HIGH_VALUE_PLAYS = [
  { cat: "Batting", plays: [
    { label: "HR", pts: "+4", note: "Home runs are king" },
    { label: "GSHR", pts: "+3 bonus", note: "Grand slams extra" },
    { label: "CYC", pts: "+10", note: "Hitting for the cycle" },
    { label: "SB", pts: "+1.75", note: "Stolen bases underrated" },
    { label: "3B", pts: "+3", note: "Triples = hidden value" },
  ]},
  { cat: "Pitching", plays: [
    { label: "W", pts: "+10", note: "Wins are massive" },
    { label: "PG", pts: "+20", note: "Perfect game jackpot" },
    { label: "NH", pts: "+10", note: "No-hitter bonus" },
    { label: "S", pts: "+7", note: "Saves elite value" },
    { label: "SO", pts: "+5", note: "Shutout bonus" },
    { label: "QS", pts: "+4", note: "Quality starts add up" },
  ]},
];

export default function MyTeamTab() {
  const { keepers, roster, showToast } = useContext(AppContext);
  const [sitList, setSitList] = useState({});
  const [pitcherStarts, setPitcherStarts] = useState({});

  const allPlayers = useMemo(() => {
    const map = new Map();
    keepers.forEach(p => map.set(p.name, p));
    roster.forEach(p => { if (!map.has(p.name)) map.set(p.name, p); });
    return Array.from(map.values());
  }, [keepers, roster]);

  const batters = useMemo(() => {
    const b = allPlayers.filter(p => p.pos !== "SP" && p.pos !== "RP");
    b.sort((a, c) => {
      const ai = POS_ORDER.indexOf(a.pos);
      const ci = POS_ORDER.indexOf(c.pos);
      if (ai !== ci) return (ai === -1 ? 99 : ai) - (ci === -1 ? 99 : ci);
      return (c.proj || 0) - (a.proj || 0);
    });
    return b;
  }, [allPlayers]);

  const pitchers = useMemo(() => {
    const p = allPlayers.filter(p => p.pos === "SP" || p.pos === "RP");
    p.sort((a, b) => {
      if (a.pos === "SP" && b.pos !== "SP") return -1;
      if (a.pos !== "SP" && b.pos === "SP") return 1;
      return (b.proj || 0) - (a.proj || 0);
    });
    return p;
  }, [allPlayers]);

  const toggleSit = (name) => {
    setSitList(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const setStarts = (name, val) => {
    setPitcherStarts(prev => ({ ...prev, [name]: val }));
  };

  const keeperMap = useMemo(() => {
    const m = {};
    keepers.forEach(k => { m[k.name] = k; });
    return m;
  }, [keepers]);

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

  const renderPlayerRow = (player, isPitcher = false) => {
    const isSitting = sitList[player.name];
    const kp = keeperMap[player.name];
    const starts = pitcherStarts[player.name] ?? null;

    return (
      <div
        key={player.name}
        style={{
          display: "flex",
          alignItems: "center",
          padding: "10px 12px",
          borderBottom: `1px solid ${COLORS.muted}22`,
          opacity: isSitting ? 0.45 : 1,
          gap: 10,
        }}
      >
        {/* Position badge */}
        <span style={{
          background: isPitcher ? `${COLORS.purple}22` : `${COLORS.primary}22`,
          color: isPitcher ? COLORS.purple : COLORS.primary,
          padding: "2px 8px",
          borderRadius: 6,
          fontSize: 11,
          fontWeight: 700,
          fontFamily: mono,
          minWidth: 32,
          textAlign: "center",
        }}>
          {player.pos}
        </span>

        {/* Name */}
        <span style={{ flex: 1, color: COLORS.text, fontWeight: 600, fontSize: 14 }}>
          {player.name}
        </span>

        {/* Team */}
        <span style={{ color: COLORS.muted, fontSize: 12, fontFamily: mono, minWidth: 36 }}>
          {player.team || "—"}
        </span>

        {/* Keeper badge */}
        {kp && (
          <span style={{
            background: kp.type === "major" ? `${COLORS.primary}22` : `${COLORS.green}22`,
            color: kp.type === "major" ? COLORS.primary : COLORS.green,
            padding: "1px 6px",
            borderRadius: 4,
            fontSize: 10,
            fontWeight: 700,
            fontFamily: mono,
          }}>
            K{kp.year}
          </span>
        )}

        {/* Projection */}
        <span style={{
          color: COLORS.green,
          fontFamily: mono,
          fontSize: 13,
          fontWeight: 600,
          minWidth: 48,
          textAlign: "right",
        }}>
          {player.proj ? player.proj.toFixed(1) : "—"}
        </span>

        {/* Pitcher 2-start selector */}
        {isPitcher && player.pos === "SP" && (
          <div style={{ display: "flex", gap: 2 }}>
            {[0, 1, 2].map(n => (
              <button
                key={n}
                onClick={() => setStarts(player.name, n)}
                style={{
                  background: starts === n ? COLORS.primary : `${COLORS.muted}22`,
                  color: starts === n ? "#fff" : COLORS.muted,
                  border: "none",
                  borderRadius: 4,
                  padding: "2px 6px",
                  fontSize: 10,
                  fontFamily: mono,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                {n}{n === 2 ? " GS \u2605" : " GS"}
              </button>
            ))}
          </div>
        )}

        {/* START/SIT toggle */}
        <button
          onClick={() => {
            toggleSit(player.name);
            showToast(`${player.name}: ${isSitting ? "START" : "SIT"}`);
          }}
          style={{
            background: isSitting ? `${COLORS.danger}22` : `${COLORS.green}22`,
            color: isSitting ? COLORS.danger : COLORS.green,
            border: `1px solid ${isSitting ? COLORS.danger : COLORS.green}44`,
            borderRadius: 6,
            padding: "4px 10px",
            fontSize: 11,
            fontWeight: 700,
            cursor: "pointer",
            minWidth: 52,
          }}
        >
          {isSitting ? "SIT" : "START"}
        </button>
      </div>
    );
  };

  return (
    <div>
      <h2 style={{ color: COLORS.text, fontSize: 22, fontWeight: 700, marginBottom: 20 }}>
        <Star /> Weekly Lineup Manager
      </h2>

      {allPlayers.length === 0 && (
        <div style={{ ...sectionStyle, textAlign: "center", color: COLORS.muted, padding: 40 }}>
          No players on your team yet. Add keepers or roster players first.
        </div>
      )}

      {/* Batters */}
      {batters.length > 0 && (
        <div style={sectionStyle}>
          <div style={headerStyle}>Batters ({batters.length})</div>
          {batters.map(p => renderPlayerRow(p, false))}
        </div>
      )}

      {/* Pitchers */}
      {pitchers.length > 0 && (
        <div style={sectionStyle}>
          <div style={headerStyle}>Pitchers ({pitchers.length})</div>
          {pitchers.map(p => renderPlayerRow(p, true))}
        </div>
      )}

      {/* Analysts to Follow */}
      <div style={sectionStyle}>
        <div style={headerStyle}>Analysts to Follow</div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 12,
        }}>
          {ANALYSTS.map(a => (
            <div key={a.name} style={{
              background: `${COLORS.bgDark}`,
              borderRadius: 8,
              padding: 14,
              border: `1px solid ${COLORS.muted}22`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: COLORS.text, fontWeight: 700, fontSize: 14 }}>{a.name}</span>
                <span style={{
                  background: `${COLORS.primary}22`,
                  color: COLORS.primary,
                  padding: "1px 8px",
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 700,
                }}>
                  {a.type}
                </span>
              </div>
              <div style={{ color: COLORS.muted, fontSize: 12, marginBottom: 4 }}>{a.handle}</div>
              <div style={{ color: COLORS.text, fontSize: 12, opacity: 0.8 }}>{a.note}</div>
            </div>
          ))}
        </div>
      </div>

      {/* High-Value Scoring Plays */}
      <div style={sectionStyle}>
        <div style={headerStyle}>High-Value Scoring Plays</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {HIGH_VALUE_PLAYS.map(section => (
            <div key={section.cat}>
              <div style={{
                color: section.cat === "Batting" ? COLORS.primary : COLORS.purple,
                fontWeight: 700,
                fontSize: 14,
                marginBottom: 10,
              }}>
                {section.cat}
              </div>
              {section.plays.map(play => (
                <div key={play.label} style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "6px 0",
                  borderBottom: `1px solid ${COLORS.muted}15`,
                  gap: 10,
                }}>
                  <span style={{
                    fontFamily: mono,
                    fontWeight: 700,
                    color: COLORS.green,
                    fontSize: 13,
                    minWidth: 70,
                  }}>
                    {play.pts}
                  </span>
                  <span style={{
                    fontFamily: mono,
                    color: COLORS.amber,
                    fontSize: 12,
                    fontWeight: 600,
                    minWidth: 40,
                  }}>
                    {play.label}
                  </span>
                  <span style={{ color: COLORS.muted, fontSize: 12 }}>{play.note}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
