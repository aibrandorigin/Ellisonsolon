import { initializeApp } from 'firebase/app';
import { initializeFirestore, doc, getDoc, setDoc, writeBatch } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true,
}, firebaseConfig.firestoreDatabaseId);

async function runTest() {
  console.log('--- PHASE 1: Testing Firestore Connectivity & Writes ---');
  console.log('Target DB:', firebaseConfig.firestoreDatabaseId);
  console.log('Project ID:', firebaseConfig.projectId);

  for (let i = 1; i <= 15; i++) {
    const startTime = Date.now();
    try {
      const testDocRef = doc(db, 'property_content', 'test_sync_record');
      await setDoc(testDocRef, {
        testId: `save_${i}`,
        timestamp: Date.now(),
        iteration: i
      });
      const duration = Date.now() - startTime;
      console.log(`Save #${i} SUCCESS: duration=${duration}ms`);
    } catch (err: any) {
      const duration = Date.now() - startTime;
      console.error(`Save #${i} FAILED: duration=${duration}ms, code=${err?.code}, message=${err?.message}`);
      if (err?.stack) {
        console.error('Stack:', err.stack);
      }
      break;
    }
  }
}

runTest().then(() => process.exit(0)).catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
