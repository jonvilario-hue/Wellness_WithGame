
# Firestore Schema for Cognitive Crucible

This document outlines the proposed Firestore database schema for storing verbal stimuli and user performance data.

## 1. Verbal Stimulus Database

This collection stores the word corpus required for the verbal training games.

**Collection:** `verbal_stimuli`

**Document ID:** Unique word (e.g., "happiness")

**Document Fields:**

```json
{
  "word": "happiness",
  "phonemes": "h æ p i n ə s",
  "syllables": 3,
  "root": "happy",
  "affixes": ["-ness"],
  "part_of_speech": "noun",
  "semantic_category": ["emotion", "state of being"],
  "frequency_score": 8.4,
  "cultural_specificity": "universal",
  "age_appropriateness": "teen"
}
```

*   **word**: The word itself (string).
*   **phonemes**: String representation of IPA phonemes.
*   **syllables**: Number of syllables (integer).
*   **root**: The root morpheme of the word (string).
*   **affixes**: Array of prefixes and suffixes (array of strings).
*   **part_of_speech**: e.g., "noun", "verb", "adjective" (string).
*   **semantic\_category**: Array of semantic tags for categorization tasks (array of strings).
*   **frequency\_score**: A score representing word frequency (e.g., from a corpus like COCA). Higher is more frequent. Used for difficulty scaling (number).
*   **cultural\_specificity**: "universal" or "regional" (string). Used for filtering idioms and culturally specific content.
*   **age\_appropriateness**: "child", "teen", or "adult" (string). Used for age-based vocabulary filtering.

## 2. User Session & Trial Logs

This collection stores detailed performance data for each user.

**Collection:** `users`

**Document ID:** `{userId}`

---

### 2.1. User Game State

**Sub-collection:** `game_states`

**Document ID:** `{gameId}` (e.g., "gwm_dynamic_sequence")

**Document Fields:** This will store the `AdaptiveState` object for each game, as defined in `src/types/index.ts`. This document provides the persistent state for the adaptive engine.

```json
{
  "gameId": "gwm_dynamic_sequence",
  "lastFocus": "verbal",
  "tier": 1,
  "levelFloor": 4,
  "levelCeiling": 10,
  "currentLevel": 7,
  "uncertainty": 0.3,
  "lastSessionAt": "timestamp",
  "levelHistory": [
    { "sessionDate": "timestamp", "startLevel": 6, "endLevel": 7, ... }
  ],
  ...
}
```

---

### 2.2. User Trial Logs

**Sub-collection:** `trial_logs`

**Document ID:** Auto-generated ID

**Document Fields:** This logs every single interaction for detailed analysis and model training.

```json
{
  "sessionId": "unique_session_id_string",
  "gameId": "gs_rapid_code",
  "focus": "verbal",
  "subVariant": "lexical_decision",
  "level": 8,
  "timestamp": "serverTimestamp",
  "stimulus": { "word": "FLIRB" },
  "response": { "answer": false, "rt_ms": 750 },
  "result": {
    "correct": true,
    "d_prime": null
  },
  "postTrialState": {
    "newLevel": 8,
    "uncertainty": 0.25
  }
}
```

*   **sessionId**: A unique ID generated at the start of a training session to group all related trials.
*   **gameId**: The ID of the game being played.
*   **focus**: The active training focus ("neutral", "math", "music", "verbal").
*   **subVariant**: The specific game mode played in that trial (e.g., "lexical_decision").
*   **level**: The difficulty level at the start of the trial.
*   **timestamp**: Firestore server timestamp.
*   **stimulus**: An object containing the exact stimulus presented to the user.
*   **response**: An object containing the user's answer and reaction time.
*   **result**: An object containing the outcome (`correct`) and any advanced metrics like d'.
*   **postTrialState**: A snapshot of key state variables *after* the adaptive engine processed the result. Useful for debugging the algorithm.
