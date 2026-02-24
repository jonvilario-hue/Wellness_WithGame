
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

const GAME_ID: GameId = 'ga_auditory_lab';
const policy = difficultyPolicies[GAME_ID];

type Trial = {
    target_freq_hz: number;
    flanker_freq_hz: number;
    options: number[];
};

export function AuditoryFlanker() {
    const { getAdaptiveState, updateAdaptiveState, logTrial } = usePerformanceStore();
    const { playFlanker, resumeContext, isAudioReady, audioContext } = useAudioEngine();

    const [gameState, setGameState] = useState<'loading' | 'start' | 'running' | 'feedback' | 'finished'>('loading');
    const [trial, setTrial] = useState<Trial | null>(null);
    const [feedback, setFeedback] = useState('');

    const trialCount = useRef(0);
    const sessionTrials = useRef<TrialResult[]>([]);
    const trialStartTime = useRef(0);
    
    const startNewTrial = useCallback(() => {
        if (!audioContext) return;
        if (trialCount.current >= 20) {
            setGameState('finished');
            return;
        }

        const state = getAdaptiveState(GAME_ID, 'music');
        const levelParams = policy.levelMap[state.currentLevel]?.content_config['music']?.params || policy.levelMap[1].content_config['music']!.params;

        const target_freq_hz = 440;
        const flanker_freq_hz = target_freq_hz * Math.pow(2, levelParams.flanker_detune_cents / 1200);
        
        trialStartTime.current = audioContext.currentTime;
        playFlanker(target_freq_hz, flanker_freq_hz, 1000);
        
        const options = [target_freq_hz, flanker_freq_hz].sort(() => Math.random() - 0.5);

        setTrial({ target_freq_hz, flanker_freq_hz, options });
        trialCount.current++;
        setGameState('running');
    }, [getAdaptiveState, playFlanker, audioContext]);

    const startNewSession = useCallback(() => {
        resumeContext();
        const sessionState = startSession(getAdaptiveState(GAME_ID, 'music'));
        updateAdaptiveState(GAME_ID, 'music', sessionState);
        trialCount.current = 0;
        sessionTrials.current = [];
        startNewTrial();
    }, [resumeContext, getAdaptiveState, updateAdaptiveState, startNewTrial]);

    const handleResponse = (response: number) => {
        if (!trial || !audioContext) return;
        const reactionTimeMs = (audioContext.currentTime - trialStartTime.current) * 1000;
        const isCorrect = response === trial.target_freq_hz;
        
        const state = getAdaptiveState(GAME_ID, 'music');
        const trialResult: TrialResult = { 
            correct: isCorrect, 
            reactionTimeMs, 
            telemetry: {
                trialType: 'flanker',
                targetFreq: trial.target_freq_hz,
                flankerFreq: trial.flanker_freq_hz,
                detuneCents: policy.levelMap[state.currentLevel]?.content_config['music']?.params.flanker_detune_cents,
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

        setFeedback(isCorrect ? 'Correct!' : 'Incorrect.');
        setGameState('feedback');
        setTimeout(startNewTrial, 1500);
    };
    
    useEffect(() => {
        if(isAudioReady) setGameState('start');
    }, [isAudioReady]);

    const renderContent = () => {
        if (gameState === 'loading' || (gameState === 'start' && !isAudioReady)) {
            return <Button onClick={resumeContext} size="lg">Tap to Enable Audio</Button>
        }
        if (gameState === 'start') {
            return <Button onClick={startNewSession} size="lg">Start Auditory Flanker</Button>
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
                        <p className="font-bold text-2xl">Identify the PITCH of the CENTER tone.</p>
                     </div>
                     <div className="h-10 text-xl font-bold">
                         {gameState === 'feedback' && <p className={cn(feedback === 'Correct!' ? 'text-green-400' : 'text-red-400')}>{feedback}</p>}
                     </div>
                     <div className="flex gap-4">
                        {trial?.options.map((option, index) => (
                             <Button key={option} onClick={() => handleResponse(option)} size="lg" className="w-48 h-16" disabled={gameState === 'feedback'}>
                                 Tone {index + 1}
                             </Button>
                        ))}
                    </div>
                </div>
            )
        }
    }

    return (
        <Card className="w-full max-w-md text-center bg-violet-950 border-violet-500/20 text-violet-100">
            <CardHeader>
                <CardTitle className="text-violet-300 flex items-center justify-center gap-2">
                    <span className="p-2 bg-violet-500/10 rounded-md"><Ear className="w-6 h-6 text-violet-400" /></span>
                    Auditory Flanker
                </CardTitle>
                <CardDescription className="text-violet-300/70">Focus on the center tone and ignore the distracting flanker sounds. Wired headphones recommended.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6 min-h-[250px] justify-center">
                {renderContent()}
            </CardContent>
        </Card>
    )
}
