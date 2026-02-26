'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePerformanceStore } from '@/hooks/use-performance-store';
import { useToast } from '@/hooks/use-toast';
import { usePageVisibility } from '@/hooks/use-page-visibility';
import { PRNG } from '@/lib/rng';
import { validationWordList, realWords } from '@/data/verbal-content';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { TrialResult, TrainingFocus, GameId, TelemetryEvent } from '@/types';
import { adjustDifficulty, difficultyPolicies } from '@/lib/adaptive-engine';

const GLR_GAME_ID: GameId = 'glr_fluency_storm';
const glrPolicy = difficultyPolicies[GLR_GAME_ID];


const isAssociativelyRelated = (prevWord: string, currentWord: string, rule: string, chain: string[]): boolean => {
    if (!currentWord || chain.includes(currentWord) || !validationWordList.has(currentWord)) {
        return false;
    }
    // For this implementation, we will use a simple last-letter-first-letter rule.
    // A real implementation would have more complex semantic checks.
    return prevWord.charAt(prevWord.length - 1).toLowerCase() === currentWord.charAt(0).toLowerCase();
};


export function AssociativeChainMode({ onComplete, focus }: { onComplete: (result: { score: number, trials: TrialResult[] }) => void, focus: TrainingFocus }) {
    const { getAdaptiveState, updateAdaptiveState, logEvent, activeSession } = usePerformanceStore();
    
    const [chain, setChain] = useState<string[]>([]);
    const [trials, setTrials] = useState<TrialResult[]>([]);
    const [userInput, setUserInput] = useState('');
    const [timeLeft, setTimeLeft] = useState(6);
    const { toast } = useToast();
    
    const timerRef = useRef<NodeJS.Timeout>();
    const trialStartTime = useRef<number>(0);
    const isVisible = usePageVisibility();
    const prngRef = useRef<PRNG>(new PRNG(activeSession?.sessionId || ''));

    const [currentWord, setCurrentWord] = useState(() => prngRef.current.shuffle(realWords)[0]);
    const [currentRule, setCurrentRule] = useState<string>('last-letter');

    const handleTimeout = useCallback(() => {
        toast({ title: "Chain Broken!", description: `You built a chain of ${chain.length}.`, variant: "destructive" });
        onComplete({ score: chain.length, trials });
    }, [chain.length, onComplete, trials, toast]);

    const resetTimer = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        setTimeLeft(6);
        trialStartTime.current = Date.now();
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current as NodeJS.Timeout);
                    handleTimeout();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, [handleTimeout]);
    
    useEffect(() => {
        if (isVisible) resetTimer();
        else if (timerRef.current) clearInterval(timerRef.current);
        return () => { if (timerRef.current) clearInterval(timerRef.current); }
    }, [isVisible, resetTimer]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeSession) return;
        const reactionTimeMs = Date.now() - trialStartTime.current;
        const submittedWord = userInput.trim().toLowerCase();

        const isValid = isAssociativelyRelated(currentWord, submittedWord, currentRule, chain);

        const currentState = getAdaptiveState(GLR_GAME_ID, focus);
        const trial: TrialResult = { correct: isValid, reactionTimeMs, telemetry: { mode: 'associative', rule: currentRule, prev_word: currentWord, submitted_word: submittedWord } };
        
        logEvent({ type: 'trial_complete', sessionId: activeSession.sessionId, payload: { ...trial, gameId: GLR_GAME_ID, focus } as any });
        setTrials(prev => [...prev, trial]);

        const newState = adjustDifficulty(trial, currentState, glrPolicy);
        updateAdaptiveState(GLR_GAME_ID, focus, newState);

        if (isValid) {
            setCurrentWord(submittedWord);
            setChain(prev => [...prev, submittedWord]);
            setUserInput('');
            resetTimer();
        } else {
             toast({ title: "Invalid link in the chain!", variant: "destructive" });
             handleTimeout();
        }
    };

    return (
        <div className="w-full flex flex-col items-center gap-4">
            <div className="w-full h-2 rounded-full bg-emerald-900/50 overflow-hidden"><div className="h-full bg-amber-400" style={{ width: `${(timeLeft / 6) * 100}%`, transition: 'width 1s linear' }}></div></div>
            <p className="font-mono text-right w-full">Chain Length: {chain.length}</p>
            <div className="text-center p-4"><p className="text-lg text-muted-foreground font-semibold">Next word must start with '{currentWord.charAt(currentWord.length - 1).toUpperCase()}'</p><p className="text-5xl font-bold text-amber-400 my-2">{currentWord.toUpperCase()}</p></div>
            <form onSubmit={handleSubmit} className="w-full flex gap-2"><Input value={userInput} onChange={(e) => setUserInput(e.target.value)} placeholder="Type related word..." autoFocus className="text-center text-lg h-12"/><Button type="submit" className="h-12 bg-emerald-600 hover:bg-emerald-500 text-white">Link</Button></form>
            <p className="text-xs text-muted-foreground h-4">{chain.slice(-5).join(' → ')}</p>
        </div>
    );
}
