'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef, useCallback } from "react";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { useAudioEngine } from "@/hooks/use-audio-engine";
import { Loader2, Ear, Headphones } from "lucide-react";
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
    condition: 'congruent' | 'incongruent';
};

export function AuditoryFlanker() {
    const { getAdaptiveState, updateAdaptiveState, logTrial } = usePerformanceStore();
    const { playFlanker, resumeContext, isAudioReady, getAudioContextTime, getLatencyInfo } = useAudioEngine();

    const [gameState, setGameState] = useState<'loading' | 'start' | 'running' | 'feedback' | 'finished'>('loading');
    const [trial, setTrial] = useState<Trial | null>(null);
    const [feedback, setFeedback] = useState('');
    
    const trialCount = useRef(0);
    const sessionTrials = useRef<TrialResult[]>([]);
    const stimulusOnsetTs = useRef(0);
    const sessionId = useRef(crypto.randomUUID());
    const deviceInfo = useRef<any>(null);
    
    const startNewTrial = useCallback(() => {
        if (!isAudioReady) return;
        if (trialCount.current >= policy.sessionLength) {
            setGameState('finished');
            return;
        }

        const state = getAdaptiveState(GAME_ID, 'music');
        const levelParams = policy.levelMap[state.currentLevel]?.content_config['music']?.params || policy.levelMap[1].content_config['music']!;

        const isCongruent = Math.random() > levelParams.incongruent_ratio;
        const condition = isCongruent ? 'congruent' : 'incongruent';
        
        const target_freq_hz = Math.random() > 0.5 ? 440 : 880; // A4 or A5
        const flanker_freq_hz = isCongruent ? target_freq_hz : (target_freq_hz === 440 ? 440 * Math.pow(2, levelParams.flanker_detune_cents / 1200) : 880 / Math.pow(2, levelParams.flanker_detune_cents / 1200));
        
        const handles = playFlanker(target_freq_hz, flanker_freq_hz, 1000, levelParams.flanker_gain_relative);
        if (handles.length > 0) {
            stimulusOnsetTs.current = handles[0].scheduledOnset;
        }
        
        const options = [target_freq_hz, flanker_freq_hz].sort(() => Math.random() - 0.5);

        setTrial({ target_freq_hz, flanker_freq_hz, options, condition });
        trialCount.current++;
        setFeedback('');
        setGameState('running');
    }, [getAdaptiveState, playFlanker, isAudioReady]);

    const startNewSession = useCallback(() => {
        resumeContext();
        const info = getLatencyInfo();
        deviceInfo.current = {
            browser: navigator.userAgent,
            sampleRate: info.sampleRate,
            baseLatency: info.baseLatency,
            outputLatency: info.outputLatency,
        };
        const sessionState = startSession(getAdaptiveState(GAME_ID, 'music'));
        updateAdaptiveState(GAME_ID, 'music', sessionState);
        trialCount.current = 0;
        sessionTrials.current = [];
        sessionId.current = crypto.randomUUID();
        startNewTrial();
    }, [resumeContext, getLatencyInfo, getAdaptiveState, updateAdaptiveState, startNewTrial]);

    const handleResponse = (responseFreq: number) => {
        if (!trial || !isAudioReady) return;
        
        const responseTs = getAudioContextTime();
        const reactionTimeMs = (responseTs - stimulusOnsetTs.current) * 1000;
        const isCorrect = responseFreq === trial.target_freq_hz;
        
        const state = getAdaptiveState(GAME_ID, 'music');
        const levelParams = policy.levelMap[state.currentLevel]?.content_config['music']?.params;
        const spectral_distance_hz = Math.abs(trial.target_freq_hz - trial.flanker_freq_hz);

        const trialResult: TrialResult = { 
            correct: isCorrect, 
            reactionTimeMs,
            stimulusOnsetTs: stimulusOnsetTs.current,
            responseTs: responseTs,
            telemetry: {
                condition: trial.condition,
                target_freq_hz: trial.target_freq_hz,
                flanker_freq_hz: trial.flanker_freq_hz,
                spectral_distance_hz,
                flanker_snr_db: -20 * Math.log10(levelParams.flanker_gain_relative), // Approximate SNR
                panning_config: { target: 0, flankers: [-1, 1] },
            } 
        };

        sessionTrials.current.push(trialResult);

        logTrial({
            sessionId: sessionId.current,
            gameId: GAME_ID,
            difficultyLevel: state.currentLevel,
            trialIndex: trialCount.current,
            responseType: isCorrect ? 'hit' : 'error',
            ...trialResult,
        } as any);

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
            return (
                <div className="text-center space-y-4">
                     <p className="text-muted-foreground font-semibold flex items-center gap-2"><Headphones/>Wired headphones are required for this task.</p>
                     <Button onClick={startNewSession} size="lg">Tap to Start</Button>
                </div>
            )
        }
        if (gameState === 'start') {
            return (
                 <div className="text-center space-y-4">
                     <p className="text-muted-foreground font-semibold flex items-center gap-2"><Headphones/>Wired headphones are required for this task.</p>
                     <Button onClick={startNewSession} size="lg">Start Auditory Flanker</Button>
                </div>
            )
        }
        if (gameState === 'finished') {
            const accuracy = sessionTrials.current.filter(t => t.correct).length / sessionTrials.current.length;
            return (
                <div className="text-center">
                    <CardTitle>Session Complete</CardTitle>
                     <p className="mt-2 text-lg">Accuracy: {(accuracy * 100).toFixed(1)}%</p>
                    <Button onClick={startNewSession} className="mt-4">Play Again</Button>
                </div>
            )
        }
        if (gameState === 'running' || gameState === 'feedback') {
            return (
                <div className="flex flex-col items-center gap-8 w-full">
                     <div className="text-center">
                        <p className="font-bold text-2xl">Which tone did you hear in the CENTER?</p>
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
                <CardDescription className="text-violet-300/70">Focus on the center tone and identify its pitch, ignoring the distracting flanker sounds.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6 min-h-[300px] justify-center">
                {renderContent()}
            </CardContent>
        </Card>
    );
}
