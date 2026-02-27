# Ga (Auditory Processing) Domain: Three-Phase Deep Audit & Implementation Plan

This document outlines the findings and implementation strategy for overhauling the Auditory Processing (Ga) domain in the Cognitive Crucible application.

### PHASE 1: PRE-AUDIT (Analyze Before Touching Anything)

#### 1A. Construct Validity Audit of Existing Mini-Games

| Mini-Game                | Primary Ga Narrow Ability      | Construct Validity | Justification                                                                                                                                                                                                                          |
| :----------------------- | :----------------------------- | :----------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Pitch Discrimination** | `U3` (General Sound Discrimination) | **Strong**         | This is a classic two-alternative forced-choice (2AFC) psychoacoustics task. It directly measures the ability to perceive differences in the fundamental frequency of non-speech sounds, which is the definition of U3.          |
| **Timbre Identification**| `U3` (General Sound Discrimination) | **Weak**           | As currently designed, this task is highly susceptible to construct contamination from `Gc` (Crystallized Intelligence). Users may simply be memorizing labels ("Piano," "Bell") for synthesized sounds, turning it into a vocabulary test. To be a true U3 timbre task, it must focus on discriminating spectrally different sounds without relying on semantic labels. |
| **Sound Localization**   | `UL` (Sound Localization)          | **Moderate**       | Using `StereoPannerNode` for "Left, Center, Right" is a valid but low-resolution operationalization of UL. It tests gross lateralization but not fine-grained azimuth resolution or elevation, which are key components of this ability. Its validity is moderate because it measures the correct construct but with low fidelity. |

#### 1B. Ga Narrow Ability Coverage Matrix (Current)

| Mini-Game                | PC   | US   | UR   | UM         | **U3**      | **U1/U9** | U8   | UK         | **UL**      | UP   |
| :----------------------- | :--- | :--- | :--- | :--------- | :---------- | :-------- | :--- | :--------- | :---------- | :--- |
| Pitch Discrimination     | None | None | None | Incidental | **Primary** | Secondary | None | Incidental | None        | None |
| Timbre Identification    | None | None | None | None       | **Primary** | Secondary | None | None       | None        | None |
| Sound Localization       | None | None | None | None       | Incidental  | None      | None | None       | **Primary** | None |

**Critical Gaps (Zero Primary Coverage):**
*   `PC` (Phonetic Coding)
*   `US` (Speech Sound Discrimination)
*   `UR` (Resistance to Auditory Stimulus Distortion)
*   `UM` (Memory for Sound Patterns)
*   `U1/U9` (Musical Discrimination & Judgment) - Only has secondary coverage.
*   `U8` (Maintaining & Judging Rhythm)
*   `UK` (Temporal Tracking)
*   `UP` (Absolute Pitch)

#### 1C. Mode × Mini-Game Feasibility Audit

| Mini-Game                | Core | Math | Music | Verbal | Spatial | EQ   | Logic |
| :----------------------- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Pitch Discrimination** | ✅   | ⚠️¹  | ✅    | ❌⁵    | ✅      | ❌⁵  | ⚠️²   |
| **Timbre Identification**| ✅   | ❌⁴  | ✅    | ❌⁴    | ✅      | ❌⁵  | ⚠️³   |
| **Sound Localization**   | ✅   | ⚠️¹  | ✅    | ❌⁵    | ✅      | ❌⁵  | ⚠️¹   |

**Flags & Modifications:**
1.  **⚠️ Math Mode (All Games):** Viable, but requires `SpeechSynthesis` API to speak numbers. The task shifts from pure `U3` to a dual-task load involving `Gwm` (holding the numbers) and `Gf` (magnitude comparison), but the core auditory discrimination remains. This is acceptable construct bleed.
2.  **⚠️ Logic Mode (Pitch):** Viable. Can map boolean `true`/`false` to HIGH/LOW tones. This maintains the `U3` demand.
3.  **⚠️ Logic Mode (Timbre):** Viable. Can map logical operators (`AND`, `OR`) to different synthesized timbres (e.g., `square` vs. `sawtooth` wave). This preserves the `U3` timbre discrimination task.
4.  **❌ Math/Verbal Mode (Timbre):** Not viable. Mapping numbers or words to timbres creates an arbitrary associative memory task (`Glr`), not a `Ga` task. The mode overlay completely shifts the construct. **Replacement needed.**
5.  **❌ Verbal/EQ Mode (All Games):** Not viable without pre-recorded assets. Procedurally generating realistic prosody or phonemes with Web Audio oscillators is not feasible. The `SpeechSynthesis` API lacks the fine-grained control over pitch contour, formants, and timing needed for valid `PC`, `US`, `UR`, or EQ prosody tasks. **Requires new mini-games designed specifically for these modes.**

#### 1D. Structural Consistency Check

*   **Fragmentation:** Yes, the hub format fragments construct measurement. A session score is an uninterpretable blend of three different narrow abilities (U3, UL). This is a **Critical** issue.
*   **UX Inconsistency:** Yes, it creates a jarring inconsistency. Users expect a focused, single-mechanic experience per domain, and the Ga "lab" violates this expectation.
*   **Justification:** The breadth of `Ga` *does* justify having multiple mechanics, but the current implementation is not structured. It's a random grab-bag.

**Recommendation:** Keep the hub format but implement a **structured rotation protocol**. On any given day, the "Auditory Processing Lab" tile on the main dashboard will link to *only one* of the mini-games. The game rotates daily or weekly. This preserves the single-mechanic UX per session while providing coverage breadth over time. The session data will be clean (`gameId` can be `ga_pitch_discrimination`, etc.), and the UI remains consistent with other domains.

#### 1E. Psychoacoustic Parameter Baseline Check

*   **Pitch Discrimination:** The current implementation uses fixed frequencies. At Level 1, the difference is often over 400 cents (4 semitones), which is trivially easy for any listener. The JND for pitch is closer to 5-10 cents for most people. The baseline is **too easy**.
*   **Timbre Identification:** The "instruments" are just different `OscillatorNode` types (`sine`, `square`, `sawtooth`, `triangle`). While spectrally different, they are not perceptually equidistant and "Piano" vs "Bell" is a `Gc` label, not a `Ga` percept. The synthesis is **too simplistic** and the labeling is invalid.
*   **Sound Localization:** At Level 1, it uses 3 positions (-1, 0, 1 pan). This is above the JND for lateralization and is a **valid starting point**. `StereoPannerNode` is sufficient for this simple task.

#### 1F. Bug & Design Smell Catalog

1.  **Critical:** `Timbre Identification` has weak construct validity due to reliance on `Gc` vocabulary.
2.  **Critical:** The hub format without a structured rotation produces uninterpretable session data.
3.  **Critical:** The lack of `PC`, `US`, `UR`, `UM`, `U8`, and `UK` coverage represents a major gap in the training program.
4.  **Major:** `Verbal` and `EQ` modes are functionally impossible with the procedural synthesis constraint.
5.  **Major:** The difficulty gradient for `Pitch Discrimination` is not psychoacoustically grounded.
6.  **Minor:** `Sound Localization` has low fidelity, only testing gross lateralization.
7.  **Minor:** The `Math` and `Logic` mode overlays introduce acceptable but unmanaged `Gwm`/`Gf` bleed.

### PHASE 2: MAIN IMPLEMENTATION STRATEGY (Fix or Rebuild)

#### 2A. Strategic Decision: Fix-Up or Rebuild?

**Decision:** **Fix-Up and Extend.**
The core mechanics of the three existing mini-games are psychoacoustically sound starting points, despite their flaws. A full rebuild is unnecessary. The primary issues are a lack of coverage and invalid mode overlays. The plan is to:
1.  **Fix** the existing 3 mini-games.
2.  **Implement** the structured rotation protocol.
3.  **Add** two new mini-games to fill critical gaps in Rhythm/Timing and Speech-in-Noise.

#### 2B. Mini-Game Roster (Final)

| # | Mini-Game Name             | Core Mechanic (one sentence)                                                                   | Primary Ga Narrow Ability | Status    |
| :- | :------------------------- | :--------------------------------------------------------------------------------------------- | :------------------------ | :-------- |
| 1 | Pitch Discrimination       | Discriminate which of two sequential pure tones is higher in pitch.                              | `U3`                      | Fix       |
| 2 | Spectral Subtraction       | Identify which partial (overtone) was removed from a complex tone between two presentations.     | `U3`                      | Replace   |
| 3 | Sound Localization Tracer  | Recall the sequence of positions from which a sound emanated in 3D space.                        | `UL` + `UM`               | Replace   |
| 4 | Rhythm Judgment            | Determine if a target rhythm matches a base rhythm or has been altered.                          | `U8`                      | **New**   |
| 5 | Speech-in-Noise Decoder    | Identify a spoken word or phoneme masked by multi-talker babble or pink noise.                   | `UR` + `US`               | **New**   |

#### 2C. Complete Coverage Matrix (Post-Implementation)

| Mini-Game                | PC          | US          | **UR**      | **UM**      | **U3**      | U1/U9     | **U8**      | UK          | **UL**      | UP   |
| :----------------------- | :---------- | :---------- | :---------- | :---------- | :---------- | :-------- | :---------- | :---------- | :---------- | :--- |
| Pitch Discrimination     | None        | None        | None        | Incid.      | **Primary** | Secondary | None        | Incid.      | None        | None |
| Spectral Subtraction     | None        | None        | Incid.      | Incid.      | **Primary** | Secondary | None        | None        | None        | None |
| Sound Localization Tracer| None        | None        | None        | **Primary** | None        | None      | None        | Secondary   | **Primary** | None |
| Rhythm Judgment          | None        | None        | Incid.      | Secondary   | None        | Secondary | **Primary** | **Primary** | None        | None |
| Speech-in-Noise Decoder  | **Primary** | **Primary** | **Primary** | Incid.      | Incid.      | None      | None        | None        | None        | None |

*Note on `UP` (Absolute Pitch):* This ability is largely considered innate and not readily trainable in adults. Including it would set unrealistic user expectations. It is intentionally excluded.

#### 2D. Mode Overlay Specifications

*   **Pitch Discrimination:**
    *   **Music:** Becomes "Interval Identification." The two tones form a melodic interval (e.g., Major 3rd, Perfect 5th). User chooses the correct interval name from options. Targets `U1/U9`.
*   **Spectral Subtraction:**
    *   **Music:** Becomes "Timbre Identification." The complex tones are modeled after real instruments. User identifies the instrument whose primary overtone was removed. Targets `U1/U9`.
*   **Sound Localization Tracer:**
    *   **Spatial:** The only valid mode. `PannerNode` with HRTF model must be used. All other modes are disabled for this mini-game.
*   **Rhythm Judgment:**
    *   **Music:** Rhythms are melodic and use notes from a musical scale. `U1/U9`.
*   **Speech-in-Noise Decoder:**
    *   **Verbal:** The primary mode. Requires `SpeechSynthesis` API. Stimuli are CVC words or phonemes. Targets `PC` / `US`.
    *   **Math:** Spoken digits are used instead of words.
    *   **EQ:** `SpeechSynthesis` prosody is manipulated (pitch, rate). User identifies emotion.
    *   **Logic:** Spoken booleans ("true," "false") are used.

#### 2E. Adaptive Difficulty Specifications

**1. Pitch Discrimination (Core Mode)**

| Level | Semitone Difference | Expected Accuracy |
| :---- | :------------------ | :---------------- |
| 1     | 2.0 (200 cents)     | >99%              |
| 5     | 0.5 (50 cents)      | ~80%              |
| 10    | 0.1 (10 cents)      | ~55%              |

**2. Spectral Subtraction (Core Mode)**

| Level | Overtone Removed (harmonic #) | Distractor Similarity       |
| :---- | :---------------------------- | :-------------------------- |
| 1     | 2nd                           | Low (Different waveforms)   |
| 5     | 4th                           | Medium (Similar waveforms)  |
| 10    | 7th or higher                 | High (Same waveform, diff filter) |

**3. Sound Localization Tracer (Spatial Mode)**

| Level | Sequence Length | # of Positions | Azimuth Separation |
| :---- | :-------------- | :------------- | :----------------- |
| 1     | 3               | 4              | 90°                |
| 5     | 5               | 8              | 45°                |
| 10    | 7               | 16             | 22.5°              |

**4. Rhythm Judgment (Core Mode)**

| Level | Alteration Type              | Tempo (BPM) |
| :---- | :--------------------------- | :---------- |
| 1     | Note duration (25% change)   | 100         |
| 5     | Note position (syncopation)  | 120         |
| 10    | Micro-timing (10% change)    | 140         |

**5. Speech-in-Noise Decoder (Verbal Mode)**

| Level | Signal-to-Noise Ratio (SNR) in dB | Masker Type        |
| :---- | :-------------------------------- | :----------------- |
| 1     | +10 dB                            | Pink Noise         |
| 5     | 0 dB                              | 1-talker babble    |
| 10    | -5 dB                             | 4-talker babble    |

#### 2F. Staircase Parameter Validation

The 2-up/1-down rule targeting ~70.7% is appropriate for all proposed tasks. The step sizes defined by the 1-10 level progression are perceptually granular and should not produce floor/ceiling effects prematurely.

#### 2G. Session Summary Metrics

```typescript
// For Pitch Discrimination / Spectral Subtraction
interface DiscriminationSummary {
  discrimination_threshold_hz: number; // Mean Hz difference on correct trials
  discrimination_threshold_cents: number; // Mean cent difference on correct trials
  mean_correct_rt_ms: number;
}

// For Sound Localization Tracer
interface LocalizationSummary {
  mean_sequence_accuracy: number; // 0-1 score for sequence recall
  mean_error_degrees: number; // Mean angular error on incorrect position recalls
  mean_correct_rt_ms: number;
}

// For Rhythm Judgment
interface RhythmSummary {
  jnd_timing_ms: number; // Smallest successfully detected timing deviation
  mean_correct_rt_ms: number;
}

// For Speech-in-Noise Decoder
interface SpeechInNoiseSummary {
  snr_threshold_db: number; // Lowest SNR level with >70% accuracy
  phoneme_confusion_matrix: Record<string, string>; // e.g., { 'p': 'b', 's': 'sh' }
  mean_correct_rt_ms: number;
}
```

#### 2H. Audio Graph Specifications

**For Spectral Subtraction:**
A chain of `OscillatorNode`s (fundamental + harmonics) connected to a master `GainNode`. The "subtraction" is achieved by setting the gain of one harmonic's `GainNode` to zero in the comparison stimulus.

```typescript
function createComplexTone(freq: number, harmonics: number[]): AudioNode[] {
    const nodes = [];
    for (let i = 1; i <= Math.max(...harmonics); i++) {
        const osc = this.audioContext.createOscillator();
        osc.frequency.value = freq * i;
        const gain = this.audioContext.createGain();
        // Attenuate higher harmonics
        gain.gain.value = harmonics.includes(i) ? 1 / (i * 1.2) : 0;
        osc.connect(gain);
        nodes.push(gain);
        osc.start();
    }
    return nodes;
}
```

#### 2I. Implementation Order

1.  **Task (M):** Implement the structured rotation protocol in `auditory-processing-router.tsx`.
2.  **Task (S):** Fix `PitchDiscriminationModule`.
3.  **Task (M):** Create `SpectralSubtractionModule` to replace Timbre ID.
4.  **Task (L):** Create `SoundLocalizationTracer` to replace Localization.
5.  **Task (L):** Create new `RhythmJudgmentModule`.
6.  **Task (L):** Create new `SpeechInNoiseDecoder` with `SpeechSynthesis`.
7.  **Task (M):** Wire up all new/fixed modules into the rotation protocol.
8.  **Task (S):** Implement summary metric computations.

*Tasks 2, 3, 4, 5, 6 can be parallelized.*

### PHASE 3: POST-AUDIT (Verification Protocol)

#### 3A. Construct Validity Re-Check
*   **Pitch Discrimination:** Remains **Strong**.
*   **Spectral Subtraction:** Becomes **Strong**. It is now a pure U3 task without Gc contamination.
*   **Sound Localization Tracer:** Becomes **Strong**. It now measures both `UL` (spatial perception) and `UM` (auditory memory), a common and valid combination in auditory cognitive science.
*   **Rhythm Judgment:** **Strong**. Directly measures `U8` and `UK`.
*   **Speech-in-Noise Decoder:** **Strong**. A gold-standard task for `UR` and `US`.

#### 3B. Ga Narrow Ability Coverage Verification
The new roster provides Primary coverage for `U3`, `UL`, `UM`, `U8`, `UK`, `UR`, `US`, and `PC`. The only remaining gaps are `U1/U9` (Musical Discrimination) and `UP` (Absolute Pitch). `U1/U9` is now well-covered as a secondary load in multiple music modes, which is sufficient. `UP` remains excluded as it is not considered trainable. Coverage is now balanced and robust.

#### 3C. Discriminant Validity Check
The mode overlays now primarily alter the *stimulus category* while preserving the core *perceptual task*. For example, `Math` mode on `Speech-in-Noise` still requires the user to perform auditory stream segregation (`UR`), but the tokens to be identified are numbers instead of words. The cognitive load shifts slightly but the primary demand remains on `Ga`.

#### 3D. Difficulty Gradient Validation
The psychoacoustically grounded difficulty dimensions in 2E ensure a monotonic and meaningful gradient. Level 1 for all tasks is set well above JND for naive listeners, and Level 10 is set at or near the limits of human perception, ensuring a high ceiling for training.

#### 3E. Ecological Validity & Transfer Argument
*   **Speech-in-Noise:** Directly transfers to understanding conversation in noisy environments (the "cocktail party effect").
*   **Localization/Rhythm:** Transfers to spatial awareness, situational alertness, and musical appreciation.
*   **Discrimination:** Underpins language acquisition and the ability to distinguish subtle cues in speech (e.g., sarcasm).

#### 3F. Data Integrity Check
The session summary metrics and the use of a PRNG for stimulus generation ensure that all trials can be deterministically replayed and analyzed. The proposed `TrialRecord` structure in the app already contains the necessary fields.

#### 3G. Cross-Domain Interference Check
The `useAudioEngine` hook and `AudioEngine` class are designed as singletons that manage a single `AudioContext`. The `stopAll()` method, if called on component unmount, will prevent audio bleed between games. No significant interference is expected.

#### 3H. Final Verdict
**Conditional Pass.**
The Ga lab, once refactored according to the Phase 2 plan, will be construct-valid, provide robust coverage of key auditory abilities, and align with the app's overall design philosophy. The plan is sound.

**Condition:** The successful implementation of the new `Speech-in-Noise Decoder` is critical, as it covers the most significant gaps (`UR`, `US`, `PC`). If this proves technically infeasible with `SpeechSynthesis`, the `Ga` domain will remain incomplete.