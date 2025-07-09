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
  team2Score: 0,
  team1Wickets: 0,
  team2Wickets: 0,
  zerosThisOver: { player1: 0, player2: 0 },
  bowlerOvers: {},
  powerplayActive: false,
  deadOversUsed: 0,
  batterStats: {},
  bowlerStats: {}
};

// Format rules
const formatRules = {
  "5": { 
    totalOvers: 5, 
    totalWickets: 11,
    powerplayOvers: 2,
    powerplayWicketValue: 0.5,
    maxBowlerOvers: 1,
    hasFreeHit: true,
    deadOvers: 0
  },
  "10": { 
    totalOvers: 10,
    totalWickets: 11,
    powerplayOvers: 3,
    powerplayWicketValue: 0.5,
    maxBowlerOvers: 2,
    hasFreeHit: true,
    deadOvers: 0
  },
  "20": { 
    totalOvers: 20,
    totalWickets: 11,
    powerplayOvers: 6,
    powerplayWicketValue: 0.5,
    maxBowlerOvers: 4,
    hasFreeHit: true,
    deadOvers: 0
  },
  "50": { 
    totalOvers: 50,
    totalWickets: 11,
    powerplayOvers: [1,10,21,30,41,42],
    powerplayWicketValue: 0.25,
    maxBowlerOvers: 10,
    hasFreeHit: true,
    deadOvers: 10
  },
  "test": { 
    totalOvers: Infinity,
    totalWickets: 30,
    powerplayOvers: 0,
    powerplayWicketValue: 0.33,
    maxBowlerOvers: Infinity,
    hasFreeHit: false,
    deadOvers: 0
  }
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
  gameState.team1Players = roomData.teams?.player1?.players || [];
  gameState.team2Players = roomData.teams?.player2?.players || [];
  
  // Initialize stats
  initializePlayerStats();
  
  setupFirebaseListeners();
  updateUI();
  checkPowerplayStatus();
}

function initializePlayerStats() {
  // Initialize batter stats
  gameState.batterStats = {};
  const battingTeam = gameState.isBatting ? gameState.player : gameState.opponent;
  const batters = battingTeam === "player1" ? gameState.team1Players : gameState.team2Players;
  batters.forEach(player => {
    gameState.batterStats[player] = { runs: 0, balls: 0, dots: 0, fours: 0, sixes: 0 };
  });
  
  // Initialize bowler stats
  gameState.bowlerStats = {};
  const bowlingTeam = gameState.isBatting ? gameState.opponent : gameState.player;
  const bowlers = bowlingTeam === "player1" ? gameState.team1Players : gameState.team2Players;
  bowlers.forEach(player => {
    gameState.bowlerStats[player] = { overs: 0, maidens: 0, runs: 0, wickets: 0 };
  });
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
  let isDotBall = false;
  
  // Check for zero card limitations
  if (batCard === 0) {
    gameState.zerosThisOver[gameState.player]++;
    if (gameState.zerosThisOver[gameState.player] > 3) {
      // Penalty for too many zeros
      if (gameState.isBatting) {
        gameState.runs -= 5;
        outcome = "Too many zeros! -5 runs";
      } else {
        outcome = "NO BALL! +1 run (Too many zeros)";
        gameState.runs += 1;
        gameState.freeHitNextBall = true;
      }
      return outcome;
    }
  }
  
  if (bowlCard === 0) {
    gameState.zerosThisOver[gameState.opponent]++;
    if (gameState.zerosThisOver[gameState.opponent] > 3) {
      outcome = "NO BALL! +1 run (Too many zeros)";
      gameState.runs += 1;
      gameState.freeHitNextBall = true;
      return outcome;
    }
  }
  
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
    
    // Update bowler stats
    if (gameState.currentBowler) {
      gameState.bowlerStats[gameState.currentBowler].wickets += wicketValue;
    }
  }
  // Batter plays 0
  else if (batCard === 0 && bowlCard > 0) {
    runsScored = bowlCard;
    outcome = `Batter played 0. Runs = ${bowlCard}`;
    isLegalBall = true;
    isDotBall = true;
  }
  // Bowler plays 0
  else if (bowlCard === 0 && batCard > 0) {
    runsScored = batCard;
    outcome = `${batCard} Run(s)!`;
    isLegalBall = true;
    if (batCard === 0) isDotBall = true;
  }
  // Normal runs
  else {
    runsScored = batCard;
    outcome = `${batCard} Run(s)!`;
    isLegalBall = true;
    if (batCard === 0) isDotBall = true;
  }
  
  // Update game state
  if (isLegalBall) {
    gameState.legalBalls++;
    gameState.runs += runsScored;
    
    // Update batter stats
    if (gameState.currentBatter) {
      gameState.batterStats[gameState.currentBatter].runs += runsScored;
      gameState.batterStats[gameState.currentBatter].balls++;
      if (isDotBall) gameState.batterStats[gameState.currentBatter].dots++;
      if (runsScored === 4) gameState.batterStats[gameState.currentBatter].fours++;
      if (runsScored === 6) gameState.batterStats[gameState.currentBatter].sixes++;
    }
    
    // Update bowler stats
    if (gameState.currentBowler) {
      gameState.bowlerStats[gameState.currentBowler].runs += runsScored;
      // Check for maiden (only count full overs)
      if (gameState.legalBalls % 6 === 0 && 
          gameState.bowlerStats[gameState.currentBowler].runs === 0) {
        gameState.bowlerStats[gameState.currentBowler].maidens++;
      }
    }
  }
  
  if (gameState.freeHitNextBall) {
    gameState.freeHit = true;
    gameState.freeHitNextBall = false;
  }
  
  // Check for over completion
  if (gameState.legalBalls % 6 === 0) {
    gameState.zerosThisOver = { player1: 0, player2: 0 };
    updateBowlerOvers();
    checkPowerplayStatus();
  }
  
  // Check for inning/match end
  checkGameEnd();
  
  return outcome;
}

function updateBowlerOvers() {
  if (gameState.currentBowler) {
    const overs = Math.floor(gameState.bowlerStats[gameState.currentBowler].balls / 6);
    gameState.bowlerStats[gameState.currentBowler].overs = overs;
  }
}

function checkPowerplayStatus() {
  const currentOver = Math.floor(gameState.legalBalls / 6) + 1; // 1-based
  
  if (Array.isArray(gameState.format.powerplayOvers)) {
    // Handle ODI-style multiple powerplays
    for (let i = 0; i < gameState.format.powerplayOvers.length; i += 2) {
      if (currentOver >= gameState.format.powerplayOvers[i] && 
          currentOver <= gameState.format.powerplayOvers[i+1]) {
        gameState.powerplayActive = true;
        return;
      }
    }
    gameState.powerplayActive = false;
  } else {
    // Standard powerplay (first X overs)
    gameState.powerplayActive = currentOver <= gameState.format.powerplayOvers;
  }
}

// Get wicket value based on format and powerplay
function getWicketValue() {
  return gameState.powerplayActive ? 
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
  gameState.zerosThisOver = { player1: 0, player2: 0 };
  gameState.powerplayActive = false;
  gameState.freeHit = false;
  gameState.freeHitNextBall = false;
  
  // Switch batting/bowling roles
  gameState.isBatting = !gameState.isBatting;
  
  // Reinitialize stats for new innings
  initializePlayerStats();
  
  updateUI();
}

// End match
function endMatch(isWin) {
  const result = isWin ? 
    `Team ${gameState.innings} wins!` : 
    "Match ended";
  console.log(result);
  
  // Save match result to Firebase
  set(ref(db, `rooms/${gameState.roomId}/result`), {
    winner: isWin ? gameState.player : gameState.opponent,
    team1Score: gameState.team1Score,
    team1Wickets: gameState.team1Wickets,
    team2Score: gameState.team2Score,
    team2Wickets: gameState.team2Wickets
  });
  
  // Navigate to results page
  window.location.href = "results.html";
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
  if (statusElement) {
    statusElement.textContent = outcome;
  }
  
  const powerplayElement = document.getElementById("powerplay");
  if (powerplayElement) {
    powerplayElement.textContent = gameState.powerplayActive ? "Powerplay Active" : "";
  }
  
  const freeHitElement = document.getElementById("freehit");
  if (freeHitElement) {
    freeHitElement.textContent = gameState.freeHit ? "FREE HIT" : "";
  }
  
  // Update target display in second innings
  if (gameState.innings === 2) {
    const targetElement = document.getElementById("target");
    if (targetElement) {
      targetElement.textContent = `Target: ${gameState.team1Score + 1}`;
      targetElement.classList.remove("hidden");
    }
  }
  }
