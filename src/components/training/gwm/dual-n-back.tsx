'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef, useCallback } from "react";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { useAudioEngine } from "@/hooks/use-audio-engine";
import { Loader2, Headphones, Brain, Waves } from "lucide-react";
import { adjustDifficulty, startSession } from "@/lib/adaptive-engine";
import { difficultyPolicies } from "@/data/difficulty-policies";
import type { AdaptiveState, TrialResult, GameId, TrialRecord } from "@/types";
import { domainIcons } from "@/components/icons";

const GAME_ID: GameId = 'gwm_dynamic_sequence';
const policy = difficultyPolicies[GAME_ID];

type Trial = {
    pitch: number;
    timbre: OscillatorType;
    isPitchMatch: boolean;
    isTimbreMatch: boolean;
};

export function DualNBack() {
    const { getAdaptiveState, updateAdaptiveState, logTrial } = usePerformanceStore();
    const { playNote, resumeContext, isAudioReady, getLatencyInfo } = useAudioEngine();

    const [gameState, setGameState] = useState<'loading' | 'tutorial' | 'playing' | 'finished'>('loading');
    const [history, setHistory] = useState<Trial[]>([]);
    const [feedback, setFeedback] = useState<{ type: 'pitch' | 'timbre', correct: boolean } | null>(null);
    const [tutorialStep, setTutorialStep] = useState(0);
    const [deviceInfo, setDeviceInfo] = useState<any>(null);

    const trialTimer = useRef<NodeJS.Timeout | null>(null);
    const trialCount = useRef(0);
    const sessionTrials = useRef<TrialResult[]>([]);
    const stimulusOnsetTs = useRef(0);
    const responseTracker = useRef<{ pitch: boolean, timbre: boolean }>({ pitch: false, timbre: false });
    const sessionId = useRef<string | null>(null);

    const startSession = useCallback(() => {
        resumeContext();
        const info = getLatencyInfo();
        setDeviceInfo(info);
        
        const sessionState = startSession(getAdaptiveState(GAME_ID, 'music'));
        updateAdaptiveState(GAME_ID, 'music', sessionState);
        
        trialCount.current = 0;
        sessionTrials.current = [];
        setHistory([]);
        sessionId.current = crypto.randomUUID();
        setTutorialStep(0);
        setGameState('tutorial');
    }, [resumeContext, getLatencyInfo, getAdaptiveState, updateAdaptiveState]);

    const startScoredSession = useCallback(() => {
        trialCount.current = 0;
        setHistory([]);
        setGameState('playing');
    }, []);

    const endSession = useCallback(() => {
        setGameState('finished');
    }, []);

    const runTrial = useCallback(() => {
        if (!isAudioReady) return;

        const isTutorial = gameState === 'tutorial';
        const adaptiveState = getAdaptiveState(GAME_ID, 'music');
        const level = isTutorial ? 1 : adaptiveState.currentLevel;
        const levelParams = policy.levelMap[level]?.content_config['music']?.params;

        if (!levelParams) {
            console.error("Missing level params for music mode");
            return;
        }

        const { n_back, pitch_palette_size, timbre_palette, target_probability } = levelParams;
        const pitch_palette = Array.from({ length: pitch_palette_size }, (_, i) => 60 + i * 2);

        let newPitch = pitch_palette[Math.floor(Math.random() * pitch_palette.length)];
        let newTimbre = timbre_palette[Math.floor(Math.random() * timbre_palette.length)];
        let isPitchMatch = false;
        let isTimbreMatch = false;

        if (history.length >= n_back) {
            const nBackTrial = history[history.length - n_back];
            if (Math.random() < target_probability) {
                newPitch = nBackTrial.pitch;
                isPitchMatch = true;
            } else {
                while(newPitch === nBackTrial.pitch) newPitch = pitch_palette[Math.floor(Math.random() * pitch_palette.length)];
            }
            if (Math.random() < target_probability) {
                newTimbre = nBackTrial.timbre;
                isTimbreMatch = true;
            } else {
                 while(newTimbre === nBackTrial.timbre) newTimbre = timbre_palette[Math.floor(Math.random() * timbre_palette.length)];
            }
        }

        const newTrial: Trial = { pitch: newPitch, timbre: newTimbre, isPitchMatch, isTimbreMatch };
        
        const handle = playNote(newTrial.pitch, newTrial.timbre, 500);
        if (handle) {
            stimulusOnsetTs.current = handle.scheduledOnset;
        }
        
        setHistory(prev => [...prev, newTrial]);
        setFeedback(null);
        responseTracker.current = { pitch: false, timbre: false };

        if (!isTutorial) {
             trialCount.current++;
        } else {
            setTutorialStep(s => s + 1);
        }

    }, [isAudioReady, gameState, getAdaptiveState, history, playNote]);

     useEffect(() => {
        if ((gameState === 'playing' || gameState === 'tutorial') && trialCount.current < 30 && tutorialStep < 6) {
            const levelParams = policy.levelMap[getAdaptiveState(GAME_ID, 'music').currentLevel]?.content_config['music']?.params;
            const isi = levelParams?.isi_ms || 2500;
            trialTimer.current = setInterval(runTrial, isi);
        } else if (gameState === 'playing' || (gameState === 'tutorial' && tutorialStep >= 5)) {
            if (gameState === 'tutorial') {
                startScoredSession();
            } else {
                endSession();
            }
        }

        return () => {
            if (trialTimer.current) clearInterval(trialTimer.current);
        };
    }, [gameState, runTrial, getAdaptiveState, tutorialStep, startScoredSession, endSession]);


    const handleResponse = (matchType: 'pitch' | 'timbre') => {
        if (!isAudioReady || history.length === 0) return;
        
        const responseTs = performance.now(); // We will need to convert this
        const rtMs = responseTs - stimulusOnsetTs.current; // This is an approximation until we convert times
        const adaptiveState = getAdaptiveState(GAME_ID, 'music');
        const levelParams = policy.levelMap[adaptiveState.currentLevel]?.content_config['music']?.params;
        const n_back = levelParams?.n_back || 1;

        if (history.length <= n_back) return; // Not enough history to check

        const currentTrial = history[history.length - 1];
        let correct = false;
        let responseType = 'false_alarm';

        if (matchType === 'pitch') {
            if (responseTracker.current.pitch) return; // Already responded
            responseTracker.current.pitch = true;
            correct = currentTrial.isPitchMatch;
            if(correct) responseType = 'hit';
        } else { // timbre
            if (responseTracker.current.timbre) return;
            responseTracker.current.timbre = true;
            correct = currentTrial.isTimbreMatch;
             if(correct) responseType = 'hit';
        }
        
        setFeedback({ type: matchType, correct });
        setTimeout(() => setFeedback(null), 500);

        if (gameState !== 'tutorial') {
            const trialResult: TrialResult = { correct, reactionTimeMs: rtMs, telemetry: {} };
            sessionTrials.current.push(trialResult);

            logTrial({
                sessionId: sessionId.current!,
                userId: 'local-user', // Placeholder for Firebase Auth
                gameId: GAME_ID,
                trialIndex: trialCount.current,
                condition: currentTrial.isPitchMatch && currentTrial.isTimbreMatch ? "dual_match" : currentTrial.isPitchMatch ? "pitch_only" : currentTrial.isTimbreMatch ? "timbre_only" : "no_match",
                stimulusParams: {
                    pitch: currentTrial.pitch,
                    timbre: currentTrial.timbre,
                },
                stimulusOnsetTs: stimulusOnsetTs.current,
                responseTs: responseTs,
                rtMs,
                correct,
                responseType,
                difficultyLevel: adaptiveState.currentLevel,
                deviceInfo,
                meta: {
                    n_back_level: n_back,
                    is_pitch_match: currentTrial.isPitchMatch,
                    is_timbre_match: currentTrial.isTimbreMatch,
                    player_said_pitch_match: matchType === 'pitch',
                    player_said_timbre_match: matchType === 'timbre',
                }
            } as any);

            const newState = adjustDifficulty(trialResult, adaptiveState, policy);
            updateAdaptiveState(GAME_ID, 'music', newState);
        }
    };
    
    useEffect(() => {
        if(!isAudioReady) setGameState('loading');
    }, [isAudioReady]);

    const renderContent = () => {
        if (gameState === 'loading') {
            return <Button onClick={resumeContext} size="lg">Tap to Enable Audio</Button>
        }
        if (gameState === 'tutorial') {
            return (
                <div className="text-center space-y-4">
                    <h3 className="text-xl font-semibold">Tutorial ({tutorialStep}/5)</h3>
                    <p>Listen to the sequence of notes. Press "Pitch Match" if the note's pitch is the same as the one from 1 trial ago. Press "Timbre Match" if the instrument sound is the same.</p>
                     <div className="w-32 h-32 bg-cyan-900/50 rounded-full flex items-center justify-center">
                        <Waves className="w-16 h-16 text-cyan-400" />
                    </div>
                </div>
            );
        }
        if (gameState === 'finished') {
            const score = sessionTrials.current.filter(t => t.correct).length;
            const accuracy = sessionTrials.current.length > 0 ? (score / sessionTrials.current.length) * 100 : 0;
            return (
                <div className="text-center space-y-4">
                    <h3 className="text-2xl font-bold">Session Complete</h3>
                    <p className="text-lg">Accuracy: {accuracy.toFixed(1)}%</p>
                    <Button onClick={startSession} size="lg">Play Again</Button>
                </div>
            )
        }
        // Playing state
        const adaptiveState = getAdaptiveState(GAME_ID, 'music');
        const n_back = policy.levelMap[adaptiveState.currentLevel]?.content_config['music']?.params.n_back || 1;
        return (
            <div className="flex flex-col items-center gap-6 w-full">
                <div className="w-full flex justify-between font-mono text-cyan-200">
                    <span>Trial: {trialCount.current} / 30</span>
                    <span>N-Back: {n_back}</span>
                </div>
                <div className="w-32 h-32 bg-cyan-900/50 rounded-full flex items-center justify-center">
                    <Waves className="w-16 h-16 text-cyan-400" />
                </div>
                <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                    <Button onClick={() => handleResponse('pitch')} className="h-20 text-lg bg-sky-600 hover:bg-sky-500">Pitch Match</Button>
                    <Button onClick={() => handleResponse('timbre')} className="h-20 text-lg bg-teal-600 hover:bg-teal-500">Timbre Match</Button>
                </div>
                <div className="h-6 mt-2">
                    {feedback && <p className={`text-lg font-bold ${feedback.correct ? 'text-green-400' : 'text-red-400'}`}>
                        {feedback.correct ? 'Correct!' : 'Incorrect'}
                    </p>}
                </div>
            </div>
        )
    }

    return (
        <Card className="w-full max-w-md text-center bg-cyan-950 border-cyan-500/20 text-cyan-100">
            <CardHeader>
                <CardTitle className="text-cyan-300 flex items-center justify-center gap-2">
                    <span className="p-2 bg-cyan-500/10 rounded-md"><domainIcons.Gwm className="w-6 h-6 text-cyan-400" /></span>
                    Dual N-Back
                </CardTitle>
                <CardDescription className="text-cyan-300/70">Does the pitch or timbre match the one from N steps ago? <br/><br/> <Headphones className="inline-block mr-2" /> Wired headphones recommended for best results.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6 min-h-[350px] justify-center">
                 {gameState === 'loading' && !isAudioReady
                    ? <Button onClick={resumeContext} size="lg">Tap to Enable Audio & Start</Button>
                    : gameState === 'loading' && isAudioReady ? <Button onClick={startSession} size="lg">Start Session</Button>
                    : renderContent()
                 }
            </CardContent>
        </Card>
    );
}
