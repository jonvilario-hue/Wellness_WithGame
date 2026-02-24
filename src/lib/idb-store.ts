
import type { TrialRecord, AdaptiveState } from '@/types';
import type { ProfileRecord } from '@/types/local-store';

const DB_NAME = 'cognitune-local';
const DB_VERSION = 2;
let db: IDBDatabase | null = null;

// Eviction Policy Configuration
const EVICTION_CONFIG = {
    maxTrials: 10000,
    checkInterval: 20, // Run eviction check every 20 writes
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
        trialStore.createIndex('gameId', 'gameId', { unique: false });
        trialStore.createIndex('timestamp', 'timestamp', { unique: false });
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
    const tx = db.transaction('trials', 'readwrite');
    const store = tx.objectStore('trials');
    const countReq = store.count();
    const count = await promisifyRequest(countReq);

    if (count > EVICTION_CONFIG.maxTrials) {
        let cursor = await promisifyRequest(store.index('timestamp').openCursor());
        const toDelete = count - EVICTION_CONFIG.maxTrials;
        console.log(`[Storage Eviction] Store count (${count}) exceeds max (${EVICTION_CONFIG.maxTrials}). Deleting ${toDelete} oldest trials.`);
        for (let i = 0; i < toDelete && cursor; i++) {
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
  if (writeCounter % EVICTION_CONFIG.checkInterval === 0) {
      runEviction(db).catch(e => console.error("Error during background eviction:", e));
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
  
  let sessions = [];
  if (db.objectStoreNames.contains('sessions')) {
    sessions = await promisifyRequest(db.transaction('sessions').objectStore('sessions').getAll());
  }
  return JSON.stringify({ profiles, trials, sessions }, null, 2);
};

export const importData = async (json: string): Promise<void> => {
  const db = await openDB();
  const data = JSON.parse(json);

  const clearTx = db.transaction(['profiles', 'trials', 'sessions'], 'readwrite');
  await Promise.all([
    promisifyRequest(clearTx.objectStore('profiles').clear()),
    promisifyRequest(clearTx.objectStore('trials').clear()),
    clearTx.objectStoreNames.contains('sessions') ? promisifyRequest(clearTx.objectStore('sessions').clear()) : Promise.resolve(),
  ]);
  
  if (data.profiles) {
    const tx = db.transaction('profiles', 'readwrite');
    for (const profile of data.profiles) {
      tx.objectStore('profiles').put(profile);
    }
    await new Promise<void>(resolve => tx.oncomplete = () => resolve());
  }
   if (data.trials) {
    const tx = db.transaction('trials', 'readwrite');
    for (const trial of data.trials) {
      tx.objectStore('trials').put(trial);
    }
    await new Promise<void>(resolve => tx.oncomplete = () => resolve());
  }
   if (data.sessions) {
    const tx = db.transaction('sessions', 'readwrite');
    for (const session of data.sessions) {
      tx.objectStore('sessions').put(session);
    }
    await new Promise<void>(resolve => tx.oncomplete = () => resolve());
  }
};

export const clearAllData = async (): Promise<void> => {
  const db = await openDB();
  const tx = db.transaction(['profiles', 'trials', 'sessions'], 'readwrite');
  await Promise.all([
    promisifyRequest(tx.objectStore('profiles').clear()),
    promisifyRequest(tx.objectStore('trials').clear()),
    tx.objectStoreNames.contains('sessions') ? promisifyRequest(tx.objectStore('sessions').clear()) : Promise.resolve(),
  ]);
};
