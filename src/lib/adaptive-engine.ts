
'use client';

import type { AdaptiveState, DifficultyPolicy, GameId, Tier, TrialResult, TrainingFocus, TierSelection } from "@/types";

export const TIER_CONFIG: Record<Tier, { name: string, range: [number, number] }> = {
    0: { name: "Foundation", range: [1, 5] },
    1: { name: "Developing", range: [4, 10] },
    2: { name: "Proficient", range: [8, 15] },
    3: { name: "Elite", range: [12, 20] },
};

export const getDefaultState = (gameId: GameId, tier: Tier): AdaptiveState => {
    const config = TIER_CONFIG[tier];
    return {
        gameId,
        lastFocus: 'neutral',
        tier,
        levelFloor: config.range[0],
        levelCeiling: config.range[1],
        currentLevel: config.range[0],
        uncertainty: 0.8,
        consecutiveCorrect: 0,
        consecutiveWrong: 0,
        recentTrials: [],
        smoothedAccuracy: 0.75, // Start with a neutral assumption
        smoothedRT: null,
        sessionCount: 0,
        lastSessionAt: 0,
        levelHistory: [],
    };
};

/**
 * The core adaptive engine. It is content-agnostic.
 * It adjusts the user's difficulty level based on performance.
 * @param trialResult - The result of the last trial (correct, reactionTimeMs).
 * @param currentState - The user's current adaptive state for the game.
 * @param policy - The difficulty policy for the specific game.
 * @returns The new, updated adaptive state.
 */
export const adjustDifficulty = (
    trialResult: TrialResult,
    currentState: AdaptiveState,
    policy: DifficultyPolicy
): AdaptiveState => {
    // 1. Record Trial with Telemetry by creating a new array
    const newRecentTrials = [...currentState.recentTrials, {
        timestamp: Date.now(),
        level: currentState.currentLevel,
        correct: trialResult.correct,
        reactionTimeMs: trialResult.reactionTimeMs,
        telemetry: trialResult.telemetry || {},
    }];
    if (newRecentTrials.length > policy.windowSize) {
        newRecentTrials.shift();
    }

    const consecutiveCorrect = trialResult.correct ? currentState.consecutiveCorrect + 1 : 0;
    const consecutiveWrong = trialResult.correct ? 0 : currentState.consecutiveWrong + 1;

    // 2. Update Smoothed Accuracy (Exponentially Weighted Moving Average)
    const accuracyAlpha = 0.15;
    const smoothedAccuracy = accuracyAlpha * (trialResult.correct ? 1 : 0) + (1 - accuracyAlpha) * currentState.smoothedAccuracy;

    let smoothedRT = currentState.smoothedRT;
    if (trialResult.correct && trialResult.reactionTimeMs > 50) { // Ignore accidental clicks
        const rtAlpha = 0.1;
        if (currentState.smoothedRT === null) {
            smoothedRT = trialResult.reactionTimeMs;
        } else {
            smoothedRT = rtAlpha * trialResult.reactionTimeMs + (1 - rtAlpha) * currentState.smoothedRT;
        }
    }
    
    let currentLevel = currentState.currentLevel;
    const { targetAccuracyHigh, targetAccuracyLow } = policy;

    // --- UNCERTAINTY-AWARE STEP SIZING (Rule 5) ---
    const step = Math.max(1, Math.round(1 * (1 + currentState.uncertainty)));

    // 3. Safety Rule (Rapid Drop on repeated failures)
    if (consecutiveWrong >= 3) {
        currentLevel = Math.max(currentState.levelFloor, currentState.currentLevel - step);
    } 
    // 4. Target Band Logic (Primary adjustment mechanism)
    else {
        if (smoothedAccuracy > targetAccuracyHigh && consecutiveCorrect >= 2) {
             currentLevel = Math.min(currentState.levelCeiling, currentState.currentLevel + step);
        } 
        else if (smoothedAccuracy < targetAccuracyLow) {
             currentLevel = Math.max(currentState.levelFloor, currentState.currentLevel - 1);
        }
    }

    // Clamp level to its tier boundaries
    currentLevel = Math.max(currentState.levelFloor, Math.min(currentState.levelCeiling, currentLevel));

    const levelChanged = currentLevel !== currentState.currentLevel;
    
    // 5. DECAY UNCERTAINTY
    let uncertainty = currentState.uncertainty;
    if (levelChanged) {
         uncertainty = Math.min(1.0, currentState.uncertainty * 1.05 + 0.05); // Increase uncertainty on change
    } else {
        uncertainty = Math.max(0.1, currentState.uncertainty * 0.98); // Decay towards baseline
    }

    // Return a completely new state object, respecting immutability.
    return {
        ...currentState,
        recentTrials: newRecentTrials,
        consecutiveCorrect: consecutiveWrong >= 3 || (smoothedAccuracy > targetAccuracyHigh && consecutiveCorrect >= 2) ? 0 : consecutiveCorrect,
        consecutiveWrong: consecutiveWrong >= 3 ? 0 : consecutiveWrong,
        smoothedAccuracy,
        smoothedRT,
        currentLevel,
        uncertainty,
    };
};

export const startSession = (state: AdaptiveState): AdaptiveState => {
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    const isReturningAfterBreak = (Date.now() - state.lastSessionAt) > oneWeek;

    let uncertainty = state.uncertainty;
    let startLevel = state.currentLevel;

    // If user is returning after a long break, increase uncertainty and slightly lower level
    // to account for skill rust.
    if (isReturningAfterBreak) {
        uncertainty = 0.6; // Re-calibration mode
        startLevel = Math.max(state.levelFloor, startLevel - 1);
    }
    
    return {
        ...state,
        uncertainty,
        currentLevel: startLevel, // Use adjusted start level
        recentTrials: [], // Clear recent trials for the new session
        sessionCount: state.sessionCount + 1,
    };
};

export const endSession = (state: AdaptiveState, sessionHistory: TrialResult[]): AdaptiveState => {
    const avgAccuracy = sessionHistory.reduce((acc, trial) => acc + (trial.correct ? 1 : 0), 0) / sessionHistory.length;
    const correctTrials = sessionHistory.filter(t => t.correct);
    const avgRT = correctTrials.reduce((acc, trial) => acc + trial.reactionTimeMs, 0) / (correctTrials.length || 1);

    const startLevel = state.levelHistory.length > 0 ? state.levelHistory[state.levelHistory.length-1].endLevel : state.levelFloor;
    
    const newLevelHistoryEntry = {
        sessionDate: Date.now(),
        startLevel: startLevel,
        endLevel: state.currentLevel,
        avgAccuracy: isNaN(avgAccuracy) ? 0 : avgAccuracy,
        avgRT: isNaN(avgRT) ? 0 : avgRT,
    };

    return {
        ...state,
        lastSessionAt: Date.now(),
        levelHistory: [...state.levelHistory, newLevelHistoryEntry].slice(-20), // Keep last 20 sessions
    };
};
