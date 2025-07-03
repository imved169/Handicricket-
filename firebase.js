import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getDatabase, ref, set, onValue, get, child } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAGU0Tsj9pwZcgwQjZzTFvGOE032l2b7HI",
  authDomain: "handicricket-d1ab7.firebaseapp.com",
  projectId: "handicricket-d1ab7",
  storageBucket: "handicricket-d1ab7.appspot.com",
  messagingSenderId: "356065986337",
  appId: "1:356065986337:web:399102c5dabfca2b6fe060",
  measurementId: "G-6XS69Z6MMF",
  databaseURL: "https://handicricket-d1ab7-default-rtdb.firebaseio.com/"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db, ref, set, onValue, get, child };

// === Summary Push Logic ===
export async function pushMatchSummary(room, summaryData) {
  const summaryRef = ref(db, `rooms/${room}/summary`);
  await set(summaryRef, summaryData);
}

import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";
import { db } from './firebase.js';

export async function pushMatchSummary(room, summaryData) {
  const summaryRef = ref(db, `rooms/${room}/summary`);
  await set(summaryRef, {
    result: summaryData.result,
    runs: summaryData.runs,
    wickets: summaryData.wickets,
    overs: summaryData.overs,
    timestamp: Date.now(),
    players: {
      player1: summaryData.team1,
      player2: summaryData.team2
    }
  });

  const historyRef = ref(db, `matchHistory/${room}`);
  await set(historyRef, summaryData);
}

export async function savePlayerStats(room, stats) {
  const statsRef = ref(db, `rooms/${room}/playerStats`);
  await set(statsRef, stats);
}
