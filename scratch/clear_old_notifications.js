const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc, doc } = require('firebase/firestore');

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

async function clearNotifications() {
  console.log("Fetching notifications collection...");
  const snap = await getDocs(collection(db, "notifications"));
  console.log(`Found ${snap.size} notifications. Deleting...`);
  
  let count = 0;
  for (const d of snap.docs) {
    await deleteDoc(doc(db, "notifications", d.id));
    count++;
  }
  console.log(`Successfully cleared ${count} notifications from Firestore!`);
  process.exit(0);
}

clearNotifications().catch((err) => {
  console.error("Error clearing notifications:", err);
  process.exit(1);
});
