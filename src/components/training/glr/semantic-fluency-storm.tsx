
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { useToast } from "@/hooks/use-toast";
import { useGlrStore, type SpacedPair } from "@/hooks/use-glr-store";
import { Loader2 } from "lucide-react";
import type { TrainingFocus, AdaptiveState, TrialResult, GameId } from "@/types";
import { useTrainingFocus } from "@/hooks/use-training-focus";
import { useTrainingOverride } from "@/hooks/use-training-override";
import { generalCategories, mathCategories, musicCategories, verbalCategories, realWords, validationWordList } from "@/data/verbal-content";
import { GameStub } from "../game-stub";
import { AlgorithmFluency } from "../logic/algorithm-fluency";
import { SpacedRetrievalMode } from "./spaced-retrieval-mode";
import { adjustDifficulty, startSession, endSession } from "@/lib/adaptive-engine";
import { difficultyPolicies } from "@/data/difficulty-policies";
import { domainIcons } from "@/components/icons";
import { usePageVisibility } from "@/hooks/use-page-visibility";
import { PRNG } from "@/lib/rng";
import { GlrMemoryPalace } from "./GlrMemoryPalace";

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

const isAssociativelyRelated = (prevWord: string, currentWord: string, rule: string, chain: string[]): boolean => {
    if (!currentWord || chain.includes(currentWord) || !validationWordList.has(currentWord)) {
        return false;
    }
    // For this implementation, we will use a simple last-letter-first-letter rule.
    // A real implementation would have more complex semantic checks.
    return prevWord.charAt(prevWord.length - 1).toLowerCase() === currentWord.charAt(0).toLowerCase();
};


export function SemanticFluencyStorm() {
    const [gameState, setGameState] = useState<'idle' | 'running' | 'finished'>('idle');
    const [currentMode, setCurrentMode] = useState<'associative' | 'spaced' | 'category' | 'spatial' | null>(null);
    const [lastScore, setLastScore] = useState(0);
    const { getNextMode } = useGlrStore();
    const { getAdaptiveState, updateAdaptiveState } = usePerformanceStore();

    const { focus: globalFocus, isLoaded: isGlobalFocusLoaded } = useTrainingFocus();
    const { override, isLoaded: isOverrideLoaded } = useTrainingOverride();

    const isComponentLoaded = isGlobalFocusLoaded && isOverrideLoaded;
    const currentTrainingFocus = isComponentLoaded ? (override || globalFocus) : 'neutral';

    const handleStart = () => {
        const mode = getNextMode(currentTrainingFocus);
        setCurrentMode(mode);
        setGameState('running');
    };

    const handleGameComplete = (result: { score: number, trials: TrialResult[] }) => {
        const { score, trials } = result;
        setLastScore(score);
        
        const adaptiveState = getAdaptiveState(GLR_GAME_ID, currentTrainingFocus);
        if (trials.length > 0) {
            const finalState = endSession(adaptiveState, trials);
            updateAdaptiveState(GLR_GAME_ID, currentTrainingFocus, finalState);
        }
        
        setGameState('finished');
    };

    if (currentTrainingFocus === 'logic') {
        return <AlgorithmFluency />;
    }

    if (currentTrainingFocus === 'eq') {
        return <CategorySwitchingMode onComplete={handleGameComplete as any} focus={currentTrainingFocus} />;
    }

    const renderContent = () => {
        if (gameState === 'idle') {
            return (
                <div className="flex flex-col items-center gap-4">
                    <p className="text-center text-muted-foreground">This game trains your ability to store and retrieve information efficiently. It rotates through different modes each time you play.</p>
                    <Button onClick={handleStart} size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white">Retrieval Trainer</Button>
                </div>
            );
        }
        if (gameState === 'finished') {
             return (
                <div className="text-center space-y-4">
                    <CardTitle>Session Complete!</CardTitle>
                    <p className="text-xl">Your score for this mode was: <span className="font-bold text-primary">{lastScore}</span></p>
                    <Button onClick={handleStart} size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white">Play Next Mode</Button>
                </div>
            );
        }
        if (gameState === 'running') {
            switch (currentMode) {
                case 'associative':
                    return <AssociativeChainMode onComplete={handleGameComplete as any} focus={currentTrainingFocus} />;
                case 'spaced':
                    return <SpacedRetrievalMode onComplete={handleGameComplete as any} focus={currentTrainingFocus} />;
                case 'category':
                    return <CategorySwitchingMode onComplete={handleGameComplete as any} focus={currentTrainingFocus} />;
                case 'spatial':
                    return <GlrMemoryPalace onComplete={handleGameComplete as any} focus={currentTrainingFocus} />;
                default:
                    return <Loader2 className="animate-spin" />;
            }
        }
    };

    return (
        <Card className="w-full max-w-2xl bg-emerald-950 border-emerald-500/20 text-emerald-100 min-h-[500px]">
            <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2 text-emerald-300">
                    <span className="p-2 bg-emerald-500/10 rounded-md"><domainIcons.Glr className="w-6 h-6 text-emerald-400" /></span>
                    Retrieval Trainer
                </CardTitle>
                <CardDescription className="text-emerald-300/70">Strengthen your brain's ability to find and use stored information. Some modes use audio; wired headphones are recommended.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-6">
                {renderContent()}
            </CardContent>
        </Card>
    );
}

function AssociativeChainMode({ onComplete, focus }: { onComplete: (result: { score: number, trials: TrialResult[] }) => void, focus: TrainingFocus }) {
    const { getAdaptiveState, updateAdaptiveState, logTrial } = usePerformanceStore();
    
    const [chain, setChain] = useState<string[]>([]);
    const [trials, setTrials] = useState<TrialResult[]>([]);
    const [userInput, setUserInput] = useState('');
    const [timeLeft, setTimeLeft] = useState(6);
    const { toast } = useToast();
    
    const timerRef = useRef<NodeJS.Timeout>();
    const trialStartTime = useRef<number>(0);
    const isVisible = usePageVisibility();
    const sessionId = useRef(crypto.randomUUID());
    const prngRef = useRef<PRNG>(new PRNG(sessionId.current));

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
        const reactionTimeMs = Date.now() - trialStartTime.current;
        const submittedWord = userInput.trim().toLowerCase();

        const isValid = isAssociativelyRelated(currentWord, submittedWord, currentRule, chain);

        const currentState = getAdaptiveState(GLR_GAME_ID, focus);
        const trial: TrialResult = { correct: isValid, reactionTimeMs, telemetry: { mode: 'associative', rule: currentRule, prev_word: currentWord, submitted_word: submittedWord } };
        
        logTrial({ sessionId: sessionId.current, gameId: GLR_GAME_ID, seq: trials.length, ...trial} as any);
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

function CategorySwitchingMode({ onComplete, focus }: { onComplete: (result: { score: number, trials: TrialResult[] }) => void, focus: TrainingFocus }) {
    const { logSubmittedWord, isWordSubmitted } = useGlrStore();
    const { getAdaptiveState, updateAdaptiveState, logTrial } = usePerformanceStore();
    
    const [timeLeft, setTimeLeft] = useState(10);
    const [totalTimeLeft, setTotalTimeLeft] = useState(60);
    const [score, setScore] = useState(0);
    const [userInput, setUserInput] = useState('');
    const [trials, setTrials] = useState<TrialResult[]>([]);
    const { toast } = useToast();
    
    const categoryTimerRef = useRef<NodeJS.Timeout>();
    const totalTimerRef = useRef<NodeJS.Timeout>();
    const trialStartTime = useRef<number>(0);
    const isVisible = usePageVisibility();

    const sessionId = useRef(crypto.randomUUID());
    const prng = useMemo(() => new PRNG(sessionId.current), [sessionId.current]);

    const categoryList = useMemo(() => {
        if (focus === 'math') return mathCategories;
        if (focus === 'music') return musicCategories;
        if (focus === 'verbal') return verbalCategories;
        if (focus === 'eq') return ['Positive Emotions', 'Negative Emotions', 'Social Roles', 'Causes of Joy'];
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
                        onComplete({ score, trials });
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
    }, [isVisible, onComplete, score, trials, switchCategory, stopTimers]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const word = userInput.trim().toLowerCase();
        if (!word) return;

        const reactionTimeMs = Date.now() - trialStartTime.current;
        trialStartTime.current = Date.now();

        const alreadySubmitted = isWordSubmitted(currentCategory, word);
        const trial: TrialResult = { correct: !alreadySubmitted, reactionTimeMs, telemetry: { mode: 'category', category: currentCategory, word } };

        const currentState = getAdaptiveState(GLR_GAME_ID, focus);
        logTrial({ sessionId: sessionId.current, gameId: GLR_GAME_ID, seq: trials.length, ...trial } as any);
        setTrials(prev => [...prev, trial]);

        const newState = adjustDifficulty(trial, currentState, glrPolicy);
        updateAdaptiveState(GLR_GAME_ID, focus, newState);

        if (alreadySubmitted) {
            toast({ title: "Already submitted!", variant: "destructive" });
        } else {
            setScore(s => s + 1);
            logSubmittedWord(currentCategory, word);
            toast({ title: "Added!", className: "bg-primary text-primary-foreground" });
        }
        setUserInput('');
    };

    return (
        <div className="w-full flex flex-col items-center gap-4">
            <div className="w-full flex justify-between font-mono"><span>Total Score: {score}</span><span>Time Left: {totalTimeLeft}s</span></div>
            <div key={currentCategory} className="w-full p-4 bg-emerald-900/50 rounded-lg text-center animate-in fade-in">
                <p className="text-3xl font-bold">{currentCategory}</p>
                 <div className="w-full h-1 mt-2 rounded-full bg-background overflow-hidden"><div className="h-full bg-amber-400" style={{ width: `${(timeLeft / 10) * 100}%`, transition: 'width 1s linear' }}></div></div>
            </div>
            <form onSubmit={handleSubmit} className="w-full flex gap-2"><Input value={userInput} onChange={e => setUserInput(e.target.value)} autoFocus placeholder="Type item in category..."/><Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white">Submit</Button></form>
            <p className="text-xs text-muted-foreground h-4">Pro-tip: Try to think of sub-categories (e.g., 'farm animals').</p>
        </div>
    );
}
