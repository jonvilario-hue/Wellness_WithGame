
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { useToast } from "@/hooks/use-toast";
import { useGlrStore, type SpacedPair } from "@/hooks/use-glr-store";
import { Archive, Loader2 } from "lucide-react";
import type { TrainingFocus } from "@/types";
import { useTrainingFocus } from "@/hooks/use-training-focus";
import { useTrainingOverride } from "@/hooks/use-training-override";
import { generalCategories, mathCategories, musicCategories, verbalCategories, generalWordList, mathWordList, musicWordList, verbalWordList } from "@/data/verbal-content";
import { GameStub } from "../game-stub";
import { AlgorithmFluency } from "../logic/algorithm-fluency";
import { SpacedRetrievalMode } from "./spaced-retrieval-mode";

const generalAntonyms: Record<string, string> = { "hot": "cold", "fast": "slow", "happy": "sad", "big": "small", "up": "down", "light": "dark", "day": "night", "rich": "poor", "old": "new", "true": "false" };

export function SemanticFluencyStorm() {
    const [gameState, setGameState] = useState<'idle' | 'running' | 'finished'>('idle');
    const [currentMode, setCurrentMode] = useState<'associative' | 'spaced' | 'category' | null>(null);
    const [lastScore, setLastScore] = useState(0);
    const { getNextMode } = useGlrStore();

    const { focus: globalFocus, isLoaded: isGlobalFocusLoaded } = useTrainingFocus();
    const { override, isLoaded: isOverrideLoaded } = useTrainingOverride();

    const isComponentLoaded = isGlobalFocusLoaded && isOverrideLoaded;
    const currentTrainingFocus = isComponentLoaded ? (override || globalFocus) : 'neutral';

    const handleStart = () => {
        const mode = getNextMode(currentTrainingFocus);
        setCurrentMode(mode);
        setGameState('running');
    };

    const handleGameComplete = (score: number) => {
        setLastScore(score);
        setGameState('finished');
    };

    if (currentTrainingFocus === 'spatial') {
        return <GameStub 
            name="Route Retrieval" 
            description="A complex 3D 'memory palace' or city map is shown briefly. The map disappears. User must answer prompts like 'Which room was next to the library?' or 'Describe the path from the fountain to the tower.'"
            chcFactor="Long-Term Retrieval (Glr) / Spatial Orientation"
            techStack={['CSS 3D Transforms', 'SVG']}
            complexity="High"
            fallbackPlan="Use a complex 2D SVG subway-style map. The core mechanic of retrieving valid paths from memory is preserved."
        />;
    }

    if (currentTrainingFocus === 'logic') {
        return <AlgorithmFluency />;
    }

    if (currentTrainingFocus === 'eq') {
        // This is the "Empathy Recall" game. It maps well to the category fluency mechanic.
        return <CategorySwitchingMode onComplete={handleGameComplete} focus={currentTrainingFocus} />;
    }


    const renderContent = () => {
        if (gameState === 'idle') {
            return (
                <div className="flex flex-col items-center gap-4">
                    <p className="text-center text-muted-foreground">This game trains your ability to store and retrieve information efficiently. It rotates through different modes each time you play.</p>
                    <Button onClick={handleStart} size="lg">Start Glr Training</Button>
                </div>
            );
        }
        if (gameState === 'finished') {
             return (
                <div className="text-center space-y-4">
                    <CardTitle>Session Complete!</CardTitle>
                    <p className="text-xl">Your score for this mode was: <span className="font-bold text-primary">{lastScore}</span></p>
                    <Button onClick={handleStart} size="lg">Play Next Mode</Button>
                </div>
            );
        }
        if (gameState === 'running') {
            switch (currentMode) {
                case 'associative':
                    return <AssociativeChainMode onComplete={handleGameComplete} focus={currentTrainingFocus} />;
                case 'spaced':
                    return <SpacedRetrievalMode onComplete={handleGameComplete} focus={currentTrainingFocus} />;
                case 'category':
                    return <CategorySwitchingMode onComplete={handleGameComplete} focus={currentTrainingFocus} />;
                default:
                    return <Loader2 className="animate-spin" />;
            }
        }
    };

    return (
        <Card className="w-full max-w-2xl bg-background text-foreground min-h-[500px]">
            <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                    <Archive />
                    (Glr) Retrieval Trainer
                </CardTitle>
                <CardDescription>Strengthen your brain's ability to find and use stored information.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-6">
                {renderContent()}
            </CardContent>
        </Card>
    );
}

// --- MODE 1: ASSOCIATIVE CHAIN ENGINE ---
const relationshipRules = ["ASSOCIATE", "RHYME", "ANTONYM", "FIRST LETTER MATCH"] as const;
type RelationshipRule = typeof relationshipRules[number];

function AssociativeChainMode({ onComplete, focus }: { onComplete: (score: number) => void, focus: TrainingFocus }) {
    const wordList = useMemo(() => {
        if (focus === 'math') return mathWordList;
        if (focus === 'music') return musicWordList;
        if (focus === 'verbal') return verbalWordList;
        return generalWordList;
    }, [focus]);

    const [chain, setChain] = useState<string[]>([]);
    const [currentWord, setCurrentWord] = useState(() => wordList[Math.floor(Math.random() * wordList.length)]);
    const [currentRule, setCurrentRule] = useState<RelationshipRule>(() => relationshipRules[Math.floor(Math.random() * relationshipRules.length)]);
    const [userInput, setUserInput] = useState('');
    const [timeLeft, setTimeLeft] = useState(6);
    const [streak, setStreak] = useState(0);
    const { toast } = useToast();
    const { getAdaptiveState, updateAdaptiveState } = usePerformanceStore();
    const timerRef = useRef<NodeJS.Timeout>();

    const handleTimeout = useCallback(() => {
        toast({ title: "Chain Broken!", description: `You built a chain of ${chain.length}.`, variant: "destructive" });
        
        const currentState = getAdaptiveState('glr_fluency_storm', focus);
        const newLevel = Math.max(currentState.levelFloor, Math.min(currentState.levelCeiling, 4 + Math.min(6, Math.floor(chain.length / 2))));

        updateAdaptiveState(
            'glr_fluency_storm',
            focus,
            {
                ...currentState,
                currentLevel: newLevel,
                lastFocus: focus,
                smoothedRT: (6 - timeLeft) * 1000,
                lastSessionAt: Date.now(),
                sessionCount: currentState.sessionCount + 1,
            }
        );
        
        if (chain.length > 0) onComplete(chain.length);
        else { 
            setCurrentWord(wordList[Math.floor(Math.random() * wordList.length)]);
            setCurrentRule(relationshipRules[Math.floor(Math.random() * relationshipRules.length)]);
            setChain([]);
        }
    }, [chain.length, timeLeft, toast, updateAdaptiveState, onComplete, getAdaptiveState, focus, wordList]);

    const resetTimer = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        setTimeLeft(6);
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
        resetTimer();
        return () => { if (timerRef.current) clearInterval(timerRef.current); }
    }, [resetTimer]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const submittedWord = userInput.trim().toLowerCase();
        if (!submittedWord) return;

        let isValid = (currentRule === "ASSOCIATE") || (currentRule === "RHYME" && submittedWord.slice(-2) === currentWord.slice(-2) && submittedWord !== currentWord) || (currentRule === "ANTONYM" && (generalAntonyms[currentWord] === submittedWord || generalAntonyms[submittedWord] === currentWord)) || (currentRule === "FIRST LETTER MATCH" && submittedWord[0] === currentWord[0]);

        if (isValid) {
            setCurrentWord(submittedWord);
            setChain(prev => [...prev, submittedWord]);
            setCurrentRule(relationshipRules[Math.floor(Math.random() * relationshipRules.length)]);
            setUserInput('');
            resetTimer();
            if (timeLeft > 4) setStreak(s => s + 1); else setStreak(0);
            if (streak > 3) toast({ title: `x${streak} Streak!`, className: "bg-primary text-primary-foreground" });
        } else {
             toast({ title: "Invalid Link", description: "That doesn't seem to fit the rule.", variant: "destructive" });
        }
    };

    return (
        <div className="w-full flex flex-col items-center gap-4">
            <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${(timeLeft / 6) * 100}%`, transition: 'width 1s linear' }}></div>
            </div>
            <p className="font-mono text-right w-full">Chain Length: {chain.length}</p>
            <div className="text-center p-4">
                <p className="text-lg text-muted-foreground font-semibold">{currentRule}</p>
                <p className="text-5xl font-bold text-primary my-2">{currentWord.toUpperCase()}</p>
            </div>
            <form onSubmit={handleSubmit} className="w-full flex gap-2">
                <Input value={userInput} onChange={(e) => setUserInput(e.target.value)} placeholder="Type related word..." autoFocus className="text-center text-lg h-12"/>
                <Button type="submit" className="h-12">Link</Button>
            </form>
            <p className="text-xs text-muted-foreground h-4">{chain.slice(-5).join(' → ')}</p>
        </div>
    );
}


// --- MODE 3: CATEGORY SWITCHING SPRINT ---
function CategorySwitchingMode({ onComplete, focus }: { onComplete: (score: number) => void, focus: TrainingFocus }) {
    const { logSubmittedWord, isWordSubmitted } = useGlrStore();
    const { getAdaptiveState, updateAdaptiveState } = usePerformanceStore();
    const [categoryIndex, setCategoryIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(10);
    const [totalTimeLeft, setTotalTimeLeft] = useState(60);
    const [score, setScore] = useState(0);
    const [userInput, setUserInput] = useState('');
    const { toast } = useToast();
    const categoryTimerRef = useRef<NodeJS.Timeout>();

    const categories = useMemo(() => {
        if (focus === 'math') return mathCategories;
        if (focus === 'music') return musicCategories;
        if (focus === 'verbal') return verbalCategories;
        if (focus === 'eq') return ['Positive Emotions', 'Negative Emotions', 'Social Roles', 'Causes of Joy'];
        return generalCategories;
    }, [focus]);

    const currentCategory = categories[categoryIndex];

    const switchCategory = useCallback(() => {
        setCategoryIndex(prev => (prev + 1) % categories.length);
        setTimeLeft(10);
    }, [categories.length]);
    
    useEffect(() => {
        categoryTimerRef.current = setInterval(switchCategory, 10000);
        const totalTimer = setInterval(() => {
            setTotalTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(categoryTimerRef.current as NodeJS.Timeout);
                    clearInterval(totalTimer);
                    const currentState = getAdaptiveState('glr_fluency_storm', focus);
                    const newLevel = Math.max(currentState.levelFloor, Math.min(currentState.levelCeiling, 4 + Math.min(6, Math.floor(score / 5))));
                    updateAdaptiveState('glr_fluency_storm', focus, { ...currentState, currentLevel: newLevel, lastFocus: focus, sessionCount: currentState.sessionCount + 1, lastSessionAt: Date.now() });
                    onComplete(score);
                    return 0;
                }
                setTimeLeft(p => p > 0 ? p-1 : 9);
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (categoryTimerRef.current) clearInterval(categoryTimerRef.current);
            clearInterval(totalTimer);
        }
    }, [switchCategory, onComplete, updateAdaptiveState, score, getAdaptiveState, focus]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const word = userInput.trim().toLowerCase();
        if (!word) return;

        if (isWordSubmitted(currentCategory, word)) {
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
            <div className="w-full flex justify-between font-mono">
                <span>Total Score: {score}</span>
                <span>Time Left: {totalTimeLeft}s</span>
            </div>
            <div key={currentCategory} className="w-full p-4 bg-muted rounded-lg text-center animate-in fade-in">
                <p className="text-3xl font-bold">{currentCategory}</p>
                 <div className="w-full h-1 mt-2 rounded-full bg-background overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${(timeLeft / 10) * 100}%`, transition: 'width 1s linear' }}></div>
                </div>
            </div>
            <form onSubmit={handleSubmit} className="w-full flex gap-2">
                <Input value={userInput} onChange={e => setUserInput(e.target.value)} autoFocus placeholder="Type item in category..."/>
                <Button type="submit">Submit</Button>
            </form>
            <p className="text-xs text-muted-foreground h-4">Pro-tip: Try to think of sub-categories (e.g., 'farm animals').</p>
        </div>
    );
}

    