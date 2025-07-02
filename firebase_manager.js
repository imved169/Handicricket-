
import { db, ref, set, get, onValue } from './firebase.js';

export class FirebaseManager {
  static async saveMatch(roomId, matchData) {
    await set(ref(db, `matches/${roomId}`), {
      ...matchData,
      timestamp: Date.now()
    });
  }

  static async loadMatch(roomId) {
    const snapshot = await get(ref(db, `matches/${roomId}`));
    return snapshot.val();
  }

  static setupSpectatorUpdates(roomId, callback) {
    onValue(ref(db, `rooms/${roomId}/live`), (snap) => {
      callback(snap.val());
    });
  }
}
