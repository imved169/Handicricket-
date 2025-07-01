
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



// Phase 4 - Game Logic Enhancements
let isFreeHit = false;
let freeHitBallPending = false;
let isDeadOverActive = false;
let deadOversUsed = 0;
let maxDeadOvers = 10;
let currentInnings = 1;
let team1Score = 0;
let team2Score = 0;
let targetScore = null;
let format = "ODI"; // can be T20, ODI, Test
let currentOver = 0;
let totalOvers = 50; // based on format
let currentBall = 0;
let wickets = 0;
let batterLives = {};

function isPowerplay(over) {
  if (format === "T20") return over < 6;
  if (format === "ODI") return (over < 10 || (over >= 20 && over < 30) || over === 40 || over === 41);
  return false; // No powerplay in Test
}

function getLifeLoss(over) {
  if (format === "Test") return 0.33;
  if (format === "ODI") return isPowerplay(over) ? 0.25 : 0.5;
  return isPowerplay(over) ? 0.5 : 1.0; // T20/5/10
}

function processFreeHit(cardBatter, cardBowler) {
  if (isFreeHit) {
    isFreeHit = false;
    freeHitBallPending = false;
    return cardBatter; // runs count, no wicket
  }
  return null;
}

function shouldSwitchInnings(score, wickets, over) {
  if (format === "Test") return false; // handle later
  return (over >= totalOvers || wickets >= 10);
}

function updateTargetAndSwitch(score) {
  if (currentInnings === 1) {
    targetScore = score + 1;
    currentInnings = 2;
    currentOver = 0;
    currentBall = 0;
    wickets = 0;
    batterLives = {};
    document.getElementById("targetText").innerText = "🎯 Target: " + targetScore + " runs";
  }
}

function applyDeadOverRules(batterCard, bowlerCard) {
  if (!isDeadOverActive) return null;
  if ((batterCard > 0 && bowlerCard === 0) || (batterCard === 0 && bowlerCard > 0)) {
    return 0; // dot ball
  }
  return null; // fall back to normal logic
}



// Phase 5 - Match Flow, Second Innings, and Free Hit Fix

function handleDelivery(batterCard, bowlerCard) {
  let runsScored = 0;
  let isWicket = false;

  if (batterCard === 0 && bowlerCard === 0) {
    // No ball
    isFreeHit = true;
    runsScored = 1;
  } else if (isFreeHit) {
    // Free hit active
    isFreeHit = false;
    // Revised Wicket Life Logic
if (batterCard === bowlerCard) {
  const loss = getLifeLoss(currentOver);
  let currentLife = batterLives[currentBatter] || 0;
  let remaining = 1.0 - currentLife;
  let add = Math.min(loss, remaining);
  batterLives[currentBatter] = currentLife + add;

  if (batterLives[currentBatter] >= 1.0) {
    wickets++;
    isWicket = true;
  }
} else {
      runsScored = batterCard;
    }
  } else // Revised Wicket Life Logic
if (batterCard === bowlerCard) {
  const loss = getLifeLoss(currentOver);
  let currentLife = batterLives[currentBatter] || 0;
  let remaining = 1.0 - currentLife;
  let add = Math.min(loss, remaining);
  batterLives[currentBatter] = currentLife + add;

  if (batterLives[currentBatter] >= 1.0) {
    wickets++;
    isWicket = true;
  }
}
  } else {
    // Regular scoring
    const deadResult = applyDeadOverRules(batterCard, bowlerCard);
    runsScored = (deadResult !== null) ? deadResult : batterCard;
  }

  if (currentInnings === 1) {
    team1Score += runsScored;
  } else {
    team2Score += runsScored;
  }

  currentBall++;
  if (currentBall >= 6) {
    currentBall = 0;
    currentOver++;
    endDeadOver(); // reset dead over if any
  }

  if (currentInnings === 2 && team2Score >= targetScore) {
    showMatchResult("Team 2 won by " + (10 - wickets) + " wickets");
    return;
  }

  if (shouldSwitchInnings(team1Score, wickets, currentOver)) {
    if (currentInnings === 1) {
      updateTargetAndSwitch(team1Score);
    } else {
      if (team2Score === targetScore - 1) {
        showMatchResult("Match tied!");
      } else {
        showMatchResult("Team 1 won by " + (targetScore - 1 - team2Score) + " runs");
      }
    }
  }
}

function showMatchResult(resultText) {
  document.getElementById("status").innerText = "🏁 " + resultText;
  disableCardButtons();
}

function disableCardButtons() {
  const cardButtons = document.querySelectorAll(".card-button");
  cardButtons.forEach(btn => btn.disabled = true);
}
