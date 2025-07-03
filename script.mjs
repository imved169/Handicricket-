
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

// === Role Sync + End Match Logic ===
import { pushMatchSummary } from './firebase.js';

export function checkMatchEnd(room, innings, runs, target, legalBalls, totalBalls, wickets, maxWickets) {
  if (innings === 2) {
    if (runs > target) {
      pushMatchSummary(room, {
        result: "Batting Team Wins",
        runs,
        wickets,
        overs: Math.floor(legalBalls / 6) + "." + (legalBalls % 6)
      });
    } else if (legalBalls >= totalBalls || wickets >= maxWickets) {
      const result = runs === target ? "Match Tied!" : "Bowling Team Wins";
      pushMatchSummary(room, {
        result,
        runs,
        wickets,
        overs: Math.floor(legalBalls / 6) + "." + (legalBalls % 6)
      });
    }
  }
}
