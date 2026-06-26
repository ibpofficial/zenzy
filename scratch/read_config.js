const { initializeApp } = require("firebase/app");
const { getFirestore, doc, getDoc } = require("firebase/firestore");

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

const { getDocs, collection } = require("firebase/firestore");

async function main() {
  const colRef = collection(db, "settings");
  const snap = await getDocs(colRef);
  snap.forEach((doc) => {
    console.log("Document ID:", doc.id);
    console.log(JSON.stringify(doc.data(), null, 2));
    console.log("----------------------------------------");
  });
  process.exit(0);
}
main().catch(console.error);
