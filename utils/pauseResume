import { getDatabase, ref, set, onValue } from "firebase/database";

export function togglePause(roomCode, isPaused) {
  const db = getDatabase();
  set(ref(db, `liveMatches/${roomCode}/pause`), isPaused);
}

export function listenPause(roomCode, callback) {
  const db = getDatabase();
  const pauseRef = ref(db, `liveMatches/${roomCode}/pause`);
  onValue(pauseRef, (snapshot) => {
    callback(snapshot.val());
  });
}
