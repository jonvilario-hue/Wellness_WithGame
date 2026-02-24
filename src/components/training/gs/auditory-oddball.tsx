'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef, useCallback } from "react";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { useAudioEngine } from "@/hooks/use-audio-engine";
import { Loader2, Headphones, Ear } from "lucide-react";
import { adjustDifficulty, startSession } from "@/lib/adaptive-engine";
import { difficultyPolicies } from "@/data/difficulty-policies";
import type { AdaptiveState, TrialResult, GameId, TrialRecord } from "@/types";
import { domainIcons } from "@/components/icons";
import { cn } from "@/lib/utils";

const GAME_ID: GameId = 'gs_rapid_code';
const policy = difficultyPolicies[GAME_ID];

type OddballTrial = {
    type: 'standard' | 'oddball';
    timbre: OscillatorType;
    position: number;
    onsetTs: number;
    responded: boolean;
};

export function AuditoryOddball() {
    const { getAdaptiveState, updateAdaptiveState, logTrial } = usePerformanceStore();
    const { playNote, resumeContext, isAudioReady, getAudioContextTime, getLatencyInfo } = useAudioEngine();

    const [gameState, setGameState] = useState<'loading' | 'tutorial' | 'playing' | 'finished'>('loading');
    const [lastTrialResult, setLastTrialResult] = useState<{ type: string; rt?: number } | null>(null);
    const [deviceInfo, setDeviceInfo] = useState<any>(null);

    const trialStream = useRef<OddballTrial[]>([]);
    const streamIndex = useRef(0);
    const trialTimer = useRef<NodeJS.Timeout | null>(null);
    const sessionId = useRef<string | null>(null);
    const adaptiveState = getAdaptiveState(GAME_ID, 'music');

    const generateStream = useCallback(() => {
        const levelParams = policy.levelMap[adaptiveState.currentLevel]?.content_config['music']?.params;
        if (!levelParams) return [];

        const { oddball_probability, min_standards_between_oddballs, timbre_pair } = levelParams;
        const stream: OddballTrial[] = [];
        let standardsSinceLastOddball = min_standards_between_oddballs;

        for (let i = 0; i < 30; i++) {
            let trial: Omit<OddballTrial, 'onsetTs' | 'responded'>;
            if (standardsSinceLastOddball >= min_standards_between_oddballs && Math.random() < oddball_probability) {
                trial = { type: 'oddball', timbre: timbre_pair[1], position: i };
                standardsSinceLastOddball = 0;
            } else {
                trial = { type: 'standard', timbre: timbre_pair[0], position: i };
                standardsSinceLastOddball++;
            }
            stream.push({ ...trial, onsetTs: 0, responded: false });
        }
        return stream;
    }, [adaptiveState]);

    const processStreamResults = useCallback(() => {
        const levelParams = policy.levelMap[adaptiveState.currentLevel]?.content_config['music']?.params;
        trialStream.current.forEach((trial, index) => {
            // Process lapses (missed oddballs)
            if (trial.type === 'oddball' && !trial.responded) {
                const trialResult: TrialResult = { correct: false, reactionTimeMs: levelParams.tempo_bpm ? (60000 / levelParams.tempo_bpm) : 2000, telemetry: {} };
                const newState = adjustDifficulty(trialResult, getAdaptiveState(GAME_ID, 'music'), policy);
                updateAdaptiveState(GAME_ID, 'music', newState);
                logTrial({
                    sessionId: sessionId.current!,
                    gameId: GAME_ID,
                    trialIndex: trial.position,
                    condition: "oddball",
                    responseType: "miss",
                    correct: false,
                    rtMs: trialResult.reactionTimeMs
                } as any);
            }
        });
    }, [getAdaptiveState, updateAdaptiveState, logTrial]);

    const runNextInStream = useCallback(() => {
        if (streamIndex.current >= trialStream.current.length) {
            processStreamResults();
            setGameState('finished');
            return;
        }

        const trial = trialStream.current[streamIndex.current];
        const handle = playNote(60, trial.timbre, 100);
        if (handle) {
            trial.onsetTs = handle.scheduledOnset;
        }
        
        streamIndex.current++;

    }, [playNote, processStreamResults]);

    const startNewSession = useCallback(() => {
        resumeContext();
        const info = getLatencyInfo();
        setDeviceInfo(info);
        
        const sessionState = startSession(adaptiveState);
        updateAdaptiveState(GAME_ID, 'music', sessionState);
        
        sessionId.current = crypto.randomUUID();
        streamIndex.current = 0;
        trialStream.current = generateStream();

        setGameState('playing');
    }, [resumeContext, getLatencyInfo, adaptiveState, updateAdaptiveState, generateStream]);

    useEffect(() => {
        if (gameState === 'playing') {
            const levelParams = policy.levelMap[adaptiveState.currentLevel]?.content_config['music']?.params;
            const isi = levelParams?.tempo_bpm ? (60000 / levelParams.tempo_bpm) : 500;
            trialTimer.current = setInterval(runNextInStream, isi);
        } else if (trialTimer.current) {
            clearInterval(trialTimer.current);
        }
        return () => { if (trialTimer.current) clearInterval(trialTimer.current); };
    }, [gameState, adaptiveState, runNextInStream]);
    
    const handlePress = () => {
        if (gameState !== 'playing' || streamIndex.current === 0) return;
        
        const responseTs = getAudioContextTime();
        const trialIndex = streamIndex.current - 1;
        const currentTrial = trialStream.current[trialIndex];
        
        if (currentTrial.responded) return; // Prevent multiple responses for one stimulus
        currentTrial.responded = true;
        
        const rtMs = (responseTs - currentTrial.onsetTs) * 1000;
        let correct = false;
        let responseType: "hit" | "false_alarm" = 'false_alarm';

        if (currentTrial.type === 'oddball') {
            correct = true;
            responseType = 'hit';
            setLastTrialResult({ type: 'HIT', rt: Math.round(rtMs) });
        } else {
            correct = false;
            responseType = 'false_alarm';
            setLastTrialResult({ type: 'FALSE ALARM' });
        }
        
        const trialResult: TrialResult = { correct, reactionTimeMs: rtMs, telemetry: {} };
        const newState = adjustDifficulty(trialResult, getAdaptiveState(GAME_ID, 'music'), policy);
        updateAdaptiveState(GAME_ID, 'music', newState);

        const levelParams = policy.levelMap[newState.currentLevel]?.content_config['music']?.params;
        logTrial({
            sessionId: sessionId.current!,
            gameId: GAME_ID,
            trialIndex: currentTrial.position,
            condition: currentTrial.type,
            stimulusParams: {
                standard_timbre: levelParams?.timbre_pair[0],
                oddball_timbre: levelParams?.timbre_pair[1],
                timbre_similarity_level: 0,
                tempo_bpm: levelParams?.tempo_bpm,
                position_in_stream: currentTrial.position,
            },
            stimulusOnsetTs: currentTrial.onsetTs,
            responseTs,
            rtMs,
            correct,
            responseType,
            difficultyLevel: adaptiveState.currentLevel,
            deviceInfo,
            meta: {},
        } as any);

        setTimeout(() => setLastTrialResult(null), 1000);
    };

     useEffect(() => {
        if(isAudioReady && gameState === 'loading') {
            setGameState('tutorial');
        }
    }, [isAudioReady, gameState]);

    const renderContent = () => {
        if (gameState === 'loading' && !isAudioReady) {
            return <Button onClick={resumeContext} size="lg">Tap to Enable Audio</Button>
        }
        if (gameState === 'tutorial') {
             return (
                <div className="text-center space-y-4">
                    <h3 className="text-xl font-semibold">Tutorial</h3>
                    <p className="text-muted-foreground">Listen to the stream of sounds. Press the button as fast as you can ONLY when you hear the "odd" sound.</p>
                    <Button onClick={startNewSession}>Start Scored Session</Button>
                </div>
            )
        }
        if (gameState === 'finished') {
             return <div className="text-center space-y-4">
                 <h3 className="text-2xl font-bold">Session Complete</h3>
                 <p>Your performance has been logged.</p>
                 <Button onClick={startNewSession} size="lg">Play Again</Button>
             </div>
        }
        
        return (
            <div className="flex flex-col items-center gap-6 w-full">
                <div className="w-full flex justify-between font-mono text-orange-200">
                    <span>Trial: {streamIndex.current} / 30</span>
                </div>
                <div className="w-48 h-48 bg-orange-900/50 rounded-full flex items-center justify-center">
                    <Ear className="w-24 h-24 text-orange-400" />
                </div>
                <Button onPointerDown={handlePress} className="w-48 h-48 rounded-full text-3xl bg-orange-600 hover:bg-orange-500 active:bg-orange-700">PRESS</Button>
                <div className="h-8 text-xl font-bold">
                    {lastTrialResult && (
                        <p className={cn(lastTrialResult.type === 'HIT' ? 'text-green-400' : 'text-red-400')}>
                            {lastTrialResult.type} {lastTrialResult.rt ? `${lastTrialResult.rt}ms` : ''}
                        </p>
                    )}
                </div>
            </div>
        )
    };

    return (
        <Card className="w-full max-w-md text-center bg-orange-950 border-orange-500/20 text-orange-100">
            <CardHeader>
                <CardTitle className="text-orange-300 flex items-center justify-center gap-2">
                    <span className="p-2 bg-orange-500/10 rounded-md"><domainIcons.Gs className="w-6 h-6 text-orange-400" /></span>
                    Auditory Oddball
                </CardTitle>
                <CardDescription className="text-orange-300/70">Press the button immediately when you hear the "odd" sound. <br/><Headphones className="inline-block mr-1 mt-2"/>Wired headphones recommended.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6 min-h-[500px] justify-center">
                {renderContent()}
            </CardContent>
        </Card>
    );
}
