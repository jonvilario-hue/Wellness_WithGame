'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef, useCallback } from "react";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import { Loader2, Brain, Share2, Check, X } from "lucide-react";
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

const generateFullStream = (level: number, prng: PRNG): Trial[] => {
    const params = policy.levelMap[level]?.content_config['logic']?.params;
    if (!params) return [];
    
    const { n_back, pool, mode, lures } = params;
    const tokenPool = logicTokenPools[pool as keyof typeof logicTokenPools];
    const audioPool = Object.keys(audioTokenGateMap);
    const stream: Trial[] = [];
    
    const totalTrials = 30;
    const targetMatchCount = Math.floor(totalTrials * 0.3); // ~30% matches
    let visualMatches = 0;
    let audioMatches = 0;
    let nonMatchSinceLastMatch = 0;

    for (let i = 0; i < totalTrials; i++) {
        let visual: Token, audio: string | undefined, isVisualMatch = false, isAudioMatch = false;
        const nBackTrial = i >= n_back ? stream[i - n_back] : null;

        // --- Visual Token ---
        if (nBackTrial && visualMatches < targetMatchCount && prng.nextFloat() < 0.3 && nonMatchSinceLastMatch >= 1) {
            visual = nBackTrial.visual;
            isVisualMatch = true;
            visualMatches++;
            nonMatchSinceLastMatch = 0;
        } else if (lures && nBackTrial && prng.nextFloat() < 0.1) {
            const confusable = confusablePairs[nBackTrial.visual] || Object.keys(confusablePairs).find(k => confusablePairs[k] === nBackTrial.visual);
            visual = confusable ? (confusablePairs[nBackTrial.visual] ? confusable : Object.keys(confusablePairs).find(k => confusablePairs[k] === nBackTrial.visual)!) : prng.shuffle(tokenPool.filter(t => t !== nBackTrial.visual))[0];
            nonMatchSinceLastMatch++;
        } else {
            visual = prng.shuffle(tokenPool.filter(t => t !== nBackTrial?.visual))[0];
            nonMatchSinceLastMatch++;
        }

        // --- Audio Token (for dual mode) ---
        if (mode === 'dual') {
            if (nBackTrial?.audio && audioMatches < targetMatchCount && prng.nextFloat() < 0.3) {
                audio = nBackTrial.audio;
                isAudioMatch = true;
                audioMatches++;
            } else {
                audio = prng.shuffle(audioPool.filter(a => a !== nBackTrial?.audio))[0];
            }
        }
        stream.push({ visual, audio, isVisualMatch, isAudioMatch });
    }
    return stream;
}

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
    const streamRef = useRef<Trial[]>([]);

    const runTrial = useCallback(() => {
        if (!engine || trialCount.current >= streamRef.current.length) {
            if(trialTimer.current) clearInterval(trialTimer.current);
            setGameState('finished');
            return;
        }

        const newTrial = streamRef.current[trialCount.current];
        
        // Play Audio
        if (newTrial.audio) {
            const audioConfig = audioTokenGateMap[newTrial.audio];
            engine.playTone({ frequency: audioConfig.freq, type: audioConfig.type, duration: 0.3, volume: 0.4 });
        }
        
        setHistory(prev => [...prev, newTrial]);
        stimulusOnsetTs.current = engine.getAudioContextTime();
        responseTracker.current = { visual: false, audio: false };
        setFeedback(null);
        trialCount.current++;
        
    }, [engine, history]);

    const startNewSession = useCallback(() => {
        engine?.resumeContext();
        prngRef.current = new PRNG(crypto.randomUUID());
        const sessionState = startSession(adaptiveState);
        updateAdaptiveState(GAME_ID, 'logic', sessionState);
        trialCount.current = 0;
        sessionTrials.current = [];
        setHistory([]);
        sessionId.current = crypto.randomUUID();
        streamRef.current = generateFullStream(sessionState.currentLevel, prngRef.current);
        setGameState('playing');
    }, [engine, adaptiveState, updateAdaptiveState, startNewTrial]);

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
            return;
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
