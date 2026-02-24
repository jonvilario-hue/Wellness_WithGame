
import type { TrialRecord } from '@/types';
import type { SessionRecord, GameProfile, SessionSummary, LatencyInfo } from '@/types/local-store';

const DB_NAME = 'cognitune-local';
const DB_VERSION = 1;

let db: IDBDatabase | null = null;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      if (!dbInstance.objectStoreNames.contains('sessions')) {
        dbInstance.createObjectStore('sessions', { keyPath: 'sessionId' });
      }
      if (!dbInstance.objectStoreNames.contains('trials')) {
        const trialStore = dbInstance.createObjectStore('trials', { keyPath: 'id', autoIncrement: false });
        trialStore.createIndex('sessionId', 'sessionId', { unique: false });
      }
      if (!dbInstance.objectStoreNames.contains('profiles')) {
        dbInstance.createObjectStore('profiles', { keyPath: 'gameId' });
      }
    };

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onerror = (event) => {
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

export const startSession = async (sessionMeta: { gameId: string; mode: string; deviceInfo: LatencyInfo; startTimestamp: number }): Promise<string> => {
  const db = await openDB();
  const sessionId = crypto.randomUUID();
  const session: SessionRecord = { ...sessionMeta, sessionId };

  const tx = db.transaction('sessions', 'readwrite');
  const store = tx.objectStore('sessions');
  await promisifyRequest(store.add(session));
  return sessionId;
};

export const logTrial = async (trial: TrialRecord): Promise<void> => {
  const db = await openDB();
  const tx = db.transaction('trials', 'readwrite');
  const store = tx.objectStore('trials');
  await promisifyRequest(store.add(trial));
};

export const endSession = async (sessionId: string, summary: SessionSummary): Promise<void> => {
    const db = await openDB();
    const tx = db.transaction('sessions', 'readwrite');
    const store = tx.objectStore('sessions');
    const session = await promisifyRequest(store.get(sessionId));
    if (session) {
        const updatedSession = { ...session, endTimestamp: Date.now(), summary };
        await promisifyRequest(store.put(updatedSession));
    }
};

export const getTrials = async (sessionId: string): Promise<TrialRecord[]> => {
    const db = await openDB();
    const tx = db.transaction('trials', 'readonly');
    const store = tx.objectStore('trials');
    const index = store.index('sessionId');
    return await promisifyRequest(index.getAll(sessionId));
};

export const getRecentSessions = async (gameId: string, count: number): Promise<SessionRecord[]> => {
    const db = await openDB();
    const tx = db.transaction('sessions', 'readonly');
    const store = tx.objectStore('sessions');
    const allSessions = await promisifyRequest(store.getAll());
    return allSessions
        .filter(s => s.gameId === gameId)
        .sort((a, b) => b.startTimestamp - a.startTimestamp)
        .slice(0, count);
};

export const getProfile = async (gameId: string): Promise<GameProfile | null> => {
  const db = await openDB();
  const tx = db.transaction('profiles', 'readonly');
  const store = tx.objectStore('profiles');
  const profile = await promisifyRequest(store.get(gameId));
  return profile || null;
};

export const setProfile = async (profile: GameProfile): Promise<void> => {
  const db = await openDB();
  const tx = db.transaction('profiles', 'readwrite');
  const store = tx.objectStore('profiles');
  await promisifyRequest(store.put(profile));
};

export const exportAllData = async (): Promise<string> => {
  const db = await openDB();
  const sessions = await promisifyRequest(db.transaction('sessions').objectStore('sessions').getAll());
  const trials = await promisifyRequest(db.transaction('trials').objectStore('trials').getAll());
  const profiles = await promisifyRequest(db.transaction('profiles').objectStore('profiles').getAll());
  return JSON.stringify({ sessions, trials, profiles }, null, 2);
};

export const importData = async (json: string): Promise<void> => {
  const db = await openDB();
  const data = JSON.parse(json);

  if (data.sessions) {
    const tx = db.transaction('sessions', 'readwrite');
    for (const session of data.sessions) {
      tx.objectStore('sessions').put(session); // put will overwrite duplicates
    }
  }
  if (data.trials) {
    const tx = db.transaction('trials', 'readwrite');
    for (const trial of data.trials) {
      tx.objectStore('trials').put(trial);
    }
  }
  if (data.profiles) {
    const tx = db.transaction('profiles', 'readwrite');
    for (const profile of data.profiles) {
      tx.objectStore('profiles').put(profile);
    }
  }
};

export const clearAllData = async (): Promise<void> => {
  const db = await openDB();
  await promisifyRequest(db.transaction('sessions', 'readwrite').objectStore('sessions').clear());
  await promisifyRequest(db.transaction('trials', 'readwrite').objectStore('trials').clear());
  await promisifyRequest(db.transaction('profiles', 'readwrite').objectStore('profiles').clear());
};
