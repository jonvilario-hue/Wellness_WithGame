# Platform Determinism Contract

This document outlines the rules and guarantees for deterministic behavior in the cognitive training platform. Adherence to this contract is critical for data integrity, session replayability, and valid scientific analysis.

## Section 1 — Contract

All stimulus generation, procedural content, option shuffling, distractor selection, and category sampling within any game component **MUST** use the seeded Pseudo-Random Number Generator (PRNG) from `src/lib/rng.ts`.

The direct use of `Math.random()` in any production game logic is **BANNED**.

This contract is enforced by two mechanisms:
1.  **Lint Rule:** An ESLint rule (`no-restricted-properties`) is configured in `.eslintrc.json` to fail the build if `Math.random()` is used in the `src/` directory.
2.  **Regression Test:** The test suite in `src/lib/__tests__/determinism-regression.test.ts` includes a test case that monkey-patches `Math.random()` to throw an error, ensuring no code path can accidentally invoke it during stimulus generation.

## Section 2 — PRNG Fallback Protocol

When a stimulus generator fails to produce a valid stimulus for a target difficulty tier (e.g., due to missing content or invalid configuration), it MUST trigger a fallback to a Tier 1 stimulus without desynchronizing the session's deterministic PRNG sequence.

The chosen protocol is **Checkpoint and Restore via a Forked PRNG**.

1.  **Checkpoint:** Before the primary generation attempt, the state of the main session PRNG is saved using `prng.getState()`.
2.  **Fallback Generation:** If the primary attempt fails, a *new, temporary PRNG* is instantiated using the saved state. This forked PRNG is used to generate the Tier 1 fallback stimulus. This isolates the fallback's pseudo-random draws.
3.  **Advance Main PRNG:** After the fallback is generated, the *main* session PRNG is advanced by the number of cycles that the *successful* path would have consumed. This is done by running the generation logic for the intended tier but discarding the output.
4.  **Result:** This ensures that whether trial `k` succeeds or falls back, trial `k+1` will always draw from the identical position in the main PRNG stream.

This protocol is validated by the "PRNG Fallback Determinism" test in `determinism-regression.test.ts`.

## Section 3 — Replay Guarantee

Every `SessionRecord` persisted in storage contains a `replayInputs` object. This object is a self-contained bundle of all metadata required to deterministically regenerate the user's entire session from scratch.

The `replayInputs` object includes:
- `seed`: The master PRNG seed for the session.
- `buildVersion`: The application version/commit hash.
- `gameId`: The ID of the game played.
- `focus`: The training focus active during the session.
- `difficultyConfig`: A snapshot of the game's difficulty policy.
- `samplerConfig`: A snapshot of the category sampler configuration, if any.

The canonical validator for this guarantee is the development utility at `src/lib/dev/replay-session.ts`.

## Section 4 — Telemetry Migration

To ensure backward compatibility with older data, all telemetry analysis pipelines **MUST** process stored records through the `normalizeTelemetryRecord` function located in `src/lib/telemetry-migration.ts`.

This function inspects a record for a `schemaVersion` field. If the version is outdated or missing, it populates all new fields with safe defaults (e.g., `prngSeed: 'unknown'`, `seq: -1`) and adds a `legacy: true` flag. This prevents analysis code from crashing on missing fields and allows for easy filtering of pre-hardening data.

## Section 5 — Eviction Safety

The local storage eviction strategy is designed to prevent data loss.

1.  **Canonical Ordering:** The eviction logic in `src/lib/idb-store.ts` uses the object store's primary key (`id`), which is a chronologically sortable string (`sessionId-trialIndex`), to identify and prune the oldest records. It does **not** use wall-clock timestamps, making it robust against clock drift.
2.  **Session Protection:** The eviction process **NEVER** deletes trial records belonging to a session where the `sessionComplete` flag is `false`. This protects all in-progress and buffered session data from being accidentally pruned.

## Section 6 — Session Recovery

**Current Limitation:** In-progress training sessions are **NOT** currently recoverable across page reloads or full tab closures. While the adaptive state and completed trial data are persisted, the in-flight state of the current game (e.g., the PRNG sequence position, current trial index, active timers) is held in component memory and is lost.

**Behavior on Reload:** A page refresh mid-game will return the user to the main dashboard or the start screen of the game, creating a new session. The interrupted session's data up to the last completed trial will be saved, but the session itself will be marked as incomplete.

**Recommended Implementation Path (for future work):**
1.  **Persist Session Context:** Upon starting a new game session, write a minimal `active_session` record to `sessionStorage`. This record should contain the `sessionId`, `gameId`, `focus`, the PRNG `seed`, and the current `trialIndex`.
2.  **Detect on Load:** On application load, check for the existence of this `active_session` record in `sessionStorage`.
3.  **Offer Resume:** If an active session is found, present the user with a UI prompt: "You have an incomplete session. Would you like to resume or start a new one?"
4.  **Rehydrate State:** If the user chooses to resume, rehydrate the game component by:
    *   Re-instantiating the PRNG with the stored `seed`.
    *   Fast-forwarding the PRNG by re-running stimulus generation for all trials up to the stored `trialIndex` but discarding the output.
    *   Loading the stimulus for the current `trialIndex`.
    *   This will restore the game to its exact state pre-reload, preserving determinism.
5.  **Clear on Completion:** Delete the `active_session` record from `sessionStorage` only when a session is successfully completed or explicitly abandoned by the user.
