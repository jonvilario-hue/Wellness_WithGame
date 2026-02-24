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

const GAME_ID: GameId = 'ef_focus_switch';
const policy = difficultyPolicies[GAME_ID];

type Trial = {
    word: 'High' | 'Low';
    pitch: 'High' | 'Low';
    isCongruent: boolean;
};

export function AuditoryStroop() {
    const { getAdaptiveState, updateAdaptiveState, logTrial } = usePerformanceStore();
    const { scheduleTone, resumeContext, isAudioReady, getAudioContextTime, getLatencyInfo } = useAudioEngine();

    const [gameState, setGameState] = useState<'loading' | 'start' | 'running' | 'feedback' | 'finished'>('loading');
    const [trial, setTrial] = useState<Trial | null>(null);
    const [feedback, setFeedback] = useState('');
    const [sessionTrials, setSessionTrials] = useState<TrialResult[]>([]);
    
    const trialCount = useRef(0);
    const stimulusOnsetTs = useRef(0);
    const sessionId = useRef<string | null>(null);
    const deviceInfo = useRef<any>(null);
    
    const startNewTrial = useCallback(() => {
        if (trialCount.current >= policy.sessionLength) {
            setGameState('finished');
            return;
        }

        const state = getAdaptiveState(GAME_ID, 'music');
        const levelParams = policy.levelMap[state.currentLevel]?.content_config['music']?.params || policy.levelMap[1].content_config['music']!;

        const isCongruent = Math.random() > levelParams.incongruent_ratio;
        const word = Math.random() > 0.5 ? 'High' : 'Low';
        let pitch: 'High' | 'Low';

        if (isCongruent) {
            pitch = word;
        } else {
            pitch = word === 'High' ? 'Low' : 'High';
        }
        
        setTrial({ word, pitch, isCongruent });
        const freq = pitch === 'High' ? levelParams.high_pitch_hz : levelParams.low_pitch_hz;
        
        const now = getAudioContextTime();
        const handle = scheduleTone(freq, now + 0.1, 0.5);
        if (handle) {
            stimulusOnsetTs.current = handle.scheduledOnset;
        }

        trialCount.current++;
        setGameState('running');
    }, [getAdaptiveState, scheduleTone, getAudioContextTime]);

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
        setSessionTrials([]);
        sessionId.current = crypto.randomUUID();
        startNewTrial();
    }, [resumeContext, getLatencyInfo, getAdaptiveState, updateAdaptiveState, startNewTrial]);

    const handleResponse = (response: 'High' | 'Low') => {
        if (!trial) return;
        const responseTs = getAudioContextTime();
        const reactionTimeMs = (responseTs - stimulusOnsetTs.current) * 1000;
        const isCorrect = response === trial.pitch;
        
        const state = getAdaptiveState(GAME_ID, 'music');
        const trialResult: TrialResult = { 
            correct: isCorrect, 
            reactionTimeMs, 
        };
        setSessionTrials(prev => [...prev, trialResult]);

        logTrial({
            sessionId: sessionId.current!,
            gameId: GAME_ID,
            trialIndex: trialCount.current,
            difficultyLevel: state.currentLevel,
            condition: trial.isCongruent ? 'congruent' : 'incongruent',
            stimulusOnsetTs: stimulusOnsetTs.current,
            responseTs,
            rtMs: reactionTimeMs,
            correct: isCorrect,
            responseType: isCorrect ? 'hit' : 'error',
            deviceInfo: deviceInfo.current,
            meta: {
                displayed_word: trial.word,
                tone_pitch_hz: trial.pitch === 'High' ? policy.levelMap[state.currentLevel].content_config.music!.params!.high_pitch_hz : policy.levelMap[state.currentLevel].content_config.music!.params!.low_pitch_hz,
                correct_response: trial.pitch,
                player_response: response,
            }
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
            return <Button onClick={resumeContext} size="lg">Tap to Enable Audio</Button>
        }
        if (gameState === 'start') {
            return (
                <div className="text-center space-y-4">
                    <p>You will see a word and hear a tone. Identify the PITCH of the tone, ignoring the word.</p>
                    <Button onClick={startNewSession} size="lg">Start Auditory Stroop</Button>
                </div>
            )
        }
        if (gameState === 'finished') {
            const accuracy = sessionTrials.filter(t => t.correct).length / sessionTrials.length;
            return (
                <div className="text-center">
                    <CardTitle>Session Complete</CardTitle>
                    <p className="mt-2">Accuracy: {(accuracy * 100).toFixed(1)}%</p>
                    <Button onClick={startNewSession} className="mt-4">Play Again</Button>
                </div>
            )
        }
        if (gameState === 'running' || gameState === 'feedback') {
            return (
                <div className="flex flex-col items-center gap-8">
                     <div className="text-center">
                        <p className="font-bold text-2xl">Identify the PITCH of the tone.</p>
                     </div>
                     <div className="h-10 text-6xl font-bold text-rose-300">
                         {trial?.word}
                     </div>
                     <div className="h-10 text-xl font-bold">
                         {gameState === 'feedback' && <p className={cn(feedback === 'Correct!' ? 'text-green-400' : 'text-red-400')}>{feedback}</p>}
                     </div>
                     <div className="flex gap-4">
                        <Button onClick={() => handleResponse('Low')} size="lg" className="w-32 h-16" disabled={gameState === 'feedback'}>Low</Button>
                        <Button onClick={() => handleResponse('High')} size="lg" className="w-32 h-16" disabled={gameState === 'feedback'}>High</Button>
                    </div>
                </div>
            )
        }
    }

    return (
        <Card className="w-full max-w-md text-center bg-rose-950 border-rose-500/20 text-rose-100">
            <CardHeader>
                <CardTitle className="text-rose-300 flex items-center justify-center gap-2">
                    <span className="p-2 bg-rose-500/10 rounded-md"><domainIcons.EF className="w-6 h-6 text-rose-400" /></span>
                    Auditory Stroop
                </CardTitle>
                <CardDescription className="text-rose-300/70">Ignore the word, classify the pitch. A test of auditory inhibition. Wired headphones recommended.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6 min-h-[300px] justify-center">
                {renderContent()}
            </CardContent>
        </Card>
    )
}
