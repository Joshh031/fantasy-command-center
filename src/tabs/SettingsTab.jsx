import { useState, useContext } from "react";
import { AppContext } from "../App.jsx";
import { TEAM_NAME, LEAGUE_NAME, SEASON, LEAGUE_SIZE, BATTING_SCORING, PITCHING_SCORING } from "../constants.js";
import * as Icons from "../icons.jsx";

const colors = {
  blue: "#3b82f6",
  green: "#00ff88",
  danger: "#ff4a4a",
  bg: "#0a0a0f",
  surface: "#0f1017",
  text: "#e0e6ed",
  muted: "#556677",
};

const panelStyle = {
  background: colors.surface,
  border: `1px solid ${colors.muted}33`,
  borderRadius: 12,
  padding: 20,
  marginBottom: 16,
};

const labelStyle = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: 1,
  color: colors.muted,
  marginBottom: 8,
};

const btnStyle = (color = colors.blue) => ({
  background: `${color}22`,
  color: color,
  border: `1px solid ${color}44`,
  borderRadius: 8,
  padding: "10px 20px",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: 14,
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  transition: "all 0.2s",
});

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
  gap: 6,
};

const gridCellStyle = {
  background: `${colors.muted}15`,
  borderRadius: 6,
  padding: "6px 10px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  fontSize: 13,
};

export default function SettingsTab() {
  const ctx = useContext(AppContext);
  const [importText, setImportText] = useState("");
  const [clearConfirm, setClearConfirm] = useState(false);

  const handleExport = () => {
    navigator.clipboard.writeText(ctx.exportData());
    ctx.showToast("Data copied to clipboard");
  };

  const handleImport = () => {
    try {
      ctx.importData(importText);
      ctx.showToast("Data imported successfully");
      setImportText("");
    } catch (err) {
      ctx.showToast("Import failed: " + err.message);
    }
  };

  const handleClear = () => {
    if (!clearConfirm) {
      setClearConfirm(true);
      return;
    }
    try {
      ctx.importData(JSON.stringify({}));
      ctx.showToast("All data cleared");
    } catch (err) {
      ctx.showToast("Clear failed: " + err.message);
    }
    setClearConfirm(false);
  };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      {/* Data Sync */}
      <div style={panelStyle}>
        <div style={labelStyle}>Data Sync</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 10, height: 10, borderRadius: "50%",
            background: colors.green, boxShadow: `0 0 8px ${colors.green}66`,
          }} />
          <span style={{ color: colors.text, fontSize: 14 }}>Local storage active</span>
        </div>
        <div style={{ color: colors.muted, fontSize: 12, marginTop: 6 }}>
          Last sync: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Export Data */}
      <div style={panelStyle}>
        <div style={labelStyle}>Export Data</div>
        <p style={{ color: colors.muted, fontSize: 13, marginBottom: 12 }}>
          Copy all app data as JSON to your clipboard for backup or transfer.
        </p>
        <button style={btnStyle(colors.blue)} onClick={handleExport}>
          <Icons.Download /> Copy All Data to Clipboard
        </button>
      </div>

      {/* Import Data */}
      <div style={panelStyle}>
        <div style={labelStyle}>Import Data</div>
        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder="Paste exported JSON data here..."
          style={{
            width: "100%",
            minHeight: 100,
            background: colors.bg,
            border: `1px solid ${colors.muted}33`,
            borderRadius: 8,
            color: colors.text,
            fontFamily: "monospace",
            fontSize: 13,
            padding: 12,
            resize: "vertical",
            boxSizing: "border-box",
            marginBottom: 10,
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            style={{
              ...btnStyle(colors.green),
              opacity: importText.trim() ? 1 : 0.4,
              pointerEvents: importText.trim() ? "auto" : "none",
            }}
            onClick={handleImport}
          >
            <Icons.Upload /> Import Data
          </button>
          <span style={{ color: colors.danger, fontSize: 12 }}>
            This will overwrite all current data
          </span>
        </div>
      </div>

      {/* Clear All Data */}
      <div style={{
        ...panelStyle,
        border: `1px solid ${colors.danger}44`,
      }}>
        <div style={{ ...labelStyle, color: colors.danger }}>Danger Zone</div>
        <p style={{ color: colors.muted, fontSize: 13, marginBottom: 12 }}>
          Permanently remove all saved data. This cannot be undone.
        </p>
        <button
          style={btnStyle(colors.danger)}
          onClick={handleClear}
        >
          <Icons.Trash /> {clearConfirm ? "Are you sure? Click again to confirm" : "Clear All Data"}
        </button>
      </div>

      {/* League Info */}
      <div style={panelStyle}>
        <div style={labelStyle}>League Info</div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
          marginBottom: 16,
        }}>
          {[
            ["Team", TEAM_NAME],
            ["League", LEAGUE_NAME],
            ["Season", SEASON],
            ["Size", `${LEAGUE_SIZE} teams`],
          ].map(([label, value]) => (
            <div key={label} style={{
              background: `${colors.muted}15`,
              borderRadius: 8,
              padding: "10px 14px",
            }}>
              <div style={{ color: colors.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>
                {label}
              </div>
              <div style={{ color: colors.text, fontSize: 15, fontWeight: 600, marginTop: 2 }}>
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Batting Scoring */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ ...labelStyle, fontSize: 10 }}>Batting Scoring</div>
          <div style={gridStyle}>
            {Object.entries(BATTING_SCORING).map(([cat, pts]) => (
              <div key={cat} style={gridCellStyle}>
                <span style={{ color: colors.text, fontWeight: 600 }}>{cat}</span>
                <span style={{ color: pts > 0 ? colors.green : pts < 0 ? colors.danger : colors.muted, fontWeight: 700 }}>
                  {pts > 0 ? "+" : ""}{pts}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Pitching Scoring */}
        <div>
          <div style={{ ...labelStyle, fontSize: 10 }}>Pitching Scoring</div>
          <div style={gridStyle}>
            {Object.entries(PITCHING_SCORING).map(([cat, pts]) => (
              <div key={cat} style={gridCellStyle}>
                <span style={{ color: colors.text, fontWeight: 600 }}>{cat}</span>
                <span style={{ color: pts > 0 ? colors.green : pts < 0 ? colors.danger : colors.muted, fontWeight: 700 }}>
                  {pts > 0 ? "+" : ""}{pts}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
