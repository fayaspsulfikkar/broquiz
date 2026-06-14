// Upload filtered questions to Firestore using Firebase Admin SDK
// Uses the Firebase CLI's stored credentials via GOOGLE_APPLICATION_CREDENTIALS
// Run: node upload-questions-v2.js

const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

// Try to find firebase-tools config directory for credentials
const os = require('os');
const configDir = path.join(os.homedir(), '.config', 'configstore');
let refreshToken = null;

try {
  const tokensPath = path.join(configDir, 'firebase-tools.json');
  if (fs.existsSync(tokensPath)) {
    const tokens = JSON.parse(fs.readFileSync(tokensPath, 'utf-8'));
    refreshToken = tokens.tokens?.refresh_token;
  }
} catch (e) {
  // ignore
}

// Use ADC with project ID
const app = initializeApp({
  projectId: 'broquiz',
  credential: applicationDefault(),
});

const db = getFirestore(app);

async function uploadQuestions() {
  const dataPath = path.resolve(__dirname, '..', 'filtered-seeds.json');
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  
  console.log(`Uploading ${data.length} questions to Firestore...`);
  console.log(`Level breakdown: L1=${data.filter(q=>q.level===1).length}, L2=${data.filter(q=>q.level===2).length}, L3=${data.filter(q=>q.level===3).length}, L4=${data.filter(q=>q.level===4).length}`);

  const chunks = [];
  for (let i = 0; i < data.length; i += 400) {
    chunks.push(data.slice(i, i + 400));
  }

  let totalUploaded = 0;
  for (let ci = 0; ci < chunks.length; ci++) {
    const chunk = chunks[ci];
    const batch = db.batch();
    
    for (const q of chunk) {
      const docRef = db.collection('questions').doc();
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
  console.error('Upload failed:', err.message);
  console.error('Full error:', err);
  process.exit(1);
});
