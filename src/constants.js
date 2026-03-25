// ============================================================
// FANTASY BASEBALL COMMAND CENTER — CONSTANTS
// ============================================================

export const TEAM_NAME = "Josh's Squad";
export const LEAGUE_SIZE = 10;
export const LEAGUE_NAME = "IAMFBL";
export const SEASON = 2026;

// Scoring system
export const BATTING_SCORING = {
  "1B": 1, "2B": 2, "3B": 3, BB: 1, CS: -1, CYC: 10, GSHR: 3,
  HP: 1, HR: 4, KO: -1, R: 1, RBI: 1, SB: 1.75, SF: 1, SH: 0.5,
};

export const PITCHING_SCORING = {
  BBI: -0.5, BS: -2, CG: 5, CGL: 3, ER: -1, INN: 0.75, K: 1,
  L: -5, NH: 10, PG: 20, PKO: 2, QS: 4, S: 7, SO: 5, W: 10,
};

// Initial keepers
export const INITIAL_KEEPERS = [
  { name: "Garrett Crochet", pos: "SP", team: "BOS", type: "major", year: 1, maxYears: 2, proj: 412.2, ecr: "SP2", age: 26, notes: "Ace. SP2 overall." },
  { name: "Cal Raleigh", pos: "C", team: "SEA", type: "major", year: 1, maxYears: 2, proj: 444.5, ecr: "C1", age: 29, notes: "Dominant C1. Positional scarcity." },
  { name: "Junior Caminero", pos: "3B", team: "TB", type: "minor", year: 1, maxYears: 3, proj: 445.1, ecr: "3B2", age: 22, notes: "45 HR breakout. Elite power." },
  { name: "Nolan McLean", pos: "SP", team: "NYM", type: "minor", year: 1, maxYears: 3, proj: 347.5, ecr: "SP29", age: 23, notes: "Young arm, high upside." },
  { name: "Konnor Griffin", pos: "SS", team: "PIT", type: "minor", year: 1, maxYears: 3, proj: 150.1, ecr: "SS20", age: 19, notes: "Toolsy prospect. Long-term play." },
];

export const INITIAL_KEEPER_WATCHLIST = [
  { name: "Corbin Burns", pos: "SP", team: "CIN", type: "minor", proj: 240.0, ecr: "SP27", age: 30, notes: "Could swap for Griffin. 3yr eligible." },
  { name: "Jackson Chourio", pos: "OF", team: "MIL", type: "minor", proj: 409.9, ecr: "OF8", age: 21, notes: "1 year left. Elite bat but short window." },
];

// Position slots for roster
export const ROSTER_SLOTS = [
  "C", "1B", "2B", "3B", "SS", "OF", "OF", "OF", "OF", "DH",
  "BN", "BN", "BN", "BN", "BN",
  "SP", "SP", "SP", "SP", "SP", "RP", "RP", "RP",
  "RES", "RES", "RES", "RES", "IL", "IL", "MiLB",
];

// Position targets for draft
export const POS_TARGETS = {
  C: 1, "1B": 1, "2B": 1, "3B": 1, SS: 1, OF: 4, DH: 1, SP: 5, RP: 3,
};

// Storage keys
export const STORAGE_KEYS = {
  roster: "iamfbl-roster",
  draftPool: "iamfbl-draft-pool",
  draftPick: "iamfbl-draft-pick",
  draftLog: "iamfbl-draft-log",
  notes: "iamfbl-notes",
  news: "iamfbl-news",
  watchlist: "iamfbl-watchlist",
  keepers: "iamfbl-keepers",
  keeperWatchlist: "iamfbl-keeper-watchlist",
  draftFlags: "iamfbl-draft-flags",
  draftAdjustments: "iamfbl-draft-adjustments",
  intelCache: "iamfbl-intel-cache",
};

// Draft flag types
export const FLAG_TYPES = {
  none: { label: "—", color: "transparent" },
  sleeper: { label: "SLEEPER", color: "#00ff88" },
  bust: { label: "BUST RISK", color: "#ff4a4a" },
  overvalued: { label: "OVERVALUED", color: "#ff6b35" },
  target: { label: "TARGET", color: "#3b82f6" },
  mustDraft: { label: "MUST DRAFT", color: "#ffaa00" },
};

// Analyst network
export const ANALYSTS = [
  { name: "Pitcher List", handle: "@PitcherList", note: "Best SP analysis. Nick Pollack's daily pod is essential.", type: "Pitching" },
  { name: "Tristan Cockcroft", handle: "@ESPN", note: "Points league guru. Best for your format.", type: "Overall" },
  { name: "Eric Karabell", handle: "@ESPN", note: "H2H & roto expert. Injury tracker.", type: "Overall" },
  { name: "Eric Samulski", handle: "@Rotoworld/NBC", note: "Deep position breakdowns. Prospect pipeline.", type: "Prospects" },
  { name: "Jeff Erickson", handle: "@RotoWire", note: "FAAB strategy king. Two-start SP rankings.", type: "In-Season" },
  { name: "Scott Pianowski", handle: "@Yahoo", note: "Position tier rankings. Contrarian takes.", type: "Draft" },
  { name: "FantraxHQ", handle: "@FantraxHQ", note: "Dynasty/prospect rankings. Deep leagues.", type: "Dynasty" },
  { name: "Baseball America", handle: "@BA_Fantasy", note: "Prospect scouting. RoboScout tool in-season.", type: "Prospects" },
];
