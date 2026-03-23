import { useState, useContext, useMemo } from "react";
import { AppContext } from "../App.jsx";
import { LEAGUE_SIZE, POS_TARGETS, FLAG_TYPES, BATTING_SCORING, PITCHING_SCORING } from "../constants.js";
import * as Icons from "../icons.jsx";
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

const ALL_POSITIONS = ["ALL", "C", "1B", "2B", "3B", "SS", "OF", "DH", "SP", "RP"];
const FLAG_CYCLE = ["none", "sleeper", "overvalued", "target", "mustDraft", "none"];

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

const btnBase = {
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontFamily: mono,
  fontWeight: 600,
  fontSize: 11,
  padding: "4px 10px",
  transition: "opacity 0.15s",
};

// ── Snake Draft Calculator ────────────────────────────────────────
function SnakeDraftCalc({ draftPick, setDraftPick }) {
  const picks = useMemo(() => {
    const p = draftPick || 1;
    const result = [];
    for (let round = 1; round <= 8; round++) {
      const pick =
        round % 2 === 1
          ? (round - 1) * LEAGUE_SIZE + p
          : round * LEAGUE_SIZE - p + 1;
      result.push({ round, pick });
    }
    return result;
  }, [draftPick]);

  return (
    <div style={sectionStyle}>
      <div style={headerStyle}>
        <Icons.Trophy /> Snake Draft Calculator
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <label style={{ color: COLORS.muted, fontSize: 13 }}>Pick Position:</label>
        <select
          value={draftPick || 1}
          onChange={(e) => setDraftPick(Number(e.target.value))}
          style={{
            background: COLORS.bgDark,
            color: COLORS.text,
            border: `1px solid ${COLORS.muted}55`,
            borderRadius: 6,
            padding: "6px 12px",
            fontFamily: mono,
            fontSize: 13,
          }}
        >
          {Array.from({ length: LEAGUE_SIZE }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              #{i + 1}
            </option>
          ))}
        </select>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {picks.map(({ round, pick }) => (
            <div
              key={round}
              style={{
                background: round % 2 === 1 ? `${COLORS.primary}22` : `${COLORS.purple}22`,
                border: `1px solid ${round % 2 === 1 ? COLORS.primary : COLORS.purple}44`,
                borderRadius: 6,
                padding: "6px 10px",
                textAlign: "center",
                minWidth: 64,
              }}
            >
              <div style={{ color: COLORS.muted, fontSize: 10, fontWeight: 600 }}>R{round}</div>
              <div style={{ color: COLORS.text, fontFamily: mono, fontWeight: 700, fontSize: 15 }}>
                #{pick}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Draft Optimizer — Top 3 Per Need ──────────────────────────────
function DraftOptimizer({ allPlayers, draftedSet, positionCounts, draftAdjustments, draftFlags, intelCache, onDraft }) {
  const needs = useMemo(() => {
    const result = [];
    for (const [pos, target] of Object.entries(POS_TARGETS)) {
      const count = positionCounts[pos] || 0;
      const needed = target - count;
      if (needed <= 0) continue;

      const available = allPlayers
        .filter((p) => p.pos === pos && !draftedSet[p.name])
        .map((p) => ({
          ...p,
          adjustedFpts: p.leagueFpts + (draftAdjustments[p.name] || 0),
        }))
        .sort((a, b) => b.adjustedFpts - a.adjustedFpts)
        .slice(0, 3);

      result.push({ pos, needed, target, count, available });
    }
    return result;
  }, [allPlayers, draftedSet, positionCounts, draftAdjustments]);

  if (needs.length === 0) {
    return (
      <div style={sectionStyle}>
        <div style={headerStyle}>
          <Icons.Check /> Draft Optimizer
        </div>
        <div style={{ color: COLORS.green, fontSize: 14 }}>All positional targets met!</div>
      </div>
    );
  }

  return (
    <div style={sectionStyle}>
      <div style={headerStyle}>
        <Icons.Star /> Draft Optimizer — Top 3 Per Need
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {needs.map(({ pos, needed, count, target, available }) => (
          <div key={pos}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span
                style={{
                  background: COLORS.primary,
                  color: "#fff",
                  borderRadius: 4,
                  padding: "2px 8px",
                  fontWeight: 700,
                  fontSize: 12,
                  fontFamily: mono,
                }}
              >
                {pos}
              </span>
              <span style={{ color: COLORS.muted, fontSize: 12 }}>
                {count}/{target} filled
              </span>
              <span
                style={{
                  background: needed >= 2 ? `${COLORS.danger}33` : `${COLORS.amber}33`,
                  color: needed >= 2 ? COLORS.danger : COLORS.amber,
                  borderRadius: 4,
                  padding: "2px 6px",
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                {needed >= 2 ? "NEED " + needed : "NEED 1"}
              </span>
            </div>
            {available.length === 0 ? (
              <div style={{ color: COLORS.muted, fontSize: 12, paddingLeft: 8 }}>
                No available players
              </div>
            ) : (
              available.map((p, idx) => (
                <div
                  key={p.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "6px 10px",
                    borderBottom: `1px solid ${COLORS.muted}15`,
                  }}
                >
                  <span style={{ color: COLORS.muted, fontSize: 11, fontFamily: mono, width: 20 }}>
                    #{idx + 1}
                  </span>
                  <span style={{ color: COLORS.text, fontWeight: 600, fontSize: 13, flex: 1 }}>
                    {p.name}
                  </span>
                  <span style={{ color: COLORS.muted, fontSize: 11 }}>{p.team}</span>
                  <span style={{ color: COLORS.primary, fontWeight: 700, fontFamily: mono, fontSize: 13 }}>
                    {p.adjustedFpts.toFixed(1)}
                  </span>
                  {draftFlags[p.name] && draftFlags[p.name] !== "none" && (
                    <span
                      style={{
                        background: `${FLAG_TYPES[draftFlags[p.name]].color}22`,
                        color: FLAG_TYPES[draftFlags[p.name]].color,
                        fontSize: 9,
                        fontWeight: 700,
                        borderRadius: 3,
                        padding: "1px 5px",
                      }}
                    >
                      {FLAG_TYPES[draftFlags[p.name]].label}
                    </span>
                  )}
                  {intelCache[p.name] && (
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        color:
                          intelCache[p.name] === "riser"
                            ? COLORS.green
                            : intelCache[p.name] === "faller"
                            ? COLORS.danger
                            : COLORS.amber,
                      }}
                    >
                      {intelCache[p.name] === "riser"
                        ? "\u25B2 RISER"
                        : intelCache[p.name] === "faller"
                        ? "\u25BC FALLER"
                        : "\u2014 HOLD"}
                    </span>
                  )}
                  <button
                    onClick={() => onDraft(p, "ME")}
                    style={{
                      ...btnBase,
                      background: COLORS.green,
                      color: COLORS.bgDark,
                    }}
                  >
                    DRAFT
                  </button>
                </div>
              ))
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Strategy Advisor Panel ────────────────────────────────────────
function StrategyAdvisor({ allPlayers, draftedSet, draftAdjustments }) {
  const [open, setOpen] = useState(false);

  const undrafted = useMemo(
    () => allPlayers.filter((p) => !draftedSet[p.name]),
    [allPlayers, draftedSet]
  );

  // Positional Scarcity Index
  const scarcity = useMemo(() => {
    const positions = Object.keys(POS_TARGETS);
    return positions.map((pos) => {
      const pool = undrafted
        .filter((p) => p.pos === pos)
        .sort((a, b) => b.leagueFpts - a.leagueFpts);
      const best = pool[0]?.leagueFpts || 0;
      const fifth = pool[4]?.leagueFpts || 0;
      const dropOff = best - fifth;
      return { pos, best, fifth, dropOff, count: pool.length };
    });
  }, [undrafted]);

  // Value Over Replacement
  const vorList = useMemo(() => {
    const replacementLevels = {};
    const positions = Object.keys(POS_TARGETS);
    positions.forEach((pos) => {
      const pool = undrafted
        .filter((p) => p.pos === pos)
        .sort((a, b) => b.leagueFpts - a.leagueFpts);
      // Replacement level = 12th best (10-team + 2 bench)
      replacementLevels[pos] = pool[11]?.leagueFpts || 0;
    });

    return undrafted
      .filter((p) => replacementLevels[p.pos] !== undefined)
      .map((p) => ({
        ...p,
        adjustedFpts: p.leagueFpts + (draftAdjustments[p.name] || 0),
        vor: p.leagueFpts + (draftAdjustments[p.name] || 0) - (replacementLevels[p.pos] || 0),
        replacementLevel: replacementLevels[p.pos] || 0,
      }))
      .sort((a, b) => b.vor - a.vor)
      .slice(0, 10);
  }, [undrafted, draftAdjustments]);

  // 2-Start SP Alert
  const twoStartSPs = useMemo(
    () =>
      undrafted
        .filter((p) => p.pos === "SP" && p.stats?.GS >= 30)
        .sort((a, b) => b.leagueFpts - a.leagueFpts),
    [undrafted]
  );

  // Closer Tier List
  const closers = useMemo(
    () =>
      undrafted
        .filter((p) => p.pos === "RP" && (p.stats?.S || 0) > 0)
        .sort((a, b) => (b.stats?.S || 0) - (a.stats?.S || 0)),
    [undrafted]
  );

  // K-Rate Risk
  const kRisk = useMemo(
    () =>
      undrafted
        .filter((p) => p.pos !== "SP" && p.pos !== "RP" && (p.stats?.K || 0) > 150)
        .sort((a, b) => (b.stats?.K || 0) - (a.stats?.K || 0)),
    [undrafted]
  );

  const subHeader = {
    fontSize: 14,
    fontWeight: 700,
    color: COLORS.amber,
    marginTop: 16,
    marginBottom: 8,
    display: "flex",
    alignItems: "center",
    gap: 6,
  };

  const tableRow = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "5px 8px",
    borderBottom: `1px solid ${COLORS.muted}15`,
    fontSize: 12,
  };

  return (
    <div style={sectionStyle}>
      <div
        style={{ ...headerStyle, cursor: "pointer", userSelect: "none" }}
        onClick={() => setOpen(!open)}
      >
        <Icons.TrendUp /> Strategy Advisor
        <span
          style={{
            marginLeft: "auto",
            fontSize: 12,
            color: COLORS.muted,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
            display: "inline-block",
          }}
        >
          <Icons.ChevDown />
        </span>
      </div>

      {open && (
        <div>
          {/* Positional Scarcity Index */}
          <div style={subHeader}>Positional Scarcity Index</div>
          <div style={{ ...tableRow, fontWeight: 700, color: COLORS.muted, fontSize: 10, borderBottom: `1px solid ${COLORS.muted}33` }}>
            <span style={{ width: 40 }}>POS</span>
            <span style={{ width: 70, textAlign: "right" }}>BEST</span>
            <span style={{ width: 70, textAlign: "right" }}>5TH</span>
            <span style={{ width: 70, textAlign: "right" }}>DROP</span>
            <span style={{ flex: 1 }}>SIGNAL</span>
          </div>
          {scarcity.map((s) => {
            const signal =
              s.dropOff > 40
                ? { label: "DRAFT NOW", color: COLORS.danger }
                : s.dropOff > 20
                ? { label: "MONITOR", color: COLORS.amber }
                : { label: "CAN WAIT", color: COLORS.green };
            return (
              <div key={s.pos} style={tableRow}>
                <span style={{ width: 40, fontWeight: 700, color: COLORS.primary, fontFamily: mono }}>{s.pos}</span>
                <span style={{ width: 70, textAlign: "right", fontFamily: mono, color: COLORS.text }}>
                  {s.best.toFixed(1)}
                </span>
                <span style={{ width: 70, textAlign: "right", fontFamily: mono, color: COLORS.muted }}>
                  {s.fifth.toFixed(1)}
                </span>
                <span style={{ width: 70, textAlign: "right", fontFamily: mono, color: COLORS.text }}>
                  {s.dropOff.toFixed(1)}
                </span>
                <span
                  style={{
                    flex: 1,
                    fontWeight: 700,
                    fontSize: 10,
                    color: signal.color,
                    background: `${signal.color}18`,
                    borderRadius: 3,
                    padding: "2px 6px",
                    display: "inline-block",
                    width: "fit-content",
                  }}
                >
                  {signal.label}
                </span>
              </div>
            );
          })}

          {/* Value Over Replacement */}
          <div style={subHeader}>Top 10 Value Over Replacement (VOR)</div>
          {vorList.map((p, idx) => (
            <div key={p.name} style={tableRow}>
              <span style={{ width: 20, fontFamily: mono, color: COLORS.muted }}>
                {idx + 1}
              </span>
              <span style={{ flex: 1, color: COLORS.text, fontWeight: 600 }}>{p.name}</span>
              <span
                style={{
                  background: `${COLORS.primary}22`,
                  color: COLORS.primary,
                  borderRadius: 4,
                  padding: "1px 6px",
                  fontWeight: 700,
                  fontSize: 10,
                  fontFamily: mono,
                }}
              >
                {p.pos}
              </span>
              <span style={{ fontFamily: mono, color: COLORS.text, width: 55, textAlign: "right" }}>
                {p.adjustedFpts.toFixed(1)}
              </span>
              <span
                style={{
                  fontFamily: mono,
                  fontWeight: 700,
                  color: p.vor > 0 ? COLORS.green : COLORS.danger,
                  width: 65,
                  textAlign: "right",
                }}
              >
                VOR {p.vor > 0 ? "+" : ""}
                {p.vor.toFixed(1)}
              </span>
            </div>
          ))}

          {/* 2-Start SP Alert */}
          <div style={subHeader}>2-Start SP Alert (GS {"\u2265"} 30)</div>
          {twoStartSPs.length === 0 ? (
            <div style={{ color: COLORS.muted, fontSize: 12, paddingLeft: 8 }}>None available</div>
          ) : (
            twoStartSPs.map((p) => (
              <div key={p.name} style={tableRow}>
                <span style={{ flex: 1, color: COLORS.text, fontWeight: 600 }}>{p.name}</span>
                <span style={{ color: COLORS.muted, fontSize: 11 }}>{p.team}</span>
                <span style={{ fontFamily: mono, fontSize: 11, color: COLORS.green }}>
                  {p.stats.GS} GS
                </span>
                <span style={{ fontFamily: mono, fontWeight: 700, color: COLORS.primary }}>
                  {p.leagueFpts.toFixed(1)}
                </span>
              </div>
            ))
          )}

          {/* Closer Tier List */}
          <div style={subHeader}>Closer Tier List (by Saves)</div>
          {closers.length === 0 ? (
            <div style={{ color: COLORS.muted, fontSize: 12, paddingLeft: 8 }}>None available</div>
          ) : (
            closers.slice(0, 15).map((p) => (
              <div key={p.name} style={tableRow}>
                <span style={{ flex: 1, color: COLORS.text, fontWeight: 600 }}>{p.name}</span>
                <span style={{ color: COLORS.muted, fontSize: 11 }}>{p.team}</span>
                <span style={{ fontFamily: mono, fontSize: 11, color: COLORS.amber }}>
                  {p.stats.S} SV
                </span>
                <span style={{ fontFamily: mono, fontWeight: 700, color: COLORS.primary }}>
                  {p.leagueFpts.toFixed(1)}
                </span>
              </div>
            ))
          )}

          {/* K-Rate Risk */}
          <div style={subHeader}>K-Rate Risk (K &gt; 150)</div>
          {kRisk.length === 0 ? (
            <div style={{ color: COLORS.muted, fontSize: 12, paddingLeft: 8 }}>No high-K batters available</div>
          ) : (
            kRisk.map((p) => (
              <div key={p.name} style={tableRow}>
                <span style={{ flex: 1, color: COLORS.text, fontWeight: 600 }}>{p.name}</span>
                <span style={{ color: COLORS.muted, fontSize: 11 }}>{p.team}</span>
                <span style={{ fontFamily: mono, fontSize: 11, color: COLORS.danger }}>
                  {p.stats.K} K
                </span>
                <span style={{ fontFamily: mono, fontSize: 11, color: COLORS.warning }}>
                  {(p.stats.K * -1).toFixed(0)} FPTS
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── Main DraftTab Component ───────────────────────────────────────
export default function DraftTab() {
  const {
    keepers,
    roster,
    draftPool,
    setDraftPool,
    draftPick,
    setDraftPick,
    draftLog,
    setDraftLog,
    draftFlags,
    setDraftFlags,
    draftAdjustments,
    setDraftAdjustments,
    intelCache,
    showToast,
  } = useContext(AppContext);

  const [posFilter, setPosFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("leagueFpts");
  const [hideDrafted, setHideDrafted] = useState(false);
  const [flagFilter, setFlagFilter] = useState("all");

  const allPlayers = useMemo(() => [...battersData, ...pitchersData], []);

  const draftedSet = useMemo(() => {
    const set = {};
    draftPool.forEach((p) => {
      if (p.drafted) set[p.name] = p.draftedBy;
    });
    return set;
  }, [draftPool]);

  // Position counts from keepers + roster + draftPool ME entries
  const positionCounts = useMemo(() => {
    const counts = {};
    const counted = new Set();
    const addPlayer = (p) => {
      if (counted.has(p.name)) return;
      counted.add(p.name);
      counts[p.pos] = (counts[p.pos] || 0) + 1;
    };
    keepers.forEach(addPlayer);
    roster.forEach(addPlayer);
    draftPool.forEach((p) => {
      if (p.drafted && p.draftedBy === "ME") {
        // Find the player in allPlayers to get their position
        const full = allPlayers.find((ap) => ap.name === p.name);
        if (full && !counted.has(p.name)) {
          counted.add(p.name);
          counts[full.pos] = (counts[full.pos] || 0) + 1;
        }
      }
    });
    return counts;
  }, [keepers, roster, draftPool, allPlayers]);

  // Draft action handlers
  const handleDraft = (player, draftedBy) => {
    setDraftPool((prev) => {
      const existing = prev.findIndex((p) => p.name === player.name);
      const entry = { name: player.name, drafted: true, draftedBy };
      if (existing >= 0) {
        const next = [...prev];
        next[existing] = entry;
        return next;
      }
      return [...prev, entry];
    });
    setDraftLog((prev) => [
      { drafter: draftedBy, player: player.name, pos: player.pos, time: Date.now() },
      ...prev,
    ]);
    showToast(`${player.name} drafted by ${draftedBy}`);
  };

  const handleDraftMe = (player) => {
    handleDraft(player, "ME");
  };

  const handleDraftOff = (player) => {
    const team = prompt("Enter team name that drafted " + player.name + ":");
    if (team && team.trim()) {
      handleDraft(player, team.trim());
    }
  };

  const handleUndo = (playerName) => {
    setDraftPool((prev) =>
      prev.map((p) => (p.name === playerName ? { ...p, drafted: false, draftedBy: null } : p))
    );
    setDraftLog((prev) => prev.filter((e) => e.player !== playerName));
    showToast(`Undid draft for ${playerName}`);
  };

  const cycleFlag = (playerName) => {
    setDraftFlags((prev) => {
      const current = prev[playerName] || "none";
      const idx = FLAG_CYCLE.indexOf(current);
      const next = FLAG_CYCLE[(idx + 1) % FLAG_CYCLE.length];
      if (next === "none") {
        const copy = { ...prev };
        delete copy[playerName];
        return copy;
      }
      return { ...prev, [playerName]: next };
    });
  };

  const setAdjustment = (playerName, val) => {
    setDraftAdjustments((prev) => {
      const num = parseFloat(val);
      if (isNaN(num) || num === 0) {
        const copy = { ...prev };
        delete copy[playerName];
        return copy;
      }
      return { ...prev, [playerName]: num };
    });
  };

  // Filtered + sorted player pool
  const filteredPlayers = useMemo(() => {
    let pool = allPlayers.map((p) => ({
      ...p,
      adjustedFpts: p.leagueFpts + (draftAdjustments[p.name] || 0),
      isDrafted: !!draftedSet[p.name],
      draftedBy: draftedSet[p.name] || null,
      flag: draftFlags[p.name] || "none",
    }));

    if (posFilter !== "ALL") {
      pool = pool.filter((p) => p.pos === posFilter);
    }
    if (search.trim()) {
      const s = search.toLowerCase();
      pool = pool.filter(
        (p) => p.name.toLowerCase().includes(s) || p.team.toLowerCase().includes(s)
      );
    }
    if (hideDrafted) {
      pool = pool.filter((p) => !p.isDrafted);
    }
    if (flagFilter !== "all") {
      pool = pool.filter((p) => p.flag === flagFilter);
    }

    pool.sort((a, b) => {
      if (sortBy === "leagueFpts") return b.adjustedFpts - a.adjustedFpts;
      if (sortBy === "cbsFpts") return (b.cbsFpts || 0) - (a.cbsFpts || 0);
      if (sortBy === "cbsRank") return (a.cbsRank || 999) - (b.cbsRank || 999);
      return 0;
    });

    return pool;
  }, [allPlayers, posFilter, search, hideDrafted, flagFilter, sortBy, draftedSet, draftFlags, draftAdjustments]);

  const poolStats = useMemo(() => {
    const total = allPlayers.length;
    const drafted = Object.keys(draftedSet).length;
    return { total, available: total - drafted, drafted };
  }, [allPlayers, draftedSet]);

  return (
    <div>
      {/* Section 1: Snake Draft Calculator */}
      <SnakeDraftCalc draftPick={draftPick} setDraftPick={setDraftPick} />

      {/* Section 2: Draft Optimizer */}
      <DraftOptimizer
        allPlayers={allPlayers}
        draftedSet={draftedSet}
        positionCounts={positionCounts}
        draftAdjustments={draftAdjustments}
        draftFlags={draftFlags}
        intelCache={intelCache}
        onDraft={handleDraftMe}
      />

      {/* Section 3: Strategy Advisor */}
      <StrategyAdvisor
        allPlayers={allPlayers}
        draftedSet={draftedSet}
        draftAdjustments={draftAdjustments}
      />

      {/* Section 4: Player Pool / Draft Board */}
      <div style={sectionStyle}>
        <div style={headerStyle}>
          <Icons.Users /> Player Pool / Draft Board
        </div>

        {/* Filter Bar */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          {ALL_POSITIONS.map((pos) => (
            <button
              key={pos}
              onClick={() => setPosFilter(pos)}
              style={{
                ...btnBase,
                background: posFilter === pos ? COLORS.primary : `${COLORS.muted}22`,
                color: posFilter === pos ? "#fff" : COLORS.muted,
                fontSize: 11,
              }}
            >
              {pos}
            </button>
          ))}
          <input
            type="text"
            placeholder="Search players..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: COLORS.bgDark,
              color: COLORS.text,
              border: `1px solid ${COLORS.muted}44`,
              borderRadius: 6,
              padding: "5px 10px",
              fontSize: 12,
              width: 160,
              outline: "none",
            }}
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              background: COLORS.bgDark,
              color: COLORS.text,
              border: `1px solid ${COLORS.muted}44`,
              borderRadius: 6,
              padding: "5px 10px",
              fontSize: 12,
            }}
          >
            <option value="leagueFpts">League FPTS</option>
            <option value="cbsFpts">CBS FPTS</option>
            <option value="cbsRank">My Rank</option>
          </select>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              color: COLORS.muted,
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={hideDrafted}
              onChange={(e) => setHideDrafted(e.target.checked)}
            />
            Hide drafted
          </label>
          <select
            value={flagFilter}
            onChange={(e) => setFlagFilter(e.target.value)}
            style={{
              background: COLORS.bgDark,
              color: COLORS.text,
              border: `1px solid ${COLORS.muted}44`,
              borderRadius: 6,
              padding: "5px 10px",
              fontSize: 12,
            }}
          >
            <option value="all">All Flags</option>
            {Object.entries(FLAG_TYPES)
              .filter(([k]) => k !== "none")
              .map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
          </select>
        </div>

        {/* Pool Count */}
        <div style={{ display: "flex", gap: 16, marginBottom: 12, fontSize: 12 }}>
          <span style={{ color: COLORS.muted }}>
            <span style={{ color: COLORS.text, fontWeight: 700, fontFamily: mono }}>
              {poolStats.total}
            </span>{" "}
            total
          </span>
          <span style={{ color: COLORS.muted }}>
            <span style={{ color: COLORS.green, fontWeight: 700, fontFamily: mono }}>
              {poolStats.available}
            </span>{" "}
            available
          </span>
          <span style={{ color: COLORS.muted }}>
            <span style={{ color: COLORS.danger, fontWeight: 700, fontFamily: mono }}>
              {poolStats.drafted}
            </span>{" "}
            drafted
          </span>
        </div>

        {/* Player Rows */}
        <div style={{ maxHeight: 600, overflowY: "auto", overflowX: "hidden" }}>
          {filteredPlayers.map((p) => {
            const isBatter = p.pos !== "SP" && p.pos !== "RP";
            const highK = isBatter && (p.stats?.K || 0) > 150;
            const twoStart = p.pos === "SP" && (p.stats?.GS || 0) >= 30;
            const intel = intelCache[p.name];
            const flagType = draftFlags[p.name] || "none";
            const flagColor = FLAG_TYPES[flagType]?.color || "transparent";
            const adj = draftAdjustments[p.name] || 0;

            return (
              <div
                key={`${p.name}-${p.pos}-${p.team}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "7px 8px",
                  borderBottom: `1px solid ${COLORS.muted}15`,
                  opacity: p.isDrafted ? 0.4 : 1,
                }}
              >
                {/* Flag indicator */}
                <div
                  onClick={() => cycleFlag(p.name)}
                  title={flagType !== "none" ? FLAG_TYPES[flagType].label : "Set flag"}
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: flagColor,
                    border: flagType === "none" ? `1px solid ${COLORS.muted}44` : "none",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                />

                {/* CBS rank */}
                <span
                  style={{
                    fontFamily: mono,
                    fontSize: 10,
                    color: COLORS.muted,
                    width: 28,
                    textAlign: "right",
                    flexShrink: 0,
                  }}
                >
                  #{p.cbsRank}
                </span>

                {/* Name */}
                <span
                  style={{
                    color: COLORS.text,
                    fontWeight: 600,
                    fontSize: 13,
                    flex: 1,
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    textDecoration: p.isDrafted ? "line-through" : "none",
                  }}
                >
                  {p.name}
                </span>

                {/* Position badge */}
                <span
                  style={{
                    background: `${COLORS.primary}22`,
                    color: COLORS.primary,
                    borderRadius: 4,
                    padding: "1px 6px",
                    fontSize: 10,
                    fontWeight: 700,
                    fontFamily: mono,
                    flexShrink: 0,
                  }}
                >
                  {p.pos}
                </span>

                {/* Team */}
                <span
                  style={{
                    color: COLORS.muted,
                    fontSize: 11,
                    width: 32,
                    textAlign: "center",
                    flexShrink: 0,
                  }}
                >
                  {p.team}
                </span>

                {/* League FPTS (adjusted) */}
                <span
                  style={{
                    color: COLORS.primary,
                    fontWeight: 700,
                    fontFamily: mono,
                    fontSize: 13,
                    width: 55,
                    textAlign: "right",
                    flexShrink: 0,
                  }}
                >
                  {p.adjustedFpts.toFixed(1)}
                </span>

                {/* CBS FPTS */}
                <span
                  style={{
                    color: COLORS.muted,
                    fontFamily: mono,
                    fontSize: 11,
                    width: 50,
                    textAlign: "right",
                    flexShrink: 0,
                  }}
                >
                  {p.cbsFpts.toFixed(1)}
                </span>

                {/* Adjustment input */}
                <input
                  type="number"
                  placeholder="+/-"
                  value={adj || ""}
                  onChange={(e) => setAdjustment(p.name, e.target.value)}
                  style={{
                    background: COLORS.bgDark,
                    color: adj > 0 ? COLORS.green : adj < 0 ? COLORS.danger : COLORS.text,
                    border: `1px solid ${COLORS.muted}33`,
                    borderRadius: 4,
                    padding: "3px 4px",
                    fontFamily: mono,
                    fontSize: 11,
                    width: 48,
                    textAlign: "center",
                    outline: "none",
                    flexShrink: 0,
                  }}
                />

                {/* Intel badge */}
                {intel && (
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      flexShrink: 0,
                      color:
                        intel === "riser"
                          ? COLORS.green
                          : intel === "faller"
                          ? COLORS.danger
                          : COLORS.amber,
                    }}
                  >
                    {intel === "riser"
                      ? "\u25B2"
                      : intel === "faller"
                      ? "\u25BC"
                      : "\u2014"}
                  </span>
                )}

                {/* K-rate warning */}
                {highK && (
                  <span
                    title={`${p.stats.K} K (${(p.stats.K * -1).toFixed(0)} FPTS)`}
                    style={{ fontSize: 12, flexShrink: 0, cursor: "help" }}
                  >
                    <Icons.Alert />
                  </span>
                )}

                {/* 2-start badge */}
                {twoStart && (
                  <span
                    style={{
                      background: `${COLORS.green}22`,
                      color: COLORS.green,
                      fontSize: 9,
                      fontWeight: 700,
                      borderRadius: 3,
                      padding: "1px 4px",
                      flexShrink: 0,
                    }}
                  >
                    2SP
                  </span>
                )}

                {/* Drafted by indicator */}
                {p.isDrafted && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: p.draftedBy === "ME" ? COLORS.green : COLORS.warning,
                      flexShrink: 0,
                    }}
                  >
                    {p.draftedBy}
                  </span>
                )}

                {/* Action buttons */}
                {!p.isDrafted ? (
                  <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                    <button
                      onClick={() => handleDraftMe(p)}
                      style={{
                        ...btnBase,
                        background: COLORS.green,
                        color: COLORS.bgDark,
                      }}
                    >
                      DRAFT
                    </button>
                    <button
                      onClick={() => handleDraftOff(p)}
                      style={{
                        ...btnBase,
                        background: COLORS.warning,
                        color: "#fff",
                      }}
                    >
                      OFF
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleUndo(p.name)}
                    style={{
                      ...btnBase,
                      background: `${COLORS.muted}33`,
                      color: COLORS.muted,
                    }}
                  >
                    UNDO
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 5: Draft Log */}
      <div style={sectionStyle}>
        <div style={headerStyle}>
          <Icons.Clock /> Draft Log
          {draftLog.length > 0 && (
            <span style={{ fontSize: 12, color: COLORS.muted, fontWeight: 400 }}>
              ({draftLog.length} picks)
            </span>
          )}
        </div>
        {draftLog.length === 0 ? (
          <div style={{ color: COLORS.muted, fontSize: 13 }}>No picks yet. Start drafting above.</div>
        ) : (
          <div style={{ maxHeight: 300, overflowY: "auto" }}>
            {draftLog.map((entry, idx) => (
              <div
                key={entry.time + "-" + idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "5px 8px",
                  borderBottom: `1px solid ${COLORS.muted}12`,
                  fontSize: 13,
                }}
              >
                <span style={{ fontFamily: mono, color: COLORS.muted, fontSize: 10, width: 20 }}>
                  {draftLog.length - idx}
                </span>
                <span
                  style={{
                    fontWeight: 700,
                    color: entry.drafter === "ME" ? COLORS.green : COLORS.warning,
                    minWidth: 60,
                  }}
                >
                  {entry.drafter}
                </span>
                <span style={{ color: COLORS.muted }}>{"\u2192"}</span>
                <span style={{ color: COLORS.text, fontWeight: 600 }}>{entry.player}</span>
                <span
                  style={{
                    background: `${COLORS.primary}22`,
                    color: COLORS.primary,
                    borderRadius: 4,
                    padding: "1px 5px",
                    fontSize: 10,
                    fontWeight: 700,
                    fontFamily: mono,
                  }}
                >
                  {entry.pos}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
