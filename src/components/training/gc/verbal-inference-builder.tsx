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
import type { AdaptiveState, TrialResult, GameId, TrainingFocus } from "@/types";
import { clozeSentences, morphologyWordPairs, spatialConcepts } from "@/data/verbal-content";
import { GameStub } from "../game-stub";
import { GcSpatialLexicon } from "./gc-spatial-lexicon";
import { RegulationArchitect } from "./regulation-architect";
import { LogicLibrary } from '../logic/logic-library';

const GAME_ID: GameId = 'gc_verbal_inference';
const policy = difficultyPolicies[GAME_ID];

// --- Puzzle Types ---
type Puzzle = {
  type: string;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
};

// --- Puzzle Generation ---
const generatePuzzleForLevel = (level: number, focus: TrainingFocus): Puzzle => {
    const levelDef = policy.levelMap[level] || policy.levelMap[Object.keys(policy.levelMap).pop() as any];
    const contentConfig = levelDef.content_config[focus];
    if (!contentConfig || !contentConfig.params) { // Fallback to verbal if focus not implemented for Gc
      return generatePuzzleForLevel(level, 'verbal');
    }
    const { sub_variant, params } = contentConfig;
    
    if (sub_variant === 'spatial_lexicon') {
        const concept = spatialConcepts[Math.floor(Math.random() * spatialConcepts.length)];
        const options = [...concept.distractors, concept.answer].sort(() => Math.random() - 0.5);
        return {
            type: 'spatial_lexicon',
            question: concept.question,
            options,
            answer: concept.answer,
            explanation: concept.explanation
        }
    }
    
    let puzzleTemplate;
    if (sub_variant === 'cloze_deletion') {
        const filteredSentences = clozeSentences.filter(p => p.difficulty === params.word_rarity);
        puzzleTemplate = filteredSentences[Math.floor(Math.random() * filteredSentences.length)] || clozeSentences[0];
         return {
            type: sub_variant,
            question: puzzleTemplate.question,
            options: [...puzzleTemplate.options, puzzleTemplate.answer].sort(() => Math.random() - 0.5),
            answer: puzzleTemplate.answer,
            explanation: puzzleTemplate.explanation,
        };
    }
    
    // Fallback for verbal mode
    puzzleTemplate = {
        question: "Which word is an antonym for 'happy'?",
        options: ["Joyful", "Ecstatic", "Sad"],
        answer: "Sad",
        explanation: "An antonym has the opposite meaning."
    };
     return {
        type: sub_variant,
        question: puzzleTemplate.question,
        options: [...puzzleTemplate.options, puzzleTemplate.answer].sort(() => Math.random() - 0.5),
        answer: puzzleTemplate.answer,
        explanation: puzzleTemplate.explanation,
    };
};

// --- Main Game Component ---
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
  
  useEffect(() => {
    if (isComponentLoaded) {
      const initialState = getAdaptiveState(GAME_ID, currentMode);
      setAdaptiveState(initialState);
      setGameState('start');
    }
  }, [isComponentLoaded, currentMode, getAdaptiveState]);
  
  const startNewTrial = useCallback((state: AdaptiveState) => {
    const onRamp = state.uncertainty > 0.7;
    const loadedLevel = onRamp
      ? Math.max(state.levelFloor, state.currentLevel - 2)
      : state.currentLevel;
    
    const newPuzzle = generatePuzzleForLevel(loadedLevel, currentMode);
    setPuzzle(newPuzzle);
    setSelectedAnswer(null);
    setInlineFeedback({ message: '', type: '' });
    setGameState('playing');
    trialStartTime.current = Date.now();
  }, [currentMode]);

  const startNewSession = useCallback(() => {
    if (!adaptiveState) return;
    const sessionState = startSession(adaptiveState);
    setAdaptiveState(sessionState);
    setSessionTrials([]);
    currentTrialIndex.current = 0;
    startNewTrial(sessionState);
  }, [adaptiveState, startNewTrial]);

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
            startNewTrial(newState);
        }
    }, 2500);
  };
  
  const getButtonClass = (option: string) => {
    if (gameState !== 'feedback' || !puzzle) return "secondary";
    if (option === puzzle.answer) return "bg-green-600 hover:bg-green-700 text-white";
    if (option === selectedAnswer) return "bg-destructive hover:bg-destructive/90 text-destructive-foreground";
    return "secondary";
  }

  // --- ROUTER LOGIC ---
  if (!isComponentLoaded) {
      return <Card className="w-full max-w-2xl min-h-[400px] flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></Card>;
  }
  
  if (currentMode === 'neutral') {
    return (
        <Card className="w-full max-w-2xl text-center">
             <CardHeader>
                <CardTitle className="flex items-center justify-center gap-2">
                    <BookOpenText />
                    (Gc) Crystallized Intelligence
                </CardTitle>
                <CardDescription>
                   This game tests your stored knowledge. Because 'Crystallized Intelligence' is about what you already know, there is no 'neutral' version of this game. Please select another training mode like Verbal, Math, or Logic.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <GameStub 
                    name="Knowledge Base"
                    chcFactor="Crystallized Intelligence (Gc)"
                    description="This game requires applying learned knowledge. A 'neutral' or 'abstract' version is not applicable for this cognitive factor."
                    techStack={[]}
                    complexity="Low"
                    fallbackPlan="N/A"
                />
            </CardContent>
        </Card>
    )
  }

  if (currentMode === 'spatial') {
    return <GcSpatialLexicon />;
  }

  if (currentMode === 'eq') {
      return <RegulationArchitect focus={currentMode} />;
  }

  if (currentMode === 'logic') {
      return <LogicLibrary focus={currentMode} />;
  }
  // --- END ROUTER LOGIC ---

  const renderContent = () => {
    if (gameState === 'loading') {
      return <Loader2 className="h-12 w-12 animate-spin text-primary" />;
    }
    if (gameState === 'start') {
      return (
        <div className="flex flex-col items-center gap-4">
          <div className="font-mono text-lg">Level: {adaptiveState?.currentLevel}</div>
          <Button onClick={startNewSession} size="lg" disabled={!adaptiveState}>Start Session</Button>
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
            (Gc) Verbal Inference
        </CardTitle>
        <CardDescription className="text-center">
            Deduce the meaning or relationship from the context provided.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6 min-h-[400px] justify-center">
        {renderContent()}
      </CardContent>
    </Card>
  );
}
