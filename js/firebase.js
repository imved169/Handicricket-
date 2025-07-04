// Firebase configuration and initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getDatabase, ref, set, get, onValue, push, remove, update, child } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAGU0Tsj9pwZcgwQjZzTFvGOE032l2b7HI",
  authDomain: "handicricket-d1ab7.firebaseapp.com",
  projectId: "handicricket-d1ab7",
  storageBucket: "handicricket-d1ab7.appspot.com",
  messagingSenderId: "356065986337",
  appId: "1:356065986337:web:399102c5dabfca2b6fe060",
  measurementId: "G-6XS69Z6MMF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Export Firebase functions for use in other modules
window.firebase = {
  db,
  ref,
  set,
  get,
  onValue,
  push,
  remove,
  update,
  child
};

// Room management functions
window.createFirebaseRoom = async function(roomCode, teamName, format) {
  try {
    await set(ref(db, `rooms/${roomCode}/player1`), {
      teamName: teamName,
      format: format,
      online: true,
      joinedAt: Date.now()
    });
    
    await set(ref(db, `rooms/${roomCode}/gameState`), {
      format: format,
      status: 'waiting',
      createdAt: Date.now()
    });
    
    return true;
  } catch (error) {
    console.error('Error creating room:', error);
    throw error;
  }
};

window.joinFirebaseRoom = async function(roomCode, teamName) {
  try {
    const roomRef = ref(db, `rooms/${roomCode}`);
    const snapshot = await get(roomRef);
    
    if (!snapshot.exists()) {
      throw new Error('Room not found');
    }
    
    const roomData = snapshot.val();
    if (roomData.player2) {
      throw new Error('Room is full');
    }
    
    await set(ref(db, `rooms/${roomCode}/player2`), {
      teamName: teamName,
      online: true,
      joinedAt: Date.now()
    });
    
    return true;
  } catch (error) {
    console.error('Error joining room:', error);
    throw error;
  }
};

window.checkRoomExists = async function(roomCode) {
  try {
    const snapshot = await get(ref(db, `rooms/${roomCode}`));
    return snapshot.exists();
  } catch (error) {
    console.error('Error checking room:', error);
    return false;
  }
};

window.createAIRoom = async function(roomCode, format, difficulty) {
  try {
    await set(ref(db, `rooms/${roomCode}/player1`), {
      teamName: 'Human Player',
      format: format,
      online: true,
      joinedAt: Date.now()
    });
    
    await set(ref(db, `rooms/${roomCode}/player2`), {
      teamName: 'AI Opponent',
      isAI: true,
      difficulty: difficulty,
      online: true,
      joinedAt: Date.now()
    });
    
    await set(ref(db, `rooms/${roomCode}/gameState`), {
      format: format,
      status: 'ai_game',
      difficulty: difficulty,
      createdAt: Date.now()
    });
    
    return true;
  } catch (error) {
    console.error('Error creating AI room:', error);
    throw error;
  }
};

window.joinAsSpectatorFirebase = async function(roomCode) {
  try {
    const roomRef = ref(db, `rooms/${roomCode}`);
    const snapshot = await get(roomRef);
    
    if (!snapshot.exists()) {
      throw new Error('Room not found');
    }
    
    const spectatorId = 'spec_' + Math.random().toString(36).substr(2, 8);
    const spectatorsRef = ref(db, `rooms/${roomCode}/spectators/${spectatorId}`);
    
    await set(spectatorsRef, {
      joinedAt: Date.now(),
      emoji: null,
      vote: null,
      online: true
    });
    
    return spectatorId;
  } catch (error) {
    console.error('Error joining as spectator:', error);
    throw error;
  }
};

// Game state management
window.saveGameState = async function(roomCode, gameState) {
  try {
    await set(ref(db, `rooms/${roomCode}/gameState`), {
      ...gameState,
      lastUpdated: Date.now()
    });
    return true;
  } catch (error) {
    console.error('Error saving game state:', error);
    throw error;
  }
};

window.loadGameState = async function(roomCode) {
  try {
    const snapshot = await get(ref(db, `rooms/${roomCode}/gameState`));
    return snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    console.error('Error loading game state:', error);
    throw error;
  }
};

// Saved games management
window.saveGame = async function(roomCode, gameData) {
  try {
    await set(ref(db, `savedGames/${roomCode}`), {
      ...gameData,
      savedAt: Date.now()
    });
    return true;
  } catch (error) {
    console.error('Error saving game:', error);
    throw error;
  }
};

window.loadSavedGames = async function() {
  try {
    const snapshot = await get(ref(db, 'savedGames'));
    const games = snapshot.val() || {};
    
    const container = document.getElementById('savedGamesList');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (Object.keys(games).length === 0) {
      container.innerHTML = '<p class="no-saved-games">No saved games found</p>';
      return;
    }
    
    Object.entries(games).forEach(([roomId, game]) => {
      const gameEl = document.createElement('div');
      gameEl.className = 'saved-game-item fade-in';
      
      const formatName = getFormatName(game.format);
      const dateStr = new Date(game.savedAt).toLocaleDateString();
      
      gameEl.innerHTML = `
        <h4>${game.teams.team1} vs ${game.teams.team2}</h4>
        <p class="game-format">${formatName}</p>
        <p class="game-score">Score: ${game.score.team1}-${game.score.team2}</p>
        <p class="game-date">Saved: ${dateStr}</p>
      `;
      
      gameEl.addEventListener('click', () => {
        if (confirm('Resume this saved game?')) {
          window.location.href = `game.html?room=${roomId}&player=player1&resume=true`;
        }
      });
      
      container.appendChild(gameEl);
    });
  } catch (error) {
    console.error('Error loading saved games:', error);
  }
};

// Live matches management
window.loadLiveMatches = async function() {
  try {
    const snapshot = await get(ref(db, 'rooms'));
    const rooms = snapshot.val() || {};
    
    const container = document.getElementById('liveMatchesList');
    if (!container) return;
    
    container.innerHTML = '';
    
    const liveMatches = Object.entries(rooms).filter(([roomId, room]) => {
      return room.gameState && 
             room.gameState.status === 'playing' && 
             room.player1 && 
             room.player2 &&
             !room.player2.isAI;
    });
    
    if (liveMatches.length === 0) {
      container.innerHTML = '<p class="no-matches">No live matches available</p>';
      return;
    }
    
    liveMatches.forEach(([roomId, room]) => {
      const matchEl = document.createElement('div');
      matchEl.className = 'live-match-item fade-in';
      
      const formatName = getFormatName(room.player1.format);
      
      matchEl.innerHTML = `
        <h4>${room.player1.teamName} vs ${room.player2.teamName}</h4>
        <p class="match-format">${formatName}</p>
        <p class="match-status">Live Now</p>
      `;
      
      matchEl.addEventListener('click', () => {
        if (confirm('Join this match as spectator?')) {
          document.getElementById('spectatorCode').value = roomId;
          joinAsSpectator();
        }
      });
      
      container.appendChild(matchEl);
    });
  } catch (error) {
    console.error('Error loading live matches:', error);
  }
};

// Spectator data management
window.updateSpectatorData = async function(roomCode, data) {
  try {
    await set(ref(db, `rooms/${roomCode}/spectatorData`), {
      ...data,
      lastUpdated: Date.now()
    });
    return true;
  } catch (error) {
    console.error('Error updating spectator data:', error);
    throw error;
  }
};

window.addSpectatorReaction = async function(roomCode, spectatorId, emoji) {
  try {
    const reactionRef = push(ref(db, `rooms/${roomCode}/reactions`));
    await set(reactionRef, {
      spectatorId: spectatorId,
      emoji: emoji,
      timestamp: Date.now()
    });
    
    // Remove reaction after 5 seconds
    setTimeout(() => {
      remove(reactionRef);
    }, 5000);
    
    return true;
  } catch (error) {
    console.error('Error adding reaction:', error);
    throw error;
  }
};

// Player online status management
window.setPlayerOnline = async function(roomCode, player) {
  try {
    await set(ref(db, `rooms/${roomCode}/${player}/online`), true);
    await set(ref(db, `rooms/${roomCode}/${player}/lastSeen`), Date.now());
    return true;
  } catch (error) {
    console.error('Error setting player online:', error);
    throw error;
  }
};

window.setPlayerOffline = async function(roomCode, player) {
  try {
    await set(ref(db, `rooms/${roomCode}/${player}/online`), false);
    await set(ref(db, `rooms/${roomCode}/${player}/lastSeen`), Date.now());
    return true;
  } catch (error) {
    console.error('Error setting player offline:', error);
    throw error;
  }
};

// Connection monitoring
window.monitorConnection = function(roomCode, player, callback) {
  const playerRef = ref(db, `rooms/${roomCode}/${player}`);
  const opponentPlayer = player === 'player1' ? 'player2' : 'player1';
  const opponentRef = ref(db, `rooms/${roomCode}/${opponentPlayer}`);
  
  // Monitor opponent's online status
  onValue(opponentRef, (snapshot) => {
    const opponentData = snapshot.val();
    if (opponentData && callback) {
      callback(opponentData.online, opponentData.lastSeen);
    }
  });
  
  // Set up disconnect handling
  const onDisconnectRef = ref(db, `rooms/${roomCode}/${player}/online`);
  // Note: Firebase onDisconnect is not available in the web SDK v9
  // This would need to be handled differently in a real implementation
};

// Cleanup functions
window.cleanupOldRooms = async function() {
  try {
    const snapshot = await get(ref(db, 'rooms'));
    const rooms = snapshot.val() || {};
    
    const currentTime = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    Object.entries(rooms).forEach(async ([roomId, room]) => {
      const roomAge = currentTime - (room.gameState?.createdAt || 0);
      if (roomAge > maxAge && room.gameState?.status !== 'playing') {
        await remove(ref(db, `rooms/${roomId}`));
      }
    });
  } catch (error) {
    console.error('Error cleaning up old rooms:', error);
  }
};

// Initialize Firebase connection
console.log('Firebase initialized successfully');

// Export for use in other modules
export { db, ref, set, get, onValue, push, remove, update, child };
