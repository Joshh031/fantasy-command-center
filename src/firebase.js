import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue } from "firebase/database";
import { getAuth, signInAnonymously } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

const DB_PATH = "fantasy-command-center";
const NUTRITION_PATH = "kids-nutrition";

let _ready = false;
let _readyCallbacks = [];

signInAnonymously(auth)
  .then(() => {
    _ready = true;
    _readyCallbacks.forEach((fn) => fn());
    _readyCallbacks = [];
  })
  .catch((err) => {
    console.warn("Firebase auth failed:", err);
  });

function onReady(fn) {
  if (_ready) fn();
  else _readyCallbacks.push(fn);
}

export function fbSet(data) {
  onReady(() => {
    set(ref(db, DB_PATH), data).catch((err) =>
      console.warn("Firebase write error:", err)
    );
  });
}

export function fbListen(callback) {
  const start = () => {
    onValue(ref(db, DB_PATH), (snap) => {
      const val = snap.val();
      if (val) callback(val);
    });
  };
  onReady(start);
}

// Nutrition tracker - separate Firebase path
export function fbSetNutrition(data) {
  onReady(() => {
    set(ref(db, NUTRITION_PATH), data).catch((err) =>
      console.warn("Firebase nutrition write error:", err)
    );
  });
}

export function fbListenNutrition(callback) {
  const start = () => {
    onValue(ref(db, NUTRITION_PATH), (snap) => {
      const val = snap.val();
      if (val) callback(val);
    });
  };
  onReady(start);
}

export function isReady() {
  return _ready;
}

export function onAuthReady(fn) {
  onReady(fn);
}
