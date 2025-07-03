import { getDatabase, ref, onValue } from "firebase/database";

export function reconnectPlayer(roomCode, playerId, callback) {
  const db = getDatabase();
  const playerRef = ref(db, `liveMatches/${roomCode}/players/${playerId}`);
  onValue(playerRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    }
  });
}
