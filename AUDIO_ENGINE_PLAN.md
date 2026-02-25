
# Audio Engine Design Plan

This document outlines the architecture, API, and implementation plan for a new, sample-first `AudioEngine` for the Cognitive Crucible project.

## PHASE 1A: CODEBASE INVENTORY

### 1. Existing Audio Code

- **`src/hooks/use-audio-engine.ts`**: This is the primary existing audio component. It uses `AudioContext`, `OscillatorNode`, `GainNode`, and `StereoPannerNode` for real-time synthesis. It also wraps `useSpeechSynthesis`.
- **`src/hooks/use-speech-synthesis.ts`**: A simple hook wrapping `window.speechSynthesis`.
- **Consumers**: The `useAudioEngine` hook is used extensively across most game components in `src/components/training/`, including `auditory-go-no-go`, `auditory-stroop`, `auditory-flanker`, `auditory-oddball`, `ComplexSpanTask`, `dual-n-back`, `pattern-matrix-renderer`, and `dynamic-sequence-transformer`.
- **Assessment**: The current `useAudioEngine` is synthesis-first and must be **refactored** to be sample-first. Its core functionality (context management, scheduling) is valuable and will be preserved. The speech synthesis logic will be merged into the new engine.

### 2. Existing Firebase Storage Usage

- **Status**: **NOT USED.** A project-wide search confirms there is no existing integration with the Firebase Storage SDK (`@firebase/storage`).
- **Firebase Services**: The project uses the core Firebase client SDK (`firebase`) but appears limited to Firestore and Auth based on the existing file structure.
- **Configuration**: No `storage.rules` file exists. The `.firebaserc` and `firebase.json` files do not contain a storage configuration.
- **Action**: The implementation plan must include adding the Firebase Storage SDK, creating a default `storage.rules` file, and configuring a storage bucket.

### 3. Existing Renderer Inventory

- **Gf (Fluid Reasoning)**: `pattern-matrix-renderer.tsx` (DOM, has audio), `GfSpatialRenderer.tsx` (WebGL).
- **Gc (Crystallized Intelligence)**: `GcVerbalRenderer.tsx` (DOM), `GcSpatialRenderer.tsx` (WebGL), `gc-math-concepts.tsx` (DOM), `gc-music-knowledge.tsx` (DOM). No audio.
- **Gwm (Working Memory)**: `DynamicSequenceRenderer.tsx` (DOM), `GwmSpatialRenderer.tsx` (WebGL), `ComplexSpanTask.tsx` (DOM), `dual-n-back.tsx` (DOM). All have significant audio integration.
- **Gs (Processing Speed)**: `rapid-code-match.tsx` (DOM), `GsSpatialRenderer.tsx` (WebGL), `auditory-oddball.tsx` (DOM). All have audio integration.
- **Gv (Visual Processing)**: `mental-rotation-lab.tsx` (DOM), `visual-music-match.tsx` (DOM), `GvSpatialAssemblyRenderer.tsx` (WebGL). No audio.
- **Ga (Auditory Processing)**: `auditory-processing-router.tsx` (DOM), `auditory-flanker.tsx` (DOM), `GaSpatialRenderer.tsx` (WebGL). All have significant audio integration.
- **Glr (Long-Term Retrieval)**: `semantic-fluency-storm.tsx` (DOM), `GlrSpatialRenderer.tsx` (WebGL), `spaced-retrieval-mode.tsx` (DOM). `SpacedRetrievalMode` has audio.
- **EF (Executive Function)**: `focus-switch-reactor.tsx` (DOM), `auditory-go-no-go.tsx` (DOM), `auditory-stroop.tsx` (DOM). All have audio integration.

### 4. Shared Services Inventory

- **Pattern**: The project consistently uses **React hooks** in `src/hooks/` as the interface for shared services, often backed by a **Zustand** store.
- **Conclusion**: The new `AudioEngine` must be exposed via a `useAudioEngine` hook to maintain architectural consistency.

### 5. Game Session Lifecycle

- **(a) Start**: Triggered by user interaction (e.g., clicking "Start"), which calls `startNewGameSession` from the `usePerformanceStore`.
- **(b) Configuration**: The adaptive state is retrieved from `usePerformanceStore` and difficulty policies from `src/data/difficulty-policies.ts`. This data is passed as props to the active game renderer.
- **(c) Response**: The renderer component captures user input (click/keyboard) and calls an `onEvent` or `handleAnswer` prop function.
- **(d) Validation**: The parent controller component receives the event, validates the response, calculates the score/RT, and logs the trial via `usePerformanceStore`.
- **(e) Cleanup**: Session cleanup is managed by the controller component, calling `completeCurrentGameSession`. Resource cleanup (`useEffect` return functions) is handled within individual renderers.
- **AudioEngine Hook**: The engine's `init()` and `cleanup()` methods must be tied to the component mount/unmount lifecycle of the game renderers that use audio.

## PHASE 1B: AUDIO ASSET LIBRARY DESIGN

### 1. Storage Bucket Structure

The proposed folder structure is adopted. It is logical and scalable.

```
/audio-assets/
  ├── manifest.json
  ├── tones/
  │   ├── piano/
  │   └── percussion/
  ├── speech/
  │   ├── words/en/
  │   ├── sentences/{emotion}/
  │   └── phoneme-pairs/
  ├── noise/
  ├── emotions/
  │   ├── vocalizations/
  │   └── prosody-contours/
  └── melodies/
      └── {difficulty}/
```

### 2. Manifest Schema

The proposed schema is adopted.

```typescript
export interface AudioAssetEntry {
  id: string;
  path: string;
  duration: number; // milliseconds
  category: string[]; // e.g., ["Gf", "Gc"]
  tags: string[];
  format: 'mp3' | 'ogg' | 'wav';
  sampleRate: number;
  fileSize: number; // bytes
}

export interface AudioAssetManifest {
  manifestVersion: string;
  assets: AudioAssetEntry[];
}
```

### 3. Download Budget and Caching Strategy

The proposed Eager/Lazy/Cache/Fallback chain is adopted. This provides resilience and performance. The `src/lib/asset-preloader.ts` file will be the basis for implementing this strategy.

- **Eager:** Preload mode-specific assets on game selection.
- **Lazy:** Load harder difficulty assets in the background.
- **Caching:** Use IndexedDB (`idb-store.ts`) to store downloaded `ArrayBuffer` data, keyed by URL. The `AudioEngine` will manage decoding this data into `AudioBuffer`s.
- **Fallback:** If cache miss and network fail, use synthesis (oscillator/TTS) and log a warning.

### 4. Asset Generation Plan

A development script (`/scripts/generate-placeholder-assets.ts`) will be planned. It will use `OfflineAudioContext` to:
- Generate sine waves for piano tones.
- Generate silent buffers for speech files (to test timing).
- Generate random data for noise buffers.
- Save these as `.wav` or `.mp3` files locally, which can then be uploaded to the Firebase Storage emulator or a development bucket.

## PHASE 1C: AUDIO CAPABILITY REQUIREMENTS PER MODE

- **Gf (Fluid Reasoning):**
    - **Sample Assets:** `tones/piano`, `tones/percussion` (for n-back, flanker tasks).
    - **Synthesis:** For precise frequency sequences where timbre is irrelevant.
    - **Effects:** Gain, precise scheduling.
    - **Example (Hard):** N-Back task where N=3 using real piano samples for stimuli, requiring memory of both pitch and timbre.

- **Ga (Auditory Processing):**
    - **Sample Assets:** `tones/piano`, `tones/guitar`, `melodies/*`.
    - **Synthesis:** Required for fine-grained pitch discrimination (e.g., 440Hz vs 442Hz).
    - **Effects:** Gain, reverb (`ConvolverNode` if available), precise scheduling.
    - **Example (Hard):** Play a pre-composed 'hard' melody; replay it with one note altered by a quarter-tone (synthesis needed for alteration). Player must identify the altered note.

- **Gc (Crystallized Intelligence):**
    - **Sample Assets:** `speech/words`, `speech/sentences`, `noise/babble-01`.
    - **Synthesis:** Fallback for missing words via Web Speech API. A warning must be logged.
    - **Effects:** Mixing (GainNodes to control SNR), `StereoPannerNode` for dichotic listening.
    - **Example (Hard):** A human-spoken sentence from `speech/sentences/neutral` is mixed with `noise/babble-01` at a low SNR (-5dB). Player must transcribe the sentence.

- **Gv (Visual Processing):**
    - **Sample Assets:** `tones/percussion/click`, `tones/synth/bell`.
    - **Synthesis:** For continuous tone generation in trajectory tracking tasks.
    - **Effects:** `PannerNode` (3D spatialization), gain automation for distance.
    - **Example (Hard):** A `bell` sample moves along a complex 3D path (e.g., a figure-eight). Player must click the 3D endpoint of the sound's trajectory.

- **EF (Emotional Intelligence):**
    - **Sample Assets:** **CRITICAL.** `speech/sentences/*`, `emotions/vocalizations`.
    - **Synthesis:** Fallback only, with a prominent developer warning.
    - **Effects:** `BiquadFilterNode` (low-pass) to generate prosody-only stimuli from full speech samples.
    - **Example (Hard):** Player hears a prosody-only contour (low-pass filtered sentence). They must identify the emotion from a list of 6 options, including two semantically close emotions like 'sadness' and 'disgust'.

- **Gq (Quantitative Knowledge):**
    - **Sample Assets:** `tones/percussion/*` for rhythmic counting. Distinct timbres (`piano`, `guitar`) for stream segregation.
    - **Synthesis:** Required for tasks mapping numbers to precise frequencies.
    - **Effects:** Precise polyrhythmic scheduling via `AudioContext.currentTime`.
    - **Example (Hard):** Player hears a polyrhythm of 3 streams (e.g., piano at 100bpm, kick at 75bpm, hi-hat at 150bpm). Task: "Count the total number of piano notes."

- **Glr (Long-Term Retrieval & Logic):**
    - **Sample Assets:** Distinct instrument sounds (`piano`, `drum`, `bell`) to represent logical categories.
    - **Synthesis:** For continuous frequency sweeps representing logical operations.
    - **Effects:** Precise sequencing.
    - **Example (Hard):** Player learns a rule: "A 'set' is piano-drum-bell. An 'anti-set' is any other 3-note sequence." The game then plays 20 sequences rapidly. Player must press a key only when they hear a 'set'.

- **Gwm (Working Memory):**
    - **Sample Assets:** Full `tones/piano` set.
    - **Synthesis:** Not primary, but could be used for distractor tones.
    - **Effects:** Precise sequencing and scheduling.
    - **Example (Hard):** Complex Span Task. Hear a sequence of 5 real piano notes, then judge if a synthesized chord is major/minor (distractor), then reproduce the original 5 notes on a virtual keyboard.

## PHASE 1D: AUDIOENGINE API DESIGN

The new API will be defined in `src/lib/audio-engine.ts` and exposed via the `src/hooks/use-audio-engine.ts` hook.

```typescript
// Located in src/lib/audio-engine.ts

export type AudioEngineState = 'uninitialized' | 'suspending' | 'running' | 'closed' | 'error';
export type EmotionType = 'happy' | 'sad' | 'angry' | 'fearful' | 'surprised' | 'disgusted' | 'neutral';

export interface PlaybackConfig {
  volume?: number;
  pan?: number; // -1 to 1
  playbackRate?: number;
  loop?: boolean;
  loopStart?: number;
  loopEnd?: number;
  startOffset?: number; // in seconds
  duration?: number; // in seconds
  envelope?: {
    attack: number; // seconds
    decay: number; // seconds
    sustain: number; // 0.0 to 1.0
    release: number; // seconds
  };
  spatialPosition?: { x: number; y: number; z: number };
}

export interface ToneConfig {
  frequency: number;
  duration: number; // ms
  type?: OscillatorType;
  volume?: number;
  pan?: number;
}

export interface SpeechConfig {
  voice?: SpeechSynthesisVoice;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export interface SampleHandle {
  id: string;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  seekTo: (timeMs: number) => void;
  onEnded: (callback: () => void) => void;
  setVolume: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;
}

// Other handle types (SequenceHandle, SpeechHandle, etc.) would be defined similarly.

export interface AudioEngineAPI {
  // --- CORE LIFECYCLE ---
  /** Initializes the AudioContext and master gain nodes. Must be called after a user gesture. */
  init(): Promise<void>;
  /** Stops all playing audio, disconnects all nodes, and closes the AudioContext. */
  cleanup(): void;
  /** Suspends the AudioContext. Ideal for when the app is backgrounded. */
  suspend(): Promise<void>;
  /** Resumes a suspended AudioContext. */
  resume(): Promise<void>;
  /** Gets the current state of the AudioContext. */
  getState(): AudioEngineState;

  // --- ASSET MANAGEMENT ---
  /** Fetches the master manifest.json from Firebase Storage. */
  loadManifest(): Promise<AudioAssetManifest>;
  /** Eagerly loads all assets required for a specific game mode. */
  preloadMode(mode: string): Promise<void>;
  /** Downloads and caches an array of specific asset IDs from the manifest. */
  preloadAssets(assetIds: string[]): Promise<void>;
  /** Retrieves a decoded AudioBuffer from the cache. Returns null if not cached. */
  getAsset(assetId: string): AudioBuffer | null;
  /** Checks if an asset is fully loaded and decoded in memory. */
  isAssetLoaded(assetId: string): boolean;

  // --- SAMPLE PLAYBACK ---
  /** Plays a pre-loaded audio sample by its manifest ID. */
  playSample(assetId: string, config?: PlaybackConfig): SampleHandle;
  /** Plays a sequence of audio events, which can be samples or synthesized tones. */
  playSampleSequence(items: any[], gapMs: number): any; // SequenceHandle

  // --- TONE SYNTHESIS (Fallback/Precision) ---
  /** Plays a synthesized tone. Used as a fallback or for precision tasks. */
  playTone(config: ToneConfig): any; // ToneHandle

  // --- SPEECH SYNTHESIS (Fallback) ---
  /**
   * Synthesizes speech using the browser's TTS engine. FALLBACK ONLY.
   * Logs a warning if used.
   */
  speak(text: string, config?: SpeechConfig): any; // SpeechHandle
   /**
   * Synthesizes speech with an emotional hint. Highly unreliable.
   * Logs a prominent warning if used.
   */
  speakWithEmotion(text: string, emotion: EmotionType, config?: SpeechConfig): any; // SpeechHandle

  // --- SPATIAL AUDIO ---
  /** Creates a new audio source positioned in 3D space. */
  createSpatialSource(source: string | ToneConfig, config: any): any; // SpatialSourceHandle

  // --- UTILITY ---
  /** Returns the duration of a loaded audio sample in milliseconds. */
  getSampleDuration(assetId: string): number | null;
  /** Returns an array of available system voices for TTS. */
  getAvailableVoices(): SpeechSynthesisVoice[];
}
```

## PHASE 1E: DEPENDENCY AND RISK ASSESSMENT

1.  **Firebase Storage Risk:**
    - **Risk:** Firebase Storage is not configured. Audio asset loading will fail.
    - **Mitigation:**
        - Add `@firebase/storage` to `package.json`.
        - Update Firebase initialization code to include `getStorage()`.
        - Create `storage.rules` file with rules: `allow read: if true; allow write: if request.auth != null;` for the `audio-assets/` path.
        - Create `firebase.json` entry for storage rules deployment.
        - Configure CORS on the Google Cloud Storage bucket:
          ```json
          [
            {
              "origin": ["https://*", "http://localhost:*"],
              "method": ["GET"],
              "maxAgeSeconds": 3600
            }
          ]
          ```

2.  **Audio File Format Risk:**
    - **Risk:** Using formats with limited browser support (OGG, WebM) will break audio on Safari.
    - **Mitigation:** Standardize on **MP3** for all compressed audio. Use **WAV** for extremely short, critical samples where decoding latency is a concern (e.g., metronome clicks).

3.  **Browser Audio Restrictions Risk:**
    - **Risk:** `AudioContext` will not start without a user gesture, leading to silent failures. Large decoded buffers will cause memory bloat.
    - **Mitigation:**
        - Implement an `AudioGate` component that overlays the app on first load, requiring a "Click to Start" button that calls `AudioEngine.init()`.
        - Implement the asset caching strategy to use `IndexedDB` for `ArrayBuffer` storage, only decoding into memory (`AudioBuffer`) what is needed for the current session.
        - Implement a memory ceiling per mode (e.g., 50MB of decoded audio) and a cache clearing mechanism.

4.  **Offline / Poor Network Risk:**
    - **Risk:** Game modes become unplayable if assets cannot be downloaded.
    - **Mitigation:** Strictly implement the "Fallback Chain". `playSample` must internally contain a `try...catch` block. On fetch failure, it must call `playTone` or `speak` with placeholder parameters and log a developer-visible warning.

5.  **Browser Support Risk:**
    - **Risk:** `Web Speech API` and `HRTF PannerNode` have inconsistent support.
    - **Mitigation:** The `AudioEngine` will detect support at initialization. If `window.speechSynthesis` is unavailable, the `speak()` method will do nothing and return a null handle. If HRTF is not supported, the `createSpatialSource` method will default to `equalpower` panning and log a console info message.

6.  **Accessibility Risk:**
    - **Risk:** Auditory-only tasks exclude Deaf/HoH players.
    - **Mitigation:** All game components using the `AudioEngine` **must** include a visual component. For example, a flashing icon during audio playback. For speech, a text transcript must be displayed. An `AudioVisualizer` component that receives data from an `AnalyserNode` in the engine can be created as a shared utility.

