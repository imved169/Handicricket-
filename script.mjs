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



// ✅ Feature Patch: 2-Lives, Test Follow-On, MVP Tracking
import { db, ref, onValue, update, set } from './firebase.js';

const roomCode = localStorage.getItem("roomCode");
const gameRef = ref(db, `rooms/${roomCode}/game`);

let life = 1; // default 1 (means on first out it goes to 0, then Wicket falls)
onValue(gameRef, (snap) => {
  const data = snap.val();
  if (!data || !data.status) return;

  const isPowerplay = data.currentOver < (data.powerplayOvers || 2);
  if (!isPowerplay) {
    if (data.result === "WICKET") {
      if (life === 1) {
        // Don't register wicket, just lose 1 life
        life = 0;
        update(gameRef, { result: "LIFE LOST", status: "resolved" });
        return;
      } else {
        // Real wicket now
        life = 1; // reset life for next batter
      }
    } else {
      life = 1; // reset if any run scored
    }
  }

  // ✅ MVP Stat Tracker
  if (data.result && data.result.includes("runs")) {
    const scorer = data.currentBatter;
    const runs = parseInt(data.result.split(" ")[0]);
    const statsRef = ref(db, `rooms/${roomCode}/stats/${scorer}`);
    onValue(statsRef, (s) => {
      let val = s.val() || { runs: 0, wickets: 0 };
      val.runs += runs;
      set(statsRef, val);
    }, { onlyOnce: true });
  } else if (data.result === "WICKET") {
    const bowler = data.currentBowler;
    const statsRef = ref(db, `rooms/${roomCode}/stats/${bowler}`);
    onValue(statsRef, (s) => {
      let val = s.val() || { runs: 0, wickets: 0 };
      val.wickets += 1;
      set(statsRef, val);
    }, { onlyOnce: true });
  }

  // ✅ Auto Summary Save at Game Over
  if (data.matchOver && data.result.includes("won")) {
    const statsPath = ref(db, `rooms/${roomCode}/stats`);
    onValue(statsPath, (snap) => {
      const stats = snap.val() || {};
      let topPlayer = "";
      let maxScore = -1;
      Object.entries(stats).forEach(([player, stat]) => {
        const score = (stat.runs || 0) + (stat.wickets || 0) * 20;
        if (score > maxScore) {
          maxScore = score;
          topPlayer = player;
        }
      });
      const summaryRef = ref(db, `rooms/${roomCode}/summary`);
      set(summaryRef, {
        result: data.result,
        mvp: topPlayer || "N/A",
        timestamp: Date.now()
      });
    }, { onlyOnce: true });
  }
});
