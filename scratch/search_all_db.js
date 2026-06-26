const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyC2366CHQdrTehbt3PfgnQJE7HEiCM5G6E",
  authDomain: "zenzy-b1ac0.firebaseapp.com",
  projectId: "zenzy-b1ac0",
  storageBucket: "zenzy-b1ac0.firebasestorage.app",
  messagingSenderId: "47905404174",
  appId: "1:47905404174:web:2edb57fdc42213b769d35f"
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
