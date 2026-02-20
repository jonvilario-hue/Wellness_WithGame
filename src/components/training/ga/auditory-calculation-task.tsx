
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Volume2, Loader2 } from 'lucide-react';
import { usePerformanceStore } from '@/hooks/use-performance-store';
import { getSuccessFeedback, getFailureFeedback } from '@/lib/feedback-system';
import { cn } from '@/lib/utils';
import { adjustDifficulty, startSession, endSession } from '@/lib/adaptive-engine';
import { difficultyPolicies } from '@/data/difficulty-policies';
import type { AdaptiveState, TrialResult, GameId, TrainingFocus } from '@/types';
import { useTrainingFocus } from '@/hooks/use-training-focus';
import { useTrainingOverride } from '@/hooks/use-training-override';

const GAME_ID: GameId = 'ga_auditory_lab';
const policy = difficultyPolicies[GAME_ID];

const useSpokenMath = () => {
    const generateProblem = (level: number, focus: TrainingFocus) => {
        const levelDef = policy.levelMap[level] || policy.levelMap[1];
        const params = levelDef.content_config[focus];
        const numOperands = params.operands;
        const operations = params.operations as ('+' | '-' | '*' | '/')[];
        
        let problemString = '';
        let answer = 0;
        let spokenProblem: string[] = [];

        // First operand
        const firstOperand = Math.floor(Math.random() * 9) + 1;
        answer = firstOperand;
        problemString += firstOperand;
        spokenProblem.push(String(firstOperand));

        for (let i = 0; i < numOperands - 1; i++) {
            const operation = operations[Math.floor(Math.random() * operations.length)];
            let nextOperand = Math.floor(Math.random() * 9) + 1;
            
            if (operation === '/') {
                // Ensure division results in an integer
                nextOperand = [1,2,3,4,5].find(d => answer % d === 0) || 1;
                answer /= nextOperand;
            } else if (operation === '*') {
                 answer *= nextOperand;
            } else if (operation === '-') {
                 answer -= nextOperand;
            } else {
                 answer += nextOperand;
            }

            problemString += ` ${operation} ${nextOperand}`;
            spokenProblem.push(operation, String(nextOperand));
        }
        return { problemString, spokenProblem, answer };
    };
    
    const speak = (text: string) => {
        if (typeof window === 'undefined' || !window.speechSynthesis) return;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
    }
    
    return { generateProblem, speak };
}


export function AuditoryCalculationTask({ onComplete }: { onComplete: () => void }) {
    const { getAdaptiveState, updateAdaptiveState } = usePerformanceStore();
    const { generateProblem, speak } = useSpokenMath();
    
    const { focus: globalFocus, isLoaded: isGlobalFocusLoaded } = useTrainingFocus();
    const { override, isLoaded: isOverrideLoaded } = useTrainingOverride();
    
    const [adaptiveState, setAdaptiveState] = useState<AdaptiveState | null>(null);
    const [gameState, setGameState] = useState<'loading' | 'start' | 'playing' | 'feedback' | 'finished'>('loading');
    const [sessionTrials, setSessionTrials] = useState<TrialResult[]>([]);
    
    const [problem, setProblem] = useState<{ problemString: string; spokenProblem: string[]; answer: number } | null>(null);
    const [userInput, setUserInput] = useState('');
    const [feedback, setFeedback] = useState('');

    const trialStartTime = useRef(0);
    const currentTrialIndex = useRef(0);
    
    const isComponentLoaded = isGlobalFocusLoaded && isOverrideLoaded;
    const currentMode = isComponentLoaded ? (override || globalFocus) : 'neutral';

     useEffect(() => {
        if(isComponentLoaded) {
            const initialState = getAdaptiveState(GAME_ID, currentMode);
            setAdaptiveState(initialState);
            setGameState('start');
        }
    }, [isComponentLoaded, currentMode, getAdaptiveState]);
    
    const playProblemAudio = useCallback((spokenProblem: string[]) => {
        spokenProblem.forEach((part, index) => {
            setTimeout(() => {
                let toSpeak = part;
                if(part === '*') toSpeak = 'times';
                if(part === '/') toSpeak = 'divided by';
                speak(toSpeak);
            }, index * 800); // 800ms between each part
        });

        setTimeout(() => {
            setGameState('playing');
            trialStartTime.current = Date.now();
        }, spokenProblem.length * 800);

    }, [speak]);

    const startNewTrial = useCallback((state: AdaptiveState) => {
        const onRamp = state.uncertainty > 0.7;
        const loadedLevel = onRamp
          ? Math.max(state.levelFloor, state.currentLevel - 2)
          : state.currentLevel;
        
        const newProblem = generateProblem(loadedLevel, currentMode);
        setProblem(newProblem);
        setUserInput('');
        setFeedback('');
        playProblemAudio(newProblem.spokenProblem);
    }, [generateProblem, playProblemAudio, currentMode]);

    const startNewSession = useCallback(() => {
        if (!adaptiveState) return;
        const sessionState = startSession(adaptiveState);
        setAdaptiveState(sessionState);
        setSessionTrials([]);
        currentTrialIndex.current = 0;
        startNewTrial(sessionState);
    }, [adaptiveState, startNewTrial]);

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (gameState !== 'playing' || !problem || !adaptiveState) return;

        setGameState('feedback');
        const reactionTimeMs = Date.now() - trialStartTime.current;
        const isCorrect = parseInt(userInput, 10) === problem.answer;
        
        const trialResult: TrialResult = { correct: isCorrect, reactionTimeMs };
        setSessionTrials(prev => [...prev, trialResult]);
        
        const newState = adjustDifficulty(trialResult, adaptiveState, policy);
        setAdaptiveState(newState);

        setFeedback(isCorrect ? getSuccessFeedback('Ga') : `Incorrect. The answer was: ${problem.answer}. ${getFailureFeedback('Ga')}`);
        
        setTimeout(() => {
            currentTrialIndex.current++;
            if (currentTrialIndex.current >= policy.sessionLength) {
                setGameState('finished');
                const finalState = endSession(newState, [...sessionTrials, trialResult]);
                updateAdaptiveState(GAME_ID, finalState);
                onComplete();
            } else {
                startNewTrial(newState);
            }
        }, 2500);

    }, [gameState, userInput, problem, adaptiveState, sessionTrials, updateAdaptiveState, startNewTrial, onComplete]);
    
    if (gameState === 'loading' || !adaptiveState) return <Loader2 className="w-12 h-12 animate-spin text-primary" />;

    if (gameState === 'start') {
        return (
            <div className="flex flex-col items-center gap-4">
              <div className="font-mono text-lg">Level: {adaptiveState.currentLevel}</div>
              <Button onClick={startNewSession} size="lg">Start Session</Button>
            </div>
          );
    }
    
    return (
        <div className="w-full max-w-sm text-center space-y-6">
            <div className="font-mono text-lg">Trial: {currentTrialIndex.current + 1} / {policy.sessionLength}</div>
             <div className="h-20 flex items-center justify-center">
                 {gameState === 'playing' || gameState === 'feedback' ? (
                     <form onSubmit={handleSubmit} className="flex gap-2">
                        <Input 
                            type="number" 
                            value={userInput} 
                            onChange={e => setUserInput(e.target.value)} 
                            className="text-2xl h-14 w-40 text-center" 
                            autoFocus
                            disabled={gameState === 'feedback'}
                        />
                        <Button type="submit" size="lg" className="h-14" disabled={gameState === 'feedback'}>Submit</Button>
                    </form>
                 ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Volume2 className="w-10 h-10"/>
                        <p>Listen carefully...</p>
                    </div>
                 )}
            </div>
             {gameState === 'feedback' && (
              <div className="mt-4 text-center text-lg font-bold animate-in fade-in">
                <p className={cn(feedback.includes('Incorrect') ? 'text-destructive' : 'text-green-600')}>{feedback}</p>
              </div>
            )}
        </div>
    )
}

    