
import type { TrialRecord, AdaptiveState } from '@/types';
import type { SessionRecord, SessionSummary, LatencyInfo, ProfileRecord } from '@/types/local-store';

const DB_NAME = 'cognitune-local';
const DB_VERSION = 2;
let db: IDBDatabase | null = null;

const MAX_TRIALS_IN_DB = 10000;
const EVICTION_CHECK_INTERVAL = 20;
let writeCounter = 0;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      // Guard against server-side execution, return a mock object or reject
      return reject('IndexedDB not available in this environment.');
    }

    if (db && db.version === DB_VERSION) {
      resolve(db);
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      if (!dbInstance.objectStoreNames.contains('sessions')) {
        const sessionStore = dbInstance.createObjectStore('sessions', { keyPath: 'sessionId' });
        sessionStore.createIndex('gameId', 'gameId', { unique: false });
        sessionStore.createIndex('startTimestamp', 'startTimestamp', { unique: false });
      }
      if (!dbInstance.objectStoreNames.contains('trials')) {
        const trialStore = dbInstance.createObjectStore('trials', { keyPath: 'id' });
        trialStore.createIndex('sessionId', 'sessionId', { unique: false });
        trialStore.createIndex('gameId', 'gameId', { unique: false });
        trialStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
      if (dbInstance.objectStoreNames.contains('profiles')) {
          dbInstance.deleteObjectStore('profiles');
      }
      dbInstance.createObjectStore('profiles', { keyPath: 'id' });
    };

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onerror = (event) => {
      console.error('IndexedDB error:', (event.target as IDBOpenDBRequest).error);
      reject('IndexedDB error: ' + (event.target as IDBOpenDBRequest).error);
    };
  });
};

export const initDB = openDB;

const promisifyRequest = <T>(request: IDBRequest<T>): Promise<T> => {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const runEviction = async (db: IDBDatabase) => {
    const tx = db.transaction('trials', 'readwrite');
    const store = tx.objectStore('trials');
    const countReq = store.count();
    const count = await promisifyRequest(countReq);

    if (count > MAX_TRIALS_IN_DB) {
        const trialsToDelete = count - MAX_TRIALS_IN_DB;
        let cursor = await promisifyRequest(store.index('timestamp').openCursor(null, 'next'));
        console.log(`Eviction triggered. Store count: ${count}. Deleting ${trialsToDelete} oldest trials.`);
        for (let i = 0; i < trialsToDelete && cursor; i++) {
            store.delete(cursor.primaryKey);
            cursor = await promisifyRequest(cursor.continue());
        }
    }
};

export const logTrial = async (trial: TrialRecord): Promise<void> => {
  const db = await openDB();
  const tx = db.transaction(['trials'], 'readwrite');
  const store = tx.objectStore('trials');
  
  await promisifyRequest(store.add(trial));
  
  writeCounter++;
  if (writeCounter % EVICTION_CHECK_INTERVAL === 0) {
      runEviction(db);
  }
};


export const getProfile = async (id: string): Promise<AdaptiveState | null> => {
  const db = await openDB();
  const tx = db.transaction('profiles', 'readonly');
  const store = tx.objectStore('profiles');
  const profileRecord = await promisifyRequest(store.get(id));
  return profileRecord ? profileRecord.state : null;
};

export const setProfile = async (id: string, state: AdaptiveState): Promise<void> => {
  const db = await openDB();
  const tx = db.transaction('profiles', 'readwrite');
  const store = tx.objectStore('profiles');
  await promisifyRequest(store.put({ id, state }));
};

export const getAllProfiles = async (): Promise<ProfileRecord[]> => {
    const db = await openDB();
    const tx = db.transaction('profiles', 'readonly');
    const store = tx.objectStore('profiles');
    return await promisifyRequest(store.getAll());
};

export const exportAllData = async (): Promise<string> => {
  const db = await openDB();
  const profiles = await promisifyRequest(db.transaction('profiles').objectStore('profiles').getAll());
  const trials = await promisifyRequest(db.transaction('trials').objectStore('trials').getAll());
  // The 'sessions' store doesn't seem to be used, but we'll include it for completeness if it exists.
  let sessions = [];
  if (db.objectStoreNames.contains('sessions')) {
    sessions = await promisifyRequest(db.transaction('sessions').objectStore('sessions').getAll());
  }
  return JSON.stringify({ profiles, trials, sessions }, null, 2);
};

export const importData = async (json: string): Promise<void> => {
  const db = await openDB();
  const data = JSON.parse(json);

  if (data.profiles) {
    const tx = db.transaction('profiles', 'readwrite');
    for (const profile of data.profiles) {
      tx.objectStore('profiles').put(profile);
    }
    await new Promise(resolve => tx.oncomplete = resolve);
  }
   if (data.trials) {
    const tx = db.transaction('trials', 'readwrite');
    for (const trial of data.trials) {
      tx.objectStore('trials').put(trial);
    }
    await new Promise(resolve => tx.oncomplete = resolve);
  }
   if (data.sessions) {
    const tx = db.transaction('sessions', 'readwrite');
    for (const session of data.sessions) {
      tx.objectStore('sessions').put(session);
    }
    await new Promise(resolve => tx.oncomplete = resolve);
  }
};

export const clearAllData = async (): Promise<void> => {
  const db = await openDB();
  if (db.objectStoreNames.contains('sessions')) {
    await promisifyRequest(db.transaction('sessions', 'readwrite').objectStore('sessions').clear());
  }
  await promisifyRequest(db.transaction('trials', 'readwrite').objectStore('trials').clear());
  await promisifyRequest(db.transaction('profiles', 'readwrite').objectStore('profiles').clear());
};


// Audit 3.5: Add development-only storage simulation function
export const simulateStorageLoad = async (sessionCount: number, trialsPerSession: number) => {
    if (process.env.NODE_ENV !== 'development') return;

    console.log(`Simulating load: ${sessionCount} sessions, ${trialsPerSession} trials each...`);
    const totalTrials = sessionCount * trialsPerSession;

    for (let i = 0; i < totalTrials; i++) {
        const mockTrial: TrialRecord = {
            id: `sim-${Date.now()}-${i}`,
            sessionId: `sim-session-${Math.floor(i / trialsPerSession)}`,
            gameId: 'gf_pattern_matrix',
            trialIndex: i % trialsPerSession,
            correct: Math.random() > 0.5,
            rtMs: 500 + Math.random() * 1000,
            timestamp: Date.now() - (totalTrials - i) * 2000,
            difficultyLevel: 1,
            stimulusParams: {},
            stimulusOnsetTs: 0,
            responseTs: 0,
            responseType: 'n/a',
        };
        await logTrial(mockTrial); // Use the real logTrial to include eviction logic
        if (i > 0 && i % 1000 === 0) {
           console.log(`... ${i} trials written.`);
        }
    }
    
    const db = await openDB();
    const finalCount = await promisifyRequest(db.transaction('trials', 'readonly').objectStore('trials').count());
    console.log(`Load simulation complete. Final store count: ${finalCount}`);
};

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    (window as any).simulateStorageLoad = simulateStorageLoad;
}
