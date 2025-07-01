import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { 
  getDatabase, 
  ref, 
  set, 
  onValue, 
  get, 
  child, 
  update,
  push,
  onDisconnect,
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAGU0Tsj9pwZcgwQjZzTFvGOE032l2b7HI",
  authDomain: "handicricket-d1ab7.firebaseapp.com",
  databaseURL: "https://handicricket-d1ab7-default-rtdb.firebaseio.com",
  projectId: "handicricket-d1ab7",
  storageBucket: "handicricket-d1ab7.appspot.com",
  messagingSenderId: "356065986337",
  appId: "1:356065986337:web:399102c5dabfca2b6fe060",
  measurementId: "G-6XS69Z6MMF"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Connection monitoring
const connectedRef = ref(db, ".info/connected");
onValue(connectedRef, (snap) => {
  if (snap.val() === true) {
    console.log("Connected to Firebase");
  } else {
    console.log("Connection lost");
  }
});

export { 
  db, 
  ref, 
  set, 
  onValue, 
  get, 
  child, 
  update,
  push,
  onDisconnect,
  serverTimestamp 
};
