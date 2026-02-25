
import type { AdaptiveState } from '@/types';
import type { ProfileRecord, SessionRecord, CachedAsset } from '@/types/local-store';
import type { TelemetryEvent } from './telemetry-events';

const DB_NAME = 'cognitune-local';
const DB_VERSION = 5;
let db: IDBDatabase | null = null;

// Eviction Policy Configuration
const EVICTION_CONFIG = {
    maxEvents: 10000,
    checkInterval: 20, // Check for eviction every 20 writes
    batchDeleteSize: 500,
    assetCacheMaxSizeBytes: 250 * 1024 * 1024, // 250MB
};
let writeCounter = 0;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject('IndexedDB not available in this environment.');
    }

    if (db && db.version === DB_VERSION && db.objectStoreNames.contains('asset-cache')) {
      resolve(db);
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      if (dbInstance.objectStoreNames.contains('trials')) {
          dbInstance.deleteObjectStore('trials');
      }

      if (!dbInstance.objectStoreNames.contains('sessions')) {
        const sessionStore = dbInstance.createObjectStore('sessions', { keyPath: 'sessionId' });
        sessionStore.createIndex('gameId', 'gameId', { unique: false });
        sessionStore.createIndex('startTimestamp', 'startTimestamp', { unique: false });
      }
      if (!dbInstance.objectStoreNames.contains('events')) {
        const eventStore = dbInstance.createObjectStore('events', { keyPath: 'eventId' });
        eventStore.createIndex('sessionId', 'sessionId', { unique: false });
        eventStore.createIndex('timestamp', 'timestamp', { unique: false });
        eventStore.createIndex('session_seq', ['sessionId', 'seq'], { unique: true });
      }
      if (!dbInstance.objectStoreNames.contains('profiles')) {
          dbInstance.createObjectStore('profiles', { keyPath: 'id' });
      }
      if (!dbInstance.objectStoreNames.contains('asset-cache')) {
          const assetStore = dbInstance.createObjectStore('asset-cache', { keyPath: 'url' });
          assetStore.createIndex('cachedAt', 'cachedAt', { unique: false });
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
    const tx = db.transaction(['events', 'sessions', 'asset-cache'], 'readwrite');
    const eventStore = tx.objectStore('events');
    const sessionStore = tx.objectStore('sessions');
    const assetStore = tx.objectStore('asset-cache');
    
    // --- Event Eviction ---
    const eventCount = await promisifyRequest(eventStore.count());

    if (eventCount > EVICTION_CONFIG.maxEvents) {
        const activeSessionIds = new Set<string>();
        let sessionCursor = await promisifyRequest(sessionStore.openCursor());
        while(sessionCursor) {
            if (!sessionCursor.value.sessionComplete) {
                activeSessionIds.add(sessionCursor.value.sessionId);
            }
            sessionCursor = await promisifyRequest(sessionCursor.continue!());
        }

        const toDeleteCount = eventCount - EVICTION_CONFIG.maxEvents;
        let deletedCount = 0;
        let eventCursor = await promisifyRequest(eventStore.openCursor());

        while (eventCursor && deletedCount < toDeleteCount) {
            const event = eventCursor.value as TelemetryEvent;
            if (!activeSessionIds.has(event.sessionId)) {
                eventCursor.delete();
                deletedCount++;
            }
            eventCursor = await promisifyRequest(eventCursor.continue!());
        }
        console.log(`[Storage Eviction] Deleted ${deletedCount} old event records.`);
    }

    // --- Asset Cache LRU Eviction ---
    const allAssets = await promisifyRequest(assetStore.getAll());
    const totalAssetSize = allAssets.reduce((sum, asset) => sum + asset.sizeBytes, 0);

    if (totalAssetSize > EVICTION_CONFIG.assetCacheMaxSizeBytes) {
        const sortedAssets = allAssets.sort((a, b) => a.cachedAt - b.cachedAt);
        let bytesToDelete = totalAssetSize - EVICTION_CONFIG.assetCacheMaxSizeBytes;
        let assetsDeletedCount = 0;
        
        for (const asset of sortedAssets) {
            if (bytesToDelete <= 0) break;
            await promisifyRequest(assetStore.delete(asset.url));
            bytesToDelete -= asset.sizeBytes;
            assetsDeletedCount++;
        }
        console.log(`[Storage Eviction] Deleted ${assetsDeletedCount} oldest assets from cache to free up space.`);
    }
};

export const logEvent = async (event: TelemetryEvent): Promise<void> => {
  const db = await openDB();
  const tx = db.transaction(['events'], 'readwrite');
  const store = tx.objectStore('events');
  await promisifyRequest(store.put(event));

  writeCounter++;
  if (writeCounter % EVICTION_CONFIG.checkInterval === 0) {
      runEviction(db).catch(e => console.error("Error during background eviction:", e));
  }
};

export const logEventBatch = async (events: TelemetryEvent[]): Promise<void> => {
    if (events.length === 0) return;
    const db = await openDB();
    const tx = db.transaction(['events'], 'readwrite');
    const store = tx.objectStore('events');
    for (const event of events) {
        store.put(event);
    }
    await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
};

export const getEventsForSession = async (sessionId: string): Promise<TelemetryEvent[]> => {
    const db = await openDB();
    const tx = db.transaction('events', 'readonly');
    const index = tx.objectStore('events').index('sessionId');
    return await promisifyRequest(index.getAll(sessionId));
}

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
  const events = await promisifyRequest(db.transaction('events').objectStore('events').getAll());
  const sessions = await promisifyRequest(db.transaction('sessions').objectStore('sessions').getAll());
  
  return JSON.stringify({ profiles, events, sessions }, null, 2);
};

export const importData = async (json: string): Promise<void> => {
  const db = await openDB();
  const data = JSON.parse(json);

  const clearTx = db.transaction(['profiles', 'events', 'sessions', 'asset-cache'], 'readwrite');
  await Promise.all([
    promisifyRequest(clearTx.objectStore('profiles').clear()),
    promisifyRequest(clearTx.objectStore('events').clear()),
    promisifyRequest(clearTx.objectStore('sessions').clear()),
    promisifyRequest(clearTx.objectStore('asset-cache').clear()),
  ]);
  
  if (data.profiles) {
    const tx = db.transaction('profiles', 'readwrite');
    for (const profile of data.profiles) tx.objectStore('profiles').put(profile);
    await new Promise<void>(resolve => { if(tx.oncomplete) tx.oncomplete = () => resolve() });
  }
   if (data.events) {
    const tx = db.transaction('events', 'readwrite');
    for (const event of data.events) tx.objectStore('events').put(event);
    await new Promise<void>(resolve => { if(tx.oncomplete) tx.oncomplete = () => resolve() });
  }
   if (data.sessions) {
    const tx = db.transaction('sessions', 'readwrite');
    for (const session of data.sessions) tx.objectStore('sessions').put(session);
    await new Promise<void>(resolve => { if(tx.oncomplete) tx.oncomplete = () => resolve() });
  }
};

export const clearAllData = async (): Promise<void> => {
  const db = await openDB();
  const tx = db.transaction(['profiles', 'events', 'sessions', 'asset-cache'], 'readwrite');
  await Promise.all([
    promisifyRequest(tx.objectStore('profiles').clear()),
    promisifyRequest(tx.objectStore('events').clear()),
    promisifyRequest(tx.objectStore('sessions').clear()),
    promisifyRequest(tx.objectStore('asset-cache').clear()),
  ]);
};

export const getCachedAsset = async (url: string): Promise<any | null> => {
    const db = await openDB();
    const tx = db.transaction('asset-cache', 'readonly');
    const asset = await promisifyRequest(tx.objectStore('asset-cache').get(url));
    return asset ? asset.data : null;
};

export const putCachedAsset = async (url: string, data: any): Promise<void> => {
    const db = await openDB();
    const tx = db.transaction('asset-cache', 'readwrite');
    const asset: CachedAsset = {
        url,
        data,
        cachedAt: Date.now(),
    };
    await promisifyRequest(tx.objectStore('asset-cache').put(asset));
};

export const clearAssetCache = async (): Promise<void> => {
    const db = await openDB();
    const tx = db.transaction('asset-cache', 'readwrite');
    await promisifyRequest(tx.objectStore('asset-cache').clear());
    console.log('[Storage] Asset cache cleared.');
};
