const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyBD8I4rMj-AJoqZoVarb205hCB26Oe4fao",
  authDomain: "zenzy-d2e0e.firebaseapp.com",
  projectId: "zenzy-d2e0e",
  storageBucket: "zenzy-d2e0e.firebasestorage.app",
  messagingSenderId: "937394853130",
  appId: "1:937394853130:web:a59cb1db2d87ce610fd6f3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const collections = [
  "settings", "workers", "users", "bookings", "payments",
  "supportTickets", "categories", "promos", "notifications"
];

async function main() {
  for (const colName of collections) {
    try {
      const snap = await getDocs(collection(db, colName));
      snap.forEach((doc) => {
        const data = doc.data();
        const str = JSON.stringify(data).toLowerCase();
        if (str.includes("tip")) {
          console.log(`Found 'tip' in collection '${colName}', doc ID '${doc.id}':`);
          console.log(JSON.stringify(data, null, 2));
          console.log("----------------------------------------");
        }
      });
    } catch (e) {
      console.error(`Error reading ${colName}:`, e.message);
    }
  }
  process.exit(0);
}
main().catch(console.error);
