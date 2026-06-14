// Upload filtered questions to Firestore
// Run: node upload-filtered-questions.js

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, writeBatch, doc } = require('firebase/firestore');
const fs = require('fs');

const firebaseConfig = {
  apiKey: 'AIzaSyA6l6cFJhXCbjy9cfoUzXaFAbKtCYA_PNs',
  authDomain: 'broquiz.firebaseapp.com',
  projectId: 'broquiz',
  storageBucket: 'broquiz.firebasestorage.app',
  messagingSenderId: '9709625037',
  appId: '1:9709625037:web:5bba8bfa44194676d95384',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function uploadQuestions() {
  const data = JSON.parse(fs.readFileSync('d:/FayasDontOpen/Bro-Quiz/filtered-seeds.json', 'utf-8'));
  
  console.log(`Uploading ${data.length} questions to Firestore...`);
  console.log(`Level breakdown: L1=${data.filter(q=>q.level===1).length}, L2=${data.filter(q=>q.level===2).length}, L3=${data.filter(q=>q.level===3).length}, L4=${data.filter(q=>q.level===4).length}`);

  // Split into batches of 400 (Firestore limit is 500)
  const chunks = [];
  for (let i = 0; i < data.length; i += 400) {
    chunks.push(data.slice(i, i + 400));
  }

  let totalUploaded = 0;
  for (let ci = 0; ci < chunks.length; ci++) {
    const chunk = chunks[ci];
    const batch = writeBatch(db);
    
    for (const q of chunk) {
      const docRef = doc(collection(db, 'questions'));
      batch.set(docRef, {
        ...q,
        id: docRef.id,
        status: 'approved',
        source: 'admin_bulk',
        times_shown: 0,
        correct_count: 0,
        hash: `fq_${q.level}_${Math.random().toString(36).substring(2, 10)}`,
        created_at: new Date().toISOString(),
      });
    }
    
    await batch.commit();
    totalUploaded += chunk.length;
    console.log(`Batch ${ci + 1}/${chunks.length} committed (${totalUploaded}/${data.length} total)`);
  }

  console.log(`\n✅ Successfully uploaded ${totalUploaded} questions to Firestore!`);
  process.exit(0);
}

uploadQuestions().catch(err => {
  console.error('Upload failed:', err);
  process.exit(1);
});
