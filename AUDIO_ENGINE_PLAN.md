
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

`