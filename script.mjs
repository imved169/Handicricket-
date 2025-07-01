
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


// ✅ Fix: Reset free hit after each delivery


// 🧮 Wicket Rule Functions

function getWicketValue(format, over, isPowerplay, lostLives) {
  if (format === 'Test') return 1 / 3;

  if (format === 'ODI') {
    if (isPowerplay) return 0.25;
    return 0.5;
  }

  if (isPowerplay) return 0.5;
  return 1.0;
}

function calculateWicketIncrease(format, over, isPowerplay, lostLives) {
  const valuePerLife = getWicketValue(format, over, isPowerplay, lostLives);
  return valuePerLife * (lostLives || 1);
}


// ✅ Free Hit fix fallback
isFreeHit = false;