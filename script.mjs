
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


// Phase 4 Game Logic: Full card resolution
import { getDatabase, ref, onValue, set, get, update } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js";

const db = getDatabase();
const room = localStorage.getItem("room");
const player = localStorage.getItem("player");

const status = document.getElementById("status");
const runBoard = document.getElementById("score");
const opponentName = document.getElementById("opponentName");
const joinStatus = document.getElementById("joinStatus");
const startMatchBtn = document.getElementById("startMatchBtn");

let runs = 0, wickets = 0, balls = 0, overs = 0.0;
let isSecondInnings = false;
let currentPlays = {};
let tossWinner = null;
let isFreeHit = false;

function updateScoreboard() {
    runBoard.innerText = `Runs: ${runs} | Wickets: ${wickets} | Overs: ${overs.toFixed(1)}`;
}

function disableButtons() {
    document.querySelectorAll(".card-btn").forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = "0.5";
    });
}

function enableButtons() {
    document.querySelectorAll(".card-btn").forEach(btn => {
        btn.disabled = false;
        btn.style.opacity = "1";
    });
}

function checkOver() {
    if (balls >= 6) {
        overs += 1;
        balls = 0;
    }
    updateScoreboard();
}

function evaluatePlays(bat, bowl) {
    if (bat === bowl && bat !== 0) {
        if (!isFreeHit) wickets++;
        status.innerText = isFreeHit ? "Free Hit! Wicket avoided!" : "Wicket!";
    } else if (bat === 0 && bowl === 0) {
        runs += 1;
        isFreeHit = true;
        status.innerText = "No Ball! Free Hit next ball.";
        balls--; // Not counted
    } else if (bat === 0 && bowl !== 0) {
        runs += bowl;
        status.innerText = `Runs scored: ${bowl}`;
    } else if (bowl === 0 && bat !== 0) {
        status.innerText = "Dot Ball.";
    } else {
        runs += bat;
        status.innerText = `Runs scored: ${bat}`;
    }

    updateScoreboard();
    checkOver();
    isFreeHit = false;
}

document.querySelectorAll(".card-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        disableButtons();
        const selected = parseInt(btn.innerText);
        set(ref(db, `rooms/${room}/currentPlays/${player}`), selected);
    });
});

// Start match button
startMatchBtn.addEventListener("click", () => {
    startMatchBtn.style.display = "none";
    status.innerText = "Match started!";
    enableButtons();
});

// Monitor opponent and card sync
onValue(ref(db, `rooms/${room}`), (snap) => {
    const data = snap.val();
    if (!data) return;

    const player1Ready = data.player1 && data.player1.playing11;
    const player2Ready = data.player2 && data.player2.playing11;
    if (player1Ready && player2Ready) {
        joinStatus.innerText = "Both players ready!";
        startMatchBtn.style.display = "block";
    } else {
        joinStatus.innerText = \`Waiting for \${!player1Ready ? "Player 1" : "Player 2"}...\`;
        startMatchBtn.style.display = "none";
    }

    // Set opponent name
    const opp = player === "player1" ? "player2" : "player1";
    if (data[opp]) {
        opponentName.innerText = "Opponent: " + (data[opp].teamName || opp);
    }

    if (data.currentPlays) {
        currentPlays = data.currentPlays;
        if (currentPlays.player1 !== undefined && currentPlays.player2 !== undefined) {
            get(ref(db, `rooms/${room}/tossWinner`)).then(tossSnap => {
                const tossWinner = tossSnap.val();
                const bat = currentPlays[tossWinner];
                const bowl = currentPlays[tossWinner === "player1" ? "player2" : "player1"];
                evaluatePlays(bat, bowl);

                // Reset plays
                set(ref(db, `rooms/${room}/currentPlays`), {});
                enableButtons();
                balls++;
                checkOver();
            });
        }
    }
});
