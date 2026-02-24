
import type { TrialRecord } from '@/types';
import type { SessionSummary, GameProfile, SessionRecord } from '@/types/local-store';

// --- Adaptive Difficulty Constants ---
const ACCURACY_THRESHOLD_UP = 0.85;
const ACCURACY_THRESHOLD_DOWN = 0.60;
const RT_THRESHOLD_UP = 800; // ms
const MAX_DIFFICULTY = 10;
const MIN_DIFFICULTY = 1;

export const computeNextDifficulty = (accuracy: number, meanRtMs: number, currentDifficulty: number): number => {
    if (accuracy >= ACCURACY_THRESHOLD_UP && meanRtMs < RT_THRESHOLD_UP) {
        return Math.min(MAX_DIFFICULTY, currentDifficulty + 1);
    }
    if (accuracy < ACCURACY_THRESHOLD_DOWN) {
        return Math.max(MIN_DIFFICULTY, currentDifficulty - 1);
    }
    return currentDifficulty;
};

export const computeSessionSummary = (trials: TrialRecord[], currentDifficulty: number): SessionSummary => {
    if (trials.length === 0) {
        return {
            totalTrials: 0,
            correctTrials: 0,
            accuracy: 0,
            meanRtMs: 0,
            medianRtMs: 0,
            difficultyLevel: currentDifficulty,
            nextDifficultyLevel: currentDifficulty,
        };
    }

    const correctTrials = trials.filter(t => t.correct);
    const accuracy = correctTrials.length / trials.length;
    const rts = correctTrials.map(t => t.rtMs).sort((a, b) => a - b);
    const meanRtMs = rts.reduce((sum, rt) => sum + rt, 0) / (rts.length || 1);
    
    let medianRtMs = 0;
    if (rts.length > 0) {
        const mid = Math.floor(rts.length / 2);
        medianRtMs = rts.length % 2 !== 0 ? rts[mid] : (rts[mid - 1] + rts[mid]) / 2;
    }

    const nextDifficultyLevel = computeNextDifficulty(accuracy, meanRtMs, currentDifficulty);

    return {
        totalTrials: trials.length,
        correctTrials: correctTrials.length,
        accuracy,
        meanRtMs,
        medianRtMs,
        difficultyLevel: currentDifficulty,
        nextDifficultyLevel,
    };
};

export const computeRollingStats = (sessions: SessionRecord[], window: number): { rollingAccuracy: number; rollingMeanRt: number } => {
    const relevantSessions = sessions
        .filter(s => s.summary)
        .slice(0, window);

    if (relevantSessions.length === 0) {
        return { rollingAccuracy: 0, rollingMeanRt: 0 };
    }

    const totalAccuracy = relevantSessions.reduce((sum, s) => sum + s.summary!.accuracy, 0);
    const totalMeanRt = relevantSessions.reduce((sum, s) => sum + s.summary!.meanRtMs, 0);

    return {
        rollingAccuracy: totalAccuracy / relevantSessions.length,
        rollingMeanRt: totalMeanRt / relevantSessions.length,
    };
};

export const updateGameProfile = (
    gameId: string,
    existingProfile: GameProfile | null,
    sessions: SessionRecord[],
    currentSessionSummary: SessionSummary
): GameProfile => {
    const rollingStats = computeRollingStats(sessions, 10);
    
    const newProfile: GameProfile = {
        gameId,
        currentDifficulty: currentSessionSummary.nextDifficultyLevel,
        rollingAccuracy: rollingStats.rollingAccuracy,
        rollingMeanRt: rollingStats.rollingMeanRt,
        lastPlayedTimestamp: Date.now(),
        sessionsCompleted: (existingProfile?.sessionsCompleted || 0) + 1,
    };

    return newProfile;
};
