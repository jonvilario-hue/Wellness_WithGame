'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { usePerformanceStore } from '@/hooks/use-performance-store';
import { useToast } from '@/hooks/use-toast';
import { usePageVisibility } from '@/hooks/use-page-visibility';
import { PRNG } from '@/lib/rng';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { generalCategories, mathCategories, musicCategories, verbalCategories, validationWordList } from "@/data/verbal-content";
import { emotionLexicon, type EmotionCluster } from '@/data/emotion-lexicon';
import type { TrialResult, TrainingFocus, GameId, TelemetryEvent } from '@/types';
import { adjustDifficulty, endSession, difficultyPolicies } from '@/lib/adaptive-engine';

const GLR_GAME_ID: GameId = 'glr_fluency_storm';
const glrPolicy = difficultyPolicies[GLR_GAME_ID];


class CategorySampler {
    private categories: string[];
    private prng: PRNG;
    private shuffledCategories: string[] = [];
    private currentIndex = 0;

    constructor(categories: string[], prng: PRNG) {
        this.categories = categories;
        this.prng = prng;
        this.reshuffle();
    }

    private reshuffle() {
        this.shuffledCategories = this.prng.shuffle(this.categories);
        this.currentIndex = 0;
    }

    public next(): string {
        if (this.currentIndex >= this.shuffledCategories.length) {
            this.reshuffle();
        }
        const category = this.shuffledCategories[this.currentIndex];
        this.currentIndex++;
        return category;
    }
}

export function CategorySwitchingMode({ onComplete, focus }: { onComplete: (result: { score: number, cluster_breadth: number, trials: TrialResult[] }) => void, focus: TrainingFocus }) {
    const { getAdaptiveState, updateAdaptiveState, logEvent, activeSession } = usePerformanceStore();
    
    const [timeLeft, setTimeLeft] = useState(10);
    const [totalTimeLeft, setTotalTimeLeft] = useState(60);
    const [score, setScore] = useState(0);
    const [userInput, setUserInput] = useState('');
    const [trials, setTrials] = useState<TrialResult[]>([]);
    const [submittedLemmas, setSubmittedLemmas] = useState<Set<string>>(new Set());
    const [touchedClusters, setTouchedClusters] = useState<Set<EmotionCluster>>(new Set());
    const { toast } = useToast();
    
    const categoryTimerRef = useRef<NodeJS.Timeout>();
    const totalTimerRef = useRef<NodeJS.Timeout>();
    const trialStartTime = useRef<number>(0);
    const isVisible = usePageVisibility();
    const prng = useMemo(() => new PRNG(activeSession?.sessionId || ''), [activeSession]);

    const categoryList = useMemo(() => {
        if (focus === 'eq') {
            return [
                'Positive Emotions', 
                'Negative Emotions', 
                'Feelings Associated with Achievement', 
                'Emotions You Might Feel at Work', 
                'Feelings Related to Loss',
                'Low-Arousal Emotions',
                'High-Arousal Emotions',
            ];
        }
        if (focus === 'math') return mathCategories;
        if (focus === 'music') return musicCategories;
        if (focus === 'verbal') return verbalCategories;
        return generalCategories;
    }, [focus]);
    
    const categorySampler = useMemo(() => new CategorySampler(categoryList, prng), [categoryList, prng]);
    const [currentCategory, setCurrentCategory] = useState(() => categorySampler.next());

    const switchCategory = useCallback(() => {
        setCurrentCategory(categorySampler.next());
        setTimeLeft(10);
    }, [categorySampler]);
    
    const stopTimers = useCallback(() => {
        if(categoryTimerRef.current) clearInterval(categoryTimerRef.current);
        if(totalTimerRef.current) clearInterval(totalTimerRef.current);
    }, []);

    useEffect(() => {
        if (isVisible) {
            trialStartTime.current = Date.now();
            categoryTimerRef.current = setInterval(switchCategory, 10000);
            totalTimerRef.current = setInterval(() => {
                setTotalTimeLeft(prev => {
                    if (prev <= 1) {
                        stopTimers();
                        onComplete({ score, cluster_breadth: touchedClusters.size, trials });
                        return 0;
                    }
                    setTimeLeft(p => p > 0 ? p-1 : 9);
                    return prev - 1;
                });
            }, 1000);
        } else {
            stopTimers();
        }
        return stopTimers;
    }, [isVisible, onComplete, score, trials, switchCategory, stopTimers, touchedClusters.size]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeSession) return;
        const word = userInput.trim().toLowerCase();
        if (!word) return;

        const reactionTimeMs = Date.now() - trialStartTime.current;
        trialStartTime.current = Date.now();
        
        let trial: TrialResult;
        
        if (focus === 'eq') {
            const lexiconEntry = emotionLexicon[word];
            const isValid = !!lexiconEntry;
            const isDuplicate = isValid && submittedLemmas.has(lexiconEntry.lemma);
            const isCorrect = isValid && !isDuplicate;

            trial = { 
                correct: isCorrect, 
                reactionTimeMs, 
                telemetry: { 
                    mode: 'category_fluency', 
                    category: currentCategory, 
                    word,
                    isValid,
                    isDuplicate,
                    lemma: lexiconEntry?.lemma,
                    cluster: lexiconEntry?.cluster
                } 
            };

            if (isCorrect) {
                setScore(s => s + 1);
                setSubmittedLemmas(prev => new Set(prev).add(lexiconEntry.lemma));
                setTouchedClusters(prev => new Set(prev).add(lexiconEntry.cluster));
                toast({ title: "Accepted!", className: "bg-primary text-primary-foreground" });
            } else {
                 toast({ title: isDuplicate ? "Already Used" : "Invalid Word", description: isDuplicate ? "You've already submitted a word from this family (e.g., 'happy'/'happiness')." : "That word is not in the emotion lexicon.", variant: "destructive" });
            }

        } else {
            // Original logic for non-EQ modes
            const isCorrect = validationWordList.has(word) && !Array.from(submittedLemmas).includes(word);
             trial = { 
                correct: isCorrect, 
                reactionTimeMs, 
                telemetry: { mode: 'category_fluency', category: currentCategory, word } 
            };
             if (isCorrect) {
                setScore(s => s + 1);
                setSubmittedLemmas(prev => new Set(prev).add(word));
                toast({ title: "Accepted!", className: "bg-primary text-primary-foreground" });
            } else {
                 toast({ title: "Invalid or duplicate word", variant: "destructive" });
            }
        }
        
        const currentState = getAdaptiveState(GLR_GAME_ID, focus);
        logEvent({ type: 'trial_complete', sessionId: activeSession.sessionId, payload: { ...trial, gameId: GLR_GAME_ID, focus } as any });
        setTrials(prev => [...prev, trial]);

        const newState = adjustDifficulty(trial, currentState, glrPolicy);
        updateAdaptiveState(GLR_GAME_ID, focus, newState);

        setUserInput('');
    };

    return (
        <div className="w-full flex flex-col items-center gap-4">
            <div className="w-full grid grid-cols-3 font-mono text-center">
                <span>Score: {score}</span>
                {focus === 'eq' && <span>Clusters: {touchedClusters.size}</span>}
                <span className={focus === 'eq' ? '' : 'col-start-3'}>Time Left: {totalTimeLeft}s</span>
            </div>
            <div key={currentCategory} className="w-full p-4 bg-emerald-900/50 rounded-lg text-center animate-in fade-in">
                <p className="text-3xl font-bold">{currentCategory}</p>
                 <div className="w-full h-1 mt-2 rounded-full bg-background overflow-hidden"><div className="h-full bg-amber-400" style={{ width: `${(timeLeft / 10) * 100}%`, transition: 'width 1s linear' }}></div></div>
            </div>
            <form onSubmit={handleSubmit} className="w-full flex gap-2"><Input value={userInput} onChange={e => setUserInput(e.target.value)} autoFocus placeholder="Type item in category..."/><Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white">Submit</Button></form>
            <p className="text-xs text-muted-foreground h-4">Pro-tip: Think of sub-categories to generate more ideas.</p>
        </div>
    );
}
