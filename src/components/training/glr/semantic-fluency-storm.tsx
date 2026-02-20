'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { useToast } from "@/hooks/use-toast";
import { useGlrStore, type SpacedPair } from "@/hooks/use-glr-store";
import { Archive, BrainCircuit, Shuffle, Loader2 } from "lucide-react";

// --- Game Data & Constants ---
const wordList = ["apple", "car", "house", "river", "mountain", "book", "chair", "music", "light", "ocean", "star", "forest", "fire", "cloud", "dream", "journey", "key", "mirror", "shadow", "silence", "time", "voice", "water", "wind", "world"];
const antonyms: Record<string, string> = { "hot": "cold", "fast": "slow", "happy": "sad", "big": "small", "up": "down", "light": "dark", "day": "night", "rich": "poor", "old": "new", "true": "false" };

// --- Main Component ---
export function SemanticFluencyStorm() {
    const [gameState, setGameState] = useState<'idle' | 'running' | 'finished'>('idle');
    const [currentMode, setCurrentMode] = useState<'associative' | 'spaced' | 'category' | null>(null);
    const [lastScore, setLastScore] = useState(0);
    const { getNextMode } = useGlrStore();

    const handleStart = () => {
        const mode = getNextMode();
        setCurrentMode(mode);
        setGameState('running');
    };

    const handleGameComplete = (score: number) => {
        setLastScore(score);
        setGameState('finished');
    };

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
                    return <AssociativeChainMode onComplete={handleGameComplete} />;
                case 'spaced':
                    return <SpacedRetrievalMode onComplete={handleGameComplete} />;
                case 'category':
                    return <CategorySwitchingMode onComplete={handleGameComplete} />;
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

function AssociativeChainMode({ onComplete }: { onComplete: (score: number) => void }) {
    const [chain, setChain] = useState<string[]>([]);
    const [currentWord, setCurrentWord] = useState(() => wordList[Math.floor(Math.random() * wordList.length)]);
    const [currentRule, setCurrentRule] = useState<RelationshipRule>(() => relationshipRules[Math.floor(Math.random() * relationshipRules.length)]);
    const [userInput, setUserInput] = useState('');
    const [timeLeft, setTimeLeft] = useState(6);
    const [streak, setStreak] = useState(0);
    const { toast } = useToast();
    const { logGameResult } = usePerformanceStore();
    const timerRef = useRef<NodeJS.Timeout>();

    const resetTimer = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        setTimeLeft(6);
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    handleTimeout();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, []);

    const handleTimeout = () => {
        toast({
            title: "Chain Broken!",
            description: `You built a chain of ${chain.length}. Let's start a new one.`,
            variant: "destructive",
        });
        logGameResult('Glr', 'neutral', { score: chain.length, time: 6 * chain.length });
        if (chain.length > 0) onComplete(chain.length);
        else { // Reset if the very first one times out
            setCurrentWord(wordList[Math.floor(Math.random() * wordList.length)]);
            setCurrentRule(relationshipRules[Math.floor(Math.random() * relationshipRules.length)]);
            setChain([]);
            resetTimer();
        }
    };
    
    useEffect(() => {
        resetTimer();
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        }
    }, [resetTimer]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const submittedWord = userInput.trim().toLowerCase();
        if (!submittedWord) return;

        // Simplified validation for prototype
        let isValid = false;
        if (currentRule === "RHYME" && submittedWord.slice(-2) === currentWord.slice(-2) && submittedWord !== currentWord) isValid = true;
        else if (currentRule === "ANTONYM" && (antonyms[currentWord] === submittedWord || antonyms[submittedWord] === currentWord)) isValid = true;
        else if (currentRule === "FIRST LETTER MATCH" && submittedWord[0] === currentWord[0]) isValid = true;
        else if (currentRule === "ASSOCIATE") isValid = true; // Forgiving validation

        if (isValid) {
            setCurrentWord(submittedWord);
            setChain(prev => [...prev, submittedWord]);
            setCurrentRule(relationshipRules[Math.floor(Math.random() * relationshipRules.length)]);
            setUserInput('');
            resetTimer();
            if (timeLeft > 4) setStreak(s => s + 1);
            else setStreak(0);

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
                <Input
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Type related word..."
                    autoFocus
                    className="text-center text-lg h-12"
                />
                <Button type="submit" className="h-12">Link</Button>
            </form>
            <p className="text-xs text-muted-foreground h-4">{chain.slice(-5).join(' → ')}</p>
        </div>
    );
}

// --- MODE 2: SPACED RETRIEVAL PAIRS ---
function SpacedRetrievalMode({ onComplete }: { onComplete: (score: number) => void }) {
    const { addSpacedPairs, getDueReviewPairs, updatePairOnResult } = useGlrStore();
    const { logGameResult } = usePerformanceStore();
    const [phase, setPhase] = useState<'review' | 'learn' | 'distract' | 'recall' | 'finished'>('review');
    const [duePairs, setDuePairs] = useState<SpacedPair[]>([]);
    const [newPairs, setNewPairs] = useState<{word1: string, word2: string}[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userInput, setUserInput] = useState('');
    const [feedback, setFeedback] = useState<Record<string, 'correct' | 'incorrect'>>({});
    const [score, setScore] = useState(0);

    // Phase 1: Load due pairs for review
    useEffect(() => {
        const pairsToReview = getDueReviewPairs();
        if (pairsToReview.length > 0) {
            setDuePairs(pairsToReview);
            setPhase('review');
        } else {
            // If no reviews, generate new pairs to learn
            const generated = Array.from({ length: 6 }).map(() => {
                const word1 = wordList[Math.floor(Math.random() * wordList.length)];
                let word2 = wordList[Math.floor(Math.random() * wordList.length)];
                while(word1 === word2) word2 = wordList[Math.floor(Math.random() * wordList.length)];
                return { word1, word2 };
            });
            setNewPairs(generated);
            addSpacedPairs(generated);
            setPhase('learn');
        }
        setCurrentIndex(0);
    }, []);

    const handleNext = () => {
        const currentList = phase === 'review' ? duePairs : newPairs;
        if (currentIndex < currentList.length - 1) {
            setCurrentIndex(i => i + 1);
        } else {
            // Transition to next phase
            if (phase === 'review') setPhase('learn');
            else if (phase === 'learn') setPhase('distract');
            else if (phase === 'recall') {
                logGameResult('Glr', 'neutral', { score: score * 10, time: 60 });
                onComplete(score);
                setPhase('finished');
            }
            setCurrentIndex(0);
        }
    };
    
    const handleRecallSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const pair = (phase === 'review' ? duePairs : newPairs)[currentIndex];
        const isCorrect = userInput.trim().toLowerCase() === pair.word2.toLowerCase();
        
        updatePairOnResult(pair.id || `${pair.word1}-${pair.word2}`, isCorrect);
        
        setFeedback(prev => ({...prev, [pair.word1]: isCorrect ? 'correct' : 'incorrect'}));
        if(isCorrect) setScore(s => s + 1);
        
        setUserInput('');
        setTimeout(handleNext, 2000);
    };

    if (phase === 'distract') {
        return <Distractor onComplete={() => { setCurrentIndex(0); setPhase('recall'); }} />;
    }
    
    const pairToShow = (phase === 'review' ? duePairs : newPairs)[currentIndex];

    return (
        <div className="w-full flex flex-col items-center gap-4">
            <p className="font-semibold text-primary uppercase">{phase} Phase</p>
            
            {phase === 'learn' && pairToShow && (
                 <div className="text-center p-8 bg-muted rounded-lg animate-in fade-in">
                    <p className="text-muted-foreground">Memorize this pair:</p>
                    <p className="text-4xl font-bold">{pairToShow.word1} - {pairToShow.word2}</p>
                    <p className="text-sm font-mono mt-4">Pair {currentIndex + 1} of {newPairs.length}</p>
                    <Button onClick={handleNext} className="mt-4">Next</Button>
                </div>
            )}
            
            {(phase === 'review' || phase === 'recall') && pairToShow && (
                <div className="w-full text-center space-y-4">
                    <p className="text-muted-foreground">What word was paired with:</p>
                    <p className="text-5xl font-bold">{pairToShow.word1}</p>
                    
                    {feedback[pairToShow.word1] ? (
                        <div className={cn("text-2xl font-bold", feedback[pairToShow.word1] === 'correct' ? "text-green-500" : "text-destructive")}>
                            {feedback[pairToShow.word1] === 'correct' ? "Correct!" : `The answer was: ${pairToShow.word2}`}
                        </div>
                    ) : (
                        <form onSubmit={handleRecallSubmit} className="flex gap-2 justify-center">
                            <Input value={userInput} onChange={e => setUserInput(e.target.value)} autoFocus placeholder="Type the word" className="text-center"/>
                            <Button type="submit">Submit</Button>
                        </form>
                    )}
                </div>
            )}
            
            {phase === 'finished' && <p>Recall session complete!</p>}
        </div>
    );
}

const Distractor = ({ onComplete }: { onComplete: () => void }) => {
    const [count, setCount] = useState(15);
    useEffect(() => {
        if (count > 0) {
            const timer = setTimeout(() => setCount(c => c - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            onComplete();
        }
    }, [count, onComplete]);

    return (
        <div className="text-center">
            <p className="text-muted-foreground">Mental Distraction</p>
            <p className="text-6xl font-mono font-bold">{count}</p>
            <p>Count down to zero...</p>
        </div>
    );
};


// --- MODE 3: CATEGORY SWITCHING SPRINT ---
const categories = ["Animals", "Tools", "Countries", "Foods", "Musical Instruments", "Body Parts", "Professions", "Clothing"];

function CategorySwitchingMode({ onComplete }: { onComplete: (score: number) => void }) {
    const { logSubmittedWord, isWordSubmitted } = useGlrStore();
    const { logGameResult } = usePerformanceStore();
    const [categoryIndex, setCategoryIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(10);
    const [totalTimeLeft, setTotalTimeLeft] = useState(60);
    const [score, setScore] = useState(0);
    const [userInput, setUserInput] = useState('');
    const { toast } = useToast();
    const categoryTimerRef = useRef<NodeJS.Timeout>();

    const currentCategory = categories[categoryIndex];

    const switchCategory = useCallback(() => {
        setCategoryIndex(prev => (prev + 1) % categories.length);
        setTimeLeft(10);
    }, []);
    
    useEffect(() => {
        categoryTimerRef.current = setInterval(switchCategory, 10000);
        const totalTimer = setInterval(() => {
            setTotalTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(categoryTimerRef.current);
                    clearInterval(totalTimer);
                    logGameResult('Glr', 'neutral', { score, time: 60 });
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
    }, [switchCategory, onComplete, logGameResult, score]);


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
            <p className="text-xs text-muted-foreground h-4">Pro-tip: Try to think of sub-categories (e.g., 'farm animals', 'jungle animals').</p>
        </div>
    );
}
