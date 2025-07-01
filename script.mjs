
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";
import { app } from './firebase.js';
const db = getDatabase(app);

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

document.addEventListener("DOMContentLoaded", () => {
  const createBtn = document.getElementById("createRoom");
  const joinBtn = document.getElementById("joinRoom");

  createBtn?.addEventListener("click", async () => {
    const teamName = document.getElementById("teamName").value.trim();
    if (!teamName) return alert("Enter team name");
    const roomCode = generateRoomCode();
    await set(ref(db, `rooms/${roomCode}/player1`), { teamName });
    window.location.href = `playing11.html?room=${roomCode}&player=player1`;
  });

  joinBtn?.addEventListener("click", async () => {
    const teamName = document.getElementById("teamName").value.trim();
    const joinCode = document.getElementById("joinCode").value.trim().toUpperCase();
    if (!teamName || !joinCode) return alert("Enter all fields");
    await set(ref(db, `rooms/${joinCode}/player2`), { teamName });
    window.location.href = `playing11.html?room=${joinCode}&player=player2`;
  });
});




// 🏏 Carry-over Wicket Handling

function handleWicketAccumulation(batter, format, over) {
  const { lifeValue, livesPerOut, outsPerBatter } = getLifeValue(format, over);
  const totalWicketValue = lifeValue * livesPerOut;
  
  if (!batter.accumulatedWicket) batter.accumulatedWicket = 0;

  // Calculate remaining space before full wicket
  const spaceLeft = 1.0 - batter.accumulatedWicket;

  // Add only what's needed to reach full 1.0
  const toAdd = Math.min(spaceLeft, totalWicketValue);
  batter.accumulatedWicket += toAdd;

  // Handle Test: 3 outs per batter = 1 wicket
  if (format === "Test") {
    if (!batter.testOuts) batter.testOuts = 0;
    batter.testOuts++;
    if (batter.testOuts >= 3) {
      batterOut(batter);
    }
    return;
  }

  // Normal formats
  if (batter.accumulatedWicket >= 1.0) {
    batterOut(batter);
  }
}


// === Career Stats Handling ===

// Career Stats Tracker
function updateCareerStats(playerName, runs, wickets, isBatter) {
  let stats = JSON.parse(localStorage.getItem(playerName)) || {
    name: playerName,
    runs: 0,
    wickets: 0,
    matches: 0
  };

  if (isBatter) stats.runs += runs;
  else stats.wickets += wickets;

  stats.matches += 1;

  localStorage.setItem(playerName, JSON.stringify(stats));
}

function getCareerStats(playerName) {
  return JSON.parse(localStorage.getItem(playerName)) || null;
}
