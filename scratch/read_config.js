const { initializeApp } = require("firebase/app");
const { getFirestore, doc, getDoc } = require("firebase/firestore");

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
