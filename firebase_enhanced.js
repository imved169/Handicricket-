import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getDatabase, ref, set, onValue, get, child, push } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCN6aZMwlsZe7JJaovU0WA3UQygWr4jYmA",
  authDomain: "handicricket-85a06.firebaseapp.com",
  projectId: "handicricket-85a06",
  storageBucket: "handicricket-85a06.appspot.com",
  messagingSenderId: "599182538558",
  appId: "1:599182538558:web:3e965753ab05f8f1e3de6f",
  measurementId: "G-HSV9H4LEJQ",
  databaseURL: "https://handicricket-85a06-default-rtdb.firebaseio.com/"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export function sendReaction(roomId, reaction) {
  const reactionsRef = ref(db, `rooms/${roomId}/reactions`);
  return push(reactionsRef, {
    emoji: reaction,
    timestamp: Date.now()
  });
}

export { db, ref, set, onValue, get, child, push };
