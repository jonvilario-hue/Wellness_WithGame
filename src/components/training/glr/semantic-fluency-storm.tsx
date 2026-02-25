
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { useToast } from "@/hooks/use-toast";
import { useGlrStore, type SpacedPair } from "@/hooks/use-glr-store";
import { Loader2 } from "lucide-react";
import type { TrainingFocus, AdaptiveState, TrialResult, GameId, TelemetryEvent } from "@/types";
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
import { FOCUS_MODE_META } from "@/lib/mode-constants";
import { Input } from "@/components/ui/input";
import { emotionLexicon, type EmotionCluster } from '@/data/emotion-lexicon';
import { OperatorRecallMode } from "./OperatorRecallMode";


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

type GlrGameMode = 'associative' | 'spaced' | 'category' | 'operator_recall' | 'spatial';

export function SemanticFluencyStorm() {
    const [gameState, setGameState] = useState<'idle' | 'running' | 'finished'>('idle');
    const [currentMode, setCurrentMode] = useState<GlrGameMode | null>(null);
    const [lastScore, setLastScore] = useState(0);
    const [lastClusterBreadth, setLastClusterBreadth] = useState(0);
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

    const handleGameComplete = (result: { score: number, trials: TrialResult[], cluster_breadth?: number }) => {
        const { score, trials, cluster_breadth } = result;
        setLastScore(score);
        setLastClusterBreadth(cluster_breadth || 0);
        
        const adaptiveState = getAdaptiveState(GLR_GAME_ID, currentTrainingFocus);
        if (trials.length > 0) {
            const finalState = endSession(adaptiveState, trials);
            updateAdaptiveState(GLR_GAME_ID, currentTrainingFocus, finalState);
        }
        
        setGameState('finished');
    };

    const renderContent = () => {
        if (gameState === 'idle') {
            const { Icon, label } = FOCUS_MODE_META[currentTrainingFocus];
            return (
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className="flex flex-col items-center gap-2 text-emerald-300">
                        <Icon className="w-10 h-10" />
                        <span className="font-semibold">{label} Mode</span>
                    </div>
                    <p className="text-muted-foreground">This game trains your ability to store and retrieve information efficiently. It rotates through different modes each time you play.</p>
                    <Button onClick={handleStart} size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white">Retrieval Trainer</Button>
                </div>
            );
        }
        if (gameState === 'finished') {
             return (
                <div className="text-center space-y-4">
                    <CardTitle>Session Complete!</CardTitle>
                    <p className="text-xl">Words Found: <span className="font-bold text-primary">{lastScore}</span></p>
                    {lastClusterBreadth > 0 && (
                        <p className="text-lg">Emotion Clusters Explored: <span className="font-bold text-primary">{lastClusterBreadth}</span></p>
                    )}
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
                 case 'operator_recall':
                    return <OperatorRecallMode onComplete={handleGameComplete as any} focus={currentTrainingFocus} />;
                case 'category':
                    return <CategorySwitchingMode onComplete={handleGameComplete} focus={currentTrainingFocus} />;
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

function CategorySwitchingMode({ onComplete, focus }: { onComplete: (result: { score: number, cluster_breadth: number, trials: TrialResult[] }) => void, focus: TrainingFocus }) {
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
