
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useTrainingFocus } from "@/hooks/use-training-focus";
import { useTrainingOverride } from "@/hooks/use-training-override";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { useToast } from "@/hooks/use-toast";
import { getSuccessFeedback, getFailureFeedback } from "@/lib/feedback-system";

type Prompt = {
    text: string;
    answers?: string[]; // Optional for neutral mode, required for math/music modes
};

const neutralPrompts: Prompt[] = [
  { text: "Things you find in a kitchen" },
  { text: "Types of fruit" },
  { text: "Animals that live in the jungle" },
  { text: "Words that start with 'C'" },
  { text: "Things that are cold" },
  { text: "Hobbies or pastimes" },
  { text: "Types of trees" },
  { text: "Things with wheels" },
];

const mathPrompts: Prompt[] = [
  { text: "Prime numbers under 50", answers: ["2", "3", "5", "7", "11", "13", "17", "19", "23", "29", "31", "37", "41", "43", "47"] },
  { text: "Even numbers between 10 and 30", answers: ["12", "14", "16", "18", "20", "22", "24", "26", "28"] },
  { text: "Types of geometric shapes", answers: ["circle", "square", "triangle", "rectangle", "pentagon", "hexagon", "octagon", "rhombus", "trapezoid", "cube", "sphere", "cylinder", "pyramid"] },
  { text: "Multiples of 7 up to 70", answers: ["7", "14", "21", "28", "35", "42", "49", "56", "63", "70"] },
  { text: "Units of time", answers: ["second", "minute", "hour", "day", "week", "month", "year", "decade", "century", "millisecond"] },
];

const musicPrompts: Prompt[] = [
    { text: "Musical instruments", answers: ["piano", "guitar", "violin", "drums", "trumpet", "flute", "cello", "saxophone", "bass", "clarinet"] },
    { text: "Music genres", answers: ["rock", "pop", "jazz", "classical", "hip hop", "electronic", "country", "blues", "reggae", "folk"] },
    { text: "Terms for dynamics (volume)", answers: ["piano", "forte", "crescendo", "diminuendo", "mezzopiano", "mezzoforte", "pianissimo", "fortissimo"] },
    { text: "Notes in the C Major scale", answers: ["c", "d", "e", "f", "g", "a", "b"] },
];


export function SemanticFluencyStorm() {
  const [gameState, setGameState] = useState('idle'); // idle, running, finished
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [timeLeft, setTimeLeft] = useState(45);
  const [currentInput, setCurrentInput] = useState('');
  const [responses, setResponses] = useState<string[]>([]);
  const [switched, setSwitched] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [inlineFeedback, setInlineFeedback] = useState({ message: '', type: '' });
  const promptHistory = useRef<string[]>([]);
  const { toast } = useToast();
  
  const { focus: globalFocus, isLoaded: isGlobalFocusLoaded } = useTrainingFocus();
  const { override, isLoaded: isOverrideLoaded } = useTrainingOverride();
  const { logGameResult } = usePerformanceStore();

  const isLoaded = isGlobalFocusLoaded && isOverrideLoaded;
  const currentMode = isLoaded ? (override || globalFocus) : 'neutral';
  
  const prompts = useMemo(() => {
    switch (currentMode) {
        case 'math': return mathPrompts;
        case 'music': return musicPrompts;
        default: return neutralPrompts;
    }
  }, [currentMode]);
  
  const getNewPrompt = useCallback(() => {
    let newPrompt = prompts[Math.floor(Math.random() * prompts.length)];
    while (promptHistory.current.includes(newPrompt.text) && promptHistory.current.length < prompts.length) {
      newPrompt = prompts[Math.floor(Math.random() * prompts.length)];
    }
    promptHistory.current.push(newPrompt.text);
    return newPrompt;
  }, [prompts]);

  const finishGame = useCallback(() => {
    setGameState('finished');
    const time = (Date.now() - startTime) / 1000;
    logGameResult('Glr', currentMode, { score: responses.length, time });
  }, [startTime, currentMode, responses.length, logGameResult]);

  const handleStart = useCallback(() => {
    promptHistory.current = [];
    let initialPrompt = getNewPrompt();
    setPrompt(initialPrompt);
    
    setGameState('running');
    setTimeLeft(45);
    setResponses([]);
    setCurrentInput('');
    setSwitched(false);
    setStartTime(Date.now());
    setInlineFeedback({ message: '', type: '' });
  }, [getNewPrompt]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === 'running' && timeLeft > 0) {
      timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
        if (timeLeft === 23 && !switched) {
          setSwitched(true);
          setPrompt(getNewPrompt());
        }
      }, 1000);
    } else if (timeLeft === 0 && gameState === 'running') {
      finishGame();
    }
    return () => clearTimeout(timer);
  }, [gameState, timeLeft, switched, getNewPrompt, finishGame]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = currentInput.trim().toLowerCase();

    if (!cleanInput) return;

    if (responses.includes(cleanInput)) {
        setCurrentInput('');
        return;
    }

    let isValid = false;
    if ((currentMode === 'math' || currentMode === 'music') && prompt?.answers) {
        if (prompt.answers.includes(cleanInput)) {
            isValid = true;
        } else {
             setInlineFeedback({ message: getFailureFeedback('Glr'), type: 'failure' });
        }
    } else { // Neutral mode has no predefined answers
        isValid = true;
    }
    
    if (isValid) {
        setInlineFeedback({ message: getSuccessFeedback('Glr'), type: 'success' });
        const newResponses = [...responses, cleanInput];
        setResponses(newResponses);

        const currentPromptAnswers = prompt?.answers || [];
        const answersForPrompt = newResponses.filter(r => currentPromptAnswers.includes(r));

        if (currentPromptAnswers.length > 0 && answersForPrompt.length === currentPromptAnswers.length) {
            toast({ title: "Category Complete!", description: "Great job! Here's a new category." });
            setPrompt(getNewPrompt());
            setTimeLeft(prev => Math.min(45, prev + 5)); // Bonus time for completion
        }
    }
    
    setTimeout(() => setInlineFeedback({ message: '', type: '' }), 1500);
    setCurrentInput('');
  }, [currentInput, responses, prompt, currentMode, toast, getNewPrompt]);

  if (!isLoaded) {
    return (
      <Card className="w-full max-w-2xl text-center">
        <CardContent className="flex items-center justify-center h-48">
          <p>Loading game...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="text-center">
        <CardTitle>(Glr) Semantic Fluency Storm</CardTitle>
        <CardDescription>Name as many items as you can for the given category.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        {gameState === 'idle' && (
          <Button onClick={handleStart} size="lg">Start Game</Button>
        )}
        
        {gameState === 'running' && (
          <div className="w-full space-y-4">
            <div className="flex justify-between w-full text-lg font-mono">
              <span>Time: {timeLeft}s</span>
              <span>Score: {responses.length}</span>
            </div>
            <div className={cn("p-4 bg-muted rounded-lg w-full text-center transition-all", switched && timeLeft > 20 && "bg-primary/20 animate-pulse")}>
              <p className="text-xl font-semibold">{prompt?.text}</p>
            </div>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input 
                type="text" 
                value={currentInput}
                onChange={e => setCurrentInput(e.target.value)}
                placeholder="Type your answer..."
                autoFocus
              />
              <Button type="submit">Enter</Button>
            </form>
            <div className="h-6 text-sm font-semibold">
              {inlineFeedback.message && (
                <p className={cn(
                  "animate-in fade-in text-center",
                  inlineFeedback.type === 'success' ? 'text-green-600' : 'text-amber-600'
                )}>
                  {inlineFeedback.message}
                </p>
              )}
            </div>
            <div className="p-4 border rounded-lg min-h-[100px] w-full flex flex-wrap gap-2">
              {responses.map((res, index) => (
                <Badge key={index} variant="secondary">{res}</Badge>
              ))}
            </div>
          </div>
        )}

        {gameState === 'finished' && (
          <div className="text-center space-y-4">
            <CardTitle>Time's Up!</CardTitle>
            <p className="text-xl">You named <span className="font-bold text-primary">{responses.length}</span> items.</p>
            <div className="p-4 border rounded-lg max-h-48 overflow-y-auto w-full flex flex-wrap justify-center gap-2">
              {responses.map((res, index) => (
                <Badge key={index} variant="secondary">{res}</Badge>
              ))}
            </div>
            <Button onClick={handleStart} size="lg">Play Again</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
