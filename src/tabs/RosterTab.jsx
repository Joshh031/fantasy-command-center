import { useContext, useState, useMemo } from "react";
import { AppContext } from "../App.jsx";
import { ROSTER_SLOTS } from "../constants.js";
import { Users, Plus, Trash } from "../icons.jsx";

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

const MAX_ROSTER = 30;

export default function RosterTab() {
  const { roster, setRoster, keepers, showToast } = useContext(AppContext);

  const [addForm, setAddForm] = useState({
    name: "", pos: "SP", team: "", proj: "", ecr: "", age: "", notes: "",
  });

  const keeperMap = useMemo(() => {
    const m = {};
    keepers.forEach(k => { m[k.name] = k; });
    return m;
  }, [keepers]);

  const allPlayers = useMemo(() => {
    const map = new Map();
    keepers.forEach(p => map.set(p.name, p));
    roster.forEach(p => { if (!map.has(p.name)) map.set(p.name, p); });
    const arr = Array.from(map.values());
    arr.sort((a, b) => (b.proj || 0) - (a.proj || 0));
    return arr;
  }, [keepers, roster]);

  const posCounts = useMemo(() => {
    const counts = {};
    allPlayers.forEach(p => {
      counts[p.pos] = (counts[p.pos] || 0) + 1;
    });
    return counts;
  }, [allPlayers]);

  const slotCounts = useMemo(() => {
    const counts = {};
    ROSTER_SLOTS.forEach(s => { counts[s] = (counts[s] || 0) + 1; });
    return counts;
  }, []);

  const handleAdd = () => {
    if (!addForm.name.trim()) { showToast("Enter player name"); return; }
    if (allPlayers.length >= MAX_ROSTER) { showToast("Roster is full (30/30)"); return; }
    if (roster.find(p => p.name === addForm.name) || keepers.find(p => p.name === addForm.name)) {
      showToast(`${addForm.name} is already on the roster`);
      return;
    }
    const entry = {
      ...addForm,
      proj: parseFloat(addForm.proj) || 0,
      age: parseInt(addForm.age) || 0,
    };
    setRoster(prev => [...prev, entry]);
    setAddForm({ name: "", pos: "SP", team: "", proj: "", ecr: "", age: "", notes: "" });
    showToast(`${entry.name} added to roster`);
  };

  const removePlayer = (name) => {
    if (keeperMap[name]) {
      showToast(`${name} is a keeper - remove from Keepers tab`);
      return;
    }
    setRoster(prev => prev.filter(p => p.name !== name));
    showToast(`${name} removed from roster`);
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
    padding: "6px 10px",
    color: COLORS.text,
    fontSize: 13,
    fontFamily: mono,
  };

  return (
    <div>
      <h2 style={{ color: COLORS.text, fontSize: 22, fontWeight: 700, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
        <Users /> Roster
      </h2>

      {/* Roster Count Banner */}
      <div style={{
        ...sectionStyle,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div>
          <span style={{ color: COLORS.text, fontWeight: 700, fontSize: 24, fontFamily: mono }}>
            {allPlayers.length}
          </span>
          <span style={{ color: COLORS.muted, fontSize: 16 }}> / {MAX_ROSTER} roster spots filled</span>
        </div>
        <div style={{
          background: COLORS.bgDark,
          borderRadius: 8,
          height: 8,
          flex: 1,
          marginLeft: 20,
          maxWidth: 300,
          overflow: "hidden",
        }}>
          <div style={{
            background: allPlayers.length >= MAX_ROSTER ? COLORS.danger : COLORS.green,
            height: "100%",
            width: `${(allPlayers.length / MAX_ROSTER) * 100}%`,
            borderRadius: 8,
            transition: "width 0.3s",
          }} />
        </div>
      </div>

      {/* Position Counts */}
      <div style={sectionStyle}>
        <div style={headerStyle}>Position Summary</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {Object.entries(slotCounts)
            .filter((v, i, arr) => arr.findIndex(x => x[0] === v[0]) === i)
            .reduce((acc, [pos, need]) => {
              if (!acc.find(a => a[0] === pos)) acc.push([pos, need]);
              return acc;
            }, [])
            .map(([pos, need]) => {
              const have = posCounts[pos] || 0;
              const full = have >= need;
              return (
                <div key={pos} style={{
                  background: COLORS.bgDark,
                  borderRadius: 8,
                  padding: "8px 14px",
                  border: `1px solid ${full ? COLORS.green : COLORS.muted}33`,
                  textAlign: "center",
                  minWidth: 60,
                }}>
                  <div style={{ color: full ? COLORS.green : COLORS.amber, fontFamily: mono, fontSize: 16, fontWeight: 700 }}>
                    {have}/{need}
                  </div>
                  <div style={{ color: COLORS.muted, fontSize: 11, fontWeight: 600 }}>{pos}</div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Player List */}
      <div style={sectionStyle}>
        <div style={headerStyle}>All Players</div>

        {allPlayers.length === 0 && (
          <div style={{ color: COLORS.muted, textAlign: "center", padding: 20, fontSize: 14 }}>
            No players on your roster yet.
          </div>
        )}

        {allPlayers.map(p => {
          const kp = keeperMap[p.name];
          return (
            <div key={p.name} style={{
              display: "flex",
              alignItems: "center",
              padding: "10px 12px",
              borderBottom: `1px solid ${COLORS.muted}22`,
              gap: 10,
            }}>
              {/* Position */}
              <span style={{
                background: (p.pos === "SP" || p.pos === "RP") ? `${COLORS.purple}22` : `${COLORS.primary}22`,
                color: (p.pos === "SP" || p.pos === "RP") ? COLORS.purple : COLORS.primary,
                padding: "2px 8px",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 700,
                fontFamily: mono,
                minWidth: 32,
                textAlign: "center",
              }}>
                {p.pos}
              </span>

              {/* Name */}
              <span style={{ flex: 1, color: COLORS.text, fontWeight: 600, fontSize: 14 }}>
                {p.name}
              </span>

              {/* Team */}
              <span style={{ color: COLORS.muted, fontSize: 12, fontFamily: mono }}>{p.team || "—"}</span>

              {/* Keeper badge */}
              {kp && (
                <span style={{
                  background: kp.type === "major" ? `${COLORS.primary}22` : `${COLORS.green}22`,
                  color: kp.type === "major" ? COLORS.primary : COLORS.green,
                  padding: "1px 8px",
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 700,
                  fontFamily: mono,
                  textTransform: "uppercase",
                }}>
                  {kp.type === "major" ? "MAJOR" : "MINOR"}
                </span>
              )}

              {/* ECR */}
              {p.ecr && (
                <span style={{ color: COLORS.muted, fontSize: 11, fontFamily: mono }}>{p.ecr}</span>
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
                {p.proj ? p.proj.toFixed(1) : "—"}
              </span>

              {/* Remove */}
              <button
                onClick={() => removePlayer(p.name)}
                title={kp ? "Keeper - remove from Keepers tab" : "Remove"}
                style={{
                  background: kp ? `${COLORS.muted}22` : `${COLORS.danger}22`,
                  color: kp ? COLORS.muted : COLORS.danger,
                  border: "none",
                  borderRadius: 6,
                  padding: "4px 8px",
                  cursor: kp ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  opacity: kp ? 0.4 : 1,
                }}
              >
                <Trash />
              </button>
            </div>
          );
        })}
      </div>

      {/* Add Player Form */}
      <div style={sectionStyle}>
        <div style={headerStyle}><Plus /> Add Player</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10, marginBottom: 14 }}>
          <input
            placeholder="Player Name"
            value={addForm.name}
            onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
            style={{ ...inputStyle, gridColumn: "span 2" }}
          />
          <select
            value={addForm.pos}
            onChange={e => setAddForm(f => ({ ...f, pos: e.target.value }))}
            style={inputStyle}
          >
            {["C","1B","2B","3B","SS","OF","DH","SP","RP"].map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <input
            placeholder="Team"
            value={addForm.team}
            onChange={e => setAddForm(f => ({ ...f, team: e.target.value.toUpperCase() }))}
            style={inputStyle}
          />
          <input
            placeholder="Proj Pts"
            type="number"
            value={addForm.proj}
            onChange={e => setAddForm(f => ({ ...f, proj: e.target.value }))}
            style={inputStyle}
          />
          <input
            placeholder="ECR"
            value={addForm.ecr}
            onChange={e => setAddForm(f => ({ ...f, ecr: e.target.value }))}
            style={inputStyle}
          />
          <input
            placeholder="Age"
            type="number"
            value={addForm.age}
            onChange={e => setAddForm(f => ({ ...f, age: e.target.value }))}
            style={inputStyle}
          />
          <input
            placeholder="Notes"
            value={addForm.notes}
            onChange={e => setAddForm(f => ({ ...f, notes: e.target.value }))}
            style={{ ...inputStyle, gridColumn: "span 2" }}
          />
        </div>
        <button
          onClick={handleAdd}
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
          Add to Roster
        </button>
      </div>
    </div>
  );
}
