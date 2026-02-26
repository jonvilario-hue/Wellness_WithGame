'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef, useCallback } from "react";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { useAudioEngine } from "@/hooks/use-audio-engine";
import { Loader2, Headphones, Hand } from "lucide-react";
import { adjustDifficulty, startSession } from "@/lib/adaptive-engine";
import { difficultyPolicies } from "@/data/difficulty-policies";
import type { AdaptiveState, TrialResult, GameId, TrialRecord } from "@/types";
import { domainIcons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { PRNG } from "@/lib/rng";


const GAME_ID: GameId = 'ef_focus_switch';
const policy = difficultyPolicies[GAME_ID];

type GoNoGoTrial = {
    type: 'GO' | 'NO-GO';
    chord: number[];
};

export function AuditoryGoNoGo() {
    const { getAdaptiveState, updateAdaptiveState, logTrial } = usePerformanceStore();
    const { engine } = useAudioEngine();

    const [gameState, setGameState] = useState<'loading' | 'tutorial' | 'playing' | 'finished'>('loading');
    const [lastTrial, setLastTrial] = useState<GoNoGoTrial | null>(null);
    const [feedback, setFeedback] = useState('');
    const [tutorialStep, setTutorialStep] = useState(0);

    const trialTimer = useRef<NodeJS.Timeout | null>(null);
    const trialCount = useRef(0);
    const sessionTrials = useRef<TrialResult[]>([]);
    const canRespond = useRef(true);
    const trialStartTime = useRef(0);
    const sessionId = useRef<string | null>(null);
    const deviceInfo = useRef<any>(null);
    const prng = useRef<PRNG | null>(null);
    const adaptiveState = getAdaptiveState(GAME_ID, 'music');


    const startNewTrial = useCallback(() => {
        if (!prng.current) return;
        const isTutorial = gameState === 'tutorial';
        const level = isTutorial ? 1 : adaptiveState.currentLevel;
        const levelParams = policy.levelMap[level]?.content_config['music']?.params;
        if (!levelParams) return;
        
        if (!isTutorial && trialCount.current >= policy.sessionLength) {
            setGameState('finished');
            return;
        }

        const isGo = prng.current.nextFloat() > levelParams.nogo_probability;
        const type = isGo ? 'GO' : 'NO-GO';
        
        const goChord = [60, 64, 67]; // C Major
        const noGoChord = [60, 66];   // Tritone
        const chord = isGo ? goChord : noGoChord;

        if (engine) {
            const handle = engine.playChord(chord, 300);
            if(handle && handle.length > 0) {
                trialStartTime.current = handle[0].scheduledOnset;
            }
        }
        
        setLastTrial({ type, chord });
        canRespond.current = true;
        setFeedback('');
        
        if (isTutorial) {
            setTutorialStep(s => s + 1);
        } else {
            trialCount.current++;
        }

        setTimeout(() => {
            if(canRespond.current && type === 'NO-GO') {
                handleTimeout();
            }
        }, levelParams.isi_ms * 0.8); // Response window is 80% of ISI

    }, [gameState, adaptiveState, engine, policy.sessionLength]);

    const startNewSession = useCallback((isTutorial: boolean) => {
        if (!engine) return;
        engine.resumeContext();
        const info = engine.getLatencyInfo();
        deviceInfo.current = info;
        prng.current = new PRNG(crypto.randomUUID());
        
        const sessionState = startSession(adaptiveState);
        updateAdaptiveState(GAME_ID, 'music', sessionState);
        
        sessionId.current = crypto.randomUUID();
        trialCount.current = 0;
        sessionTrials.current = [];
        setTutorialStep(0);
        
        if (isTutorial) {
            setGameState('tutorial');
        } else {
            setGameState('playing');
        }
    }, [engine, adaptiveState, updateAdaptiveState]);
    
    useEffect(() => {
        if (gameState === 'playing' || gameState === 'tutorial') {
            if (gameState === 'tutorial' && tutorialStep >= 5) {
                setGameState('playing'); // Move from tutorial to scored session
                return;
            }
            const levelParams = policy.levelMap[adaptiveState.currentLevel]?.content_config['music']?.params;
            const isi = levelParams?.isi_ms || 1500;
            runTrial();
            trialTimer.current = setInterval(runTrial, isi);
        } else if (trialTimer.current) {
            clearInterval(trialTimer.current);
        }
        return () => { if (trialTimer.current) clearInterval(trialTimer.current); }
    }, [gameState, adaptiveState, startNewTrial, tutorialStep]);
    
    const runTrial = useCallback(() => {
        startNewTrial();
    }, [startNewTrial]);


    const handlePress = () => {
        if (!lastTrial || !canRespond.current || !engine) return;
        
        canRespond.current = false;
        const responseTs = engine.getAudioContextTime();
        const rtMs = (responseTs - trialStartTime.current) * 1000;
        const isCorrect = lastTrial.type === 'GO';
        const responseType = isCorrect ? 'hit' : 'false_alarm';
        
        setFeedback(isCorrect ? 'Good' : 'Oops! Do not press for dissonant chords.');
        if(gameState === 'playing') logAndContinue(isCorrect, responseType, rtMs);
    };

    const handleTimeout = () => {
        if (!lastTrial || !canRespond.current || !engine) return;

        canRespond.current = false;
        const responseTs = engine.getAudioContextTime();
        const rtMs = (responseTs - trialStartTime.current) * 1000;
        const isCorrect = lastTrial.type === 'NO-GO';
        const responseType = isCorrect ? 'correct_rejection' : 'miss';
        
        setFeedback(isCorrect ? '' : 'Missed!');
        if(gameState === 'playing') logAndContinue(isCorrect, responseType, rtMs);
    }

    const logAndContinue = (isCorrect: boolean, responseType: string, rtMs: number) => {
        const state = getAdaptiveState(GAME_ID, 'music');
        const trialResult: TrialResult = { 
            correct: isCorrect, 
            reactionTimeMs: rtMs, 
            telemetry: { condition: lastTrial?.type.toLowerCase(), responseType } 
        };
        sessionTrials.current.push(trialResult);

        logTrial({
            sessionId: sessionId.current!,
            gameId: GAME_ID,
            trialIndex: trialCount.current,
            difficultyLevel: state.currentLevel,
            condition: trialResult.telemetry.condition,
            stimulusParams: {
                chord: lastTrial?.chord
            },
            stimulusOnsetTs: trialStartTime.current,
            responseTs: engine?.getAudioContextTime(),
            rtMs: rtMs,
            correct: isCorrect,
            responseType: responseType,
            deviceInfo: deviceInfo.current,
            meta: {},
        } as TrialRecord);

        const newState = adjustDifficulty(trialResult, state, policy);
        updateAdaptiveState(GAME_ID, 'music', newState);
    };
    
    useEffect(() => {
        if(engine?.isReady && gameState === 'loading') {
            startNewSession(true);
        }
    }, [engine, gameState, startNewSession]);
    
    const renderContent = () => {
        if (gameState === 'loading' && !engine?.isReady) {
            return <Button onClick={() => engine?.resumeContext()} size="lg">Tap to Enable Audio</Button>
        }
        if (gameState === 'tutorial' || gameState === 'playing') {
             return (
                <>
                    <div className="text-center">
                        {gameState === 'tutorial' && <p className="font-bold mb-2">TUTORIAL ({tutorialStep}/5)</p>}
                        <p className="font-semibold text-lg">Press for pleasant chords. Do NOT press for dissonant chords.</p>
                    </div>
                    <div className="h-8 text-xl font-bold">
                        <p className={cn(feedback === 'Good' ? 'text-green-400' : 'text-red-400')}>{feedback}</p>
                    </div>
                    <Button onPointerDown={handlePress} className="w-48 h-48 rounded-full text-2xl">PRESS</Button>
                </>
             )
        }
        if (gameState === 'finished') {
             return <div className="text-center">
                 <CardTitle>Session Complete</CardTitle>
                 <Button onClick={() => startNewSession(true)} className="mt-4">Play Again</Button>
             </div>
        }
    }

    return (
        <Card className="w-full max-w-md text-center">
            <CardHeader>
                <CardTitle className="flex items-center justify-center gap-2">
                    <span className="p-2 bg-primary/10 rounded-md"><Hand className="w-6 h-6 text-primary" /></span>
                    Auditory Go/No-Go
                </CardTitle>
                <CardDescription>
                    <Headphones className="inline-block mr-1"/>Wired headphones recommended.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6 min-h-[400px] justify-center">
                {renderContent()}
            </CardContent>
        </Card>
    );
}
