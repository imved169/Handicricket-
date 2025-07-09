import { db, ref, set, onValue, get } from "./firebase.js";

// Game state
let gameState = {
  roomId: null,
  player: null,
  opponent: null,
  isBatting: false,
  currentBatter: null,
  currentBowler: null,
  runs: 0,
  wickets: 0,
  legalBalls: 0,
  freeHit: false,
  freeHitNextBall: false,
  format: null,
  innings: 1,
  team1Score: 0,
  team2Score: 0
};

// Format rules
const formatRules = {
  "5": { totalOvers: 5, totalWickets: 11, powerplayOvers: 2, powerplayWicketValue: 0.5 },
  "10": { totalOvers: 10, totalWickets: 11, powerplayOvers: 3, powerplayWicketValue: 0.5 },
  "20": { totalOvers: 20, totalWickets: 11, powerplayOvers: 6, powerplayWicketValue: 0.5 },
  "50": { totalOvers: 50, totalWickets: 11, powerplayOvers: [1,10,21,30,41,42], powerplayWicketValue: 0.25 },
  "test": { totalOvers: Infinity, totalWickets: 30, powerplayOvers: 0, powerplayWicketValue: 0.33 }
};

// Initialize game
export async function initGame(roomId, player) {
  gameState.roomId = roomId;
  gameState.player = player;
  gameState.opponent = player === "player1" ? "player2" : "player1";
  
  // Load game data from Firebase
  const roomRef = ref(db, `rooms/${roomId}`);
  const snapshot = await get(roomRef);
  
  if (!snapshot.exists()) {
    throw new Error("Room does not exist");
  }
  
  const roomData = snapshot.val();
  gameState.format = formatRules[roomData.format || "5"];
  gameState.isBatting = determineBattingRole(roomData);
  
  setupFirebaseListeners();
  updateUI();
}

// Determine batting role
function determineBattingRole(roomData) {
  if (!roomData.tossWinner || !roomData.battingFirst) {
    throw new Error("Toss not completed");
  }
  
  return (gameState.innings % 2 === 1) ? 
    (gameState.player === roomData.battingFirst) : 
    (gameState.player !== roomData.battingFirst);
}

// Process ball outcome
export async function processBallOutcome(batCard, bowlCard) {
  let outcome = "";
  let runsScored = 0;
  let isWicket = false;
  let isLegalBall = false;
  
  // No Ball (both 0)
  if (batCard === 0 && bowlCard === 0) {
    outcome = "NO BALL! +1 run (Free Hit next ball)";
    gameState.runs += 1;
    gameState.freeHitNextBall = true;
    isLegalBall = false;
  } 
  // Free Hit
  else if (gameState.freeHit) {
    if (batCard === bowlCard && batCard > 0) {
      outcome = "Wicket on Free Hit (not out)";
    } else {
      runsScored = batCard;
      outcome = `${batCard} Run(s)! (Free Hit)`;
    }
    gameState.freeHit = false;
    isLegalBall = true;
  }
  // Wicket (same number > 0)
  else if (batCard === bowlCard && batCard > 0) {
    const wicketValue = getWicketValue();
    gameState.wickets += wicketValue;
    outcome = wicketValue >= 1.0 ? "WICKET! (Out)" : `WICKET! (${(1.0 - wicketValue).toFixed(2)} left)`;
    isWicket = true;
    isLegalBall = true;
  }
  // Batter plays 0
  else if (batCard === 0 && bowlCard > 0) {
    runsScored = bowlCard;
    outcome = `Batter played 0. Runs = ${bowlCard}`;
    isLegalBall = true;
  }
  // Bowler plays 0
  else if (bowlCard === 0 && batCard > 0) {
    runsScored = batCard;
    outcome = `${batCard} Run(s)!`;
    isLegalBall = true;
  }
  // Normal runs
  else {
    runsScored = batCard;
    outcome = `${batCard} Run(s)!`;
    isLegalBall = true;
  }
  
  // Update game state
  if (isLegalBall) {
    gameState.legalBalls++;
    gameState.runs += runsScored;
  }
  
  if (gameState.freeHitNextBall) {
    gameState.freeHit = true;
    gameState.freeHitNextBall = false;
  }
  
  // Check for inning/match end
  checkGameEnd();
  
  return outcome;
}

// Get wicket value based on format and powerplay
function getWicketValue() {
  const currentOver = Math.floor(gameState.legalBalls / 6);
  let isPowerplay = false;
  
  if (Array.isArray(gameState.format.powerplayOvers)) {
    for (let i = 0; i < gameState.format.powerplayOvers.length; i += 2) {
      if (currentOver >= gameState.format.powerplayOvers[i] - 1 && 
          currentOver <= gameState.format.powerplayOvers[i+1] - 1) {
        isPowerplay = true;
        break;
      }
    }
  } else if (currentOver < gameState.format.powerplayOvers) {
    isPowerplay = true;
  }
  
  return isPowerplay ? 
    gameState.format.powerplayWicketValue : 
    (gameState.format.name === "ODI" ? 0.5 : 1.0);
}

// Check if game/innings should end
function checkGameEnd() {
  const ballsLeft = gameState.format.totalOvers * 6 - gameState.legalBalls;
  const wicketsLeft = gameState.format.totalWickets - Math.floor(gameState.wickets);
  
  // Innings end conditions
  if (gameState.innings === 2 && gameState.runs > gameState.team1Score) {
    endMatch(true);
  } else if (wicketsLeft <= 0 || ballsLeft <= 0) {
    endInning();
  }
}

// End current inning
function endInning() {
  if (gameState.innings === 1) {
    gameState.team1Score = gameState.runs;
    gameState.team1Wickets = gameState.wickets;
  } else {
    gameState.team2Score = gameState.runs;
    gameState.team2Wickets = gameState.wickets;
  }
  
  // Reset for next innings
  gameState.runs = 0;
  gameState.wickets = 0;
  gameState.legalBalls = 0;
  gameState.innings++;
  
  updateUI();
}

// End match
function endMatch(isWin) {
  const result = isWin ? 
    `Team ${gameState.innings} wins!` : 
    "Match ended";
  console.log(result);
  // Navigate to results page
}

// Setup Firebase listeners
function setupFirebaseListeners() {
  const playsRef = ref(db, `rooms/${gameState.roomId}/currentPlays`);
  
  onValue(playsRef, (snapshot) => {
    const plays = snapshot.val();
    if (plays && plays.player1 !== null && plays.player2 !== null) {
      const battingPlayer = gameState.isBatting ? gameState.player : gameState.opponent;
      const bowlingPlayer = gameState.isBatting ? gameState.opponent : gameState.player;
      
      const outcome = processBallOutcome(
        plays[battingPlayer],
        plays[bowlingPlayer]
      );
      
      updateUI(outcome);
      resetPlays();
    }
  });
}

// Reset plays after each ball
async function resetPlays() {
  await set(ref(db, `rooms/${gameState.roomId}/currentPlays`), {
    player1: null,
    player2: null
  });
}

// Update UI
function updateUI(outcome = "") {
  const scoreElement = document.getElementById("score");
  if (scoreElement) {
    scoreElement.textContent = `${gameState.runs}/${Math.floor(gameState.wickets)}`;
  }
  
  const oversElement = document.getElementById("overs");
  if (oversElement) {
    oversElement.textContent = `${Math.floor(gameState.legalBalls/6)}.${gameState.legalBalls%6}`;
  }
  
  const statusElement = document.getElementById("status");
  if (statusElement && outcome) {
    statusElement.textContent = outcome;
  }
}
