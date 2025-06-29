
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";
import { app } from './firebase.js';
const db = getDatabase(app);

document.getElementById("createRoom").addEventListener("click", () => {
  const teamName = document.getElementById("teamName").value.trim();
  if (!teamName) return alert("Enter your team name");

  const roomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
  const roomRef = ref(db, `rooms/${roomCode}`);
  set(roomRef, {
    player1: {
      teamName: teamName
    }
  }).then(() => {
    window.location.href = `playing11.html?room=${roomCode}&player=player1`;
  });
});

document.getElementById("joinRoom").addEventListener("click", () => {
  const teamName = document.getElementById("teamName").value.trim();
  const roomCode = document.getElementById("roomCode").value.trim().toUpperCase();
  if (!teamName || !roomCode) return alert("Enter all details");

  const player2Ref = ref(db, `rooms/${roomCode}/player2`);
  set(player2Ref, {
    teamName: teamName
  }).then(() => {
    window.location.href = `playing11.html?room=${roomCode}&player=player2`;
  });
});
