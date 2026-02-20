
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import { BookOpenText, Loader2 } from "lucide-react";
import { useTrainingFocus } from "@/hooks/use-training-focus";
import { useTrainingOverride } from "@/hooks/use-training-override";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { getSuccessFeedback, getFailureFeedback } from "@/lib/feedback-system";
import { adjustDifficulty, startSession, endSession } from "@/lib/adaptive-engine";
import { difficultyPolicies } from "@/data/difficulty-policies";
import type { AdaptiveState, TrialResult, GameId } from "@/types";

const GAME_ID: GameId = 'gc_verbal_inference';
const policy = difficultyPolicies[GAME_ID];

const neutralPuzzles = [
  {
    type: 'analogy',
    question: "Doctor is to hospital as teacher is to ____.",
    options: ["Book", "Student", "School", "Pencil"],
    answer: "School",
    explanation: "A doctor works in a hospital, and a teacher works in a school. The relationship is person to workplace."
  },
  {
    type: 'context',
    question: "The river, widened by weeks of rain, began to ____ the nearby village with murky water.",
    options: ["evaporate", "inundate", "solidify", "irrigate"],
    answer: "inundate",
    explanation: "'Inundate' means to flood or overwhelm, which fits the context of a widened river and a village."
  },
  {
    type: 'inference',
    question: "Despite the chaos around him, the monk remained ____, a silent anchor in a swirling storm.",
    options: ["agitated", "boisterous", "imperturbable", "volatile"],
    answer: "imperturbable",
    explanation: "'Imperturbable' means unable to be upset or excited; calm. This contrasts with the surrounding chaos."
  },
  {
    type: 'relationship',
    question: "Which word does not belong with the others?",
    options: ["Branch", "Leaf", "Root", "Feather"],
    answer: "Feather",
    explanation: "Branch, leaf, and root are all parts of a tree. A feather is part of a bird."
  },
];

const mathPuzzles = [
  {
    type: 'word-problem',
    question: "A train travels 300 miles in 5 hours. What is its average speed in miles per hour?",
    options: ["50 mph", "60 mph", "70 mph", "55 mph"],
    answer: "60 mph",
    explanation: "Speed is distance divided by time (300 miles / 5 hours = 60 mph)."
  },
  {
    type: 'logic',
    question: "If X > Y and Y > Z, which statement is definitely true?",
    options: ["X < Z", "X = Z", "X > Z", "Y > X"],
    answer: "X > Z",
    explanation: "This is the transitive property of inequality. If X is greater than Y, and Y is greater than Z, then X must be greater than Z."
  },
];

const musicPuzzles = [
  {
    type: 'terminology',
    question: "Which term refers to the speed of a piece of music?",
    options: ["Dynamics", "Tempo", "Rhythm", "Pitch"],
    answer: "Tempo",
    explanation: "Tempo is the speed or pace of a given piece."
  },
  {
    type: 'analogy',
    question: "Verse is to song as chapter is to ____.",
    options: ["Poem", "Book", "Paragraph", "Page"],
    answer: "Book",
    explanation: "A verse is a section of a song, just as a chapter is a section of a book."
  },
];

type Puzzle = (typeof neutralPuzzles)[0];

export function VerbalInferenceBuilder() {
  const { getAdaptiveState, updateAdaptiveState } = usePerformanceStore();
  const { focus: globalFocus, isLoaded: isGlobalFocusLoaded } = useTrainingFocus();
  const { override, isLoaded: isOverrideLoaded } = useTrainingOverride();

  const [adaptiveState, setAdaptiveState] = useState<AdaptiveState | null>(null);
  const [gameState, setGameState] = useState<'loading' | 'start' | 'playing' | 'feedback' | 'finished'>('loading');
  const [sessionTrials, setSessionTrials] = useState<TrialResult[]>([]);
  
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [inlineFeedback, setInlineFeedback] = useState({ message: '', type: '' });
  
  const trialStartTime = useRef(0);
  const currentTrialIndex = useRef(0);

  const isComponentLoaded = isGlobalFocusLoaded && isOverrideLoaded;
  const currentMode = isComponentLoaded ? (override || globalFocus) : 'neutral';
  
  const puzzleSet = useMemo(() => {
    switch (currentMode) {
        case 'math': return mathPuzzles;
        case 'music': return musicPuzzles;
        default: return neutralPuzzles;
    }
  }, [currentMode]);
  
  useEffect(() => {
    if (isComponentLoaded) {
      const initialState = getAdaptiveState(GAME_ID, currentMode);
      setAdaptiveState(initialState);
      setGameState('start');
    }
  }, [isComponentLoaded, currentMode, getAdaptiveState]);
  
  const generateNewPuzzle = useCallback((level: number) => {
    // In a real implementation, `level` would determine the complexity (e.g., word rarity)
    const newPuzzle = puzzleSet[Math.floor(Math.random() * puzzleSet.length)];
    setPuzzle({
      ...newPuzzle,
      options: [...newPuzzle.options].sort(() => Math.random() - 0.5)
    });
    setSelectedAnswer(null);
    setInlineFeedback({ message: '', type: '' });
    setGameState('playing');
    trialStartTime.current = Date.now();
  }, [puzzleSet]);

  const startNewSession = useCallback(() => {
    if (!adaptiveState) return;
    const sessionState = startSession(adaptiveState);
    setAdaptiveState(sessionState);
    setSessionTrials([]);
    currentTrialIndex.current = 0;
    generateNewPuzzle(sessionState.currentLevel);
  }, [adaptiveState, generateNewPuzzle]);

  const handleAnswer = (option: string) => {
    if (gameState !== 'playing' || !puzzle || !adaptiveState) return;

    setGameState('feedback');
    setSelectedAnswer(option);
    const reactionTimeMs = Date.now() - trialStartTime.current;
    const isCorrect = option === puzzle.answer;

    const trialResult: TrialResult = { correct: isCorrect, reactionTimeMs };
    setSessionTrials(prev => [...prev, trialResult]);
    
    const newState = adjustDifficulty(trialResult, adaptiveState, policy);
    setAdaptiveState(newState);

    setInlineFeedback({ message: isCorrect ? getSuccessFeedback('Gc') : getFailureFeedback('Gc'), type: isCorrect ? 'success' : 'failure' });
    
    setTimeout(() => {
        currentTrialIndex.current++;
        if (currentTrialIndex.current >= policy.sessionLength) {
            setGameState('finished');
            const finalState = endSession(newState, [...sessionTrials, trialResult]);
            updateAdaptiveState(GAME_ID, currentMode, finalState);
        } else {
            generateNewPuzzle(newState.currentLevel);
        }
    }, 2500);
  };
  
  const getButtonClass = (option: string) => {
    if (gameState !== 'feedback' || !puzzle) return "secondary";
    if (option === puzzle.answer) return "bg-green-600 hover:bg-green-700 text-white";
    if (option === selectedAnswer) return "bg-destructive hover:bg-destructive/90 text-destructive-foreground";
    return "secondary";
  }

  const renderContent = () => {
    if (gameState === 'loading' || !isComponentLoaded) {
      return <Loader2 className="h-12 w-12 animate-spin text-primary" />;
    }
    if (gameState === 'start') {
      return (
        <div className="flex flex-col items-center gap-4">
          <div className="font-mono text-lg">Level: {adaptiveState?.currentLevel}</div>
          <Button onClick={startNewSession} size="lg">Start Session</Button>
        </div>
      );
    }
    if (gameState === 'finished') {
       const finalAccuracy = sessionTrials.filter(t => t.correct).length / sessionTrials.length;
       return (
        <div className="text-center space-y-4 animate-in fade-in">
          <CardTitle>Session Complete!</CardTitle>
          <p className="text-xl">Accuracy: {isNaN(finalAccuracy) ? 'N/A' : (finalAccuracy * 100).toFixed(0) + '%'}</p>
          <Button onClick={() => setGameState('start')} size="lg">Play Again</Button>
        </div>
      );
    }
    if (!puzzle) return <Loader2 className="h-12 w-12 animate-spin text-primary" />;

    return (
      <>
        <div className="w-full flex justify-between font-mono text-sm">
          <span>Trial: {currentTrialIndex.current + 1} / {policy.sessionLength}</span>
          <span>Level: {adaptiveState?.currentLevel}</span>
        </div>
        <div className="p-6 bg-muted rounded-lg w-full text-center min-h-[100px] flex items-center justify-center">
          <p className="text-lg md:text-xl font-medium">{puzzle.question}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {puzzle.options.map((option, index) => (
            <Button 
              key={index} 
              onClick={() => handleAnswer(option)}
              disabled={gameState === 'feedback'}
              size="lg"
              className={cn("h-auto py-3 whitespace-normal transition-all duration-300", getButtonClass(option))}
            >
              {option}
            </Button>
          ))}
        </div>
        <div className="h-16 mt-2 text-center">
          <div className="h-6 text-sm font-semibold">
            {inlineFeedback.message && (
              <p className={cn("animate-in fade-in", inlineFeedback.type === 'success' ? 'text-green-600' : 'text-amber-600')}>
                {inlineFeedback.message}
              </p>
            )}
          </div>
          {gameState === 'feedback' && (
            <div className="animate-in fade-in">
                <p className="text-sm text-muted-foreground">{puzzle.explanation}</p>
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-center gap-2">
            <BookOpenText />
            (Gc) Verbal Inference Builder
        </CardTitle>
        <CardDescription className="text-center">Deduce the meaning or relationship from the context provided.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6 min-h-[400px] justify-center">
        {renderContent()}
      </CardContent>
    </Card>
  );
}
