import { useState, useMemo } from "react";
import { TrendUp, TrendDown, Search } from "../icons.jsx";
import {
  computeMomentumModel,
  classifySignal,
  getFactorLabel,
  getFactorDescription,
  FACTOR_WEIGHTS,
} from "../data/momentumFactors.js";

const COLORS = {
  primary: "#3b82f6",
  green: "#00ff88",
  greendim: "rgba(0,255,136,0.12)",
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

const FACTORS = ["momentum", "volatility", "size", "value", "quality", "growth"];

function FactorBar({ value, factor }) {
  // value is z-score [-3, 3], normalize to visual width
  const pct = Math.round(((value + 3) / 6) * 100);
  const isNeg = factor === "volatility"; // lower volatility = better
  const effectiveGood = isNeg ? value < 0 : value > 0;
  const color = effectiveGood ? COLORS.green : value === 0 ? COLORS.amber : COLORS.danger;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
      <span style={{ fontSize: 10, color: COLORS.muted, width: 52, textAlign: "right", fontFamily: mono, flexShrink: 0 }}>
        {getFactorLabel(factor).slice(0, 5).toUpperCase()}
      </span>
      <div style={{
        flex: 1, height: 6, background: `${COLORS.muted}22`, borderRadius: 3, position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: `${COLORS.muted}44`,
        }} />
        <div style={{
          position: "absolute",
          left: value >= 0 ? "50%" : `${pct}%`,
          width: `${Math.abs(pct - 50)}%`,
          top: 0, bottom: 0,
          background: color,
          borderRadius: 3,
          opacity: 0.7,
          transition: "all 0.3s ease",
        }} />
      </div>
      <span style={{ fontSize: 10, fontFamily: mono, color, width: 36, textAlign: "right", flexShrink: 0 }}>
        {value > 0 ? "+" : ""}{value.toFixed(1)}
      </span>
    </div>
  );
}

function CompositeGauge({ value }) {
  const signal = classifySignal(value);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{
        width: 44, height: 44, borderRadius: "50%",
        border: `3px solid ${signal.color}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: `${signal.color}15`,
        flexShrink: 0,
      }}>
        <span style={{ fontFamily: mono, fontSize: 14, fontWeight: 800, color: signal.color }}>
          {value}
        </span>
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: signal.color, letterSpacing: 0.5 }}>
          {signal.label}
        </div>
        <div style={{ fontSize: 10, color: COLORS.muted }}>Composite</div>
      </div>
    </div>
  );
}

function PlayerCard({ player, rank, expanded, onToggle }) {
  const signal = classifySignal(player.composite);
  const isBatter = player.stats?.AB !== undefined;

  return (
    <div style={{
      background: COLORS.surface,
      border: `1px solid ${COLORS.muted}33`,
      borderRadius: 10,
      overflow: "hidden",
      transition: "border-color 0.2s",
      borderColor: expanded ? `${signal.color}55` : `${COLORS.muted}33`,
    }}>
      {/* Header row */}
      <div
        onClick={onToggle}
        style={{
          display: "flex", alignItems: "center", padding: "12px 14px", gap: 10,
          cursor: "pointer", userSelect: "none",
        }}
      >
        <span style={{
          fontFamily: mono, fontSize: 11, fontWeight: 700, color: COLORS.muted,
          width: 28, textAlign: "right", flexShrink: 0,
        }}>#{rank}</span>

        <CompositeGauge value={player.composite} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: COLORS.text }}>{player.name}</span>
            <span style={{
              background: `${COLORS.purple}22`, color: COLORS.purple,
              padding: "1px 6px", borderRadius: 4, fontSize: 10, fontWeight: 700, fontFamily: mono,
            }}>{player.pos}</span>
            <span style={{ color: COLORS.muted, fontSize: 11, fontFamily: mono }}>{player.team}</span>
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 3 }}>
            <span style={{ fontSize: 11, color: COLORS.muted }}>
              CBS Rank: <span style={{ color: COLORS.text, fontFamily: mono, fontWeight: 600 }}>{player.cbsRank || "—"}</span>
            </span>
            <span style={{ fontSize: 11, color: COLORS.muted }}>
              Proj: <span style={{ color: COLORS.primary, fontFamily: mono, fontWeight: 600 }}>{(player.leagueFpts || 0).toFixed(1)}</span>
            </span>
            {player.age && (
              <span style={{ fontSize: 11, color: COLORS.muted }}>
                Age: <span style={{ color: COLORS.text, fontFamily: mono }}>{player.age}</span>
              </span>
            )}
          </div>
        </div>

        <div style={{
          color: signal.color, fontFamily: mono, fontSize: 10, fontWeight: 700,
          padding: "3px 8px", borderRadius: 4, background: `${signal.color}15`,
          border: `1px solid ${signal.color}33`, flexShrink: 0,
        }}>
          {player.composite >= 50 ? <TrendUp /> : <TrendDown />}
        </div>
      </div>

      {/* Expanded factor breakdown */}
      {expanded && (
        <div style={{ padding: "0 14px 14px", borderTop: `1px solid ${COLORS.muted}22` }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: COLORS.muted, textTransform: "uppercase",
            letterSpacing: 1, marginTop: 10, marginBottom: 8,
          }}>
            Barra Factor Decomposition
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {FACTORS.map((f) => (
              <FactorBar key={f} factor={f} value={player.factors[f]} />
            ))}
          </div>

          {/* Key stats */}
          <div style={{
            marginTop: 12, padding: "10px 12px", background: `${COLORS.bgDark}`,
            borderRadius: 8, border: `1px solid ${COLORS.muted}22`,
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Key Metrics
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {isBatter ? (
                <>
                  <Stat label="AVG" value={player.stats?.AVG?.toFixed(3)} />
                  <Stat label="OBP" value={player.stats?.OBP?.toFixed(3)} />
                  <Stat label="SLG" value={player.stats?.SLG?.toFixed(3)} />
                  <Stat label="ISO" value={(player.stats?.SLG - player.stats?.AVG)?.toFixed(3)} />
                  <Stat label="HR" value={player.stats?.HR} />
                  <Stat label="SB" value={player.stats?.SB} />
                  <Stat label="BB/K" value={(player.stats?.BB / Math.max(player.stats?.K, 1))?.toFixed(2)} />
                  <Stat label="AB" value={player.stats?.AB} />
                </>
              ) : (
                <>
                  <Stat label="ERA" value={player.stats?.ERA?.toFixed(2)} />
                  <Stat label="WHIP" value={player.stats?.WHIP?.toFixed(2)} />
                  <Stat label="K" value={player.stats?.K} />
                  <Stat label="K/BB" value={(player.stats?.K / Math.max(player.stats?.BB, 1))?.toFixed(1)} />
                  <Stat label="QS" value={player.stats?.QS} />
                  <Stat label="W" value={player.stats?.W} />
                  <Stat label="IP" value={player.stats?.INNs} />
                  <Stat label="BB/9" value={((player.stats?.BB / Math.max(player.stats?.INNs, 1)) * 9)?.toFixed(1)} />
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{ minWidth: 54 }}>
      <div style={{ fontSize: 9, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 13, fontFamily: mono, fontWeight: 700, color: COLORS.text }}>{value ?? "—"}</div>
    </div>
  );
}

function FactorLegend() {
  return (
    <div style={{
      background: COLORS.surface, borderRadius: 10, padding: 16,
      border: `1px solid ${COLORS.muted}33`, marginBottom: 16,
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.text, marginBottom: 10 }}>
        Barra Factor Definitions
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {FACTORS.map((f) => (
          <div key={f} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <span style={{
              fontFamily: mono, fontSize: 9, fontWeight: 700, color: COLORS.primary,
              background: `${COLORS.primary}15`, padding: "2px 6px", borderRadius: 3,
              flexShrink: 0, marginTop: 1,
            }}>
              {getFactorLabel(f).toUpperCase()}
            </span>
            <span style={{ fontSize: 11, color: COLORS.muted, lineHeight: 1.3 }}>
              {getFactorDescription(f)}
            </span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10, padding: "8px 10px", background: COLORS.bgDark, borderRadius: 6, border: `1px solid ${COLORS.muted}22` }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.muted, marginBottom: 4, letterSpacing: 0.5 }}>FACTOR WEIGHTS</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {FACTORS.map((f) => {
            const w = FACTOR_WEIGHTS.batter[f];
            return (
              <span key={f} style={{ fontSize: 10, fontFamily: mono, color: w < 0 ? COLORS.danger : COLORS.text }}>
                {getFactorLabel(f).slice(0, 4).toUpperCase()}: {w > 0 ? "+" : ""}{(w * 100).toFixed(0)}%
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function MomentumTab() {
  const [view, setView] = useState("batters");
  const [search, setSearch] = useState("");
  const [expandedPlayer, setExpandedPlayer] = useState(null);
  const [showLegend, setShowLegend] = useState(false);
  const [posFilter, setPosFilter] = useState("ALL");
  const [signalFilter, setSignalFilter] = useState("ALL");

  const model = useMemo(() => computeMomentumModel(), []);

  const pool = view === "batters" ? model.batters : model.pitchers;

  const positions = useMemo(() => {
    const set = new Set(pool.map((p) => p.pos));
    return ["ALL", ...Array.from(set).sort()];
  }, [pool]);

  const filtered = useMemo(() => {
    let list = pool;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.team.toLowerCase().includes(q)
      );
    }
    if (posFilter !== "ALL") {
      list = list.filter((p) => p.pos === posFilter);
    }
    if (signalFilter !== "ALL") {
      list = list.filter((p) => classifySignal(p.composite).label === signalFilter);
    }
    return list;
  }, [pool, search, posFilter, signalFilter]);

  // Distribution summary
  const distro = useMemo(() => {
    const d = { "STRONG BUY": 0, BUY: 0, HOLD: 0, SELL: 0, "STRONG SELL": 0 };
    pool.forEach((p) => {
      d[classifySignal(p.composite).label]++;
    });
    return d;
  }, [pool]);

  const sectionStyle = {
    background: COLORS.surface,
    borderRadius: 12,
    padding: 16,
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
    outline: "none",
    boxSizing: "border-box",
  };

  const btnStyle = (active) => ({
    padding: "6px 14px",
    borderRadius: 6,
    border: `1px solid ${active ? COLORS.primary + "66" : COLORS.muted + "44"}`,
    background: active ? `${COLORS.primary}20` : "transparent",
    color: active ? COLORS.primary : COLORS.muted,
    fontFamily: mono,
    fontSize: 11,
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.15s",
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{
          color: COLORS.text, fontSize: 22, fontWeight: 700,
          display: "flex", alignItems: "center", gap: 8, margin: 0,
        }}>
          <TrendUp /> Momentum Factor Model
        </h2>
        <button
          onClick={() => setShowLegend(!showLegend)}
          style={{
            ...btnStyle(showLegend),
            fontSize: 10,
          }}
        >
          {showLegend ? "HIDE" : "SHOW"} METHODOLOGY
        </button>
      </div>

      <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 16, lineHeight: 1.5 }}>
        Multi-factor model based on the MSCI Barra risk framework. Combines Momentum, Volatility,
        Size, Value, Quality, and Growth factors to identify high-alpha fantasy assets.
      </div>

      {showLegend && <FactorLegend />}

      {/* Signal distribution bar */}
      <div style={{ ...sectionStyle, marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
          Signal Distribution — {view === "batters" ? "Batters" : "Pitchers"} ({pool.length})
        </div>
        <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", marginBottom: 10 }}>
          {Object.entries(distro).map(([label, count]) => {
            const signal = classifySignal(label === "STRONG BUY" ? 85 : label === "BUY" ? 70 : label === "HOLD" ? 50 : label === "SELL" ? 30 : 10);
            const pct = (count / pool.length) * 100;
            return pct > 0 ? (
              <div key={label} style={{ width: `${pct}%`, background: signal.color, opacity: 0.7 }} />
            ) : null;
          })}
        </div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {Object.entries(distro).map(([label, count]) => {
            const signal = classifySignal(label === "STRONG BUY" ? 85 : label === "BUY" ? 70 : label === "HOLD" ? 50 : label === "SELL" ? 30 : 10);
            return (
              <button
                key={label}
                onClick={() => setSignalFilter(signalFilter === label ? "ALL" : label)}
                style={{
                  background: signalFilter === label ? `${signal.color}20` : "transparent",
                  border: `1px solid ${signalFilter === label ? signal.color + "66" : "transparent"}`,
                  borderRadius: 4, padding: "2px 8px", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 4,
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: 2, background: signal.color, display: "inline-block", opacity: 0.8 }} />
                <span style={{ fontSize: 10, fontFamily: mono, color: signal.color, fontWeight: 700 }}>{count}</span>
                <span style={{ fontSize: 10, color: COLORS.muted }}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <button onClick={() => { setView("batters"); setPosFilter("ALL"); setSignalFilter("ALL"); }} style={btnStyle(view === "batters")}>BATTERS</button>
        <button onClick={() => { setView("pitchers"); setPosFilter("ALL"); setSignalFilter("ALL"); }} style={btnStyle(view === "pitchers")}>PITCHERS</button>

        <div style={{ width: 1, height: 20, background: `${COLORS.muted}33`, margin: "0 4px" }} />

        <select
          value={posFilter}
          onChange={(e) => setPosFilter(e.target.value)}
          style={{ ...inputStyle, padding: "5px 8px", fontSize: 11, width: "auto" }}
        >
          {positions.map((p) => (
            <option key={p} value={p}>{p === "ALL" ? "All Positions" : p}</option>
          ))}
        </select>

        <div style={{ flex: 1 }} />

        <div style={{ position: "relative" }}>
          <Search />
          <input
            placeholder="Search player or team..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...inputStyle, paddingLeft: 30, width: 220 }}
          />
          <div style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: COLORS.muted, pointerEvents: "none" }}>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 10, fontFamily: mono }}>
        Showing {filtered.length} of {pool.length} players
        {signalFilter !== "ALL" && <span style={{ color: COLORS.primary }}> | Signal: {signalFilter}</span>}
        {posFilter !== "ALL" && <span style={{ color: COLORS.purple }}> | Pos: {posFilter}</span>}
      </div>

      {/* Player list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {filtered.slice(0, 50).map((p, i) => (
          <PlayerCard
            key={`${p.name}-${p.pos}`}
            player={p}
            rank={i + 1}
            expanded={expandedPlayer === p.name}
            onToggle={() => setExpandedPlayer(expandedPlayer === p.name ? null : p.name)}
          />
        ))}
      </div>

      {filtered.length > 50 && (
        <div style={{ textAlign: "center", padding: 16, color: COLORS.muted, fontSize: 12 }}>
          Showing top 50 of {filtered.length} results. Use search or filters to narrow.
        </div>
      )}

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: COLORS.muted, fontSize: 13 }}>
          No players match your filters.
        </div>
      )}
    </div>
  );
}
