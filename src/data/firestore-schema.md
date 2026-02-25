# Local Storage (IndexedDB) Schema for Cognitive Crucible

This document outlines the IndexedDB schema for storing user performance data, designed for offline-first capability, scalability, and mode-independent analysis. The application **does not** use Firestore for this data; it uses a robust, client-side IndexedDB implementation.

## 1. Database: `cognitune-local`

---

### 1.1. Object Store: `profiles`

Stores the adaptive state for each unique game and focus combination.

-   **Key Path**: `id` (string, composite key like `{gameId}/{focus}`)
-   **Example Key**: `gwm_dynamic_sequence/music`
-   **Value**: `AdaptiveState` object (from `src/types/index.ts`)

```json
{
  "id": "gwm_dynamic_sequence/music",
  "state": {
    "gameId": "gwm_dynamic_sequence",
    "lastFocus": "music",
    "currentLevel": 5,
    "levelFloor": 1,
    "levelCeiling": 10,
    "uncertainty": 0.45,
    "sessionCount": 3,
    "levelHistory": [
        { "sessionDate": 1677300000000, "startLevel": 4, "endLevel": 5, "avgAccuracy": 0.9, "avgRT": 750 }
    ]
    // ... other AdaptiveState fields
  }
}
```

### 1.2. Object Store: `events`

A flat log of every single event that occurs, including trials, session management, and errors. This is the primary data store for all user activity.

-   **Key Path**: `eventId` (string, UUID)
-   **Indexes**:
    -   `sessionId`: For efficiently retrieving all events for a given session.
    -   `timestamp`: For chronological queries.
-   **Value**: `TelemetryEvent` object (from `src/lib/telemetry-events.ts`)

**Example `trial_complete` Event:**
```json
{
  "eventId": "evt-1677200000-123",
  "sessionId": "session-abc-123",
  "timestamp": 1677200000123,
  "schemaVersion": 2,
  "seq": 15,
  "type": "trial_complete",
  "payload": {
    "gameId": "gwm_dynamic_sequence",
    "focus": "music",
    "difficultyLevel": 5,
    "correct": true,
    "rtMs": 789,
    "stimulusParams": {
      "melody_length": 4,
      "melody_notes": [60, 64, 67, 60]
    }
  }
}
```

### 1.3. Object Store: `sessions`

Stores metadata for each training session, including the inputs required to deterministically replay it.

-   **Key Path**: `sessionId` (string)
-   **Value**: `SessionRecord` object (from `src/types/local-store.ts`)

```json
{
  "sessionId": "session-abc-123",
  "gameId": "gwm_dynamic_sequence",
  "mode": "music",
  "startTimestamp": 1677200000000,
  "sessionComplete": false,
  "replayInputs": {
    "seed": "some-prng-seed",
    "buildVersion": "v1.3.0",
    "gameId": "gwm_dynamic_sequence",
    "focus": "music",
    "difficultyConfig": { ... }
  }
}
```

### 1.4. Object Store: `asset-cache`

Stores raw asset data (e.g., `ArrayBuffer` for audio files) to enable offline access and reduce network requests.

-   **Key Path**: `url` (string, the fetch URL of the asset)
-   **Indexes**: `cachedAt` (for LRU eviction)
-   **Value**: `CachedAsset` object (`src/types/local-store.ts`)

```json
{
    "url": "/audio-assets/ga-game/eq/phrase-happy-1.mp3",
    "data": "...",
    "cachedAt": 1677400000000
}
```
