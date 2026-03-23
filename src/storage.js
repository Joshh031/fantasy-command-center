import { fbSet, fbListen } from "./firebase.js";
import { STORAGE_KEYS } from "./constants.js";

// Debounce helper
let _saveTimer = null;
const DEBOUNCE_MS = 400;

// All data keys we persist
const ALL_KEYS = [
  "roster", "draftPool", "draftPick", "draftLog",
  "notes", "news", "watchlist", "keepers", "keeperWatchlist",
  "draftFlags", "draftAdjustments", "intelCache",
];

// Save all data to Firebase + localStorage
export function saveAll(data) {
  // Immediate localStorage write
  ALL_KEYS.forEach((key) => {
    if (data[key] !== undefined) {
      try {
        localStorage.setItem(STORAGE_KEYS[key] || `iamfbl-${key}`, JSON.stringify(data[key]));
      } catch (e) {
        console.warn("localStorage write error:", e);
      }
    }
  });

  // Debounced Firebase write
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => {
    const payload = {};
    ALL_KEYS.forEach((key) => {
      if (data[key] !== undefined) payload[key] = data[key];
    });
    fbSet(payload);
  }, DEBOUNCE_MS);
}

// Load from localStorage (sync, for initial render)
export function loadLocal() {
  const data = {};
  ALL_KEYS.forEach((key) => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS[key] || `iamfbl-${key}`);
      if (raw) data[key] = JSON.parse(raw);
    } catch (e) {
      // skip
    }
  });
  return data;
}

// Listen to Firebase for cross-device sync
export function listenForSync(callback) {
  fbListen((val) => {
    // Write to localStorage as backup
    ALL_KEYS.forEach((key) => {
      if (val[key] !== undefined) {
        try {
          localStorage.setItem(STORAGE_KEYS[key] || `iamfbl-${key}`, JSON.stringify(val[key]));
        } catch (e) {
          // skip
        }
      }
    });
    callback(val);
  });
}

// Export all data as JSON string
export function exportData(data) {
  const payload = {};
  ALL_KEYS.forEach((key) => {
    if (data[key] !== undefined) payload[key] = data[key];
  });
  return JSON.stringify(payload, null, 2);
}

// Import data from JSON string
export function importData(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    if (typeof parsed !== "object" || parsed === null) {
      throw new Error("Invalid data format");
    }
    // Write to localStorage + Firebase
    saveAll(parsed);
    return parsed;
  } catch (e) {
    throw new Error(`Import failed: ${e.message}`);
  }
}
