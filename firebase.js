import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, get, child, update, remove } from "firebase/database";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCN6aZMwlsZe7JJaovU0WA3UQygWr4jYmA",
  authDomain: "handicricket-85a06.firebaseapp.com",
  projectId: "handicricket-85a06",
  storageBucket: "handicricket-85a06.appspot.com",
  messagingSenderId: "599182538558",
  appId: "1:599182538558:web:3e965753ab05f8f1e3de6f",
  measurementId: "G-HSV9H4LEJQ"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Database references
const usersRef = ref(db, 'users');
const playersRef = ref(db, 'players');
const teamsRef = ref(db, 'teams');
const matchesRef = ref(db, 'matches');
const leaderboardRef = ref(db, 'leaderboard');
const transferMarketRef = ref(db, 'transferMarket');

export { 
  db, ref, set, onValue, get, child, update, remove, 
  usersRef, playersRef, teamsRef, matchesRef, leaderboardRef, transferMarketRef 
};
