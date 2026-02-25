
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef, useCallback } from "react";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import { Loader2, Brain, Share2 } from "lucide-react";
import { adjustDifficulty, startSession } from "@/lib/adaptive-engine";
import { difficultyPolicies } from "@/data/difficulty-policies";
import type { TrialResult, GameId } from "@/types";
import { domainIcons } from "@/components/icons";
import { PRNG } from '@/lib/rng';
import { logicTokenPools, confusablePairs, audioTokenGateMap } from "@/data/logic-content";

const GAME_ID: GameId = 'gwm_dynamic_sequence';
const policy = difficultyPolicies[GAME_ID];

type Token = string;
type Trial = {
    visual: Token;
    audio?: string;
    isVisualMatch: boolean;
    isAudioMatch: boolean;
};

export function TokenNBack() {
    const { getAdaptiveState, updateAdaptiveState, logEvent } = usePerformanceStore();
    const { engine } = useAudioEngine();

    const [gameState, setGameState] = useState<'loading' | 'start' | 'playing' | 'finished'>('loading');
    const [history, setHistory] = useState<Trial[]>([]);
    const [feedback, setFeedback] = useState<{ type: 'visual' | 'audio', correct: boolean } | null>(null);
    
    const trialTimer = useRef<NodeJS.Timeout | null>(null);
    const trialCount = useRef(0);
    const sessionTrials = useRef<TrialResult[]>([]);
    const stimulusOnsetTs = useRef(0);
    const responseTracker = useRef<{ visual: boolean, audio: boolean }>({ visual: false, audio: false });
    const sessionId = useRef(crypto.randomUUID());
    const prngRef = useRef<PRNG>(new PRNG(sessionId.current));

    const adaptiveState = getAdaptiveState(GAME_ID, 'logic');

    const generateStream = useCallback(() => {
        const params = policy.levelMap[adaptiveState.currentLevel]?.content_config['logic']?.params;
        if (!params) return [];

        const { n_back, pool, mode, lures } = params;
        const tokenPool = logicTokenPools[pool as keyof typeof logicTokenPools];
        const audioPool = Object.keys(audioTokenGateMap);
        const stream: Trial[] = [];
        
        const targetMatchCount = Math.floor(30 * 0.3);
        let visualMatches = 0;
        let audioMatches = 0;

        for (let i = 0; i < 30; i++) {
            let visual: Token;
            let audio: string | undefined = undefined;
            let isVisualMatch = false;
            let isAudioMatch = false;

            const nBackTrial = history.length >= n_back ? history[history.length - n_back] : null;

            // Visual Token
            if (nBackTrial && visualMatches < targetMatchCount && Math.random() < 0.3) {
                visual = nBackTrial.visual;
                isVisualMatch = true;
                visualMatches++;
            } else if (lures && nBackTrial && Math.random() < 0.1) {
                const confusable = confusablePairs[nBackTrial.visual] || Object.keys(confusablePairs).find(k => confusablePairs[k] === nBackTrial.visual);
                visual = confusable ? (confusablePairs[nBackTrial.visual] ? confusable : Object.keys(confusablePairs).find(k => confusablePairs[k] === nBackTrial.visual)!) : prngRef.current.shuffle(tokenPool.filter(t => t !== nBackTrial.visual))[0];
            } else {
                visual = prngRef.current.shuffle(tokenPool.filter(t => t !== nBackTrial?.visual))[0];
            }

            // Audio Token (for dual mode)
            if (mode === 'dual') {
                if (nBackTrial?.audio && audioMatches < targetMatchCount && Math.random() < 0.3) {
                    audio = nBackTrial.audio;
                    isAudioMatch = true;
                    audioMatches++;
                } else {
                    audio = prngRef.current.shuffle(audioPool.filter(a => a !== nBackTrial?.audio))[0];
                }
            }
            stream.push({ visual, audio, isVisualMatch, isAudioMatch });
            setHistory(prev => [...prev, stream[stream.length - 1]]);
        }
        return stream;
    }, [adaptiveState, history]);
    
    const runTrial = useCallback(() => {
        if (!engine || history.length >= 30) {
            if(trialTimer.current) clearInterval(trialTimer.current);
            setGameState('finished');
            return;
        }

        const params = policy.levelMap[adaptiveState.currentLevel]?.content_config['logic']?.params;
        if (!params) return;
        
        const n_back = params.n_back;
        const tokenPool = logicTokenPools[params.pool as keyof typeof logicTokenPools];
        const audioPool = Object.keys(audioTokenGateMap);

        let newVisual: Token, newAudio: string | undefined;
        let isVisualMatch = false, isAudioMatch = false;
        
        const nBackTrial = history[history.length - n_back];
        
        // Visual
        if (history.length >= n_back && Math.random() < 0.3) {
            newVisual = nBackTrial.visual;
            isVisualMatch = true;
        } else {
            newVisual = prngRef.current.shuffle(tokenPool.filter(t => t !== nBackTrial?.visual))[0];
        }

        // Audio
        if (params.mode === 'dual') {
             if (history.length >= n_back && Math.random() < 0.3) {
                newAudio = nBackTrial.audio;
                isAudioMatch = true;
            } else {
                newAudio = prngRef.current.shuffle(audioPool.filter(a => a !== nBackTrial?.audio))[0];
            }
            const audioConfig = audioTokenGateMap[newAudio!];
            engine.playTone({ frequency: audioConfig.freq, type: audioConfig.type, duration: 0.3, volume: 0.4 });
        }
        
        const newTrial: Trial = { visual: newVisual, audio: newAudio, isVisualMatch, isAudioMatch };
        setHistory(prev => [...prev, newTrial]);
        
        stimulusOnsetTs.current = engine.getAudioContextTime();
        responseTracker.current = { visual: false, audio: false };
        setFeedback(null);
        trialCount.current++;
        
    }, [engine, history, adaptiveState, prngRef]);

    const startNewSession = useCallback(() => {
        engine?.resumeContext();
        prngRef.current = new PRNG(crypto.randomUUID());
        const sessionState = startSession(adaptiveState);
        updateAdaptiveState(GAME_ID, 'logic', sessionState);
        trialCount.current = 0;
        sessionTrials.current = [];
        setHistory([]);
        sessionId.current = crypto.randomUUID();
        setGameState('playing');
    }, [engine, adaptiveState, updateAdaptiveState]);

    useEffect(() => {
        if (gameState === 'playing') {
            runTrial(); // Initial trial
            const isi = policy.levelMap[adaptiveState.currentLevel]?.content_config['logic']?.params.token_duration || 2500;
            trialTimer.current = setInterval(runTrial, isi);
        }
        return () => {
            if (trialTimer.current) clearInterval(trialTimer.current);
        };
    }, [gameState, runTrial, adaptiveState]);

    const handleResponse = (matchType: 'visual' | 'audio') => {
        if (!engine || history.length === 0) return;
        
        const responseTs = engine.getAudioContextTime();
        const rtMs = (responseTs - stimulusOnsetTs.current) * 1000;
        const n_back = policy.levelMap[adaptiveState.currentLevel]?.content_config['logic']?.params.n_back || 1;

        if (history.length <= n_back) return;
        const currentTrial = history[history.length - 1];

        let correct = false;
        if (matchType === 'visual' && !responseTracker.current.visual) {
            responseTracker.current.visual = true;
            correct = currentTrial.isVisualMatch;
        } else if (matchType === 'audio' && !responseTracker.current.audio) {
            responseTracker.current.audio = true;
            correct = currentTrial.isAudioMatch;
        } else {
            return; // Already responded for this type
        }

        setFeedback({ type: matchType, correct });
        setTimeout(() => setFeedback(null), 800);

        const trialResult: TrialResult = { correct, reactionTimeMs: rtMs };
        sessionTrials.current.push(trialResult);
        const newState = adjustDifficulty(trialResult, getAdaptiveState(GAME_ID, 'logic'), policy);
        updateAdaptiveState(GAME_ID, 'logic', newState);
    };

    if (gameState === 'loading') return <Button onClick={() => setGameState('start')} size="lg">Start</Button>;
    if (gameState === 'start') return <Button onClick={startNewSession} size="lg">Start Token N-Back</Button>;
    if (gameState === 'finished') {
        const accuracy = sessionTrials.length > 0 ? sessionTrials.filter(t => t.correct).length / sessionTrials.length * 100 : 0;
        return <div className="text-center">
            <h3 className="text-2xl font-bold">Session Finished!</h3>
            <p className="text-lg">Accuracy: {accuracy.toFixed(1)}%</p>
            <Button onClick={startNewSession} className="mt-4">Play Again</Button>
        </div>;
    }

    const currentTrial = history[history.length - 1];
    const nLevel = policy.levelMap[adaptiveState.currentLevel]?.content_config['logic']?.params.n_back || 1;
    const isDual = policy.levelMap[adaptiveState.currentLevel]?.content_config['logic']?.params.mode === 'dual';

    return (
        <Card className="w-full max-w-md text-center bg-cyan-950 border-cyan-500/20 text-cyan-100">
            <CardHeader>
                <CardTitle className="text-cyan-300 flex items-center justify-center gap-2">
                    <Share2 /> Token N-Back
                </CardTitle>
                <CardDescription className="text-cyan-300/70">Does the token match the one from {nLevel} step(s) ago?</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6 min-h-[350px] justify-center">
                <div className="w-full flex justify-between font-mono text-cyan-200">
                    <span>Trial: {trialCount.current} / 30</span>
                    <span>N-Back: {nLevel}</span>
                </div>
                <div className="w-64 h-32 bg-gray-900/50 rounded-lg flex items-center justify-center font-mono text-4xl text-cyan-300">
                    {currentTrial?.visual}
                </div>
                <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                    <Button onClick={() => handleResponse('visual')} className="h-20 text-lg bg-sky-600 hover:bg-sky-500 disabled:bg-sky-900 disabled:opacity-100">
                        Visual Match
                        {feedback?.type === 'visual' && (feedback.correct ? <Check className="w-6 h-6 ml-2 text-green-400"/> : <X className="w-6 h-6 ml-2 text-red-400"/>)}
                    </Button>
                    <Button onClick={() => handleResponse('audio')} className="h-20 text-lg bg-teal-600 hover:bg-teal-500 disabled:bg-teal-900 disabled:opacity-100" disabled={!isDual}>
                        Audio Match
                         {feedback?.type === 'audio' && (feedback.correct ? <Check className="w-6 h-6 ml-2 text-green-400"/> : <X className="w-6 h-6 ml-2 text-red-400"/>)}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
