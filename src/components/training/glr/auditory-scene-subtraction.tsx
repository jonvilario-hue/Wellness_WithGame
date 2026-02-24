
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef, useCallback } from "react";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { useAudioEngine } from "@/hooks/use-audio-engine";
import { Loader2, Ear } from "lucide-react";
import { adjustDifficulty, startSession } from "@/lib/adaptive-engine";
import { difficultyPolicies } from "@/data/difficulty-policies";
import type { AdaptiveState, TrialResult, GameId } from "@/types";
import { domainIcons } from "@/components/icons";
import { cn } from "@/lib/utils";

const GAME_ID: GameId = 'ga_auditory_lab'; // This is a Ga task
const policy = difficultyPolicies[GAME_ID];

type Trial = {
    reference_scene_instruments: string[];
    comparison_scene_instruments: string[];
    correct_answer: string;
};

export function AuditorySceneSubtraction() {
    const { getAdaptiveState, updateAdaptiveState, logTrial } = usePerformanceStore();
    const { playSimultaneous, stopAll, resumeContext, isAudioReady, audioContext } = useAudioEngine();

    const [gameState, setGameState] = useState<'loading' | 'start' | 'running' | 'feedback' | 'finished'>('loading');
    const [trial, setTrial] = useState<Trial | null>(null);
    const [feedback, setFeedback] = useState('');

    const trialCount = useRef(0);
    const sessionTrials = useRef<TrialResult[]>([]);
    const trialStartTime = useRef(0);
    
    const startNewTrial = useCallback(() => {
        if (trialCount.current >= 10) {
            setGameState('finished');
            return;
        }

        const state = getAdaptiveState(GAME_ID, 'music');
        const levelParams = policy.levelMap[state.currentLevel]?.content_config['music']?.params || policy.levelMap[1].content_config['music']!.params;
        const { layer_count } = levelParams;
        
        const instruments = ['drums', 'bass', 'piano', 'flute', 'guitar'];
        const reference_scene_instruments = instruments.slice(0, layer_count);
        const missing_instrument_index = Math.floor(Math.random() * layer_count);
        const correct_answer = reference_scene_instruments[missing_instrument_index];
        const comparison_scene_instruments = reference_scene_instruments.filter((_, i) => i !== missing_instrument_index);

        setTrial({ reference_scene_instruments, comparison_scene_instruments, correct_answer });
        
        if (audioContext) {
            playSimultaneous(reference_scene_instruments, 3000);
            trialStartTime.current = audioContext.currentTime + 3.5; // Start time is when comparison plays
            setTimeout(() => {
                stopAll();
                setTimeout(() => {
                    playSimultaneous(comparison_scene_instruments, 3000);
                }, 500)
            }, 3000);
        }

        trialCount.current++;
        setGameState('running');
    }, [getAdaptiveState, playSimultaneous, stopAll, audioContext]);

    const startNewSession = useCallback(() => {
        resumeContext();
        const sessionState = startSession(getAdaptiveState(GAME_ID, 'music'));
        updateAdaptiveState(GAME_ID, 'music', sessionState);
        trialCount.current = 0;
        sessionTrials.current = [];
        startNewTrial();
    }, [resumeContext, getAdaptiveState, updateAdaptiveState, startNewTrial]);

    const handleResponse = (response: string) => {
        if (!trial || !audioContext) return;
        stopAll();
        const reactionTimeMs = (audioContext.currentTime - trialStartTime.current) * 1000;
        const isCorrect = response === trial.correct_answer;
        
        const state = getAdaptiveState(GAME_ID, 'music');
        const trialResult: TrialResult = { 
            correct: isCorrect, 
            reactionTimeMs, 
            telemetry: {
                trialType: 'scene_subtraction',
                layer_count: trial.reference_scene_instruments.length,
                correctAnswer: trial.correct_answer,
                userResponse: response,
            }
        };
        sessionTrials.current.push(trialResult);
        logTrial({
            module_id: GAME_ID,
            mode: 'music',
            levelPlayed: state.currentLevel,
            isCorrect,
            responseTime_ms: reactionTimeMs,
            meta: trialResult.telemetry
        });
        const newState = adjustDifficulty(trialResult, state, policy);
        updateAdaptiveState(GAME_ID, 'music', newState);

        setFeedback(isCorrect ? 'Correct!' : `Incorrect. The missing instrument was ${trial.correct_answer}.`);
        setGameState('feedback');
        setTimeout(startNewTrial, 2000);
    };
    
    useEffect(() => {
        if(isAudioReady) setGameState('start');
    }, [isAudioReady]);

    const renderContent = () => {
        if (gameState === 'loading' || (gameState === 'start' && !isAudioReady)) {
            return <Button onClick={resumeContext} size="lg">Tap to Enable Audio</Button>
        }
        if (gameState === 'start') {
            return <Button onClick={startNewSession} size="lg">Start Auditory Scene Subtraction</Button>
        }
        if (gameState === 'finished') {
            return (
                <div className="text-center">
                    <CardTitle>Session Complete</CardTitle>
                    <Button onClick={startNewSession} className="mt-4">Play Again</Button>
                </div>
            )
        }
        if (gameState === 'running' || gameState === 'feedback') {
            return (
                <div className="flex flex-col items-center gap-8">
                     <div className="text-center">
                        <p className="font-bold text-2xl">Which instrument is missing from the second mix?</p>
                     </div>
                     <div className="h-10 text-xl font-bold">
                         {gameState === 'feedback' && <p className={cn(feedback === 'Correct!' ? 'text-green-400' : 'text-red-400')}>{feedback}</p>}
                     </div>
                     <div className="flex flex-wrap gap-4 justify-center">
                        {trial?.reference_scene_instruments.map(instrument => (
                             <Button key={instrument} onClick={() => handleResponse(instrument)} size="lg" className="w-32 h-16" disabled={gameState === 'feedback'}>
                                 {instrument.charAt(0).toUpperCase() + instrument.slice(1)}
                             </Button>
                        ))}
                    </div>
                </div>
            )
        }
    }

    return (
        <Card className="w-full max-w-lg text-center bg-emerald-950 border-emerald-500/20 text-emerald-100">
            <CardHeader>
                <CardTitle className="text-emerald-300 flex items-center justify-center gap-2">
                    <span className="p-2 bg-emerald-500/10 rounded-md"><Ear className="w-6 h-6 text-emerald-400" /></span>
                    Auditory Scene Subtraction
                </CardTitle>
                <CardDescription className="text-emerald-300/70">Listen to the full mix, then identify which instrument is removed. Wired headphones recommended.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6 min-h-[250px] justify-center">
                {renderContent()}
            </CardContent>
        </Card>
    )
}
