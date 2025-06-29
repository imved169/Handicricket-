
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";
import { app } from './firebase.js';
const db = getDatabase(app);

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

document.addEventListener("DOMContentLoaded", () => {
  const createBtn = document.querySelector("button:nth-of-type(1)");
  const joinBtn = document.querySelector("button:nth-of-type(2)");

  createBtn.addEventListener("click", async () => {
    const teamName = document.getElementById("teamName").value.trim();
    if (!teamName) return alert("Enter your team name");

    const roomCode = generateRoomCode();
    const roomRef = ref(db, `rooms/${roomCode}`);
    await set(roomRef, {
      player1: { teamName }
    });
    window.location.href = `playing11.html?room=${roomCode}&player=player1`;
  });

  joinBtn.addEventListener("click", async () => {
    const teamName = document.getElementById("teamName").value.trim();
    const roomCode = document.getElementById("joinCode").value.trim().toUpperCase();
    if (!teamName || !roomCode) return alert("Enter all details");

    const player2Ref = ref(db, `rooms/${roomCode}/player2`);
    await set(player2Ref, {
      teamName
    });
    window.location.href = `playing11.html?room=${roomCode}&player=player2`;
  });
});
