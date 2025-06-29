import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAGU0Tsj9pwZcgwQjZzTFvGOE032l2b7HI",
  authDomain: "handicricket-d1ab7.firebaseapp.com",
  databaseURL: "https://handicricket-d1ab7-default-rtdb.firebaseio.com",
  projectId: "handicricket-d1ab7",
  storageBucket: "handicricket-d1ab7.appspot.com",
  messagingSenderId: "356065986337",
  appId: "1:356065986337:web:399102c5dabfca2b6fe060",
  measurementId: "G-6XS69Z6MMF"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export async function createRoom() {
  const teamName = document.getElementById("teamName").value;
  if (!teamName) return alert("Enter team name");

  const roomCode = Math.floor(1000 + Math.random() * 9000).toString();
  const teamKey = "team1";

  sessionStorage.setItem("roomCode", roomCode);
  sessionStorage.setItem("teamKey", teamKey);
  sessionStorage.setItem("teamName", teamName);

  await set(ref(db, `rooms/${roomCode}/${teamKey}`), {
    teamName,
    players: []
  });

  document.getElementById("roomInfo").innerText = `Your Room Code: ${roomCode}`;
  setTimeout(() => {
    window.location.href = "playing11.html";
  }, 1500);
}

export async function joinRoom() {
  const teamName = document.getElementById("teamName").value;
  const roomCode = document.getElementById("joinCode").value;

  if (!teamName || !roomCode) return alert("Fill all fields");

  const snapshot = await get(ref(db, `rooms/${roomCode}`));
  if (!snapshot.exists()) return alert("Room doesn't exist");

  const teamKey = snapshot.val().team1 ? "team2" : "team1";

  sessionStorage.setItem("roomCode", roomCode);
  sessionStorage.setItem("teamKey", teamKey);
  sessionStorage.setItem("teamName", teamName);

  await set(ref(db, `rooms/${roomCode}/${teamKey}`), {
    teamName,
    players: []
  });

  alert(`Joined as ${teamKey}`);
  window.location.href = "playing11.html";
}