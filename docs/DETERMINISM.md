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

**Current Implementation:** In-progress training sessions are recoverable across page reloads.

1.  **Persist Session Pointer:** Upon starting a new game session, a minimal `active_session` record is written to `sessionStorage`. This record contains the `sessionId`, `gameId`, the PRNG `seed`, and the current `trialIndex` (`seq`).
2.  **Detect on Load:** On application load, the `usePerformanceStore` hydration logic checks for the existence of this `active_session` record.
3.  **Offer Resume:** If an active session is found, the store automatically resumes the session from where it left off and shows a toast notification.
4.  **Rehydrate State:** The store rehydrates the game state by:
    *   Re-instantiating the PRNG with the stored `seed`.
    *   Fast-forwarding the PRNG by re-running stimulus generation for all trials up to the stored `trialIndex` but discarding the output. This restores the PRNG to its exact state pre-reload, preserving determinism.
    *   Loading the correct game at the correct trial index.
5.  **Clear on Completion:** The `active_session` record is deleted from `sessionStorage` only when a session is successfully completed or explicitly abandoned by the user.