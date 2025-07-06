// createRoomAI.js
import { db, ref, set } from './firebase.js';

export async function createAIRoom(roomCode, teamName, format) {
  await set(ref(db, 'rooms/' + roomCode), {
    player1: {
      name: teamName,
      format: format,
      ready: false
    },
    player2: {
      name: "AI",
      ready: false
    },
    mode: "AI",
    tossWinner: "player1"
  });
}
