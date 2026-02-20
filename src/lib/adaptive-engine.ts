
import type { AdaptiveState, DifficultyPolicy, GameId, Tier, TrialResult } from "@/types";

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
        tier,
        levelFloor: config.range[0],
        levelCeiling: config.range[1],
        currentLevel: config.range[0] + 1,
        uncertainty: 0.8,
        consecutiveCorrect: 0,
        consecutiveWrong: 0,
        recentTrials: [],
        smoothedAccuracy: 0.75, // Start with a neutral assumption
        smoothedRT: 0,
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
    
    // Update trackers for correct/wrong streaks
    if(trialResult.correct) {
        state.consecutiveCorrect++;
        state.consecutiveWrong = 0;
    } else {
        state.consecutiveCorrect = 0;
        state.consecutiveWrong++;
    }

    // 2. Update Smoothed Accuracy (EWMA)
    const alpha = 0.15; // default smoothing factor
    state.smoothedAccuracy = alpha * (trialResult.correct ? 1 : 0) + (1 - alpha) * state.smoothedAccuracy;

    // 3. Update Smoothed Reaction Time (EWMA for correct trials only)
    if (trialResult.correct) {
        if (state.smoothedRT === 0) {
            state.smoothedRT = trialResult.reactionTimeMs;
        } else {
            state.smoothedRT = alpha * trialResult.reactionTimeMs + (1 - alpha) * state.smoothedRT;
        }
    }
    
    let levelChanged = false;
    const originalLevel = state.currentLevel;

    // 4. Safety Rule (Rapid Drop)
    const rapidDropMultiplier = state.uncertainty > 0.5 ? 2 : 1;
    if (state.consecutiveWrong >= 3) {
        state.currentLevel = Math.max(state.levelFloor, state.currentLevel - (2 * rapidDropMultiplier));
        state.consecutiveWrong = 0;
        state.consecutiveCorrect = 0;
        levelChanged = true;
    } else {
        // 6. Target Band Logic
        const { targetAccuracyHigh, targetAccuracyLow } = policy;
        if (state.smoothedAccuracy > targetAccuracyHigh && state.consecutiveCorrect >= 2) {
             state.currentLevel = Math.min(state.levelCeiling, state.currentLevel + 1);
             state.consecutiveCorrect = 0; // Reset after level up
             levelChanged = true;
        } else if (state.smoothedAccuracy < targetAccuracyLow && state.consecutiveWrong > 0) {
             state.currentLevel = Math.max(state.levelFloor, state.currentLevel - 1);
             state.consecutiveWrong = 0; // Reset after level down
             levelChanged = true;
        }
    }

    // 5. Stability Rule (Hysteresis) - check if level oscillated
    if (state.recentTrials.length > 2) {
        const lastTwoTrials = state.recentTrials.slice(-2);
        const lastLevelChange = lastTwoTrials[1].level - lastTwoTrials[0].level;
        const currentLevelChange = state.currentLevel - originalLevel;
        if (lastLevelChange > 0 && currentLevelChange < 0 || lastLevelChange < 0 && currentLevelChange > 0) {
            state.currentLevel = originalLevel; // Revert the change to hold steady
            levelChanged = false;
        }
    }
    
    // 7. Decay Uncertainty (only if level didn't change)
    if (!levelChanged) {
        state.uncertainty = Math.max(0.1, state.uncertainty * 0.99);
    } else {
         // Reset uncertainty slightly on level change to allow faster re-adaptation if needed
         state.uncertainty = Math.min(1.0, state.uncertainty * 1.1);
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
    
    // Apply warm-up offset
    const sessionStartLevel = Math.max(state.levelFloor, startLevel - 2);

    return {
        ...state,
        uncertainty,
        currentLevel: sessionStartLevel, // Start at the warm-up level
        recentTrials: [], // Clear recent trials for the new session
        sessionCount: state.sessionCount + 1,
    };
};

export const endSession = (state: AdaptiveState, sessionHistory: TrialResult[]): AdaptiveState => {
    const avgAccuracy = sessionHistory.reduce((acc, trial) => acc + (trial.correct ? 1 : 0), 0) / sessionHistory.length;
    const correctTrials = sessionHistory.filter(t => t.correct);
    const avgRT = correctTrials.reduce((acc, trial) => acc + trial.reactionTimeMs, 0) / (correctTrials.length || 1);

    const startLevel = state.levelHistory.length > 0 ? state.levelHistory[state.levelHistory.length-1].endLevel : state.levelFloor + 1;
    
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
