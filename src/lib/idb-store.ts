

import type { TrialRecord, AdaptiveState } from '@/types';
import type { ProfileRecord, SessionRecord, ReplayInputs } from '@/types/local-store';

const DB_NAME = 'cognitune-local';
const DB_VERSION = 2;
let db: IDBDatabase | null = null;

// Eviction Policy Configuration
const EVICTION_CONFIG = {
    maxTrials: 10000,
    checkInterval: 20, // Run eviction check every 20 writes
    batchDeleteSize: 500, // Number of records to delete at a time
};
let writeCounter = 0;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject('IndexedDB not available in this environment.');
    }

    if (db && db.version === DB_VERSION && db.objectStoreNames.contains('trials')) {
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
        if (!trialStore.indexNames.contains('timestamp')) {
            trialStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      }
      if (!dbInstance.objectStoreNames.contains('profiles')) {
          dbInstance.createObjectStore('profiles', { keyPath: 'id' });
      }
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
    const tx = db.transaction(['trials', 'sessions'], 'readwrite');
    const trialStore = tx.objectStore('trials');
    const sessionStore = tx.objectStore('sessions');
    
    const trialCount = await promisifyRequest(trialStore.count());

    if (trialCount <= EVICTION_CONFIG.maxTrials) {
        return;
    }
    
    // 1. Get all session IDs that are still in-progress
    const incompleteSessions = new Set<string>();
    let sessionCursor = await promisifyRequest(sessionStore.openCursor());
    while(sessionCursor) {
        if (!sessionCursor.value.sessionComplete) {
            incompleteSessions.add(sessionCursor.value.sessionId);
        }
        sessionCursor = await promisifyRequest(sessionCursor.continue());
    }

    // 2. Iterate through trials from oldest to newest and delete if they are not from an incomplete session
    const toDeleteCount = trialCount - EVICTION_CONFIG.maxTrials;
    console.log(`[Storage Eviction] Store count (${trialCount}) exceeds max (${EVICTION_CONFIG.maxTrials}). Deleting up to ${toDeleteCount} oldest trials.`);
    
    let deletedCount = 0;
    // Open cursor on the primary key, which is assumed to be chronologically sortable (e.g., ULID or timestamp-based UUID)
    let trialCursor = await promisifyRequest(trialStore.openCursor());

    while (trialCursor && deletedCount < toDeleteCount) {
        const trial = trialCursor.value as TrialRecord;
        if (!incompleteSessions.has(trial.sessionId)) {
            trialCursor.delete();
            deletedCount++;
        }
        trialCursor = await promisifyRequest(trialCursor.continue());
    }
    
    console.log(`[Storage Eviction] Deleted ${deletedCount} trial records.`);
};

export const logTrial = async (trial: TrialRecord): Promise<void> => {
  const db = await openDB();
  const tx = db.transaction(['trials'], 'readwrite');
  const store = tx.objectStore('trials');
  await promisifyRequest(store.put(trial));

  writeCounter++;
  if (writeCounter % EVICTION_CONFIG.checkInterval === 0) {
      runEviction(db).catch(e => console.error("Error during background eviction:", e));
  }
};

export const logTrialBatch = async (trials: TrialRecord[]): Promise<void> => {
    if (trials.length === 0) return;
    const db = await openDB();
    const tx = db.transaction(['trials'], 'readwrite');
    const store = tx.objectStore('trials');
    for (const trial of trials) {
        store.put(trial); // Use put to be idempotent
    }
    await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
};

export const startOrUpdateSession = async (session: SessionRecord): Promise<void> => {
    const db = await openDB();
    const tx = db.transaction(['sessions'], 'readwrite');
    const store = tx.objectStore('sessions');
    await promisifyRequest(store.put(session));
};

export const completeSession = async (sessionId: string, endTime: number): Promise<void> => {
    const db = await openDB();
    const tx = db.transaction(['sessions'], 'readwrite');
    const store = tx.objectStore('sessions');
    const session = await promisifyRequest(store.get(sessionId));
    if (session) {
        session.endTimestamp = endTime;
        session.sessionComplete = true;
        await promisifyRequest(store.put(session));
    }
};

export const extractReplayInputs = async (sessionId: string): Promise<ReplayInputs | null> => {
    const db = await openDB();
    const tx = db.transaction('sessions', 'readonly');
    const session = await promisifyRequest(tx.objectStore('sessions').get(sessionId));
    return session?.replayInputs || null;
}

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
  const sessions = await promisifyRequest(db.transaction('sessions').objectStore('sessions').getAll());
  
  return JSON.stringify({ profiles, trials, sessions }, null, 2);
};

export const importData = async (json: string): Promise<void> => {
  const db = await openDB();
  const data = JSON.parse(json);

  const clearTx = db.transaction(['profiles', 'trials', 'sessions'], 'readwrite');
  await Promise.all([
    promisifyRequest(clearTx.objectStore('profiles').clear()),
    promisifyRequest(clearTx.objectStore('trials').clear()),
    promisifyRequest(clearTx.objectStore('sessions').clear()),
  ]);
  
  if (data.profiles) {
    const tx = db.transaction('profiles', 'readwrite');
    for (const profile of data.profiles) tx.objectStore('profiles').put(profile);
    await new Promise<void>(resolve => tx.oncomplete = () => resolve());
  }
   if (data.trials) {
    const tx = db.transaction('trials', 'readwrite');
    for (const trial of data.trials) tx.objectStore('trials').put(trial);
    await new Promise<void>(resolve => tx.oncomplete = () => resolve());
  }
   if (data.sessions) {
    const tx = db.transaction('sessions', 'readwrite');
    for (const session of data.sessions) tx.objectStore('sessions').put(session);
    await new Promise<void>(resolve => tx.oncomplete = () => resolve());
  }
};

export const clearAllData = async (): Promise<void> => {
  const db = await openDB();
  const tx = db.transaction(['profiles', 'trials', 'sessions'], 'readwrite');
  await Promise.all([
    promisifyRequest(tx.objectStore('profiles').clear()),
    promisifyRequest(tx.objectStore('trials').clear()),
    promisifyRequest(tx.objectStore('sessions').clear()),
  ]);
};
