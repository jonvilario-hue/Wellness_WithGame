
import type { AdaptiveState, DifficultyPolicy, GameId, Tier, TrialResult, TrainingFocus } from "@/types";

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


export const adjustDifficulty = (
    trialResult: TrialResult,
    currentState: AdaptiveState,
    policy: DifficultyPolicy
): AdaptiveState => {
    const state: AdaptiveState = { ...currentState };

    // 1. Record Trial
    state.recentTrials.push({
        timestamp: Date.now(),
        level: state.currentLevel,
        ...trialResult,
    });
    if (state.recentTrials.length > policy.windowSize) {
        state.recentTrials.shift();
    }
    
    if(trialResult.correct) {
        state.consecutiveCorrect++;
        state.consecutiveWrong = 0;
    } else {
        state.consecutiveCorrect = 0;
        state.consecutiveWrong++;
    }

    // 2. Update Smoothed Accuracy (EWMA)
    const alpha = 0.15;
    state.smoothedAccuracy = alpha * (trialResult.correct ? 1 : 0) + (1 - alpha) * state.smoothedAccuracy;

    if (trialResult.correct) {
        if (state.smoothedRT === null) {
            state.smoothedRT = trialResult.reactionTimeMs;
        } else {
            state.smoothedRT = alpha * trialResult.reactionTimeMs + (1 - alpha) * state.smoothedRT;
        }
    }
    
    let levelChanged = false;
    const originalLevel = state.currentLevel;

    // --- UNCERTAINTY-AWARE STEP SIZING (Rule 5) ---
    const step = Math.max(1, Math.round(1 * (1 + state.uncertainty)));

    // 4. Safety Rule (Rapid Drop)
    if (state.consecutiveWrong >= 3) {
        state.currentLevel = Math.max(state.levelFloor, state.currentLevel - step);
        state.consecutiveWrong = 0;
        state.consecutiveCorrect = 0; // Reset both streaks
        levelChanged = true;
    } else {
        // 6. Target Band Logic
        const { targetAccuracyHigh, targetAccuracyLow } = policy;
        if (state.smoothedAccuracy > targetAccuracyHigh && state.consecutiveCorrect >= 2) {
             state.currentLevel = Math.min(state.levelCeiling, state.currentLevel + step);
             state.consecutiveCorrect = 0;
             levelChanged = true;
        } else if (state.smoothedAccuracy < targetAccuracyLow && state.consecutiveWrong > 0) {
             state.currentLevel = Math.max(state.levelFloor, state.currentLevel - 1); // Use smaller step for single errors
             state.consecutiveWrong = 0;
             levelChanged = true;
        }
    }

    // Clamp level to its tier boundaries
    state.currentLevel = Math.max(state.levelFloor, Math.min(state.levelCeiling, state.currentLevel));

    if(state.currentLevel !== originalLevel) {
        levelChanged = true;
    }

    // 5. Stability Rule (Hysteresis)
    if (state.recentTrials.length > 2) {
        const lastTrial = state.recentTrials[state.recentTrials.length - 2];
        if(lastTrial) {
            const lastLevelChange = originalLevel - lastTrial.level;
            const currentLevelChange = state.currentLevel - originalLevel;
            if ((lastLevelChange > 0 && currentLevelChange < 0) || (lastLevelChange < 0 && currentLevelChange > 0)) {
                state.currentLevel = originalLevel; // Revert the change
                levelChanged = false;
            }
        }
    }
    
    // 7. DECAY UNCERTAINTY
    // If level changed, we are less certain. If it holds, we become more certain.
    if (levelChanged) {
         state.uncertainty = Math.min(1.0, state.uncertainty * 1.05);
    } else {
        state.uncertainty = Math.max(0.1, state.uncertainty * 0.98);
    }

    return state;
};

export const startSession = (state: AdaptiveState): AdaptiveState => {
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    const isReturningAfterBreak = (Date.now() - state.lastSessionAt) > oneWeek;

    let uncertainty = state.uncertainty;
    let startLevel = state.currentLevel;

    if (isReturningAfterBreak) {
        uncertainty = 0.6; // Re-calibration mode
        startLevel = Math.max(state.levelFloor, startLevel - 1); // Rust adjustment
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

    