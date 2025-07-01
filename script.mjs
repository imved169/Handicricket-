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



// ✅ Safe Sync Patch for Card Matching and Status
import { db, ref, onValue, update } from "./firebase.js";

const gameRef = ref(db, `rooms/${roomCode}/game`);
onValue(gameRef, (snapshot) => {
  const gameData = snapshot.val();
  if (!gameData) return;

  // Check if both cards are played
  if (gameData.player1Card !== null && gameData.player2Card !== null && gameData.status !== "resolved") {
    const p1 = gameData.player1Card;
    const p2 = gameData.player2Card;

    let result = "";
    if (p1 === p2) {
      result = "WICKET";
    } else {
      result = `${p1} runs`;
    }

    update(gameRef, {
      result: result,
      status: "resolved",
      lastUpdate: Date.now()
    });
  }
});
