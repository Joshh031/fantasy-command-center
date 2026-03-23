import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue } from "firebase/database";
import { getAuth, signInAnonymously } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBEFzIjmRcAtBnRY_H9iV_1WcaF_hMvH2g",
  authDomain: "familyhub-d72f8.firebaseapp.com",
  databaseURL: "https://familyhub-d72f8-default-rtdb.firebaseio.com",
  projectId: "familyhub-d72f8",
  storageBucket: "familyhub-d72f8.appspot.com",
  messagingSenderId: "674695614112",
  appId: "1:674695614112:web:3f2d8bce8f5c4bde12e75d",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

const DB_PATH = "fantasy-command-center";

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

export function isReady() {
  return _ready;
}

export function onAuthReady(fn) {
  onReady(fn);
}
