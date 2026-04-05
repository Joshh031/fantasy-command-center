import { useState, useEffect, useCallback, useMemo, createContext } from "react";
import { TEAM_NAME, LEAGUE_NAME, SEASON, INITIAL_KEEPERS, INITIAL_KEEPER_WATCHLIST } from "./constants.js";
import { saveAll, loadLocal, listenForSync, exportData, importData } from "./storage.js";
import { onAuthReady } from "./firebase.js";
import * as Icons from "./icons.jsx";
import MyTeamTab from "./tabs/MyTeamTab.jsx";
import KeepersTab from "./tabs/KeepersTab.jsx";
import DraftTab from "./tabs/DraftTab.jsx";
import RosterTab from "./tabs/RosterTab.jsx";
import FreeAgentTab from "./tabs/FreeAgentTab.jsx";
import TradeTab from "./tabs/TradeTab.jsx";
import IntelTab from "./tabs/IntelTab.jsx";
import SettingsTab from "./tabs/SettingsTab.jsx";
import KidsNutrition from "./KidsNutrition.jsx";

export const AppContext = createContext(null);

const PIN = "1211";

function PinGate({ onSuccess }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handleKey = (n) => {
    if (pin.length >= 4) return;
    const next = pin + n;
    setPin(next);
    if (next.length === 4) {
      if (next === PIN) {
        sessionStorage.setItem("fcc_auth", PIN);
        onSuccess();
      } else {
        setError("Incorrect PIN");
        setTimeout(() => { setPin(""); setError(""); }, 800);
      }
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) setPin(pin.slice(0, -1));
  };

  return (
    <div className="pin-overlay">
      <div className="pin-box">
        <div className="pin-logo">🍎</div>
        <div className="pin-title">Kids Fuel</div>
        <div className="pin-sub">Enter PIN to continue</div>
        <div className="pin-dots">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`pin-dot ${i < pin.length ? (error ? "error" : "filled") : ""}`} />
          ))}
        </div>
        <div className="pin-grid">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, "del"].map((k, i) => (
            k === null ? <div key={i} /> :
            k === "del" ? (
              <button key={i} className="pin-key del" onClick={handleDelete}>DEL</button>
            ) : (
              <button key={i} className="pin-key" onClick={() => handleKey(String(k))}>{k}</button>
            )
          ))}
        </div>
        <div className="pin-error">{error}</div>
      </div>
    </div>
  );
}

export default function App() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem("fcc_auth") === PIN);
  const [activeApp, setActiveApp] = useState(() => localStorage.getItem("fcc-active-app") || "nutrition");
  const [activeTab, setActiveTab] = useState("myteam");
  const [syncStatus, setSyncStatus] = useState("…");
  const [toast, setToast] = useState(null);
  const [loaded, setLoaded] = useState(false);

  // App state
  const [keepers, setKeepers] = useState(INITIAL_KEEPERS);
  const [keeperWatchlist, setKeeperWatchlist] = useState(INITIAL_KEEPER_WATCHLIST);
  const [roster, setRoster] = useState([]);
  const [draftPool, setDraftPool] = useState([]);
  const [draftPick, setDraftPick] = useState(null);
  const [draftLog, setDraftLog] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [notes, setNotes] = useState("");
  const [news, setNews] = useState([]);
  const [draftFlags, setDraftFlags] = useState({});
  const [draftAdjustments, setDraftAdjustments] = useState({});
  const [intelCache, setIntelCache] = useState({});
  const [tradeMyPlayers, setTradeMyPlayers] = useState([]);
  const [tradeTheirPlayers, setTradeTheirPlayers] = useState([]);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  // Load from localStorage on mount
  useEffect(() => {
    const local = loadLocal();
    if (local.keepers?.length) setKeepers(local.keepers);
    if (local.keeperWatchlist?.length) setKeeperWatchlist(local.keeperWatchlist);
    if (local.roster) setRoster(local.roster);
    if (local.draftPool) setDraftPool(local.draftPool);
    if (local.draftPick !== undefined) setDraftPick(local.draftPick);
    if (local.draftLog) setDraftLog(local.draftLog);
    if (local.watchlist) setWatchlist(local.watchlist);
    if (local.notes) setNotes(local.notes);
    if (local.news) setNews(local.news);
    if (local.draftFlags) setDraftFlags(local.draftFlags);
    if (local.draftAdjustments) setDraftAdjustments(local.draftAdjustments);
    if (local.intelCache) setIntelCache(local.intelCache);
    setLoaded(true);
  }, []);

  // Firebase sync listener
  useEffect(() => {
    onAuthReady(() => {
      setSyncStatus("ok");
      listenForSync((val) => {
        if (val.keepers?.length) setKeepers(val.keepers);
        if (val.keeperWatchlist) setKeeperWatchlist(val.keeperWatchlist);
        if (val.roster) setRoster(val.roster);
        if (val.draftPool) setDraftPool(val.draftPool);
        if (val.draftPick !== undefined) setDraftPick(val.draftPick);
        if (val.draftLog) setDraftLog(val.draftLog);
        if (val.watchlist) setWatchlist(val.watchlist);
        if (val.notes !== undefined) setNotes(val.notes);
        if (val.news) setNews(val.news);
        if (val.draftFlags) setDraftFlags(val.draftFlags);
        if (val.draftAdjustments) setDraftAdjustments(val.draftAdjustments);
        if (val.intelCache) setIntelCache(val.intelCache);
      });
    });
  }, []);

  // Auto-save on state changes
  useEffect(() => {
    if (!loaded) return;
    saveAll({
      keepers, keeperWatchlist, roster, draftPool, draftPick,
      draftLog, watchlist, notes, news, draftFlags, draftAdjustments, intelCache,
    });
  }, [keepers, keeperWatchlist, roster, draftPool, draftPick, draftLog, watchlist, notes, news, draftFlags, draftAdjustments, intelCache, loaded]);

  const ctx = useMemo(() => ({
    keepers, setKeepers,
    keeperWatchlist, setKeeperWatchlist,
    roster, setRoster,
    draftPool, setDraftPool,
    draftPick, setDraftPick,
    draftLog, setDraftLog,
    watchlist, setWatchlist,
    notes, setNotes,
    news, setNews,
    draftFlags, setDraftFlags,
    draftAdjustments, setDraftAdjustments,
    intelCache, setIntelCache,
    tradeMyPlayers, setTradeMyPlayers,
    tradeTheirPlayers, setTradeTheirPlayers,
    showToast,
    exportData: () => exportData({
      keepers, keeperWatchlist, roster, draftPool, draftPick,
      draftLog, watchlist, notes, news, draftFlags, draftAdjustments, intelCache,
    }),
    importData: (json) => {
      const parsed = importData(json);
      if (parsed.keepers?.length) setKeepers(parsed.keepers);
      if (parsed.keeperWatchlist) setKeeperWatchlist(parsed.keeperWatchlist);
      if (parsed.roster) setRoster(parsed.roster);
      if (parsed.draftPool) setDraftPool(parsed.draftPool);
      if (parsed.draftPick !== undefined) setDraftPick(parsed.draftPick);
      if (parsed.draftLog) setDraftLog(parsed.draftLog);
      if (parsed.watchlist) setWatchlist(parsed.watchlist);
      if (parsed.notes !== undefined) setNotes(parsed.notes);
      if (parsed.news) setNews(parsed.news);
      if (parsed.draftFlags) setDraftFlags(parsed.draftFlags);
      if (parsed.draftAdjustments) setDraftAdjustments(parsed.draftAdjustments);
      if (parsed.intelCache) setIntelCache(parsed.intelCache);
    },
  }), [keepers, keeperWatchlist, roster, draftPool, draftPick, draftLog, watchlist, notes, news, draftFlags, draftAdjustments, intelCache, tradeMyPlayers, tradeTheirPlayers, showToast]);

  const switchApp = (app) => {
    setActiveApp(app);
    localStorage.setItem("fcc-active-app", app);
  };

  if (!authed) return <PinGate onSuccess={() => setAuthed(true)} />;

  if (activeApp === "nutrition") {
    return <KidsNutrition onBack={() => switchApp("fcc")} />;
  }

  const tabs = [
    { id: "myteam", label: "My Team", icon: <Icons.Star /> },
    { id: "keepers", label: "Keepers", icon: <Icons.Lock /> },
    { id: "draft", label: "Draft HQ", icon: <Icons.Trophy /> },
    { id: "roster", label: "Roster", icon: <Icons.Users /> },
    { id: "freeagent", label: "FA Analyzer", icon: <Icons.TrendUp /> },
    { id: "trade", label: "Trade Eval", icon: <Icons.Swap /> },
    { id: "intel", label: "Intel Feed", icon: <Icons.Search /> },
    { id: "settings", label: "Settings", icon: <Icons.Settings /> },
  ];

  return (
    <AppContext.Provider value={ctx}>
      {/* Topbar */}
      <div className="topbar">
        <div className="topbar-inner">
          <div className="topbar-logo">
            <div className="topbar-mark">FCC</div>
            <span className="topbar-title">Fantasy Command Center</span>
          </div>
          <div className="topbar-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`topbar-tab ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
          <div className="topbar-right">
            <button className="topbar-nutrition-btn" onClick={() => switchApp("nutrition")} title="Back to Kids Fuel">
              🍎 Kids Fuel
            </button>
            <span className={`sync-badge ${syncStatus === "ok" ? "ok" : syncStatus === "err" ? "err" : ""}`}>
              {syncStatus === "ok" ? "✓ Synced" : syncStatus === "err" ? "✗ Offline" : "…"}
            </span>
            <span className="sync-badge">{SEASON}</span>
          </div>
        </div>
      </div>

      {/* Page */}
      <div className="page">
        <div className="tab-content" key={activeTab}>
          {activeTab === "myteam" && <MyTeamTab />}
          {activeTab === "keepers" && <KeepersTab />}
          {activeTab === "draft" && <DraftTab />}
          {activeTab === "roster" && <RosterTab />}
          {activeTab === "freeagent" && <FreeAgentTab />}
          {activeTab === "trade" && <TradeTab />}
          {activeTab === "intel" && <IntelTab />}
          {activeTab === "settings" && <SettingsTab />}
        </div>
      </div>

      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}
    </AppContext.Provider>
  );
}
