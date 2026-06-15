import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, deleteField, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA6l6cFJhXCbjy9cfoUzXaFAbKtCYA_PNs",
  authDomain: "broquiz.firebaseapp.com",
  projectId: "broquiz",
  storageBucket: "broquiz.firebasestorage.app",
  messagingSenderId: "9709625037",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function clear() {
  try {
    const snapshot = await getDocs(collection(db, "users"));
    let count = 0;
    for (const userDoc of snapshot.docs) {
      if (userDoc.data().fraud_detected === true) {
        await updateDoc(doc(db, "users", userDoc.id), {
          fraud_detected: deleteField()
        });
        count++;
        console.log(`Cleared for user: ${userDoc.id}`);
      }
    }
    console.log(`Done. Cleared fraud from ${count} users.`);
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}

clear();
