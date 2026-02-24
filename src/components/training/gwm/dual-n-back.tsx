
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef, useCallback } from "react";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { useAudioEngine } from "@/hooks/use-audio-engine";
import { Loader2, Music, Waves } from "lucide-react";
import { adjustDifficulty, startSession } from "@/lib/adaptive-engine";
import { difficultyPolicies } from "@/data/difficulty-policies";
import type { AdaptiveState, TrialResult, GameId } from "@/types";
import { domainIcons } from "@/components/icons";

const GAME_ID: GameId = 'gwm_dynamic_sequence';
const policy = difficultyPolicies[GAME_ID];

type Trial = {
    pitch: number;
    timbre: string;
};

export function DualNBack() {
    const { getAdaptiveState, updateAdaptiveState, logTrial } = usePerformanceStore();
    const { playNote, resumeContext, isAudioReady } = useAudioEngine();

    const [gameState, setGameState] = useState<'loading' | 'start' | 'running' | 'finished'>('loading');
    const [history, setHistory] = useState<Trial[]>([]);
    const [nBack, setNBack] = useState(2);

    const trialTimer = useRef<NodeJS.Timeout | null>(null);
    const trialCount = useRef(0);
    const sessionTrials = useRef<TrialResult[]>([]);

    const startNewTrial = useCallback(() => {
        if (trialCount.current >= 20) {
            setGameState('finished');
            return;
        }

        const state = getAdaptiveState(GAME_ID, 'music');
        const levelParams = policy.levelMap[state.currentLevel]?.content_config['music']?.params || policy.levelMap[1].content_config['music']!.params;
        const { pitch_palette, timbre_palette } = levelParams;
        setNBack(levelParams.n_back);

        const newTrial: Trial = {
            pitch: pitch_palette[Math.floor(Math.random() * pitch_palette.length)],
            timbre: timbre_palette[Math.floor(Math.random() * timbre_palette.length)],
        };

        playNote(newTrial.pitch, newTrial.timbre, 300);
        setHistory(prev => [...prev, newTrial].slice(-nBack -1));
        trialCount.current++;
    }, [playNote, getAdaptiveState, nBack]);

    const startNewSession = useCallback(() => {
        resumeContext();
        const sessionState = startSession(getAdaptiveState(GAME_ID, 'music'));
        updateAdaptiveState(GAME_ID, 'music', sessionState);
        trialCount.current = 0;
        sessionTrials.current = [];
        setHistory([]);
        setGameState('running');
    }, [resumeContext, getAdaptiveState, updateAdaptiveState]);

    useEffect(() => {
        if (gameState === 'running') {
            trialTimer.current = setInterval(startNewTrial, 2000);
        } else {
            if (trialTimer.current) clearInterval(trialTimer.current);
        }
        return () => {
            if (trialTimer.current) clearInterval(trialTimer.current);
        };
    }, [gameState, startNewTrial]);

    useEffect(() => {
        if(isAudioReady) setGameState('start');
    }, [isAudioReady]);

    const handleResponse = (matchType: 'pitch' | 'timbre') => {
        if (history.length < nBack) return;

        const currentTrial = history[history.length - 1];
        const nBackTrial = history[history.length - 1 - nBack];
        
        let isCorrect = false;
        if (matchType === 'pitch') {
            isCorrect = currentTrial.pitch === nBackTrial.pitch;
        } else {
            isCorrect = currentTrial.timbre === nBackTrial.timbre;
        }

        const state = getAdaptiveState(GAME_ID, 'music');
        const trialResult: TrialResult = { correct: isCorrect, reactionTimeMs: 500, telemetry: {} };
        sessionTrials.current.push(trialResult);
        logTrial({
            module_id: GAME_ID,
            mode: 'music',
            levelPlayed: state.currentLevel,
            isCorrect,
            responseTime_ms: 500,
            meta: { matchType, nBack }
        });
        const newState = adjustDifficulty(trialResult, state, policy);
        updateAdaptiveState(GAME_ID, 'music', newState);
    };
    
    if (gameState === 'loading' || (gameState === 'start' && !isAudioReady)) {
        return (
            <Card className="w-full max-w-md text-center bg-cyan-950 border-cyan-500/20 text-cyan-100">
                <CardHeader>
                    <CardTitle className="text-cyan-300 flex items-center justify-center gap-2">
                        <span className="p-2 bg-cyan-500/10 rounded-md"><domainIcons.Gwm className="w-6 h-6 text-cyan-400" /></span>
                        Dual N-Back
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Button onClick={resumeContext} size="lg" className="bg-cyan-600 hover:bg-cyan-500 text-white">Tap to Enable Audio</Button>
                </CardContent>
            </Card>
        )
    }

    if (gameState === 'finished') {
        return (
             <Card className="w-full max-w-md text-center bg-cyan-950 border-cyan-500/20 text-cyan-100 p-8">
                 <CardTitle>Session Complete</CardTitle>
                 <Button onClick={startNewSession} className="mt-4">Play Again</Button>
             </Card>
        )
    }

    return (
        <Card className="w-full max-w-md text-center bg-cyan-950 border-cyan-500/20 text-cyan-100">
            <CardHeader>
                <CardTitle className="text-cyan-300 flex items-center justify-center gap-2">
                    <span className="p-2 bg-cyan-500/10 rounded-md"><domainIcons.Gwm className="w-6 h-6 text-cyan-400" /></span>
                    Dual N-Back
                </CardTitle>
                <CardDescription className="text-cyan-300/70">Press 'Pitch' if the note's pitch matches the one {nBack} steps back. Press 'Timbre' if the instrument sound matches.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6 min-h-[250px] justify-center">
                {gameState === 'start' ? (
                     <Button onClick={startNewSession} size="lg" className="bg-cyan-600 hover:bg-cyan-500 text-white">Start</Button>
                ) : (
                    <>
                        <div className="w-32 h-32 bg-cyan-900/50 rounded-full flex items-center justify-center">
                            <Waves className="w-16 h-16 text-cyan-400 animate-pulse" />
                        </div>
                        <div className="flex gap-4">
                            <Button onClick={() => handleResponse('pitch')} size="lg" className="w-32 h-16">Pitch Match</Button>
                            <Button onClick={() => handleResponse('timbre')} size="lg" className="w-32 h-16">Timbre Match</Button>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
