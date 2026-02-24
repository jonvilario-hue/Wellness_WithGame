
'use client';

import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import type { GameId, TrialResult } from '@/types';

// This is a placeholder for the actual Firebase app instance.
// In a real app, this would be initialized in a central firebase config file.
let db: any = null;
let auth: any = null;

try {
    const { getFirebase } = require('@/firebase');
    const firebase = getFirebase();
    db = getFirestore(firebase.app);
    auth = getAuth(firebase.app);
} catch (e) {
    console.error("Firebase not initialized. Trial logging will be disabled.", e);
}


export const logTrialResult = async (
  module_id: GameId,
  currentLevel: number,
  trialResult: TrialResult
) => {
  if (!db || !auth) {
      console.log("Firestore not available, skipping trial log.");
      return;
  }
  
  const user = auth.currentUser;
  if (!user) {
    // console.log("No user signed in, skipping trial log.");
    return;
  }

  const payload = {
      userId: user.uid,
      timestamp: serverTimestamp(),
      module_id,
      currentLevel,
      isCorrect: trialResult.correct,
      responseTime_ms: trialResult.reactionTimeMs,
      ...trialResult.telemetry,
  };

  try {
    await addDoc(collection(db, 'users', user.uid, 'trial_logs'), payload);
  } catch (error) {
    console.error("Error logging trial to Firestore:", error);
    // In a production app, you might queue this for retry using a service worker.
  }
};
